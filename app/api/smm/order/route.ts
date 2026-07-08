import { NextResponse } from 'next/server';
import { smmRequest } from '@/lib/smm';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' });

  const { service, link, quantity, price } = await request.json();
  
  // Safely parse values
  const qty = parseFloat(String(quantity)) || 1000;
  const rate = parseFloat(String(price)) || 0;
  
  // Calculate cost safely
  const cost = (qty / 1000) * rate;

  // Validate cost
  if (isNaN(cost) || cost <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid cost calculation' });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' });

  const currentBalance = parseFloat(String(user.walletBalance)) || 0;
  
  if (currentBalance < cost) {
    return NextResponse.json({ success: false, error: 'Insufficient funds' });
  }

  // Deduct money safely
  user.walletBalance = currentBalance - cost;
  if (isNaN(user.walletBalance)) user.walletBalance = 0;
  await user.save();

  try {
    const data = await smmRequest('add', { service, link, quantity: qty });
    
    await Transaction.create({
      userId, type: 'smm', description: `SMM Order for ${link}`, amount: cost, status: 'success'
    });

    return NextResponse.json({ success: true, message: 'Order placed!', orderId: data.order, newBalance: user.walletBalance });
  } catch (error) {
    // Refund on failure
    user.walletBalance = (parseFloat(String(user.walletBalance)) || 0) + cost;
    if (isNaN(user.walletBalance)) user.walletBalance = 0;
    await user.save();
    return NextResponse.json({ success: false, error: 'Provider failed' });
  }
}
