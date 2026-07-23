import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getUserId } from '@/lib/auth';
import { getSupportBotReply, ChatMessage } from '@/lib/supportBot';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// Formats the chat transcript into a single readable message for the
// ticket, so an admin opening it sees the full conversation the customer
// already had with the bot - not just their last line.
function transcriptToMessage(history: ChatMessage[]): string {
  return history
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Bot'}: ${m.content}`)
    .join('\n\n');
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const ip = getClientIp(request);
    const limit = await checkRateLimit(`support-chat:ip:${ip}`, 20, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many messages. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'No messages provided' }, { status: 400 });
    }

    // Basic shape validation - don't trust the client to only send
    // well-formed history.
    const history: ChatMessage[] = messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20); // cap context sent to the model

    if (history.length === 0 || history[history.length - 1].role !== 'user') {
      return NextResponse.json({ success: false, error: 'Invalid message history' }, { status: 400 });
    }

    const { reply, escalate } = await getSupportBotReply(history);

    let ticketId: string | null = null;

    if (escalate) {
      const userId = await getUserId(request);
      if (!userId) {
        // Can't create a ticket without an account. Tell the bot's reply
        // to still show, but let the frontend know it needs to prompt
        // login/signup to actually reach a human.
        return NextResponse.json({ success: true, reply, escalate: true, requiresLogin: true });
      }

      const fullHistory = [...history, { role: 'assistant' as const, content: reply }];
      const ticket = await Ticket.create({
        userId,
        subject: 'Support chat - needs human follow-up',
        status: 'pending',
        messages: [{ sender: 'user', message: transcriptToMessage(fullHistory) }],
      });
      ticketId = String(ticket._id);

      sendTelegramMessage(
        `🤖➡️👤 <b>Chat escalated to support</b>\nTicket created from the AI chat widget.\n<b>Transcript:</b>\n${transcriptToMessage(fullHistory).slice(0, 500)}`
      );
    }

    return NextResponse.json({ success: true, reply, escalate, ticketId });
  } catch (error: any) {
    console.error('Support chat error:', error.message);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
