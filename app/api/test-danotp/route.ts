import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.YOUR_DANOTP_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'API KEY MISSING',
      message: 'Add YOUR_DANOTP_API_KEY to Vercel Environment Variables',
      hint: 'Go to Vercel Dashboard > Settings > Environment Variables'
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
    
    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      url: url,
      apiKeySet: apiKey ? 'YES (hidden)' : 'NO',
      rawResponse: text.substring(0, 500),
      parsed: (() => {
        try {
          return JSON.parse(text);
        } catch {
          return 'Not JSON: ' + text;
        }
      })()
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'CONNECTION FAILED',
      message: error.message,
      url: `https://www.danotp.com.ng/stubs/buy-accounts.php`
    }, { status: 500 });
  }
}
