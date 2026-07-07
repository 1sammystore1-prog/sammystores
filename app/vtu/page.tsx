'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function VtuPage() {
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const handlePurchase = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/vtu/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, network, planId: amount })
      });
      const data = await res.json();
      if (data.success) {
        setMsgType('success');
        setMsg('Transaction Successful!');
      } else {
        setMsgType('error');
        setMsg(data.error || 'Transaction Failed');
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
            <p className="terminal-text text-sm mb-2">{`> MODULE: VTU_SERVICES`}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#e0e0e0]">AIRTIME & DATA</h1>
          </div>
          <div className="card-dark max-w-2xl">
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_NETWORK`}</label>
              <select value={network} onChange={(e) => setNetwork(e.target.value)} className="input-dark">
                <option value="mtn">MTN</option>
                <option value="airtel">AIRTEL</option>
                <option value="glo">GLO</option>
                <option value="9mobile">9MOBILE</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> PHONE_NUMBER`}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" className="input-dark" />
            </div>
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> AMOUNT (NAIRA)`}</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" className="input-dark" />
            </div>
            <button onClick={handlePurchase} disabled={loading} className="btn-neon-green w-full">
              {loading ? 'PROCESSING...' : 'BUY NOW'}
            </button>
            {msg && (
              <div className={`mt-6 p-4 rounded text-center border ${msgType === 'success' ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]' : 'border-[#ff2a6d] bg-[#ff2a6d]/10 text-[#ff2a6d]'}`}>
                <p className="font-mono font-bold">{msg}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
