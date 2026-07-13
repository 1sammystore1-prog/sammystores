import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Cart from '@/models/Cart';

export async function GET(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' }, { status: 401 });

  const cart = await Cart.findOne({ userId });
  const items = cart?.items || [];
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return NextResponse.json({ success: true, items, total });
}

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' }, { status: 401 });

  const { productId, name, category, unitPrice, quantity } = await request.json();
  const qty = parseInt(String(quantity)) || 1;

  if (!productId || !name || typeof unitPrice !== 'number' || unitPrice <= 0 || qty <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid item' }, { status: 400 });
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existing = cart.items.find((i) => i.productId === String(productId));
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({ productId: String(productId), name, category, unitPrice, quantity: qty });
  }

  await cart.save();
  const total = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return NextResponse.json({ success: true, items: cart.items, total });
}

export async function DELETE(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' }, { status: 401 });

  const { productId } = await request.json().catch(() => ({ productId: null }));

  const cart = await Cart.findOne({ userId });
  if (!cart) return NextResponse.json({ success: true, items: [], total: 0 });

  if (productId) {
    cart.items = cart.items.filter((i) => i.productId !== String(productId));
  } else {
    cart.items = [];
  }

  await cart.save();
  const total = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return NextResponse.json({ success: true, items: cart.items, total });
}
