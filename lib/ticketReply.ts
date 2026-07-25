import dbConnect from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { sendTicketReplyEmail } from '@/lib/email';

// Shared by BOTH the admin web panel's reply route and the Telegram
// webhook, so replying "as admin" always does exactly the same thing no
// matter which surface it came from - one place to get this right,
// instead of the two slowly drifting apart.
export async function replyToTicketAsAdmin(
  ticketId: string,
  message: string,
  status?: string
) {
  await dbConnect();

  const ticket = await Ticket.findById(ticketId).populate('userId', 'name email');
  if (!ticket) return null;

  if (message?.trim()) {
    ticket.messages.push({ sender: 'admin', message: message.trim(), createdAt: new Date() });
    ticket.userUnread = true;
  }

  if (status && ['open', 'pending', 'closed'].includes(status)) {
    ticket.status = status;
  } else if (message?.trim()) {
    ticket.status = 'open';
  }

  await ticket.save();

  const ticketUser = ticket.userId as any;
  if (message?.trim() && ticketUser?.email) {
    sendTicketReplyEmail({
      to: ticketUser.email,
      subject: ticket.subject,
      message: message.trim(),
    }).catch((err) => console.error('Ticket reply email failed:', err));
  }

  return ticket;
}
