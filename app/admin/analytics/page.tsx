'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const TYPE_LABELS: Record<string, string> = {
  account_purchase: 'Accounts & Logs',
  smm: 'SMM Orders',
  virtual_number: 'Virtual Numbers',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
        else setError(d.error || 'Failed to load analytics');
        setLoading(false);
      })
      .catch(() => {
        setError('Network error');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading analytics...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return null;

  const revenueLineData = {
    labels: data.revenueByDay.map((d: any) => d._id.slice(5)), // MM-DD
    datasets: [
      {
        label: 'Revenue (₦)',
        data: data.revenueByDay.map((d: any) => d.revenue),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const signupsBarData = {
    labels: data.signupsByDay.map((d: any) => d._id.slice(5)),
    datasets: [
      {
        label: 'New Signups',
        data: data.signupsByDay.map((d: any) => d.count),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } } },
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-[#f97316] mb-4 inline-block">
        ← Back to Admin Dashboard
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Analytics</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-gray-500 font-semibold mb-1">This Month's Revenue</p>
          <p className="text-2xl font-bold text-gray-800">₦{data.thisMonthRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 font-semibold mb-1">Last Month's Revenue</p>
          <p className="text-2xl font-bold text-gray-800">₦{data.lastMonthRevenue.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 font-semibold mb-1">Month-over-Month Growth</p>
          <p className={`text-2xl font-bold ${data.growthPercent === null ? 'text-gray-400' : data.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.growthPercent === null ? 'N/A (no data last month)' : `${data.growthPercent >= 0 ? '+' : ''}${data.growthPercent}%`}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Revenue - Last 30 Days</h2>
          {data.revenueByDay.length > 0 ? (
            <Line data={revenueLineData} options={chartOptions} />
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No sales in the last 30 days.</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">New Signups - Last 30 Days</h2>
          {data.signupsByDay.length > 0 ? (
            <Bar data={signupsBarData} options={chartOptions} />
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No new signups in the last 30 days.</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Revenue by Category</h2>
          {data.revenueByType.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.revenueByType
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .map((row: any) => (
                  <div key={row._id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{TYPE_LABELS[row._id] || row._id}</span>
                    <span className="font-semibold text-gray-800">
                      ₦{row.revenue.toLocaleString()} <span className="text-gray-400 font-normal">({row.orders} orders)</span>
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Top Sellers (Last 30 Days)</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No sales yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-gray-700 truncate pr-2">{p.name}</span>
                  <span className="font-semibold text-gray-800 shrink-0">
                    ₦{p.revenue.toLocaleString()} <span className="text-gray-400 font-normal">×{p.orders}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
