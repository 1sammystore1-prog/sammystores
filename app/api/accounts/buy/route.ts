import { NextResponse } from 'next/server';
import { buyAccountsRequest } from '@/lib/buyaccounts';
import { purchaseListing, getAllListings } from '@/lib/accszone';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getMarkups, computeMarkup, toNgn } from '@/lib/pricing';
import { cleanAccountData } from '@/lib/accountData';

function pickStock(obj: any): number | null {
  if (!obj) return null;
  const candidates = [obj.stock, obj.quantity, obj.qty, obj.available, obj.count, obj.inventory];
  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue;
    const n = parseInt(String(c), 10);
    if (!isNaN(n)) return n;
  }
  return null;
}

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

async function handleBenotpPurchase(productId: string, qty: number, coupon: string | undefined, userId: string) {
  const rawId = productId.replace(/^benotp_/, '');
  const productData = await buyAccountsRequest('getProducts');
  const products = extractProducts(productData);
  const product = products.find((p: any) => String(p.id) === String(rawId));

  if (!product) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 400 });
  }

  const stock = pickStock(product);
  if (stock !== null && stock <= 0) {
    return NextResponse.json({ success: false, error: 'This product is out of stock' }, { status: 400 });
  }
  if (stock !== null && qty > stock) {
    return NextResponse.json(
      { success: false, error: `Only ${stock} available - please lower the quantity` },
      { status: 400 }
    );
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
      id: rawId,
      amount: qty,
      coupon: coupon || ''
    });

    const txn = await Transaction.create({
      userId,
      type: 'account_purchase',
      description: `Bought ${qty} x ${product.name || product.title || `account ID ${rawId}`}`,
      amount: cost,
      status: 'success',
      metadata: {
        productId,
        source: 'benotp',
        productName: product.name || product.title || null,
        category: product.category || null,
        quantity: qty,
        accountData: cleanAccountData(data),
        instructions: product.instructions || null,
        video: product.video || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase successful!',
      accountData: cleanAccountData(data),
      newBalance: debited.walletBalance,
      orderId: String(txn._id)
    });
  } catch (providerError: any) {
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: cost } });
    const reason = providerError?.message || 'Purchase failed';
    return NextResponse.json(
      { success: false, error: `${reason} - your wallet has been refunded.` },
      { status: 400 }
    );
  }
}

async function handleAccszonePurchase(productId: string, qty: number, coupon: string | undefined, userId: string) {
  const rawId = productId.replace(/^accszone_/, '');

  const listings = await getAllListings();
  const listing = listings.find((l: any) => String(l.id) === String(rawId));

  if (!listing) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 400 });
  }

  if (typeof listing.available_stock === 'number' && listing.available_stock <= 0) {
    return NextResponse.json({ success: false, error: 'This product is out of stock' }, { status: 400 });
  }
  if (typeof listing.available_stock === 'number' && qty > listing.available_stock) {
    return NextResponse.json(
      { success: false, error: `Only ${listing.available_stock} available - please lower the quantity` },
      { status: 400 }
    );
  }

  const baseUnitPriceUsd = parseFloat(String(listing.price));
  if (isNaN(baseUnitPriceUsd) || baseUnitPriceUsd <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid product price' }, { status: 500 });
  }

  const markups = await getMarkups();
  const unitPrice = computeMarkup(toNgn(baseUnitPriceUsd), markups.accounts);
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
    const result = await purchaseListing(rawId, qty, coupon || undefined);

    const accountData = { Accounts: result.accounts.join('\n') };

    const txn = await Transaction.create({
      userId,
      type: 'account_purchase',
      description: `Bought ${qty} x ${listing.title}`,
      amount: cost,
      status: 'success',
      metadata: {
        productId,
        source: 'accszone',
        productName: listing.title,
        category: listing.subcategory?.title || listing.category?.title || null,
        quantity: qty,
        accountData,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase successful!',
      accountData,
      newBalance: debited.walletBalance,
      orderId: String(txn._id)
    });
  } catch (providerError: any) {
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: cost } });
    const reason = providerError?.message || 'Purchase failed';
    return NextResponse.json(
      { success: false, error: `${reason} - your wallet has been refunded.` },
      { status: 400 }
    );
  }
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

  const idStr = String(productId);

  try {
    if (idStr.startsWith('accszone_')) {
      return await handleAccszonePurchase(idStr, qty, coupon, userId);
    }
    if (idStr.startsWith('benotp_')) {
      return await handleBenotpPurchase(idStr, qty, coupon, userId);
    }
    return NextResponse.json({ success: false, error: 'Unknown product source' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
