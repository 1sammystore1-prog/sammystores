'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function SmmPage() {
  const [service, setService] = useState('instagram_followers');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [balance, setBalance] = useState(0);

  const handleOrder = async () => {
    setLoading(true);
    setMsg('');
    
    const token = localStorage.getItem('token');
    if (!token) {
      setMsgType('error');
      setMsg('Please login to place orders.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/smm/order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ service, link, quantity })
      });
      const data = await res.json();
      if (data.success) {
        setMsgType('success');
        setMsg(data.message);
        setBalance(data.newBalance);
      } else {
        setMsgType('error');
        setMsg(data.error || 'Order Failed');
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
            <p className="terminal-text text-sm mb-2">{`> MODULE: SMM_SERVICES`}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#e0e0e0]">SOCIAL MEDIA MARKETING</h1>
            {balance > 0 && <p className="text-[#00ff88] font-mono mt-2">Current Balance: ₦{balance}</p>}
          </div>
          <div className="card-dark max-w-2xl">
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_SERVICE`}</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className="input-dark">
                <option value="instagram_followers">INSTAGRAM FOLLOWERS (₦500/1k)</option>
                <option value="instagram_likes">INSTAGRAM LIKES (₦500/1k)</option>
                <option value="tiktok_views">TIKTOK VIEWS (₦500/1k)</option>
                <option value="youtube_subscribers">YOUTUBE SUBSCRIBERS (₦500/1k)</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> TARGET_LINK`}</label>
              <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/..." className="input-dark" />
            </div>
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> QUANTITY`}</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-dark" />
            </div>
            <button onClick={handleOrder} disabled={loading} className="btn-neon-purple w-full">
              {loading ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
            {msg && (
              <div className={`mt-6 p-4 rounded text-center border ${msgType === 'success' ? 'border-[#b829dd] bg-[#b829dd]/10 text-[#b829dd]' : 'border-[#ff2a6d] bg-[#ff2a6d]/10 text-[#ff2a6d]'}`}>
                <p className="font-mono font-bold">{msg}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
