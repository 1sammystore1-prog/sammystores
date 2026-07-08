import { NextResponse } from 'next/server';
import { danotpServer2Request } from '@/lib/danotp-server2';
import { getUserId } from '@/lib/auth';
import { deductBalance } from '@/lib/wallet';

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ success: false, error: 'Please login first' });

    const { service, country, maxPrice, operator, ref } = await request.json();
    const cost = parseInt(maxPrice) || 500;

    const deduction = await deductBalance(userId, cost, `Rent ${service} number (${country}) - Server 2`);
    if (!deduction.success) {
      return NextResponse.json({ success: false, error: deduction.error });
    }

    const params: any = { service, country };
    if (maxPrice) params.maxPrice = maxPrice;
    if (operator) params.operator = operator;
    if (ref) params.ref = ref;

    const data = await danotpServer2Request('getNumber', params);

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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
