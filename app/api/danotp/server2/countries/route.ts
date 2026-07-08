import { NextResponse } from 'next/server';
import { danotpServer2Request } from '@/lib/danotp-server2';

export async function GET() {
  try {
    const data = await danotpServer2Request('getCountries');
    return NextResponse.json({ success: true, countries: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
