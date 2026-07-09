import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const apiKey = process.env.FIVESIM_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'FIVESIM_API_KEY not set in Vercel',
      hint: 'Go to Vercel > Settings > Environment Variables and add FIVESIM_API_KEY'
    }, { status: 500 });
  }

  try {
    // Test 1: Check balance with v1
    const response1 = await axios.get('https://5sim.net/v1/user/profile', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    return NextResponse.json({ 
      success: true,
      message: '5sim API is working!',
      balance: response1.data.balance,
      email: response1.data.email
    });

  } catch (error: any) {
    // If v1 fails, try to see what error we get
    const errorMessage = error.response?.data || error.message;
    
    return NextResponse.json({ 
      success: false,
      error: '5sim API connection failed',
      details: errorMessage,
      apiKeySet: apiKey ? 'Yes (hidden)' : 'No',
      apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'Not set'
    }, { status: 500 });
  }
}
