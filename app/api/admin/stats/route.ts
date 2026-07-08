import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET() {
  await dbConnect();
  
  const totalUsers = await User.countDocuments();
  
  // Calculate total wallet balance across all users
  const users = await User.find();
  const totalWalletBalance = users.reduce((acc, user) => acc + (user.walletBalance || 0), 0);

  const totalTransactions = await Transaction.countDocuments();

  return NextResponse.json({ 
    success: true, 
    totalUsers, 
    totalWalletBalance,
    totalTransactions 
  });
}
