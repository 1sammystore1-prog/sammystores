import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Product purchases only - accounts/logs (account_purchase) and SMM
// orders (smm). Virtual numbers have their own dedicated history at
// /numbers (History tab, powered by /api/numbers/history) since those
// need Check-Code/Cancel actions that don't apply here. Wallet-money
// movements (funding, bonuses, discounts) live on the separate
// Transaction History page (/api/wallet/transactions) - keeping these
// apart is the whole point of this split.
export async function GET(request: Request) {
  await dbConnect();
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await Transaction.find({ userId, type: { $in: ['account_purchase', 'smm'] } })
    .sort({ createdAt: -1 })
    .limit(100);

  return NextResponse.json({ success: true, orders });
}
