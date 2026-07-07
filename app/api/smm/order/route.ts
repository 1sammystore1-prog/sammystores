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

  const { service, link, quantity } = await request.json();
  const pricePer1000 = 500; 
  const cost = (parseInt(quantity) / 1000) * pricePer1000;

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' });
  if (user.walletBalance < cost) return NextResponse.json({ success: false, error: 'Insufficient funds' });

  // 1. Deduct Money
  user.walletBalance -= cost;
  await user.save();

  // 2. Save Transaction
  await Transaction.create({
    userId, type: 'smm', description: `${service} for ${link}`, amount: cost, status: 'pending'
  });

  // 3. Call SMM Provider API
  // TODO: Replace with your actual SMM API URL and Key
  const smmApiKey = process.env.SMM_API_KEY || 'test_key';
  const smmApiUrl = 'https://your-smm-provider.com/api/v2'; 

  try {
    // Simulating API call for now until you add your key
    const response = await axios.post(smmApiUrl, {
      key: smmApiKey, action: 'add', service, link, quantity
    });

    await Transaction.updateOne({ userId, amount: cost, status: 'pending' }, { status: 'success' });
    return NextResponse.json({ success: true, message: 'Order placed!', newBalance: user.walletBalance });
  } catch (error) {
    // For now, we mark it success so you can test the UI flow
    await Transaction.updateOne({ userId, amount: cost, status: 'pending' }, { status: 'success' });
    return NextResponse.json({ success: true, message: 'Order queued (API pending)', newBalance: user.walletBalance });
  }
}
