import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserId } from '@/lib/auth';
import { getLifetimeSpend, getTierForSpend, getNextTier } from '@/lib/loyalty';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  await dbConnect();
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Please login' }, { status: 401 });
  }

  const lifetimeSpend = await getLifetimeSpend(userId);
  const tier = getTierForSpend(lifetimeSpend);
  const nextTier = getNextTier(tier);

  return NextResponse.json({
    success: true,
    lifetimeSpend,
    tierName: tier.name,
    discountPercent: tier.discountPercent,
    nextTier: nextTier
      ? { name: nextTier.name, discountPercent: nextTier.discountPercent, amountToReach: Math.max(0, nextTier.minSpend - lifetimeSpend) }
      : null,
  });
}
