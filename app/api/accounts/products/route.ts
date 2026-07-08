import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.YOUR_DANOTP_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'API key not configured in Vercel',
      products: [] 
    }, { status: 500 });
  }

  try {
    const url = `https://www.danotp.com.ng/stubs/buy-accounts.php?action=getProducts&api_key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    const text = await response.text();
    
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}: ${text.substring(0, 100)}`,
        products: [],
        rawResponse: text.substring(0, 200)
      }, { status: response.status });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON from DanOTP',
        products: [],
        rawResponse: text.substring(0, 300)
      }, { status: 500 });
    }

    // Handle different response formats
    let products = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) products = data.data;
      else if (Array.isArray(data.products)) products = data.products;
      else if (data.product) products = [data.product];
    }

    return NextResponse.json({
      success: true,
      products: products,
      count: products.length
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Network error',
      products: [] 
    }, { status: 500 });
  }
}
