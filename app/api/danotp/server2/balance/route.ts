import { NextResponse } from 'next/server';
import { danotpServer2Request } from '@/lib/danotp-server2';

export async function GET() {
  try {
    const data = await danotpServer2Request('getBalance');
    return NextResponse.json({ success: true, balance: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
