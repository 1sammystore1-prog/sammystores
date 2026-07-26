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

  // Fetch all active banners (there should usually be just one or a
  // handful) and filter the date window in JS rather than via nested
  // Mongo operators - simpler to reason about and to debug, and the
  // dataset here is always tiny.
  const activeBanners = await PromoBanner.find({ active: true })
    .sort({ createdAt: -1 })
    .select('message emoji linkUrl linkLabel theme backgroundColor textColor startDate endDate')
    .lean();

  const qualifying = activeBanners.filter((b: any) => {
    const afterStart = !b.startDate || new Date(b.startDate) <= now;
    const beforeEnd = !b.endDate || new Date(b.endDate) >= now;
    return afterStart && beforeEnd;
  });

  console.log(
    `[promo-banner] active banners: ${activeBanners.length}, qualifying (within date window): ${qualifying.length}`,
    activeBanners.map((b: any) => ({ id: b._id, startDate: b.startDate, endDate: b.endDate }))
  );

  const banner = qualifying[0] || null;
  return NextResponse.json({ success: true, banner });
}
