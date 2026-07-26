'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Banner {
  _id: string;
  message: string;
  emoji?: string;
  linkUrl?: string;
  linkLabel?: string;
  theme: 'festive' | 'sale' | 'celebration' | 'ad' | 'custom';
  backgroundColor?: string;
  textColor?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}

const THEME_PREVIEW: Record<string, string> = {
  festive: 'bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white',
  sale: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black',
  celebration: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white',
  ad: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white',
};

export default function AdminPromoBannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const [message, setMessage] = useState('');
  const [emoji, setEmoji] = useState('🎉');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [theme, setTheme] = useState<Banner['theme']>('festive');
  const [backgroundColor, setBackgroundColor] = useState('#111827');
  const [textColor, setTextColor] = useState('#ffffff');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
  };

  const loadBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/promo-banner', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setBanners(data.banners);
      else setError(data.error || 'Failed to load banners');
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/promo-banner', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          message: message.trim(),
          emoji: emoji.trim(),
          linkUrl: linkUrl.trim(),
          linkLabel: linkLabel.trim(),
          theme,
          backgroundColor,
          textColor,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('');
        setLinkUrl('');
        setLinkLabel('');
        setStartDate('');
        setEndDate('');
        loadBanners();
      } else {
        setError(data.error || 'Failed to create banner');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleActive = async (b: Banner) => {
    await fetch(`/api/admin/promo-banner/${b._id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ active: !b.active }),
    });
    loadBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner permanently?')) return;
    await fetch(`/api/admin/promo-banner/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadBanners();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Promo / Event Banner</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
          &larr; Admin Home
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        A festive, fun, or ad-style banner shown at the top of the site - great for holidays, sales, or
        even paid ad placements for someone else. Only one shows at a time. Optionally schedule it to a
        specific date range so it turns on/off automatically.
      </p>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-4 mb-8 space-y-3">
        <h2 className="font-semibold text-gray-800 mb-2">Create New Banner</h2>

        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🎉"
            maxLength={4}
            className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center"
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Happy New Year! Enjoy 10% off all SMM orders this week."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Link URL (optional, e.g. sponsor's site)"
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Link text (e.g. Shop Now)"
            className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Banner['theme'])}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="festive">Festive (red/pink)</option>
            <option value="sale">Sale (yellow/orange)</option>
            <option value="celebration">Celebration (purple/pink)</option>
            <option value="ad">Ad (dark/neutral)</option>
            <option value="custom">Custom colors</option>
          </select>
          {theme === 'custom' && (
            <>
              <label className="text-xs text-gray-500 flex items-center gap-1">
                Background
                <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-8 h-8 border-0" />
              </label>
              <label className="text-xs text-gray-500 flex items-center gap-1">
                Text
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 border-0" />
              </label>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-gray-500">
            Start (optional)
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </label>
          <label className="text-xs text-gray-500">
            End (optional)
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </label>
        </div>

        {message.trim() && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Preview:</p>
            <div
              className={`px-4 py-2.5 rounded-lg text-sm font-medium ${theme === 'custom' ? '' : THEME_PREVIEW[theme]}`}
              style={theme === 'custom' ? { backgroundColor, color: textColor } : undefined}
            >
              {emoji} {message}
              {linkUrl && <span className="underline ml-2 font-semibold">{linkLabel || 'Learn More'}</span>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm"
        >
          {sending ? 'Creating...' : 'Create Banner'}
        </button>
      </form>

      <h2 className="font-semibold text-gray-800 mb-3">All Banners</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : banners.length === 0 ? (
        <p className="text-sm text-gray-500">No banners created yet.</p>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b._id} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div
                className={`px-3 py-2 rounded-lg text-sm font-medium mb-3 ${b.theme === 'custom' ? '' : THEME_PREVIEW[b.theme]}`}
                style={b.theme === 'custom' ? { backgroundColor: b.backgroundColor, color: b.textColor } : undefined}
              >
                {b.emoji} {b.message}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                  <span className={`font-semibold px-2 py-1 rounded-full mr-2 ${b.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                    {b.active ? 'Active' : 'Inactive'}
                  </span>
                  {(b.startDate || b.endDate) && (
                    <span>
                      {b.startDate ? new Date(b.startDate).toLocaleDateString() : 'Anytime'} →{' '}
                      {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'No end'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(b)} className="font-semibold underline hover:opacity-70">
                    {b.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button onClick={() => deleteBanner(b._id)} className="font-semibold underline hover:opacity-70 text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
