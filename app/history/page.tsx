'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

// Friendly labels + credit/debit direction for each wallet transaction
// type - raw type strings like "coupon_discount" aren't meaningful to a
// customer at a glance, and knowing whether an entry ADDED or REMOVED
// money is the single most important thing to see instantly.
const TYPE_INFO: Record<string, { label: string; direction: 'credit' | 'debit' }> = {
  wallet_fund: { label: 'Wallet Funded', direction: 'credit' },
  welcome_bonus: { label: 'Welcome Bonus', direction: 'credit' },
  referral_bonus: { label: 'Referral Bonus', direction: 'credit' },
  coupon_discount: { label: 'Coupon Discount', direction: 'credit' },
  tier_discount: { label: 'Loyalty Discount', direction: 'credit' },
  admin_credit: { label: 'Admin Credit', direction: 'credit' },
  admin_debit: { label: 'Admin Debit', direction: 'debit' },
  refund: { label: 'Refund', direction: 'credit' },
  deposit: { label: 'Deposit', direction: 'credit' },
  withdrawal: { label: 'Withdrawal', direction: 'debit' },
};

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

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
      setLoading(false);
    };
    fetchHistory();
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
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800">Transaction History</h1>
            <p className="text-sm text-gray-500 mt-1">Wallet funding, bonuses, and discounts.</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 text-xs">
            <Link href="/orders" className="text-[#f97316] font-semibold hover:underline">
              Looking for what you bought? View Order History →
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/numbers" className="text-[#f97316] font-semibold hover:underline">
              Looking for virtual numbers? View Numbers History →
            </Link>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-500 mb-4">No wallet activity yet.</p>
              <Link href="/fund" className="btn-primary inline-block px-6 py-2">
                Fund Your Wallet
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn: any) => {
                const info = TYPE_INFO[txn.type] || { label: txn.type, direction: 'credit' as const };
                const isCredit = info.direction === 'credit';
                return (
                  <div key={txn._id} className="card p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">{info.label}</p>
                        <p className="text-gray-800 font-medium break-words">{txn.description}</p>
                      </div>
                      {statusBadge(txn.status)}
                    </div>
                    <div className="flex justify-between items-center text-sm mt-3">
                      <span className="text-gray-400">{new Date(txn.createdAt).toLocaleString()}</span>
                      <span className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}₦{txn.amount?.toLocaleString()}
                      </span>
                    </div>
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
