import { NextResponse } from 'next/server';
import { danotpRequest } from '@/lib/danotp';

export async function GET() {
  try {
    const data = await danotpRequest('getServices');
    return NextResponse.json({ success: true, services: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
