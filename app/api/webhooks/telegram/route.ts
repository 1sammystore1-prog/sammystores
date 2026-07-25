import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { replyToTicketAsAdmin } from '@/lib/ticketReply';

export const dynamic = 'force-dynamic';

// Lets you reply to a customer's support ticket directly from Telegram -
// reply (Telegram's native reply-to-message feature) to any ticket
// notification, and your reply text gets posted to that ticket exactly
// as if you'd typed it in the admin panel (customer gets emailed too).
//
// How the matching works: every ticket notification sent by this app
// (see app/api/support/tickets/route.ts, [id]/route.ts, and
// support/chat/route.ts) ends with a line "Ticket ID: <mongo id>". When
// you reply to one of those messages, Telegram includes the ORIGINAL
// message's text in `message.reply_to_message.text` - we just regex that
// back out. No database mapping needed, and it keeps working correctly
// even for old notifications sitting far back in your chat history.
export async function POST(request: Request) {
  // Telegram lets you set a secret token when registering the webhook
  // (see setWebhook's secret_token param) that it echoes back on every
  // request in this header - this is what stops a random person from
  // POSTing fake "replies" to this endpoint and injecting fake admin
  // messages into a customer's ticket.
  const providedSecret = request.headers.get('x-telegram-bot-api-secret-token');
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: any;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // ignore malformed updates
  }

  const message = update?.message;
  const replyTo = message?.reply_to_message;
  const replyText: string | undefined = message?.text;

  // Ignore anything that isn't a plain-text reply to an earlier message -
  // e.g. someone just chatting with the bot, stickers, non-reply messages.
  if (!message || !replyTo || !replyText) {
    return NextResponse.json({ ok: true });
  }

  // Only the configured admin chat can trigger a reply this way - this
  // isn't a public bot, it's tied to one specific admin conversation.
  if (String(message.chat?.id) !== process.env.TELEGRAM_ADMIN_CHAT_ID) {
    return NextResponse.json({ ok: true });
  }

  const sourceText: string = replyTo.text || replyTo.caption || '';
  const match = sourceText.match(/Ticket ID:\s*([a-f0-9]{24})/i);

  if (!match) {
    await sendTelegramMessage(
      "❌ Couldn't find a ticket ID in the message you replied to. Make sure you're replying directly to a ticket notification (not an announcement or another message)."
    );
    return NextResponse.json({ ok: true });
  }

  const ticketId = match[1];

  try {
    const ticket = await replyToTicketAsAdmin(ticketId, replyText);
    if (!ticket) {
      await sendTelegramMessage(`❌ Ticket ${ticketId} not found - it may have been deleted.`);
    } else {
      await sendTelegramMessage(`✅ Reply sent on "${ticket.subject}" - customer notified by email.`);
    }
  } catch (e: any) {
    console.error('Telegram ticket reply error:', e.message);
    await sendTelegramMessage('❌ Something went wrong sending that reply - check the admin panel directly.');
  }

  return NextResponse.json({ ok: true });
}
