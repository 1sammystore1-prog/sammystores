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

  // Calculate cost
  let cost = 0;
  if (service_type === 'airtime') cost = parseInt(amount);
  else if (service_type === 'data' || service_type === 'cable' || service_type === 'electricity') {
    // Fetch plan price
    const plansRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vtu/plans?type=${service_type}&network=${network}`);
    const plansData = await plansRes.json();
    const plan = plansData.plans?.find((p: any) => p.id === plan_id);
    cost = plan ? parseFloat(plan.price) : 0;
  } else if (service_type === 'exam') {
    const plansRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vtu/plans?type=exam`);
    const plansData = await plansRes.json();
    const plan = plansData.plans?.find((p: any) => p.id === exam_id);
    cost = plan ? parseFloat(plan.price) * (quantity || 1) : 0;
  }

  if (user.walletBalance < cost) return NextResponse.json({ success: false, error: 'Insufficient funds' });

  // Deduct money
  user.walletBalance -= cost;
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
    user.walletBalance += cost;
    await user.save();
    return NextResponse.json({ success: false, error: 'Purchase failed' });
  }
}
