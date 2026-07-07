'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function NumbersPage() {
  const [service, setService] = useState('whatsapp');
  const [country, setCountry] = useState('usa');
  const [loading, setLoading] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [smsCode, setSmsCode] = useState('');
  const services = ['whatsapp', 'telegram', 'gmail', 'facebook', 'instagram', 'tiktok', 'twitter', 'snapchat', 'discord', 'amazon'];

  const buyNumber = async () => {
    setLoading(true);
    setTimeout(() => {
      setCurrentNumber({ orderId: '12345', phoneNumber: '+1 (555) 123-4567' });
      setLoading(false);
      setTimeout(() => { setSmsCode('Your code is: 847291'); }, 10000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-8">
            <p className="terminal-text text-sm mb-2">{`> MODULE: VIRTUAL_NUMBERS`}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#e0e0e0]">ACQUIRE NUMBER</h1>
          </div>
          <div className="card-dark max-w-2xl">
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_SERVICE`}</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className="input-dark">
                {services.map(s => (<option key={s} value={s} className="bg-[#1a1a25]">{s.toUpperCase()}</option>))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_COUNTRY`}</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-dark">
                <option value="usa" className="bg-[#1a1a25]">🇺🇸 USA</option>
                <option value="uk" className="bg-[#1a1a25]">🇬🇧 UK</option>
                <option value="canada" className="bg-[#1a1a25]">🇨🇦 CANADA</option>
              </select>
            </div>
            <button onClick={buyNumber} disabled={loading} className="btn-neon-green w-full disabled:opacity-50">
              {loading ? 'ACQUIRING...' : 'ACQUIRE NUMBER - $0.50'}
            </button>
            {currentNumber && (
              <div className="mt-6 p-6 border border-[#00ff88]/30 bg-[#00ff88]/5 rounded-lg">
                <h3 className="text-[#00ff88] font-mono mb-2">{`> ACQUISITION_SUCCESSFUL`}</h3>
                <p className="text-2xl md:text-3xl font-mono text-[#00ff88] mb-2">{currentNumber.phoneNumber}</p>
                <p className="text-sm text-[#a0a0b0] font-mono">Order ID: {currentNumber.orderId}</p>
                {smsCode && (<div className="mt-4 p-4 border border-[#00ff88] bg-[#00ff88]/10 rounded"><p className="text-sm text-[#00ff88] font-mono">{`> SMS_INTERCEPTED:`}</p><p className="text-3xl font-bold text-[#00ff88] font-mono">{smsCode}</p></div>)}
                {!smsCode && (<p className="text-[#00ff88]/70 text-sm mt-4 font-mono">{`> WAITING_FOR_SMS...`}</p>)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
