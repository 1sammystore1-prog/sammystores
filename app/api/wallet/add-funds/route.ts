import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, type } = await request.json(); // type: 'paystack' or 'manual'
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const user = await User.findById(userId);
  user.walletBalance += amount;
  await user.save();

  await Transaction.create({
    userId,
    type: 'wallet_fund',
    description: `Wallet funded via ${type}`,
    amount,
    status: 'success'
  });

  return NextResponse.json({ success: true, newBalance: user.walletBalance });
}
