import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

function maskName(name: string): string {
  if (!name) return 'A user';
  const first = name.trim().split(' ')[0];
  if (first.length <= 2) return first + '***';
  return first.slice(0, 3) + '***';
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const PURCHASE_TYPES = ['virtual_number', 'account_purchase', 'smm'];

export async function GET() {
  await dbConnect();

  const transactions = await Transaction.find({
    status: 'success',
    type: { $in: PURCHASE_TYPES },
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('userId', 'name')
    .lean();

  const activity = transactions
    .filter((t: any) => t.userId)
    .map((t: any) => ({
      user: maskName(t.userId.name),
      description: t.description,
      amount: t.amount,
      time: timeAgo(t.createdAt),
    }));

  return NextResponse.json({ success: true, activity });
}
