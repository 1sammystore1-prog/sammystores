import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function GET(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Please login' }, { status: 401 });

  const [totalTransactions, activeNumbers] = await Promise.all([
    Transaction.countDocuments({ userId }),
    Transaction.countDocuments({ userId, type: 'virtual_number', status: 'success' }),
  ]);

  return NextResponse.json({ success: true, totalTransactions, activeNumbers });
}
