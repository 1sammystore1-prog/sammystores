import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { service, country } = await request.json();
    
    // Your secret key from .env.local
    const apiKey = process.env.YOUR_DANOTP_API_KEY;
    
    if (!apiKey || apiKey === 'your_danotp_api_key_here') {
      return NextResponse.json({ success: false, error: 'API Key not configured' });
    }

    // Call the real DanOTP API
    const response = await axios.get('https://danotp.com.ng/stubs/handler_api.php', {
      params: {
        action: 'getNumber',
        api_key: apiKey,
        service: service,
        country: country
      }
    });

    const data = response.data;

    // DanOTP returns text like "ACCESS_NUMBER:12345:1234567890"
    if (data.includes('ACCESS_NUMBER')) {
      const parts = data.split(':');
      return NextResponse.json({ 
        success: true, 
        orderId: parts[1], 
        phoneNumber: parts[2] 
      });
    } else {
      return NextResponse.json({ success: false, error: data });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' });
  }
}
