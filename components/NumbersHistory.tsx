'use client';
import { useState, useEffect } from 'react';

interface HistoryOrder {
  transactionId: string;
  activationId: string;
  provider: 'tiger' | 'benotp';
  phoneNumber: string;
  service: string;
  price: number;
  createdAt: string;
  cancelled: boolean;
  actionable: boolean;
}

export default function NumbersHistory() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Per-order transient state, keyed by transactionId - keeps each row's
  // own loading/message state independent of the others.
  const [rowState, setRowState] = useState<Record<string, { checking?: boolean; cancelling?: boolean; sms?: string | null; msg?: string }>>({});

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/numbers/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error || 'Failed to load history');
      }
    } catch {
      setError('Network error loading history');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const setRow = (id: string, patch: Partial<{ checking: boolean; cancelling: boolean; sms: string | null; msg: string }>) => {
    setRowState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const checkCode = async (order: HistoryOrder) => {
    setRow(order.transactionId, { checking: true, msg: '' });
    const token = localStorage.getItem('token');
    try {
      const endpoint =
        order.provider === 'benotp'
          ? `/api/numbers/benotp/status?id=${order.activationId}`
          : `/api/numbers/tiger/sms?id=${order.activationId}`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.sms) {
        setRow(order.transactionId, { checking: false, sms: data.sms, msg: 'Code received!' });
      } else if (data.success) {
        setRow(order.transactionId, { checking: false, msg: 'No code yet - try again in a moment.' });
      } else {
        setRow(order.transactionId, { checking: false, msg: data.error || 'Could not check status' });
      }
    } catch {
      setRow(order.transactionId, { checking: false, msg: 'Network error' });
    }
  };

  const cancelOrder = async (order: HistoryOrder) => {
    if (!window.confirm('Cancel this number and refund your wallet?')) return;
    setRow(order.transactionId, { cancelling: true, msg: '' });
    const token = localStorage.getItem('token');
    try {
      const endpoint = order.provider === 'benotp' ? '/api/numbers/benotp/cancel' : '/api/numbers/tiger/cancel';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activationId: order.activationId }),
      });
      const data = await res.json();
      if (data.success) {
        setRow(order.transactionId, { cancelling: false, msg: `Refunded ₦${data.refunded}` });
        loadHistory(); // refresh so this order now shows as cancelled
      } else {
        setRow(order.transactionId, { cancelling: false, msg: data.error || 'Could not cancel' });
      }
    } catch {
      setRow(order.transactionId, { cancelling: false, msg: 'Network error' });
    }
  };

  if (loading) {
    return <p className="text-gray-400 text-sm text-center py-8">Loading history...</p>;
  }

  if (error) {
    return <p className="text-red-400 text-sm text-center py-8">{error}</p>;
  }

  if (orders.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No numbers purchased yet.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const rs = rowState[order.transactionId] || {};
        return (
          <div key={order.transactionId} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white font-semibold">{order.phoneNumber}</p>
                <p className="text-gray-400 text-xs">{order.service}</p>
              </div>
              <div className="text-right">
                <p className="text-[#f97316] font-semibold text-sm">₦{order.price.toLocaleString()}</p>
                <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {order.cancelled && (
              <span className="inline-block text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Cancelled &amp; refunded</span>
            )}

            {!order.cancelled && !order.actionable && (
              <span className="inline-block text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">Expired - too old to check or cancel</span>
            )}

            {order.actionable && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => checkCode(order)}
                  disabled={rs.checking}
                  className="flex-1 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  {rs.checking ? 'Checking...' : 'Check for Code'}
                </button>
                <button
                  onClick={() => cancelOrder(order)}
                  disabled={rs.cancelling}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  {rs.cancelling ? 'Cancelling...' : 'Cancel & Refund'}
                </button>
              </div>
            )}

            {rs.sms && (
              <p className="mt-2 text-green-400 font-mono text-sm">Code: {rs.sms}</p>
            )}
            {rs.msg && !rs.sms && (
              <p className="mt-2 text-gray-400 text-xs">{rs.msg}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
