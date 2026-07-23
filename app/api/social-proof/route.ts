import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic';

// Public, unauthenticated endpoint powering the "recently purchased"
// social-proof popup. Deliberately sources ONLY real transactions, never
// fake/simulated data - a false claim of recent activity would be
// misleading. Equally deliberately, it strips anything identifying:
//   - Only first name + last initial (never full name/email)
//   - Only account_purchase and smm transaction types - virtual_number
//     descriptions embed the actual phone number, which must never be
//     shown publicly, so that type is excluded entirely
//   - No amounts (a customer's spend is not for public display)
function anonymizeName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] || 'Someone';
  const lastInitial = parts.length > 1 ? `${parts[1][0].toUpperCase()}.` : '';
  return lastInitial ? `${first} ${lastInitial}` : first;
}

// Extracts just the product/service name from our own known description
// formats - never passes raw description text through unfiltered, since
// that text isn't guaranteed to stay free of sensitive details forever.
function extractLabel(type: string, description: string): string | null {
  if (type === 'account_purchase') {
    const match = description.match(/^Bought \d+ x (.+)$/);
    return match ? match[1] : null;
  }
  if (type === 'smm') {
    const match = description.match(/^SMM order: (.+?)(?: x\d+)?$/);
    return match ? match[1] : null;
  }
  return null;
}

export async function GET() {
  try {
    await dbConnect();

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000); // last 48h
    const transactions = await Transaction.find({
      type: { $in: ['account_purchase', 'smm'] },
      status: 'success',
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('userId', 'name')
      .lean();

    const items = transactions
      .map((t: any) => {
        const label = extractLabel(t.type, t.description || '');
        if (!label || !t.userId?.name) return null;
        return {
          name: anonymizeName(t.userId.name),
          product: label,
          createdAt: t.createdAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error('Social proof fetch error:', error.message);
    return NextResponse.json({ success: true, items: [] }); // fail quiet - this is decorative, not critical
  }
}
