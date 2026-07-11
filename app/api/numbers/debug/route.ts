import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  const apiKey = process.env.FIVESIM_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key not set' }, { status: 500 });
  }

  try {
    // Test 1: Try guest/countries
    const countriesRes = await axios.get('https://5sim.net/v1/guest/countries', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      countriesEndpoint: '/v1/guest/countries',
      countriesData: countriesRes.data,
      countriesType: typeof countriesRes.data,
      countriesIsArray: Array.isArray(countriesRes.data)
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    }, { status: 500 });
  }
}
