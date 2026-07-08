'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function VirtualNumbersPage() {
  const [selectedServer, setSelectedServer] = useState('usa1');
  const [services, setServices] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    fetchServices();
    if (selectedServer !== 'usa1') {
      fetchCountries();
    }
  }, [selectedServer]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch(selectedServer) {
        case 'usa1':
          endpoint = '/api/numbers/usa-server1?action=getServices';
          break;
        case 'all1':
          endpoint = '/api/numbers/all-countries-server1?action=getServices';
          break;
        case 'all2':
          endpoint = '/api/numbers/all-countries-server2?action=getServices&country=US';
          break;
      }
      
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success && Array.isArray(data.services || data.data)) {
        setServices(data.services || data.data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
    setLoading(false);
  };

  const fetchCountries = async () => {
    try {
      let endpoint = '';
      switch(selectedServer) {
        case 'all1':
          endpoint = '/api/numbers/all-countries-server1?action=getCountries';
          break;
        case 'all2':
          endpoint = '/api/numbers/all-countries-server2?action=getCountries';
          break;
      }
      
      if (endpoint) {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCountries(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  };

  const purchaseNumber = async () => {
    setPurchasing(true);
    setMsg('');
    setOrderData(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setMsgType('error');
      setMsg('Please login to purchase');
      setPurchasing(false);
      return;
    }

    try {
      let endpoint = '';
      let body: any = { service: selectedService };

      switch(selectedServer) {
        case 'usa1':
          endpoint = '/api/numbers/usa-server1';
          body.country = 'usa';
          break;
        case 'all1':
          endpoint = '/api/numbers/all-countries-server1';
          body.country = selectedCountry;
          break;
        case 'all2':
          endpoint = '/api/numbers/all-countries-server2';
          body.country = selectedCountry;
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (data.success || data.parsed) {
        setMsgType('success');
        setMsg('Number acquired successfully!');
        setOrderData(data.parsed || data);
      } else {
        setMsgType('error');
        setMsg(data.error || 'Purchase failed');
      }
    } catch (error: any) {
      setMsgType('error');
      setMsg('Network error: ' + error.message);
    }
    setPurchasing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Virtual Numbers</h1>
            <p className="text-gray-600">Get instant access to virtual numbers worldwide</p>
          </div>

          {/* Server Selection */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setSelectedServer('usa1')}
              className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                selectedServer === 'usa1'
                  ? 'border-[#f97316] bg-[#f97316] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-[#f97316]'
              }`}
            >
              🇺🇸 USA Server 1
            </button>
            <button
              onClick={() => setSelectedServer('all1')}
              className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                selectedServer === 'all1'
                  ? 'border-[#f97316] bg-[#f97316] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-[#f97316]'
              }`}
            >
              🌍 All Countries Server 1
            </button>
            <button
              onClick={() => setSelectedServer('all2')}
              className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                selectedServer === 'all2'
                  ? 'border-[#f97316] bg-[#f97316] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-[#f97316]'
              }`}
            >
              🌐 All Countries Server 2
            </button>
          </div>

          <div className="card p-6 md:p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {selectedServer === 'usa1' && '🇺🇸 USA Server 1'}
              {selectedServer === 'all1' && '🌍 All Countries Server 1'}
              {selectedServer === 'all2' && '🌐 All Countries Server 2'}
            </h2>

            {/* Service Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Service</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="input-field"
              >
                <option value="">Choose a service...</option>
                {services.map((service: any, idx: number) => (
                  <option key={idx} value={service.id || service.slug || service}>
                    {service.name || service} {service.price && `- ₦${parseFloat(service.price).toLocaleString()}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Selection */}
            {selectedServer !== 'usa1' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a country...</option>
                  {countries.map((country: any, idx: number) => (
                    <option key={idx} value={country.code || country.id || country}>
                      {country.flag ? country.flag + ' ' : ''}{country.name || country}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={purchaseNumber}
              disabled={purchasing || !selectedService || (selectedServer !== 'usa1' && !selectedCountry)}
              className="btn-primary w-full disabled:opacity-50"
            >
              {purchasing ? 'Processing...' : 'Purchase Number'}
            </button>

            {msg && (
              <div className={`mt-6 p-4 rounded-xl ${
                msgType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <p className="font-semibold">{msg}</p>
              </div>
            )}

            {orderData && (
              <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Order Details:</h3>
                <div className="space-y-2 text-sm">
                  {orderData.order_id && (
                    <div>
                      <span className="text-gray-600">Order ID: </span>
                      <span className="font-mono font-semibold">{orderData.order_id}</span>
                    </div>
                  )}
                  {orderData.number && (
                    <div>
                      <span className="text-gray-600">Number: </span>
                      <span className="font-mono font-semibold">{orderData.number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
