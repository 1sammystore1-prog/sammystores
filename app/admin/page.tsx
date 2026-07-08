'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalWalletBalance: 0, totalTransactions: 0 });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users')
        ]);
        
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();

        if (statsData.success) setStats(statsData);
        if (usersData.success) setUsers(usersData.users);

        // Fetch pending requests from user list (or create a specific API for pending txns if needed)
        // For now, we'll simulate fetching pending requests from a dedicated endpoint if we had one,
        // but let's assume we just show users and stats for now to keep it simple.
        
      } catch (error) {
        console.error('Admin fetch error:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-[#00ff88] font-mono">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[#e0e0e0]">ADMIN DASHBOARD</h1>
        <Link href="/dashboard" className="text-[#00f5ff] font-mono hover:underline">Exit to Site</Link>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card-dark border-[#00f5ff]">
          <h3 className="text-[#a0a0b0] font-mono text-sm">TOTAL USERS</h3>
          <p className="text-4xl font-bold text-[#00f5ff] mt-2">{stats.totalUsers}</p>
        </div>
        <div className="card-dark border-[#ffd700]">
          <h3 className="text-[#a0a0b0] font-mono text-sm">TOTAL WALLET BALANCE</h3>
          <p className="text-4xl font-bold text-[#ffd700] mt-2">{stats.totalWalletBalance.toLocaleString()}</p>
        </div>
        <div className="card-dark border-[#00ff88]">
          <h3 className="text-[#a0a0b0] font-mono text-sm">TOTAL TRANSACTIONS</h3>
          <p className="text-4xl font-bold text-[#00ff88] mt-2">{stats.totalTransactions}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-dark">
        <h2 className="text-2xl font-bold text-[#e0e0e0] mb-4 font-mono">REGISTERED USERS</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="text-[#00f5ff] border-b border-[#2a2a3a]">
              <tr>
                <th className="p-3">NAME</th>
                <th className="p-3">EMAIL</th>
                <th className="p-3">BALANCE</th>
                <th className="p-3">JOINED</th>
              </tr>
            </thead>
            <tbody className="text-[#a0a0b0]">
              {users.map((user) => (
                <tr key={user._id} className="border-b border-[#2a2a3a] hover:bg-[#1a1a25]">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 text-[#ffd700]">₦{user.walletBalance?.toLocaleString() || 0}</td>
                  <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
