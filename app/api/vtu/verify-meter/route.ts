import { NextResponse } from 'next/server';
import { vtuRequest } from '@/lib/vtu';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const meter_number = searchParams.get('meter_number');
    const disco = searchParams.get('disco');
    const meter_type = searchParams.get('meter_type') || 'prepaid';

    const data = await vtuRequest('verifyMeter', { meter_number, disco, meter_type });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
