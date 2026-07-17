import { NextResponse } from 'next/server';
import { getNumber, cancelNumber, poolLabel, BenotpPool } from '@/lib/benotp';
import { getBenotpPrices } from '@/lib/pricing';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

const VALID_POOLS: BenotpPool[] = ['usa1', 'usa2', 'all1', 'all2'];

export async function POST(request: Request) {
  await dbConnect();

  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pool, service, country, areaCode, carrier } = await request.json();
  if (!pool || !VALID_POOLS.includes(pool) || !service) {
    return NextResponse.json({ error: 'Pool and service are required' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.suspended) {
    return NextResponse.json({ error: 'Your account is suspended. Contact support.' }, { status: 403 });
  }

  try {
    const prices = await getBenotpPrices();
    const priceNgn = prices[pool];

    if (!priceNgn || priceNgn <= 0) {
      return NextResponse.json({ error: 'Pricing not configured for this pool' }, { status: 500 });
    }

    // Same atomic check-and-deduct pattern used for TigerSMS/AccsZone -
    // avoids the balance-race issue those were fixed for.
    const debited = await User.findOneAndUpdate(
      { _id: userId, walletBalance: { $gte: priceNgn } },
      { $inc: { walletBalance: -priceNgn } },
      { new: true }
    );

    if (!debited) {
      const currentBalance = parseFloat(String(user.walletBalance)) || 0;
      return NextResponse.json(
        { error: `Insufficient balance. Need ₦${priceNgn.toFixed(2)}, Have ₦${currentBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    let order;
    try {
      order = await getNumber(pool, { service, country, areaCode, carrier });
    } catch (buyError: any) {
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: priceNgn } });
      console.error('BenOTP purchase failed:', buyError?.message || buyError);
      return NextResponse.json(
        { error: 'Could not get a number from this pool right now - your wallet has been refunded.' },
        { status: 400 }
      );
    }

    try {
      await Transaction.create({
        userId,
        type: 'virtual_number',
        description: `BenOTP ${poolLabel(pool)}: ${order.phoneNumber} (${service})`,
        amount: priceNgn,
        status: 'success',
        activationId: order.activationId,
        metadata: { provider: 'benotp', pool },
      });
    } catch (txError: any) {
      console.error('Failed to record transaction after successful BenOTP purchase:', txError);
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: priceNgn } });
      try {
        await cancelNumber(pool, order.activationId);
      } catch (cancelError) {
        console.error('Failed to cancel BenOTP activation during rollback:', cancelError);
      }
      return NextResponse.json({ error: 'Could not complete purchase, please try again' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.activationId,
      phoneNumber: order.phoneNumber,
      pool,
      price: priceNgn,
      newBalance: debited.walletBalance,
    });
  } catch (e: any) {
    console.error('BenOTP buy number error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
