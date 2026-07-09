import { NextResponse } from 'next/server';
import { fiveSimRequest } from '@/lib/5sim';

export async function GET() {
  try {
    const data = await fiveSimRequest('/guest/countries');
    
    // 5sim returns an array of countries
    if (Array.isArray(data)) {
      return NextResponse.json({ 
        success: true, 
        countries: data.map((c: any) => ({
          code: c.name,
          name: c.name,
          img: c.img || null
        })).sort((a: any, b: any) => a.name.localeCompare(b.name))
      });
    }
    
    return NextResponse.json({ success: true, countries: [] });
  } catch (error: any) {
    console.error('Countries API error:', error.response?.data || error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}
