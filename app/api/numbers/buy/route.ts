import { NextResponse } from 'next/server';
import { fiveSimRequest } from '@/lib/5sim';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserId } from '@/lib/auth';
import Transaction from '@/models/Transaction';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Please login' }, { status: 401 });

  const { country, product } = await request.json();
  if (!country || !product) {
    return NextResponse.json({ error: 'Country and product are required' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    // 1. Get price from 5sim
    const priceData = await fiveSimRequest(`/prices/country/${country}/product/${product}/operator/any`);
    
    // 5sim returns prices in an object, we need to find the lowest price
    let price = 0;
    if (priceData && typeof priceData === 'object') {
      const prices = Object.values(priceData).flat();
      if (prices.length > 0) {
        // Find the lowest price
        price = Math.min(...prices.map((p: any) => parseFloat(p.cost)));
      }
    }

    // Convert USD to NGN (approximate rate, you can adjust this or fetch live rate)
    const priceInNgn = price * 1500; 

    if (user.walletBalance < priceInNgn) {
      return NextResponse.json({ error: `Insufficient funds. You need ₦${priceInNgn.toFixed(2)}` }, { status: 400 });
    }

    // 2. Buy the number
    const activation = await fiveSimRequest(`/buy/activation/${country}/${product}`, 'POST');

    // 3. Deduct money and save transaction
    user.walletBalance -= priceInNgn;
    await user.save();

    await Transaction.create({
      userId,
      type: 'virtual_number',
      description: `Bought ${product} number for ${country} - Order ID: ${activation.id}, Phone: ${activation.phone}`,
      amount: priceInNgn,
      status: 'success'
    });

    return NextResponse.json({ 
      success: true, 
      orderId: activation.id,
      phoneNumber: activation.phone,
      price: priceInNgn,
      newBalance: user.walletBalance
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to buy number' }, { status: 500 });
  }
}
