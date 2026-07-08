import { NextResponse } from 'next/server';
import { vtuRequest } from '@/lib/vtu';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const iuc = searchParams.get('iuc');
    const cable_id = searchParams.get('cable_id') || '2';

    const data = await vtuRequest('verifyIUC', { iuc, cable_id });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
