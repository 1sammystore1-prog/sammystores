import { NextResponse } from 'next/server';
import { fiveSimRequest } from '@/lib/5sim';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json({ success: false, error: 'Country is required' }, { status: 400 });
  }

  try {
    // Use "any" for operator to get all products
    const data = await fiveSimRequest(`/guest/products/${country}/any`);
    
    // 5sim returns an array of products
    if (Array.isArray(data)) {
      return NextResponse.json({ 
        success: true, 
        products: data.map((p: any) => ({
          id: p.name,
          name: p.name
        })).sort((a: any, b: any) => a.name.localeCompare(b.name))
      });
    }
    
    return NextResponse.json({ success: true, products: [] });
  } catch (error: any) {
    console.error('Products API error:', error.response?.data || error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
