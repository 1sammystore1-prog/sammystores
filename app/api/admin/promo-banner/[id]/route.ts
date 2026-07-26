import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';
import dbConnect from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';

export const dynamic = 'force-dynamic';

// Toggle active/inactive, or edit any field - a single PATCH covers both
// so the admin UI doesn't need two separate calls for "turn this off"
// vs "change the message".
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    'message',
    'emoji',
    'linkUrl',
    'linkLabel',
    'theme',
    'backgroundColor',
    'textColor',
    'startDate',
    'endDate',
    'active',
  ];
  const update: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in body) {
      if ((field === 'startDate' || field === 'endDate') && body[field]) {
        update[field] = new Date(body[field]);
      } else {
        update[field] = body[field];
      }
    }
  }

  const banner = await PromoBanner.findByIdAndUpdate(id, update, { returnDocument: 'after' });
  if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

  return NextResponse.json({ success: true, banner });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await dbConnect();
  const { id } = await params;
  const banner = await PromoBanner.findByIdAndDelete(id);
  if (!banner) return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
