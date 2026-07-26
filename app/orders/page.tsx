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
      className="ml-2 shrink-0 px-2 py-1 text-xs rounded bg-white border border-gray-200 text-[#f97316] hover:bg-orange-50 font-semibold"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function statusBadge(status: string) {
  const styles =
    status === 'success'
      ? 'text-green-700 border-green-200 bg-green-50'
      : status === 'pending'
        ? 'text-amber-700 border-amber-200 bg-amber-50'
        : 'text-red-700 border-red-200 bg-red-50';
  const dot =
    status === 'success' ? 'bg-green-500' : status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-red-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border shrink-0 ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status.toUpperCase()}
    </span>
  );
}

function typeLabel(type: string) {
  if (type === 'account_purchase') return 'Account / Log';
  if (type === 'smm') return 'SMM Order';
  return type;
}

function renderAccountData(accountData: any) {
  if (!accountData) return null;
  const entries = typeof accountData === 'object' ? Object.entries(accountData) : [['Details', accountData]];
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <p className="text-gray-400 text-[10px] uppercase font-semibold mb-1">{key}</p>
          <div className="flex items-start justify-between gap-2">
            <span className="text-gray-800 text-sm break-all whitespace-pre-wrap">{String(value)}</span>
            <CopyButton text={String(value)} />
          </div>
        </div>
      ))}
    </div>
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
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#f97316] mb-4 transition-colors">
            ← Back to Dashboard
          </Link>

          <div className="mb-2">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800">Order History</h1>
            <p className="text-sm text-gray-500 mt-1">Accounts, logs, and SMM orders you've purchased.</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 text-xs">
            <Link href="/numbers" className="text-[#f97316] font-semibold hover:underline">
              Looking for virtual numbers? View Numbers History →
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/history" className="text-[#f97316] font-semibold hover:underline">
              Looking for wallet funding/bonuses? View Transaction History →
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-500 mb-4">No account or SMM orders yet.</p>
              <Link href="/dashboard" className="btn-primary inline-block px-6 py-2">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => {
                const hasDetails = order.type === 'account_purchase' && order.metadata?.accountData;
                const isExpanded = expandedId === order._id;
                return (
                  <div
                    key={order._id}
                    id={`order-${order._id}`}
                    className={`card p-4 ${highlightId === order._id ? 'ring-2 ring-orange-300' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">{typeLabel(order.type)}</p>
                        <p className="text-gray-800 font-medium break-words">{order.description}</p>
                      </div>
                      {statusBadge(order.status)}
                    </div>

                    <div className="flex justify-between items-center text-sm mt-3">
                      <span className="text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                      <span className="text-[#f97316] font-bold">₦{order.amount?.toLocaleString()}</span>
                    </div>

                    {hasDetails && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order._id)}
                        className="mt-3 text-[#f97316] text-xs font-semibold hover:underline"
                      >
                        {isExpanded ? 'Hide Details ▲' : 'View Logs ▼'}
                      </button>
                    )}

                    {hasDetails && isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {order.metadata?.category && (
                          <p className="text-xs text-[#f97316] font-semibold mb-2">{order.metadata.category}</p>
                        )}
                        <h4 className="text-gray-800 font-bold text-sm mb-2">Account Details</h4>
                        <div className="bg-white rounded-lg p-3 mb-3 border border-gray-100">
                          {renderAccountData(order.metadata.accountData)}
                        </div>
                        {order.metadata?.instructions && (
                          <>
                            <h4 className="text-gray-800 font-bold text-sm mb-2">Instructions</h4>
                            <p className="text-gray-600 whitespace-pre-line text-xs mb-3">{order.metadata.instructions}</p>
                          </>
                        )}
                        {order.metadata?.video && (
                          <>
                            <h4 className="text-gray-800 font-bold text-sm mb-2">Video Tutorial</h4>
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
                                className="text-[#f97316] text-xs font-semibold hover:underline"
                              >
                                Watch Tutorial
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
