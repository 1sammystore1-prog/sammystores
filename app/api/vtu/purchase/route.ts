import { NextResponse } from 'next/server';
import { getDataPlans, resolveNetworkId, buyAirtime, buyDataBundle } from '@/lib/clubkonnect';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';
import { getMarkups, computeMarkup } from '@/lib/pricing';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Please login' }, { status: 401 });

  const body = await request.json();
  const { service_type, network, phone } = body;

  if (service_type !== 'airtime' && service_type !== 'data') {
    return NextResponse.json(
      { error: `${service_type} purchases are not yet supported` },
      { status: 400 }
    );
  }

  if (!network || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.suspended) return NextResponse.json({ error: 'Your account is suspended. Contact support.' }, { status: 403 });

  const requestId = `${userId}-${Date.now()}`;

  try {
    const markups = await getMarkups();
    let basePrice: number;
    let clubkonnectNetworkId: string;
    let planCode: string | null = null;

    if (service_type === 'airtime') {
      const { amount } = body;
      basePrice = parseFloat(String(amount));
      if (isNaN(basePrice) || basePrice <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      }
      clubkonnectNetworkId = await resolveNetworkId(network);
    } else {
      const { plan_id } = body;
      if (!plan_id) {
        return NextResponse.json({ error: 'Missing plan' }, { status: 400 });
      }
      const plans = await getDataPlans();
      const plan = plans.find((p) => p.code === String(plan_id));
      if (!plan) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      }
      basePrice = plan.price;
      clubkonnectNetworkId = plan.networkId;
      planCode = plan.code;
    }

    const price = computeMarkup(basePrice, markups.vtu);

    const debited = await User.findOneAndUpdate(
      { _id: userId, walletBalance: { $gte: price } },
      { $inc: { walletBalance: -price } },
      { new: true }
    );

    if (!debited) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }

    let providerResponse;
    try {
      providerResponse =
        service_type === 'airtime'
          ? await buyAirtime(clubkonnectNetworkId, basePrice, phone, requestId)
          : await buyDataBundle(clubkonnectNetworkId, planCode as string, phone, requestId);
    } catch (providerError: any) {
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: price } });
      return NextResponse.json({ error: `Purchase failed: ${providerError.message}` }, { status: 400 });
    }

    try {
      await Transaction.create({
        userId,
        type: 'vtu',
        description: `VTU: ${network} ${service_type} for ${phone}`,
        amount: price,
        status: 'success',
        activationId: providerResponse?.orderid ? String(providerResponse.orderid) : requestId,
      });
    } catch (txError) {
      console.error('Failed to record VTU transaction after successful purchase:', txError);
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase successful',
      newBalance: debited.walletBalance
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
