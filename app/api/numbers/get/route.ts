import { NextResponse } from 'next/server';
import axios from 'axios';
import { getUserId } from '@/lib/auth';
import { deductBalance } from '@/lib/wallet';

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ success: false, error: 'Please login first' });

    const { service, country } = await request.json();
    const apiKey = process.env.YOUR_DANOTP_API_KEY;
    
    // Cost per number (you can change this later)
    const cost = 500; 

    // 1. Deduct money first
    const deduction = await deductBalance(userId, cost, `Rent ${service} number (${country})`);
    if (!deduction.success) {
      return NextResponse.json({ success: false, error: deduction.error });
    }

    if (!apiKey || apiKey === 'your_danotp_api_key_here') {
      return NextResponse.json({ success: false, error: 'API Key not configured' });
    }

    // 2. Call DanOTP
    const response = await axios.get('https://danotp.com.ng/stubs/handler_api.php', {
      params: {
        action: 'getNumber',
        api_key: apiKey,
        service: service,
        country: country
      }
    });

    const data = response.data;

    if (data.includes('ACCESS_NUMBER')) {
      const parts = data.split(':');
      return NextResponse.json({ 
        success: true, 
        orderId: parts[1], 
        phoneNumber: parts[2],
        newBalance: deduction.newBalance
      });
    } else {
      return NextResponse.json({ success: false, error: data });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' });
  }
}
