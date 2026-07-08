import { NextResponse } from 'next/server';
import { buyAccountsRequest } from '@/lib/buyaccounts';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' });

  const { productId, amount, coupon, price } = await request.json();
  const qty = parseInt(String(amount)) || 1;
  const unitPrice = parseFloat(String(price)) || 0;
  const cost = unitPrice * qty;

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
    const data = await buyAccountsRequest('buyProduct', { 
      id: productId, 
      amount: qty, 
      coupon: coupon || '' 
    });

    await Transaction.create({
      userId, 
      type: 'account_purchase', 
      description: `Bought account ID ${productId}`, 
      amount: cost, 
      status: 'success'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Purchase successful!', 
      accountData: data, 
      newBalance: user.walletBalance 
    });
  } catch (error) {
    // Refund on failure
    user.walletBalance = (parseFloat(String(user.walletBalance)) || 0) + cost;
    if (isNaN(user.walletBalance)) user.walletBalance = 0;
    await user.save();
    return NextResponse.json({ success: false, error: 'Purchase failed' });
  }
}
