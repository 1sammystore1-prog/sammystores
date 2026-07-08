import { NextResponse } from 'next/server';
import { vtuRequest } from '@/lib/vtu';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'data';
    const network = searchParams.get('network');

    const params: any = { type };
    if (network) params.network = network;

    const data = await vtuRequest('getPlans', params);
    return NextResponse.json({ success: true, plans: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
