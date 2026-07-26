import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const PRODUCT_TYPES = ['account_purchase', 'smm', 'virtual_number'];

// Pulls a display name back out of our own known description formats -
// same approach as app/api/social-proof/route.ts and
// app/api/numbers/history/route.ts. Falls back to the raw description
// if the format doesn't match, rather than dropping the row.
function extractProductName(type: string, description: string): string {
  if (type === 'account_purchase') {
    const m = description.match(/^Bought \d+ x (.+)$/);
    return m ? m[1] : description;
  }
  if (type === 'smm') {
    const m = description.match(/^SMM order: (.+?)(?: x\d+)?$/);
    return m ? m[1] : description;
  }
  if (type === 'virtual_number') {
    const m = description.match(/^Virtual number(?:\s*\(.+?\))?:\s*.+?\s*\((.+)\)$/);
    return m ? m[1] : description;
  }
  return description;
}

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await dbConnect();

  const days = 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Daily revenue over the last 30 days - aggregated in the database
  // (grouping by day is cheap for MongoDB, expensive to do by hand in JS
  // for potentially thousands of rows).
  const revenueByDay = await Transaction.aggregate([
    { $match: { type: { $in: PRODUCT_TYPES }, status: 'success', createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Daily new signups over the same window.
  const signupsByDay = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Revenue split by category (accounts/logs vs SMM vs numbers) - a
  // simple grouped sum, not a time series.
  const revenueByType = await Transaction.aggregate([
    { $match: { type: { $in: PRODUCT_TYPES }, status: 'success', createdAt: { $gte: since } } },
    { $group: { _id: '$type', revenue: { $sum: '$amount' }, orders: { $sum: 1 } } },
  ]);

  // Top-selling individual products/services - description parsing isn't
  // something MongoDB's aggregation can do cleanly, so this part fetches
  // the raw rows and tallies them in JS. Capped at 2000 rows (30 days of
  // sales) which is comfortably fast to reduce in memory.
  const recentSales = await Transaction.find({
    type: { $in: PRODUCT_TYPES },
    status: 'success',
    createdAt: { $gte: since },
  })
    .select('type description amount')
    .limit(2000)
    .lean();

  const productTally: Record<string, { name: string; orders: number; revenue: number }> = {};
  for (const t of recentSales) {
    const name = extractProductName(t.type, t.description || '');
    const key = `${t.type}:${name}`;
    if (!productTally[key]) productTally[key] = { name, orders: 0, revenue: 0 };
    productTally[key].orders += 1;
    productTally[key].revenue += t.amount || 0;
  }
  const topProducts = Object.values(productTally)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // This month vs last month total revenue, for a simple growth figure.
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonthAgg, lastMonthAgg] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: { $in: PRODUCT_TYPES }, status: 'success', createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          type: { $in: PRODUCT_TYPES },
          status: 'success',
          createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const thisMonthRevenue = thisMonthAgg[0]?.total ?? 0;
  const lastMonthRevenue = lastMonthAgg[0]?.total ?? 0;
  const growthPercent =
    lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;

  return NextResponse.json({
    success: true,
    revenueByDay,
    signupsByDay,
    revenueByType,
    topProducts,
    thisMonthRevenue,
    lastMonthRevenue,
    growthPercent,
  });
}
