Blog + Referral Banner + Split History/Orders (mobile-friendly)
======================================================================

PART 1 - Split Orders / Transactions / Numbers into 3 separate views
Updated: app/api/orders/route.ts              (now filtered to account_purchase + smm only)
Updated: app/api/wallet/transactions/route.ts (now filtered to wallet-money types only)
Updated: app/orders/page.tsx                  (rewritten as mobile card layout, was a raw table)
Updated: app/history/page.tsx                 (rewritten as mobile card layout, friendly labels,
                                               credit/debit color-coded amounts)
Updated: components/NumbersHistory.tsx        (cross-links to the other two)

Before: /orders and /history both showed the EXACT SAME unfiltered mix
of every transaction type in a table that required horizontal scrolling
on mobile - genuinely hard to use on a phone and confusing to parse.

Now: three genuinely separate, cross-linked sections:
  - Order History (/orders)     -> accounts, logs, SMM purchases
  - Transaction History (/history) -> wallet funding, bonuses, discounts
  - Numbers History (/numbers, History tab) -> virtual number purchases
    (unchanged location - it already had its own dedicated Check/Cancel
    actions, so it stays where it is, just now cross-linked from the
    other two)
Each page cross-links to the other two ("Looking for X? →") so nobody
gets stuck on the wrong page wondering where something went.

PART 2 - Referral banner (more visible than the buried /referrals page)
New: components/ReferralBanner.tsx
Updated: app/layout.tsx (renders it globally, right below the announcement banner)

Shows a compact "Earn ₦500 per referral" banner to logged-in users on
every page except admin/login/register/the referrals page itself (no
point promoting it there). Dismissing hides it until tomorrow, not
forever - the point is repeated visibility, not a one-time nag.

PART 3 - Blog (SEO content)
New: lib/blogPosts.ts       (4 articles targeting real search terms)
New: app/blog/page.tsx      (listing page)
New: app/blog/[slug]/page.tsx (individual post pages, proper per-post SEO metadata)
Updated: app/sitemap.ts     (blog posts now included)
Updated: components/Footer.tsx (adds a Blog link)

Articles cover: virtual numbers for WhatsApp/Telegram verification, SMM
panels explained, what to check before buying a social media account,
and why bank transfer beats cards for funding a wallet in Nigeria - each
written as genuinely useful content (not keyword-stuffed), linking back
to the relevant product pages at the end.

HOW TO USE:
1. Upload to repo root in Codespace.
2. unzip -o blog-referral-history-split.zip -d .
   rm blog-referral-history-split.zip
3. npm run dev - check:
   a. /orders shows only account/SMM purchases, as mobile cards
   b. /history shows only wallet activity, as mobile cards
   c. /numbers History tab still works, now with cross-links
   d. The orange referral banner appears near the top of pages
   e. /blog shows the 4 articles, each with its own working page
4. git add -A
   git commit -m "Split orders/transactions/numbers history; add referral banner and blog"
   git push
