Reply to support tickets directly from Telegram
====================================================
New:     lib/ticketReply.ts                       (shared reply logic)
New:     app/api/webhooks/telegram/route.ts        (receives your replies)
Updated: app/api/admin/tickets/[id]/route.ts       (now uses the shared helper)
Updated: app/api/support/tickets/route.ts          (notification includes Ticket ID)
Updated: app/api/support/tickets/[id]/route.ts     (was MISSING a notification
                                                     entirely when a customer
                                                     replied to an existing
                                                     ticket - only new tickets
                                                     notified you before; fixed)
Updated: app/api/support/chat/route.ts             (notification includes Ticket ID)

HOW IT WORKS:
Every ticket notification Telegram sends you now ends with a line like
"Ticket ID: 64f1a2b3c4d5e6f7a8b9c0d1". To reply, use Telegram's native
"Reply" feature (swipe or long-press the notification message) and type
your answer - your reply gets posted to that exact ticket, the customer
gets emailed, and Telegram confirms with a ✅ message back to you. No
need to open the website or admin panel at all.

SETUP REQUIRED (two steps):

1. Add a new env var - TELEGRAM_WEBHOOK_SECRET - to BOTH .env.local and
   Vercel. This is just a random string YOU make up (not from Telegram),
   used to verify incoming webhook calls are really from Telegram and
   not someone else hitting your endpoint. Generate one with:
     node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"

2. Register your webhook URL with Telegram (ONE-TIME, run this yourself
   in any terminal - it's a direct call to Telegram's API, not something
   that runs in your app). Replace the bracketed parts with your real
   values:

     curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
       -d "url=https://yourdomain.com/api/webhooks/telegram" \
       -d "secret_token=<THE_TELEGRAM_WEBHOOK_SECRET_YOU_JUST_MADE>"

   You should get back {"ok":true,"result":true,...}. That's it - Telegram
   now forwards every message sent to your bot to this endpoint.

HOW TO USE:
1. Upload to repo root in Codespace.
2. unzip -o telegram-ticket-replies.zip -d .
   rm telegram-ticket-replies.zip
3. Add TELEGRAM_WEBHOOK_SECRET to .env.local (see step 1 above).
4. git add -A
   git commit -m "Add Telegram reply support for tickets"
   git push
5. Add TELEGRAM_WEBHOOK_SECRET to Vercel's env vars too, redeploy.
6. Run the setWebhook curl command above ONCE.
7. Test: wait for (or trigger) a ticket notification in Telegram, reply
   to it, confirm you get the ✅ confirmation and the reply shows up on
   the ticket in the admin panel / customer's support page.
