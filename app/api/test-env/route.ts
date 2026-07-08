import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.YOUR_DANOTP_API_KEY;
  
  return NextResponse.json({
    apiKeySet: !!apiKey,
    apiKeyValue: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('DANOTP') || key.includes('API'))
  });
}
