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

  const { phone, network, amount } = await request.json();
  const cost = parseInt(amount);

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' });
  if (user.walletBalance < cost) return NextResponse.json({ success: false, error: 'Insufficient funds' });

  // 1. Deduct Money
  user.walletBalance -= cost;
  await user.save();

  // 2. Save Transaction
  await Transaction.create({
    userId, type: 'vtu', description: `${network} Airtime/Data to ${phone}`, amount: cost, status: 'pending'
  });

  // 3. Call Provider API (DanOTP or similar)
  const apiKey = process.env.YOUR_DANOTP_API_KEY;
  try {
    // Note: Adjust the URL and params based on your specific VTU provider's documentation
    const response = await axios.get('https://danotp.com.ng/stubs/vtu.php', {
      params: { action: 'purchase', api_key: apiKey, phone, network, amount: cost, request_id: Date.now().toString() }
    });

    // Update transaction status based on response
    const status = response.data.status === 'success' ? 'success' : 'failed';
    await Transaction.updateOne({ userId, amount: cost, status: 'pending' }, { status });

    return NextResponse.json({ success: status === 'success', message: status === 'success' ? 'Sent successfully!' : 'Provider failed', newBalance: user.walletBalance });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Network Error' });
  }
}
