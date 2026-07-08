import { NextResponse } from 'next/server';
import { smmRequest } from '@/lib/smm';

export async function GET() {
  try {
    const data = await smmRequest('services');
    return NextResponse.json({ success: true, services: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
