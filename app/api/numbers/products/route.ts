import { NextResponse } from 'next/server';
import { fiveSimRequest } from '@/lib/5sim';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json({ success: false, error: 'Country is required' }, { status: 400 });
  }

  try {
    const data = await fiveSimRequest(`/products/${country}/any`);
    return NextResponse.json({ success: true, products: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
