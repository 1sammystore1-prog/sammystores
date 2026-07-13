import { NextResponse } from 'next/server';
import { buyAccountsRequest } from '@/lib/buyaccounts';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Cart from '@/models/Cart';
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

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  if (user.suspended) {
    return NextResponse.json({ success: false, error: 'Your account is suspended. Contact support.' }, { status: 403 });
  }

  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ success: false, error: 'Your cart is empty' }, { status: 400 });
  }

  const productData = await buyAccountsRequest('getProducts');
  const liveProducts = extractProducts(productData);
  const markups = await getMarkups();

  const results: Array<{ productId: string; name: string; success: boolean; error?: string }> = [];
  const remainingItems: typeof cart.items = [];

  for (const item of cart.items) {
    const liveProduct = liveProducts.find((p: any) => String(p.id) === String(item.productId));

    if (!liveProduct) {
      results.push({ productId: item.productId, name: item.name, success: false, error: 'No longer available' });
      remainingItems.push(item);
      continue;
    }

    const baseUnitPrice = parseFloat(String(liveProduct.price));
    if (isNaN(baseUnitPrice) || baseUnitPrice <= 0) {
      results.push({ productId: item.productId, name: item.name, success: false, error: 'Invalid product price' });
      remainingItems.push(item);
      continue;
    }

    const unitPrice = computeMarkup(baseUnitPrice, markups.accounts);
    const cost = unitPrice * item.quantity;

    const debited = await User.findOneAndUpdate(
      { _id: userId, walletBalance: { $gte: cost } },
      { $inc: { walletBalance: -cost } },
      { new: true }
    );

    if (!debited) {
      results.push({ productId: item.productId, name: item.name, success: false, error: 'Insufficient funds' });
      remainingItems.push(item);
      continue;
    }

    try {
      const data = await buyAccountsRequest('buyProduct', {
        id: item.productId,
        amount: item.quantity,
        coupon: '',
      });

      await Transaction.create({
        userId,
        type: 'account_purchase',
        description: `Bought ${item.quantity} x ${item.name}`,
        amount: cost,
        status: 'success',
        metadata: {
          productId: item.productId,
          productName: item.name,
          category: item.category || null,
          quantity: item.quantity,
          accountData: data,
        },
      });

      results.push({ productId: item.productId, name: item.name, success: true });
    } catch (providerError) {
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: cost } });
      results.push({ productId: item.productId, name: item.name, success: false, error: 'Purchase failed, refunded' });
      remainingItems.push(item);
    }
  }

  cart.items = remainingItems;
  await cart.save();

  const finalUser = await User.findById(userId);
  const allSucceeded = results.every((r) => r.success);

  return NextResponse.json({
    success: allSucceeded,
    partial: !allSucceeded && results.some((r) => r.success),
    results,
    newBalance: finalUser?.walletBalance ?? null,
  });
}
