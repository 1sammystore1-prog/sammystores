import { NextResponse } from 'next/server';
import { getServices } from '@/lib/tigerSms';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const country = new URL(req.url).searchParams.get('country');
  if (!country) return NextResponse.json({ success: false, error: 'Country required' }, { status: 400 });
  try { return NextResponse.json({ success: true, services: await getServices(country) }); }
  catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
