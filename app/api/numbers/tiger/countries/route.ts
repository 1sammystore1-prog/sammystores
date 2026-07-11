import { NextResponse } from 'next/server';
import { getCountries } from '@/lib/tigerSms';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return NextResponse.json({ success: true, countries: await getCountries() }); }
  catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
