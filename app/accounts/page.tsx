'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function AccountsPage() {
  const [accountType, setAccountType] = useState('gmail');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [accountData, setAccountData] = useState(null);

  const handleBuy = async () => {
    setLoading(true);
    setMsg('');
    setAccountData(null);
    try {
      const res = await fetch('/api/accounts/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: accountType, amount: 1 })
      });
      const data = await res.json();
      if (data.success) {
        setMsgType('success');
        setMsg('Account Acquired!');
        setAccountData(data.data);
      } else {
        setMsgType('error');
        setMsg(data.error || 'Purchase Failed');
      }
    } catch (e) {
      setMsgType('error');
      setMsg('Network Error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-8">
            <p className="terminal-text text-sm mb-2">{`> MODULE: ACCOUNT_MARKET`}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#e0e0e0]">BUY ACCOUNTS</h1>
          </div>
          <div className="card-dark max-w-2xl">
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_ACCOUNT_TYPE`}</label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="input-dark">
                <option value="gmail">GMAIL (AGED)</option>
                <option value="whatsapp">WHATSAPP (VERIFIED)</option>
                <option value="facebook">FACEBOOK (FARMED)</option>
                <option value="twitter">TWITTER/X</option>
              </select>
            </div>
            <div className="mb-6 p-4 bg-[#1a1a25] rounded border border-[#2a2a3a]">
              <p className="text-[#a0a0b0] text-sm font-mono">{`> STOCK: `}<span className="text-[#00ff88] font-bold">AVAILABLE</span></p>
            </div>
            <button onClick={handleBuy} disabled={loading} className="btn-neon-green w-full">
              {loading ? 'SECURING ACCOUNT...' : 'PURCHASE ACCOUNT'}
            </button>
            {msg && (
              <div className={`mt-6 p-4 rounded text-center border ${msgType === 'success' ? 'border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700]' : 'border-[#ff2a6d] bg-[#ff2a6d]/10 text-[#ff2a6d]'}`}>
                <p className="font-mono font-bold">{msg}</p>
              </div>
            )}
            {accountData && (
              <div className="mt-4 p-4 border border-[#00ff88]/30 bg-[#00ff88]/5 rounded font-mono text-sm text-[#e0e0e0]">
                <pre className="whitespace-pre-wrap">{JSON.stringify(accountData, null, 2)}</pre>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
