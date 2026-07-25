Email Verification + Loyalty/Tier System
============================================

PART 1 - EMAIL VERIFICATION
New:     app/api/auth/verify-email/route.ts       (validates the emailed link)
New:     app/api/auth/resend-verification/route.ts (logged-in users can request a fresh link)
New:     app/verify-email/page.tsx                 (lands here from the emailed link)
Updated: models/User.ts                            (emailVerified + token fields)
Updated: lib/email.ts                               (sendVerificationEmail)
Updated: app/api/auth/register/route.ts             (sends the verification email on signup)
Updated: app/api/account/me/route.ts                (returns emailVerified)
Updated: app/settings/page.tsx                      (Verified/Unverified badge + resend button)

How it works: same secure pattern as password reset - only a SHA-256
hash of a random token is ever stored, the raw token only exists in the
emailed link, and it expires (24 hours). Existing accounts (before this
feature existed) are NEVER retroactively required to verify - the check
everywhere is `emailVerified === false` specifically, so an account
with the field simply absent (every pre-existing user) is treated as
verified and never nagged.

PART 2 - LOYALTY / TIER SYSTEM
New:     lib/loyalty.ts                  (4 tiers based on lifetime product spend)
New:     app/api/account/loyalty/route.ts (status endpoint for the dashboard card)
Updated: models/Transaction.ts            (adds 'tier_discount' type - AND fixes a
                                           separate, already-live bug: 'coupon_discount'
                                           was ALSO missing from this enum, silently
                                           crashing every successful coupon checkout
                                           with a false "failed" error after the
                                           discount had already been correctly applied)
Updated: app/api/cart/checkout/route.ts   (automatically credits the tier discount
                                           on every purchase, no code needed)
Updated: app/dashboard/page.tsx           (new "Loyalty Tier" card)

Tiers (lifetime spend on actual products - SMM/accounts/logs/numbers,
NOT wallet funding itself):
  Bronze:    ₦0+         -> 0% off
  Silver:    ₦25,000+    -> 2% off
  Gold:      ₦100,000+   -> 4% off
  Platinum:  ₦250,000+   -> 7% off

The discount is applied automatically as a wallet credit-back right
after checkout, the same mechanism as a coupon - no code to enter. It
stacks additively with a coupon (both computed off the same gross spend
figure), not multiplicatively. Tier is recalculated live on every
checkout (not cached), so crossing into a new tier mid-purchase applies
that tier's discount immediately.

HOW TO USE:
1. Upload to repo root in Codespace.
2. unzip -o email-verification-and-loyalty.zip -d .
   rm email-verification-and-loyalty.zip
3. npm run dev - test:
   a. Register a new test account, check the verification email arrives,
      click it, confirm /verify-email shows success.
   b. Check Settings shows "Verified" after that.
   c. Make a real test purchase, confirm the wallet gets credited back
      the tier discount (check /admin transactions or your own history).
   d. Check the Dashboard shows the new Loyalty Tier card.
4. git add -A
   git commit -m "Add email verification and loyalty tier system; fix coupon_discount enum bug"
   git push
