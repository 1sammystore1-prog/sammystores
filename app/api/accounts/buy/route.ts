import { NextResponse } from 'next/server';
import { buyAccountsRequest } from '@/lib/buyaccounts';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getMarkups, computeMarkup } from '@/lib/pricing';

function extractProducts(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.categories)) {
      return data.categories.flatMap((c: any) =>
        Array.isArray(c.products) ? c.products.map((p: any) => ({ ...p, category: c.name })) : []
      );
    }
    if (Array.isArray(data.products)) return data.products;
    if (data.product && typeof data.product === 'object') return [data.product];
  }
  return [];
}

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' }, { status: 401 });

  const { productId, amount, coupon } = await request.json();
  const qty = parseInt(String(amount)) || 1;
  if (!productId || qty <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  if (user.suspended) return NextResponse.json({ success: false, error: 'Your account is suspended. Contact support.' }, { status: 403 });

  try {
    const productData = await buyAccountsRequest('getProducts');
    const products = extractProducts(productData);
    const product = products.find((p: any) => String(p.id) === String(productId));

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 400 });
    }

    const baseUnitPrice = parseFloat(String(product.price));
    if (isNaN(baseUnitPrice) || baseUnitPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid product price' }, { status: 500 });
    }

    const markups = await getMarkups();
    const unitPrice = computeMarkup(baseUnitPrice, markups.accounts);
    const cost = unitPrice * qty;

    const debited = await User.findOneAndUpdate(
      { _id: userId, walletBalance: { $gte: cost } },
      { $inc: { walletBalance: -cost } },
      { new: true }
    );

    if (!debited) {
      return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
    }

    try {
      const data = await buyAccountsRequest('buyProduct', {
        id: productId,
        amount: qty,
        coupon: coupon || ''
      });

      const txn = await Transaction.create({
        userId,
        type: 'account_purchase',
        description: `Bought ${qty} x ${product.name || product.title || `account ID ${productId}`}`,
        amount: cost,
        status: 'success',
        metadata: {
          productId,
          productName: product.name || product.title || null,
          category: product.category || null,
          quantity: qty,
          accountData: data,
          instructions: product.instructions || null,
          video: product.video || null,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Purchase successful!',
        accountData: data,
        newBalance: debited.walletBalance,
        orderId: String(txn._id)
      });
    } catch (providerError) {
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: cost } });
      return NextResponse.json({ success: false, error: 'Purchase failed' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
