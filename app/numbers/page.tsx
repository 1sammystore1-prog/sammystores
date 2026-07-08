'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function NumbersPage() {
  const [server, setServer] = useState('1');
  const [services, setServices] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [service, setService] = useState('');
  const [country, setCountry] = useState('');
  const [maxPrice, setMaxPrice] = useState('500');
  const [loading, setLoading] = useState(false);
  const [checkingSms, setCheckingSms] = useState(false);
  const [currentNumber, setCurrentNumber] = useState<any>(null);
  const [smsCode, setSmsCode] = useState('');
  const [msg, setMsg] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (server === '1') {
          const [servicesRes, countriesRes] = await Promise.all([
            fetch('/api/danotp/services'),
            fetch('/api/danotp/countries')
          ]);
          
          const servicesData = await servicesRes.json();
          const countriesData = await countriesRes.json();
          
          if (servicesData.success) {
            setServices(servicesData.services);
            if (servicesData.services.length > 0) {
              setService(servicesData.services[0].slug || servicesData.services[0].id);
            }
          }
          
          if (countriesData.success) {
            setCountries(countriesData.countries);
            if (countriesData.countries.length > 0) {
              setCountry(countriesData.countries[0].code || countriesData.countries[0].id);
            }
          }
        } else {
          const [servicesRes, countriesRes] = await Promise.all([
            fetch('/api/danotp/server2/services?country=US'),
            fetch('/api/danotp/server2/countries')
          ]);
          
          const servicesData = await servicesRes.json();
          const countriesData = await countriesRes.json();
          
          if (servicesData.success) {
            setServices(servicesData.services);
            if (servicesData.services.length > 0) {
              setService(servicesData.services[0].slug || servicesData.services[0].id);
            }
          }
          
          if (countriesData.success) {
            setCountries(countriesData.countries);
            if (countriesData.countries.length > 0) {
              setCountry(countriesData.countries[0].code || countriesData.countries[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [server]);

  const buyNumber = async () => {
    setLoading(true);
    setMsg('');
    setCurrentNumber(null);
    setSmsCode('');

    const token = localStorage.getItem('token');
    if (!token) {
      setMsg('Please login to acquire a number.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = server === '1' ? '/api/numbers/get' : '/api/numbers/server2/get';
      const body = server === '1' 
        ? { service, country, quantity: 1 }
        : { service, country, maxPrice };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.success) {
        setCurrentNumber(data);
        setBalance(data.newBalance);
        setMsg('Number acquired! Click "Check SMS" to get code.');
      } else {
        setMsg(data.error || 'Failed to acquire number');
      }
    } catch (e) {
      setMsg('Network error');
    }
    setLoading(false);
  };

  const checkSms = async () => {
    if (!currentNumber?.orderId) return;
    setCheckingSms(true);
    setMsg('');
    
    try {
      const endpoint = server === '1' ? '/api/numbers/sms' : '/api/numbers/server2/sms';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentNumber.orderId })
      });
      const data = await res.json();
      
      if (data.success) {
        setSmsCode(data.sms);
        setMsg('SMS Received!');
      } else {
        setMsg(data.error || 'No SMS yet. Try again in 10 seconds.');
      }
    } catch (e) {
      setMsg('Network error');
    }
    setCheckingSms(false);
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
            {balance > 0 && <p className="text-[#00ff88] font-mono mt-2">Current Balance: ₦{balance}</p>}
          </div>
          <div className="card-dark max-w-2xl">
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_SERVER`}</label>
              <select value={server} onChange={(e) => setServer(e.target.value)} className="input-dark">
                <option value="1">ALL COUNTRIES SERVER 1</option>
                <option value="2">ALL COUNTRIES SERVER 2</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_SERVICE`}</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className="input-dark">
                {services.length === 0 ? (
                  <option value="">Loading services...</option>
                ) : (
                  services.map((s) => (
                    <option key={s.id} value={s.slug || s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> SELECT_COUNTRY`}</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-dark">
                {countries.length === 0 ? (
                  <option value="">Loading countries...</option>
                ) : (
                  countries.map((c) => (
                    <option key={c.code || c.id} value={c.code || c.id}>
                      {c.flag} {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {server === '2' && (
              <div className="mb-6">
                <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> MAX_PRICE (NGN)`}</label>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input-dark"
                />
              </div>
            )}
            <button onClick={buyNumber} disabled={loading} className="btn-neon-green w-full">
              {loading ? 'ACQUIRING...' : `ACQUIRE NUMBER - ₦${maxPrice || 500}`}
            </button>
            
            {msg && <p className={`mt-4 text-center font-mono ${msg.includes('acquired') || msg.includes('Received') ? 'text-[#00ff88]' : 'text-[#ff2a6d]'}`}>{msg}</p>}

            {currentNumber && (
              <div className="mt-6 p-6 border border-[#00ff88]/30 bg-[#00ff88]/5 rounded-lg">
                <h3 className="text-[#00ff88] font-mono mb-2">{`> ACQUISITION_SUCCESSFUL`}</h3>
                <p className="text-2xl font-mono text-[#00ff88] mb-2">{currentNumber.phoneNumber}</p>
                <p className="text-sm text-[#a0a0b0] font-mono mb-4">Order ID: {currentNumber.orderId}</p>
                
                <button 
                  onClick={checkSms} 
                  disabled={checkingSms || !!smsCode}
                  className="btn-neon-purple w-full text-sm"
                >
                  {checkingSms ? 'CHECKING...' : smsCode ? 'SMS RECEIVED' : 'CHECK FOR SMS'}
                </button>

                {smsCode && (
                  <div className="mt-4 p-4 border border-[#00ff88] bg-[#00ff88]/10 rounded text-center">
                    <p className="text-sm text-[#00ff88] font-mono mb-1">{`> OTP_CODE:`}</p>
                    <p className="text-4xl font-bold text-[#00ff88] tracking-widest">{smsCode}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
