import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { phone, planId, network } = await request.json();
    const apiKey = process.env.YOUR_DANOTP_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'API Key missing' });

    const response = await axios.get('https://danotp.com.ng/stubs/vtu.php', {
      params: { action: 'purchase', api_key: apiKey, phone, plan_id: planId, network, request_id: Date.now().toString() }
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' });
  }
}
