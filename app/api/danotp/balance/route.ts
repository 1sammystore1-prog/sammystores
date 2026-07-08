import { NextResponse } from 'next/server';
import { danotpRequest } from '@/lib/danotp';

export async function GET() {
  try {
    const data = await danotpRequest('getBalance');
    return NextResponse.json({ success: true, balance: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
