import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { service, link, quantity } = await request.json();
    const apiKey = process.env.YOUR_DANOTP_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'API Key missing' });

    const response = await axios.get('https://danotp.com.ng/api/v2', {
      params: { action: 'add', key: apiKey, service, link, quantity }
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' });
  }
}
