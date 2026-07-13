'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

function isVideoUrl(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function toEmbedUrl(url: string) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-2 px-2 py-1 text-xs rounded bg-[#2a2a3a] text-[#00f5ff] hover:bg-[#3a3a4a] font-mono"
    >
      {copied ? 'COPIED' : 'COPY'}
    </button>
  );
}

function OrdersInner() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(highlightId);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'success') return 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10';
    if (status === 'pending') return 'text-[#ffd700] border-[#ffd700]/30 bg-[#ffd700]/10';
    return 'text-[#ff2a6d] border-[#ff2a6d]/30 bg-[#ff2a6d]/10';
  };

  const renderAccountData = (accountData: any) => {
    if (!accountData) return null;
    if (typeof accountData === 'object') {
      return Object.entries(accountData).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between py-1 border-b border-[#2a2a3a]/50 last:border-0">
          <span className="text-[#a0a0b0] text-xs uppercase">{key}</span>
          <span className="flex items-center text-[#e0e0e0]">
            {String(value)}
            <CopyButton text={String(value)} />
          </span>
        </div>
      ));
    }
    return (
      <div className="flex items-center justify-between">
        <span className="text-[#e0e0e0]">{String(accountData)}</span>
        <CopyButton text={String(accountData)} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-8">
            <p className="terminal-text text-sm mb-2">{`> MODULE: ORDER_HISTORY`}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#e0e0e0]">MY ORDERS</h1>
          </div>

          <div className="card-dark">
            {loading ? (
              <p className="text-center text-[#a0a0b0] font-mono py-10">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#a0a0b0] font-mono mb-4">No orders found yet.</p>
                <Link href="/dashboard" className="btn-neon-green inline-block px-6 py-2">Go to Dashboard</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="text-[#00f5ff] border-b border-[#2a2a3a]">
                    <tr>
                      <th className="p-3">TYPE</th>
                      <th className="p-3">DESCRIPTION</th>
                      <th className="p-3">AMOUNT</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">DATE</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="text-[#a0a0b0]">
                    {orders.map((order: any) => {
                      const hasDetails = order.type === 'account_purchase' && order.metadata?.accountData;
                      const isExpanded = expandedId === order._id;
                      return (
                        <>
                          <tr
                            key={order._id}
                            id={`order-${order._id}`}
                            className={`border-b border-[#2a2a3a] hover:bg-[#1a1a25] transition-colors ${
                              highlightId === order._id ? 'bg-[#00f5ff]/5' : ''
                            }`}
                          >
                            <td className="p-3 text-[#e0e0e0] uppercase">{order.type}</td>
                            <td className="p-3">{order.description}</td>
                            <td className="p-3 text-[#ffd700]">₦{order.amount}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(order.status)}`}>
                                {order.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">
                              {hasDetails && (
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : order._id)}
                                  className="text-[#00f5ff] text-xs font-mono hover:underline"
                                >
                                  {isExpanded ? 'HIDE' : 'VIEW LOGS'}
                                </button>
                              )}
                            </td>
                          </tr>
                          {hasDetails && isExpanded && (
                            <tr key={`${order._id}-details`} className="bg-[#12121a] border-b border-[#2a2a3a]">
                              <td colSpan={6} className="p-4">
                                <div className="max-w-xl">
                                  {order.metadata?.category && (
                                    <p className="text-xs text-[#f97316] mb-2">{order.metadata.category}</p>
                                  )}
                                  <h4 className="text-[#e0e0e0] font-bold mb-2">Account Details</h4>
                                  <div className="bg-[#0a0a0f] rounded-lg p-4 mb-3">
                                    {renderAccountData(order.metadata.accountData)}
                                  </div>
                                  {order.metadata?.instructions && (
                                    <>
                                      <h4 className="text-[#e0e0e0] font-bold mb-2">Instructions</h4>
                                      <p className="text-[#a0a0b0] whitespace-pre-line text-xs mb-3">
                                        {order.metadata.instructions}
                                      </p>
                                    </>
                                  )}
                                  {order.metadata?.video && (
                                    <>
                                      <h4 className="text-[#e0e0e0] font-bold mb-2">Video Tutorial</h4>
                                      {isVideoUrl(order.metadata.video) ? (
                                        <div className="aspect-video max-w-md mb-2">
                                          <iframe
                                            src={toEmbedUrl(order.metadata.video)}
                                            className="w-full h-full rounded-lg"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        </div>
                                      ) : (
                                        <a
                                          href={order.metadata.video}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#00f5ff] text-xs font-mono hover:underline"
                                        >
                                          Watch Tutorial
                                        </a>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersInner />
    </Suspense>
  );
}
