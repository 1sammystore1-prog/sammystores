import { NextResponse } from 'next/server';
import { checkStatus } from '@/lib/benotp';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();

    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const activationId = new URL(req.url).searchParams.get('id');
    if (!activationId) {
      return NextResponse.json({ success: false, error: 'Activation ID required' }, { status: 400 });
    }

    // Scoped to the caller - same access-control fix already applied to
    // the TigerSMS equivalent of this endpoint.
    const txn = await Transaction.findOne({
      userId,
      activationId,
      type: 'virtual_number',
      'metadata.provider': 'benotp',
    });
    if (!txn) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const pool = txn.metadata?.pool;
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Missing pool information for this order' }, { status: 500 });
    }

    const result = await checkStatus(pool, activationId);
    return NextResponse.json({ success: true, status: result.status, sms: result.code });
  } catch (e: any) {
    console.error('BenOTP status check error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
  }
}
