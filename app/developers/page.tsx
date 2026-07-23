import Link from 'next/link';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/account/me',
    desc: 'Get your account profile and wallet balance.',
    body: null,
    example: `{
  "success": true,
  "user": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "walletBalance": 12415.78,
    "createdAt": "2026-01-10T12:00:00.000Z",
    "suspended": false
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/wallet/balance',
    desc: 'Get just your current wallet balance.',
    body: null,
    example: `{ "balance": 12415.78 }`,
  },
  {
    method: 'GET',
    path: '/api/orders',
    desc: 'List your most recent orders/transactions (up to 100), newest first.',
    body: null,
    example: `{ "success": true, "orders": [ { "type": "virtual_number", "description": "...", "amount": 350, "status": "success", "createdAt": "..." } ] }`,
  },
  {
    method: 'POST',
    path: '/api/numbers/tiger/buy',
    desc: 'Buy a virtual phone number for SMS verification.',
    body: `{ "country": "0", "service": "wa" }`,
    example: `{ "success": true, "orderId": "12345", "phoneNumber": "+79991234567", "service": "WhatsApp", "price": 350, "newBalance": 12065.78 }`,
  },
  {
    method: 'GET',
    path: '/api/numbers/tiger/sms?orderId=12345',
    desc: 'Check a virtual number for a received SMS/activation code.',
    body: null,
    example: `{ "success": true, "status": "received", "code": "123456" }`,
  },
  {
    method: 'POST',
    path: '/api/numbers/tiger/cancel',
    desc: 'Cancel an activation before an SMS is received (refunds your wallet).',
    body: `{ "orderId": "12345" }`,
    example: `{ "success": true }`,
  },
  {
    method: 'POST',
    path: '/api/smm/order',
    desc: 'Place an SMM (social media growth) order.',
    body: `{ "service": "1234", "link": "https://instagram.com/yourpage", "quantity": 1000 }`,
    example: `{ "success": true, "orderId": "...", "newBalance": 11815.78 }`,
  },
  {
    method: 'POST',
    path: '/api/accounts/buy',
    desc: 'Buy a pre-made account listing.',
    body: `{ "productId": "...", "amount": 1 }`,
    example: `{ "success": true, "newBalance": 11565.78 }`,
  },
  {
    method: 'POST',
    path: '/api/support/tickets',
    desc: 'Open a support ticket.',
    body: `{ "subject": "Order issue", "message": "My order #123 did not arrive." }`,
    example: `{ "success": true, "ticket": { "_id": "...", "status": "pending" } }`,
  },
];

export default function DevelopersPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 pt-8 pb-16">
      <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        &larr; Back to Settings
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Developer API</h1>
      <p className="text-gray-600 mb-6">
        Integrate SammyStore into your own scripts, bots, or apps using your personal API key -
        the same one shown on your Settings page. Every endpoint below is the exact same one the
        SammyStore website itself uses, so anything you can do on the site, you can do through
        this API.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
        <h2 className="font-semibold text-gray-800 mb-2">Authentication</h2>
        <p className="text-sm text-gray-600 mb-3">
          Get your API key from{' '}
          <Link href="/settings" className="text-[#f97316] font-semibold hover:underline">
            Settings
          </Link>
          . Send it as a Bearer token on every request:
        </p>
        <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto">
{`Authorization: Bearer sammy_your_api_key_here`}
        </pre>
        <p className="text-xs text-gray-500 mt-3">
          Keep your API key secret - anyone with it can act as your account (buy numbers, place
          orders, spend your wallet balance). If it's ever exposed, regenerate it immediately from
          Settings; the old key stops working the moment you do.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Rate limit: 60 requests per minute per API key across all endpoints combined.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
        <h2 className="font-semibold text-gray-800 mb-2">Example request</h2>
        <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto">
{`curl https://sammystore.example.com/api/wallet/balance \\
  -H "Authorization: Bearer sammy_your_api_key_here"`}
        </pre>
      </div>

      <h2 className="font-semibold text-gray-800 mb-3 text-lg">Endpoints</h2>
      <div className="space-y-4">
        {ENDPOINTS.map((ep) => (
          <div key={ep.path} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  ep.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {ep.method}
              </span>
              <code className="text-sm font-mono text-gray-800">{ep.path}</code>
            </div>
            <p className="text-sm text-gray-600 mb-2">{ep.desc}</p>
            {ep.body && (
              <>
                <p className="text-xs font-semibold text-gray-500 mb-1">Request body</p>
                <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto mb-2">
                  {ep.body}
                </pre>
              </>
            )}
            <p className="text-xs font-semibold text-gray-500 mb-1">Example response</p>
            <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto">
              {ep.example}
            </pre>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-8 text-center">
        All prices are in Nigerian Naira (₦). Wallet balance is shared between the website and
        the API - funding your wallet via the site makes funds immediately available here too.
      </p>
    </div>
  );
}
