import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';

export const dynamic = 'force-dynamic';

// Public, unauthenticated - returns the single currently-active promo
// banner, if one exists and its optional date window (if set) currently
// includes today. Only one is ever shown at a time (the most recently
// created one that qualifies), unlike AnnouncementBanner which stacks
// several - a festive/ad banner competing for attention with other
// festive/ad banners defeats the purpose.
export async function GET() {
  await dbConnect();

  const now = new Date();
  const banner = await PromoBanner.findOne({
    active: true,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  })
    .sort({ createdAt: -1 })
    .select('message emoji linkUrl linkLabel theme backgroundColor textColor')
    .lean();

  return NextResponse.json({ success: true, banner: banner || null });
}
