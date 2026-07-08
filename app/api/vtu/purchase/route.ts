import { NextResponse } from 'next/server';
import { vtuRequest } from '@/lib/vtu';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' });

  const { service_type, network, phone, amount, plan_id, request_id, cable_id, iuc, disco_id, meter_number, meter_type, exam_id, quantity } = await request.json();

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' });

  // Ensure walletBalance is valid
  const currentBalance = parseFloat(String(user.walletBalance)) || 0;

  // Calculate cost safely
  let cost = 0;
  
  if (service_type === 'airtime') {
    cost = parseFloat(String(amount)) || 0;
  } else if (service_type === 'data' || service_type === 'cable' || service_type === 'electricity') {
    // For now, use a default cost since we can't fetch plans in serverless easily
    cost = parseFloat(String(amount)) || 100;
  } else if (service_type === 'exam') {
    const qty = parseInt(String(quantity)) || 1;
    cost = parseFloat(String(amount)) || 1000;
    cost = cost * qty;
  }

  // Validate cost
  if (isNaN(cost) || cost <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid cost calculation' });
  }

  if (currentBalance < cost) {
    return NextResponse.json({ success: false, error: 'Insufficient funds' });
  }

  // Deduct money safely
  user.walletBalance = currentBalance - cost;
  
  // Safety check
  if (isNaN(user.walletBalance)) {
    user.walletBalance = 0;
  }
  
  await user.save();

  // Build purchase params
  const params: any = { service_type, request_id: request_id || Date.now().toString() };
  if (network) params.network = network;
  if (phone) params.phone = phone;
  if (amount) params.amount = amount;
  if (plan_id) params.plan_id = plan_id;
  if (cable_id) params.cable_id = cable_id;
  if (iuc) params.iuc = iuc;
  if (disco_id) params.disco = disco_id;
  if (meter_number) params.meter_number = meter_number;
  if (meter_type) params.meter_type = meter_type;
  if (exam_id) params.exam_id = exam_id;
  if (quantity) params.quantity = quantity;

  try {
    const data = await vtuRequest('purchase', params);
    
    await Transaction.create({
      userId,
      type: 'vtu',
      description: `${service_type.toUpperCase()} - ${phone || meter_number || iuc || 'PIN'}`,
      amount: cost,
      status: 'success'
    });

    return NextResponse.json({ success: true, message: 'Purchase successful!', data, newBalance: user.walletBalance });
  } catch (error) {
    // Refund on failure
    user.walletBalance = (parseFloat(String(user.walletBalance)) || 0) + cost;
    if (isNaN(user.walletBalance)) user.walletBalance = 0;
    await user.save();
    return NextResponse.json({ success: false, error: 'Purchase failed' });
  }
}
