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
  
  // Calculate cost based on price per 1000
  const cost = (parseInt(quantity) / 1000) * parseFloat(price);

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' });
  if (user.walletBalance < cost) return NextResponse.json({ success: false, error: 'Insufficient funds' });

  // 1. Deduct Money
  user.walletBalance -= cost;
  await user.save();

  // 2. Call DanOTP SMM API
  try {
    const data = await smmRequest('add', { service, link, quantity });
    
    // Save Transaction
    await Transaction.create({
      userId, type: 'smm', description: `SMM Order #${data.order || 'Pending'} for ${link}`, amount: cost, status: 'success'
    });

    return NextResponse.json({ success: true, message: 'Order placed!', orderId: data.order, newBalance: user.walletBalance });
  } catch (error) {
    // Refund if API fails
    user.walletBalance += cost;
    await user.save();
    return NextResponse.json({ success: false, error: 'Provider failed' });
  }
}
