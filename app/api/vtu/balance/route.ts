import { NextResponse } from 'next/server';
import { getWalletBalance } from '@/lib/clubkonnect';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await getWalletBalance();
    return NextResponse.json({ success: true, balance: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
