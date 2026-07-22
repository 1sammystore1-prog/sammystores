import { NextResponse } from 'next/server';
import axios from 'axios';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';
import { creditNeurapayTransaction } from '@/lib/neurapayCredit';

const NEURAPAY_BASE_URL = 'https://neurapay.com.ng/api/v1';

// Backs the "Check payment status" button on the fund page. The webhook
// is the primary way payments get credited, but webhook delivery isn't
// instant (or guaranteed to arrive first try), so this lets an impatient
// user confirm manually - safe to call repeatedly, see
// lib/neurapayCredit.ts for the idempotency guard.
export async function POST(request: Request) {
  try {
    await dbConnect();

    const userId = getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Please login' }, { status: 401 });
    }

    const { reference } = await request.json();
    if (!reference || typeof reference !== 'string') {
      return NextResponse.json({ success: false, error: 'Reference required' }, { status: 400 });
    }

    // Only let a user check/consume their own transaction.
    const txn = await Transaction.findOne({ activationId: reference, userId, type: 'wallet_fund' });
    if (!txn) {
      return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
    }

    if (txn.status === 'success') {
      return NextResponse.json({ success: true, status: 'success', newBalance: undefined });
    }

    const secretKey = process.env.NEURAPAY_SECRET_KEY;
    const businessId = process.env.NEURAPAY_BUSINESS_ID;
    if (!secretKey || !businessId) {
      return NextResponse.json({ success: false, error: 'NeuraPay is not configured' }, { status: 500 });
    }

    // NOTE: we don't yet know NeuraPay's own transaction id for this
    // payment (only their webhook tells us that, and it differs from the
    // reference we generated). Until that's captured, this direct status
    // lookup will typically 404 - that's expected, not a real failure, so
    // we treat it as "still pending" rather than surfacing a raw API
    // error to the user. The webhook is what actually credits the wallet
    // in the normal case; this is just a best-effort manual nudge.
    const neurapayReference = txn.metadata?.neurapayReference;
    if (!neurapayReference) {
      return NextResponse.json({ success: true, status: 'pending' });
    }

    let statusRes;
    try {
      statusRes = await axios.get(`${NEURAPAY_BASE_URL}/transactions/${encodeURIComponent(neurapayReference)}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'X-Business-Id': businessId,
        },
      });
    } catch (lookupError: any) {
      console.error('NeuraPay status lookup failed (treating as still pending):', lookupError.response?.status);
      return NextResponse.json({ success: true, status: 'pending' });
    }

    const data = statusRes.data?.data || statusRes.data;
    const status = data?.status;

    if (status !== 'successful' && status !== 'success') {
      return NextResponse.json({ success: true, status: status || 'pending' });
    }

    const grossAmount = Number(data.amount) || 0;
    const netAmount = Number(data.net_amount) || grossAmount;

    const result = await creditNeurapayTransaction({
      reference: neurapayReference,
      virtualAccount: txn.metadata?.accountNumber,
      grossAmount,
      netAmount,
      providerReference: data.provider_reference,
    });

    return NextResponse.json({ success: true, status: 'success', newBalance: result.newBalance });
  } catch (error: any) {
    console.error('NeuraPay status check error:', error.response?.data || error.message);
    return NextResponse.json({ success: false, error: 'Could not check payment status' }, { status: 500 });
  }
}
