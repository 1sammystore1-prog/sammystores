1) Fix: customers short-changed by NeuraPay's fee  +  2) Mongoose deprecation cleanup
========================================================================================

PART 1 - NeuraPay fee was being deducted from the CUSTOMER, not the store
Updated: lib/neurapayCredit.ts

Before: customers were credited NeuraPay's "net" amount (gross transfer
minus NeuraPay's collection fee) - so someone who transferred ₦1000 might
only see ₦970 in their wallet, with no explanation. Meanwhile you were
ALSO paying your own NeuraPay fees separately.

Now: customers are credited the FULL amount they actually sent (gross).
The store absorbs NeuraPay's collection fee as a cost of doing business,
same as any normal payment processor setup. The fee amount is still
recorded on the transaction's metadata (feeAbsorbedByStore) so you can
see exactly how much NeuraPay's fees are costing you over time, without
your customers ever seeing a short credit.

PART 2 - Mongoose deprecation warning cleanup
Updated (14 files): every findOneAndUpdate/findByIdAndUpdate call using
the deprecated `{ new: true }` option now uses `{ returnDocument: 'after' }`
instead, per Mongoose's own suggested replacement. Purely mechanical,
same behavior, just removes the warning from your logs and future-proofs
against Mongoose eventually removing the old option entirely.
Files: app/api/account/regenerate-key, app/api/accounts/buy,
app/api/admin/catalog/products/[id], app/api/admin/coupons/[id],
app/api/admin/pricing, app/api/cart/checkout, app/api/catalog/buy,
app/api/logs/buy, app/api/numbers/benotp/buy, app/api/numbers/tiger/buy,
app/api/smm/order, lib/coupon.ts, lib/neurapayCredit.ts, lib/rateLimit.ts

HOW TO USE:
1. Upload to repo root in Codespace.
2. unzip -o neurapay-fee-fix-and-mongoose-cleanup.zip -d .
   rm neurapay-fee-fix-and-mongoose-cleanup.zip
3. npm run dev - fund a wallet with a real test transfer, confirm the
   FULL amount you sent shows up in the wallet (not a fee-reduced amount).
4. git add -A
   git commit -m "Credit customers full amount (store absorbs NeuraPay fee); fix Mongoose deprecation warnings"
   git push
