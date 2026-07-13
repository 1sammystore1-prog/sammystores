'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

interface CartItem {
  productId: string;
  name: string;
  category?: string;
  unitPrice: number;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | ''>('');

  const fetchCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      setMsg('Failed to load cart');
      setMsgType('error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (productId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/cart', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    if (data.success) {
      setItems(data.items || []);
      setTotal(data.total || 0);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    setMsg('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setMsg('All items purchased successfully! Check your orders.');
        setMsgType('success');
        setItems([]);
        setTotal(0);
      } else if (data.partial) {
        setMsg('Some items were purchased, others failed and were refunded — check details below.');
        setMsgType('error');
        fetchCart();
      } else {
        const firstError = data.results?.[0]?.error || data.error || 'Checkout failed';
        setMsg(firstError);
        setMsgType('error');
        fetchCart();
      }
    } catch {
      setMsg('Checkout failed — please try again');
      setMsgType('error');
    }
    setCheckingOut(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b3001f] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#b3001f] mb-4 transition-colors">
            ← Back to Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Your Cart</h1>
            <p className="text-gray-600">Review your items before checking out</p>
          </div>

          {msg && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                msgType === 'success'
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}
            >
              {msg}
            </div>
          )}

          {items.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Link href="/accounts" className="btn-primary inline-block">
                Browse Accounts
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="card p-4 flex items-center justify-between">
                    <div>
                      {item.category && (
                        <span className="inline-block text-xs font-semibold text-[#b3001f] bg-primary-50 px-2 py-1 rounded-full mb-1">
                          {item.category}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        ₦{item.unitPrice.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-[#b3001f]">
                        ₦{(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-sm text-gray-400 hover:text-red-600 transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-6 flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total</p>
                  <p className="text-2xl font-bold text-gray-800">₦{total.toLocaleString()}</p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingOut ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
