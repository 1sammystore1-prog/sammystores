import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Numbers typically only accept an SMS for a limited window after
// purchase (the provider itself enforces this, not us) - past that,
// "check for code" / "cancel" calls would just fail anyway. Rather than
// let a user tap a button that's guaranteed to error on an old order,
// the list marks orders past this age as no longer actionable - the
// phone number and purchase details still show either way, per the
// actual ask ("still view the number they bought").
const ACTIONABLE_WINDOW_MINUTES = 20;

// Both providers' buy routes save the phone number embedded in the
// transaction's own description text (see app/api/numbers/tiger/buy and
// .../benotp/buy) rather than as a separate structured field - these
// patterns pull it back out. If a description format ever changes, this
// just falls back to showing the raw description instead of breaking.
function parsePhoneAndService(description: string, provider: string): { phoneNumber: string; service: string } {
  if (provider === 'benotp') {
    // "Virtual number (<poolLabel>): <phoneNumber> (<service>)"
    const match = description.match(/^Virtual number \(.+?\):\s*(.+?)\s*\((.+)\)$/);
    if (match) return { phoneNumber: match[1], service: match[2] };
  } else {
    // "Virtual number: <phoneNumber> (<serviceName> - <country>)"
    const match = description.match(/^Virtual number:\s*(.+?)\s*\((.+)\)$/);
    if (match) return { phoneNumber: match[1], service: match[2] };
  }
  return { phoneNumber: description, service: '' };
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await Transaction.find({ userId, type: 'virtual_number' })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const now = Date.now();

    const orders = transactions.map((t: any) => {
      const provider = t.metadata?.provider === 'benotp' ? 'benotp' : 'tiger';
      const { phoneNumber, service } = parsePhoneAndService(t.description || '', provider);
      const ageMinutes = (now - new Date(t.createdAt).getTime()) / 60000;
      const cancelled = t.status === 'refunded' || !!t.metadata?.cancelled;

      return {
        transactionId: String(t._id),
        activationId: t.activationId,
        provider,
        phoneNumber,
        service,
        price: t.amount,
        createdAt: t.createdAt,
        cancelled,
        // Only worth showing action buttons if it's neither already
        // cancelled NOR aged out of the provider's own SMS window.
        actionable: !cancelled && ageMinutes < ACTIONABLE_WINDOW_MINUTES,
      };
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('Numbers history error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to load history' }, { status: 500 });
  }
}
