import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { productId, amount } = await request.json();
    const apiKey = process.env.YOUR_DANOTP_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'API Key missing' });

    const response = await axios.get('https://danotp.com.ng/stubs/buy-accounts.php', {
      params: { action: 'buyProduct', api_key: apiKey, id: productId, amount: amount || 1 }
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' });
  }
}
