Public Developer API - integrate with SammyStore programmatically
=====================================================================
New:     app/developers/page.tsx     (public API docs page)
Updated: lib/auth.ts                 (accepts API keys, not just session JWTs)
Updated: app/settings/page.tsx       (links to the new docs page)
Updated: 27 route files              (added `await` - see below, this is mechanical/safe)

THE CORE CHANGE:
Every user already had a personal API key (viewable/regeneratable on
Settings) - it just did nothing, since every protected endpoint only
accepted a browser session JWT. lib/auth.ts's getUserId() now accepts
EITHER credential:
  - A session JWT (unchanged, still how the website itself works)
  - An API key ("sammy_..." prefix) - looked up directly against the
    database

This means every existing endpoint that already called getUserId() -
buy a number, place an SMM order, check balance, list orders, open a
support ticket, etc. - is now usable by an external developer's own
code with their API key, with ZERO duplicated business logic. No new
"v1 API" routes needed; the real app IS the API.

WHY 27 FILES CHANGED:
Validating an API key requires a database lookup, so getUserId() had to
become async. Every route that calls it needed `await` added before the
call - this is purely mechanical (all 27 already run inside `async
function` route handlers, so this is 100% safe, not a behavior change
for existing JWT-based requests).

SAFETY NOTES:
- Admin routes (app/api/admin/*) use a completely separate check
  (verifyAdmin in lib/adminAuth.ts) that never calls getUserId - API
  keys can NEVER be used to reach admin functionality, even accidentally.
- API-key requests share a rate limit of 60/minute across ALL endpoints
  combined (one buggy integration script can't hammer everything).
- Suspended-user checks on individual routes still apply exactly as
  before - a suspended account's API key is just as blocked as their
  browser session would be.

HOW TO USE:
1. Upload to repo root in Codespace.
2. unzip -o public-api.zip -d .
   rm public-api.zip
3. npm run dev - test end to end:
   a. Log in on the site, go to Settings, copy your API key.
   b. curl http://localhost:3000/api/wallet/balance -H "Authorization: Bearer sammy_..."
      -> should return your real balance, same as the site shows.
   c. Visit /developers to see the full docs page.
4. git add -A
   git commit -m "Add public developer API (API key auth on existing endpoints)"
   git push
