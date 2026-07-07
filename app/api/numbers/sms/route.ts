import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    const apiKey = process.env.YOUR_DANOTP_API_KEY;

    if (!apiKey || apiKey === 'your_danotp_api_key_here') {
      return NextResponse.json({ success: false, error: 'API Key not configured' });
    }

    // Call DanOTP to check for SMS
    const response = await axios.get('https://danotp.com.ng/stubs/handler_api.php', {
      params: {
        action: 'getSms',
        api_key: apiKey,
        id: orderId
      }
    });

    const data = response.data;

    // DanOTP usually returns "STATUS:1:the_code_here" if successful
    if (data.includes('STATUS:1:')) {
      const code = data.split(':')[2];
      return NextResponse.json({ success: true, sms: code });
    } 
    // "STATUS:2" means waiting for SMS
    else if (data.includes('STATUS:2')) {
      return NextResponse.json({ success: false, error: 'Waiting for SMS...' });
    } 
    // "STATUS:3" means timeout/cancelled
    else if (data.includes('STATUS:3')) {
      return NextResponse.json({ success: false, error: 'SMS Timed Out' });
    } 
    else {
      return NextResponse.json({ success: false, error: data });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' });
  }
}
