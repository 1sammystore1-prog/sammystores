import { NextResponse } from 'next/server';
import { japRequest } from '@/lib/jap';
import { getMarkups, computeMarkup, toNgn } from '@/lib/pricing';

export async function GET() {
  try {
    const data = await japRequest('services');
    const markups = await getMarkups();

    // JAP quotes `rate` in USD per 1000 units - convert to NGN first, then
    // apply the markup on top, so the price shown here (in ₦) matches what
    // smm/order actually charges.
    const services = Array.isArray(data)
      ? data.map((s: any) => ({
          ...s,
          rate: computeMarkup(toNgn(parseFloat(s.rate) || 0), markups.smm),
        }))
      : data;

    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
