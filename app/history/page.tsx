'use client';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

const mockTransactions = [
  { id: 'TXN-001', type: 'Virtual Number', service: 'WhatsApp', amount: '₦500', status: 'Success', date: '2026-07-07' },
  { id: 'TXN-002', type: 'VTU', service: 'MTN Data', amount: '₦1,000', status: 'Pending', date: '2026-07-06' },
  { id: 'TXN-003', type: 'SMM', service: 'IG Followers', amount: '2,500', status: 'Failed', date: '2026-07-05' },
  { id: 'TXN-004', type: 'Account', service: 'Gmail Aged', amount: '₦1,500', status: 'Success', date: '2026-07-04' },
];

export default function HistoryPage() {
  const getStatusColor = (status) => {
    if (status === 'Success') return 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10';
    if (status === 'Pending') return 'text-[#ffd700] border-[#ffd700]/30 bg-[#ffd700]/10';
    return 'text-[#ff2a6d] border-[#ff2a6d]/30 bg-[#ff2a6d]/10';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="mb-8">
            <p className="terminal-text text-sm mb-2">{`> MODULE: TRANSACTION_LOGS`}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#e0e0e0]">HISTORY</h1>
          </div>
          <div className="card-dark">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead className="text-[#00f5ff] border-b border-[#2a2a3a]">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">SERVICE</th>
                    <th className="p-3">AMOUNT</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">DATE</th>
                  </tr>
                </thead>
                <tbody className="text-[#a0a0b0]">
                  {mockTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-[#2a2a3a] hover:bg-[#1a1a25] transition-colors">
                      <td className="p-3 text-[#e0e0e0]">{txn.id}</td>
                      <td className="p-3">{txn.type}</td>
                      <td className="p-3">{txn.service}</td>
                      <td className="p-3">{txn.amount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(txn.status)}`}>
                          {txn.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">{txn.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
