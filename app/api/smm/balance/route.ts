import { NextResponse } from 'next/server';
import { smmRequest } from '@/lib/smm';

export async function GET() {
  try {
    const data = await smmRequest('balance');
    return NextResponse.json({ success: true, balance: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
