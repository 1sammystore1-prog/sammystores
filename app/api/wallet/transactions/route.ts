import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Wallet money-movement entries only - funding, bonuses, discounts,
// admin adjustments, refunds. Product purchases (account_purchase, smm)
// have their own Order History page, and virtual numbers have their own
// dedicated history at /numbers - this page is specifically "what
// happened to my wallet balance", not "what did I buy".
const WALLET_TYPES = [
  'wallet_fund',
  'welcome_bonus',
  'referral_bonus',
  'coupon_discount',
  'tier_discount',
  'admin_credit',
  'admin_debit',
  'refund',
  'deposit',
  'withdrawal',
];

export async function GET(request: Request) {
  await dbConnect();
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transactions = await Transaction.find({ userId, type: { $in: WALLET_TYPES } })
    .sort({ createdAt: -1 })
    .limit(100);

  return NextResponse.json({ success: true, transactions });
}
