import { NextResponse } from 'next/server';
import axios from 'axios';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' });

  const { accountType } = await request.json();
  const price = 1500; 

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' });
  if (user.walletBalance < price) return NextResponse.json({ success: false, error: 'Insufficient funds' });

  // 1. Deduct Money
  user.walletBalance -= price;
  await user.save();

  // 2. Save Transaction
  await Transaction.create({
    userId, type: 'account_purchase', description: `Purchased ${accountType} account`, amount: price, status: 'pending'
  });

  // 3. Fetch from Supplier API
  // TODO: Replace with your actual Account Supplier API
  const supplierApiKey = process.env.ACCOUNT_SUPPLIER_KEY || 'test_key';
  
  try {
    // Simulating supplier response
    const randomStr = Math.random().toString(36).substring(2, 8);
    const accountDetails = {
      email: `user_${randomStr}@gmail.com`,
      password: `Pass_${randomStr}123!`,
      recovery: 'recovery@darknet.com',
      type: accountType
    };

    await Transaction.updateOne({ userId, amount: price, status: 'pending' }, { status: 'success' });
    return NextResponse.json({ success: true, message: 'Account acquired!', account: accountDetails, newBalance: user.walletBalance });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Supplier failed' });
  }
}
