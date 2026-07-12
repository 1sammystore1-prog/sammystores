import { NextResponse } from 'next/server';
import { getDataPlans } from '@/lib/clubkonnect';
import { getMarkups, computeMarkup } from '@/lib/pricing';

const APP_NETWORK_NAMES: Record<string, string> = {
  '1': 'MTN',
  '2': 'GLO',
  '3': 'AIRTEL',
  '4': '9MOBILE',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'data';
  const network = searchParams.get('network');

  if (type !== 'data') {
    return NextResponse.json({ success: true, plans: [] });
  }

  try {
    const targetName = network ? APP_NETWORK_NAMES[network] : undefined;
    const allPlans = await getDataPlans();
    const markups = await getMarkups();

    const filtered = targetName
      ? allPlans.filter((p) => p.network.toUpperCase().includes(targetName))
      : allPlans;

    const plans = filtered.map((p) => ({
      id: p.code,
      name: p.name,
      price: computeMarkup(p.price, markups.vtu),
    }));

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
