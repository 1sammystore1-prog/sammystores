import { NextResponse } from 'next/server';
import { checkSms } from '@/lib/tigerSms';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
  try { return NextResponse.json({ success: true, ...(await checkSms(orderId)) }); }
  catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }); }
}
