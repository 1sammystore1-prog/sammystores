import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const totalUsers = await User.countDocuments();
  const users = await User.find();
  const totalWalletBalance = users.reduce((acc, user) => acc + (parseFloat(String(user.walletBalance)) || 0), 0);
  const totalTransactions = await Transaction.countDocuments();

  // Total NeuraPay fees the store has absorbed (see lib/neurapayCredit.ts -
  // customers are credited the full amount they sent, so this fee comes
  // straight out of the store's margin). Aggregated in the database
  // rather than summed in JS, since this could be thousands of rows.
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [feesAllTime, feesThisMonth] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: 'wallet_fund', status: 'success', 'metadata.feeAbsorbedByStore': { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$metadata.feeAbsorbedByStore' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: 'wallet_fund',
          status: 'success',
          createdAt: { $gte: startOfMonth },
          'metadata.feeAbsorbedByStore': { $gt: 0 },
        },
      },
      { $group: { _id: null, total: { $sum: '$metadata.feeAbsorbedByStore' }, count: { $sum: 1 } } },
    ]),
  ]);

  const neurapayFeesAbsorbed = {
    allTime: feesAllTime[0]?.total ?? 0,
    allTimeCount: feesAllTime[0]?.count ?? 0,
    thisMonth: feesThisMonth[0]?.total ?? 0,
    thisMonthCount: feesThisMonth[0]?.count ?? 0,
  };

  return NextResponse.json({ success: true, totalUsers, totalWalletBalance, totalTransactions, neurapayFeesAbsorbed });
}
