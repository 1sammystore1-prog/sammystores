import { NextResponse } from 'next/server';
import { danotpServer2Request } from '@/lib/danotp-server2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const country = searchParams.get('country');

    const data = await danotpServer2Request('getPrices', { service, country });
    return NextResponse.json({ success: true, prices: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
