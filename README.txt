1) ReferralBanner fix + 2) Analytics Dashboard + 3) Promo/Event Banner
==========================================================================

PART 1 - ReferralBanner quick fix
Updated: components/ReferralBanner.tsx
Was re-fetching /api/account/referrals on EVERY page navigation. Now
caches the result in memory for the session - fetched once, reused on
every subsequent navigation until a full page refresh.

PART 2 - Analytics Dashboard (admin)
New: app/api/admin/analytics/route.ts  (aggregates all the numbers)
New: app/admin/analytics/page.tsx      (charts, using chart.js - already
                                        an installed dependency, just
                                        never wired up until now)
Updated: components/AdminSidebar.tsx   (adds "Analytics" nav link)

Shows: revenue over the last 30 days (line chart), new signups over the
last 30 days (bar chart), revenue split by category (Accounts & Logs /
SMM / Virtual Numbers), top 10 best-selling individual products/services
by revenue, and this-month-vs-last-month growth percentage.

PART 3 - Promo / Event Banner ("fun" sitewide banner + ad placements)
New: models/PromoBanner.ts
New: app/api/promo-banner/route.ts            (public - returns the
                                               currently active one)
New: app/api/admin/promo-banner/route.ts      (admin list + create)
New: app/api/admin/promo-banner/[id]/route.ts (admin toggle/edit/delete)
New: components/PromoBanner.tsx               (the banner itself)
New: app/admin/promo-banner/page.tsx          (admin management UI)
Updated: app/layout.tsx                       (renders it site-wide, at
                                               the very top)
Updated: components/AdminSidebar.tsx          (adds nav link)

What it's for: a festive/celebratory/sale banner for special occasions
(New Year, a flash sale, a milestone), OR an ad placement you sell to
someone else (their message + optional link + custom brand colors via
the "Custom colors" theme option). Only one shows at a time. Optional
start/end date lets you schedule it in advance so it turns on and off
automatically without you needing to remember. 4 presets (Festive, Sale,
Celebration, Ad) plus fully custom background/text colors.

Manage it at /admin/promo-banner - same style as your existing
Announcements admin page.

HOW TO USE:
1. Upload to repo root in Codespace.
2. unzip -o analytics-and-promo-banner.zip -d .
   rm analytics-and-promo-banner.zip
3. npm run dev - check:
   a. /admin/analytics shows charts (will be mostly empty until real
      sales data accumulates over the next 30 days)
   b. /admin/promo-banner - create a test banner, confirm it shows up
      site-wide immediately, dismiss it, confirm it stays dismissed
4. git add -A
   git commit -m "Add analytics dashboard, promo/event banner, and referral banner fetch fix"
   git push
