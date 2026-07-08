import { NextResponse } from 'next/server';
import { vtuRequest } from '@/lib/vtu';

export async function GET() {
  try {
    const data = await vtuRequest('getBalance');
    return NextResponse.json({ success: true, balance: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
