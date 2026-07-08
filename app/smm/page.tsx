'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function SmmPage() {
  const [services, setServices] = useState<any[]>([]);
  const [service, setService] = useState('');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [balance, setBalance] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/smm/services');
        const data = await res.json();
        if (data.success && Array.isArray(data.services)) {
          setServices(data.services);
          if (data.services.length > 0) {
            setService(data.services[0].service);
            setCurrentPrice(data.services[0].rate);
          }
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      }
    };
    fetchServices();
  }, []);

  const handleServiceChange = (e: any) => {
    const selectedId = e.target.value;
    setService(selectedId);
    const selectedService = services.find((s) => s.service === selectedId);
    if (selectedService) setCurrentPrice(selectedService.rate);
  };

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
        body: JSON.stringify({ service, link, quantity, price: currentPrice })
      });
      const data = await res.json();
      if (data.success) {
        setMsgType('success');
        setMsg(`Order Placed! ID: ${data.orderId}`);
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

  const calculateTotal = () => {
    return ((parseInt(quantity) / 1000) * currentPrice).toFixed(2);
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
              <select value={service} onChange={handleServiceChange} className="input-dark">
                {services.length === 0 ? (
                  <option value="">Loading services...</option>
                ) : (
                  services.map((s) => (
                    <option key={s.service} value={s.service}>
                      {s.name} - ₦{s.rate}/1k
                    </option>
                  ))
                )}
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
            
            <div className="mb-6 p-4 bg-[#1a1a25] rounded border border-[#2a2a3a] flex justify-between">
              <span className="text-[#a0a0b0] font-mono">{`> TOTAL_COST:`}</span>
              <span className="text-[#ffd700] font-bold font-mono">₦{calculateTotal()}</span>
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
