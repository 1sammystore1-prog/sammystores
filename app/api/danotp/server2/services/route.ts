import { NextResponse } from 'next/server';
import { danotpServer2Request } from '@/lib/danotp-server2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'US';

    const data = await danotpServer2Request('getServices', { country });
    return NextResponse.json({ success: true, services: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
