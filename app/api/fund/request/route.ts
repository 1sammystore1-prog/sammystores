import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

export async function POST(request: Request) {
  await dbConnect();
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount } = await request.json();
  const validAmount = parseFloat(String(amount));

  if (isNaN(validAmount) || validAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Create a PENDING transaction record
  await Transaction.create({
    userId,
    type: 'manual_fund_request',
    description: `Manual Transfer Request for ₦${validAmount}`,
    amount: validAmount,
    status: 'pending'
  });

  return NextResponse.json({ success: true, message: 'Request submitted for approval' });
}
