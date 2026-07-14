import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

let cache: { totalUsers: number; totalTransactions: number } | null = null;
let cacheAt = 0;
const CACHE_TTL = 1000 * 60 * 5;

export async function GET() {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL) {
    return NextResponse.json({ success: true, ...cache });
  }

  await dbConnect();

  const [totalUsers, totalTransactions] = await Promise.all([
    User.countDocuments({}),
    Transaction.countDocuments({ status: 'success' }),
  ]);

  cache = { totalUsers, totalTransactions };
  cacheAt = now;

  return NextResponse.json({ success: true, ...cache });
}
