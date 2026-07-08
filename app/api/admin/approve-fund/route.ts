import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function POST(request: Request) {
  await dbConnect();
  const { transactionId } = await request.json();

  const txn = await Transaction.findById(transactionId);
  if (!txn || txn.status !== 'pending' || txn.type !== 'manual_fund_request') {
    return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 });
  }

  // Update transaction status
  txn.status = 'success';
  await txn.save();

  // Add money to user's wallet
  const user = await User.findById(txn.userId);
  if (user) {
    user.walletBalance = (user.walletBalance || 0) + txn.amount;
    await user.save();
  }

  return NextResponse.json({ success: true, message: 'Funds approved' });
}
