import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';

export const dynamic = 'force-dynamic';

// List every banner (active, scheduled, past, disabled) for the admin
// panel's own history/management view.
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const banners = await PromoBanner.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, banners });
}

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const { message, emoji, linkUrl, linkLabel, theme, backgroundColor, textColor, startDate, endDate } =
    await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const validTheme = ['festive', 'sale', 'celebration', 'ad', 'custom'].includes(theme) ? theme : 'festive';

  const banner = await PromoBanner.create({
    message: message.trim(),
    emoji: emoji?.trim() || '',
    linkUrl: linkUrl?.trim() || '',
    linkLabel: linkLabel?.trim() || '',
    theme: validTheme,
    backgroundColor: validTheme === 'custom' ? backgroundColor?.trim() || '' : '',
    textColor: validTheme === 'custom' ? textColor?.trim() || '' : '',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    active: true,
    createdBy: admin._id,
  });

  return NextResponse.json({ success: true, banner });
}
