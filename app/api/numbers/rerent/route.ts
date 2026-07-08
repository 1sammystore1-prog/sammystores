import { NextResponse } from 'next/server';
import { danotpRequest } from '@/lib/danotp';

export async function POST(request: Request) {
  try {
    const { rentalId } = await request.json();
    const data = await danotpRequest('rerent', { rental_id: rentalId });

    if (data.includes('EXTEND')) {
      return NextResponse.json({ success: true, message: 'Rental extended' });
    } else {
      return NextResponse.json({ success: false, error: data });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
