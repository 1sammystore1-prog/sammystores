'use client';
import { useState, useEffect } from 'react';

interface Banner {
  _id: string;
  message: string;
  emoji?: string;
  linkUrl?: string;
  linkLabel?: string;
  theme: 'festive' | 'sale' | 'celebration' | 'ad' | 'custom';
  backgroundColor?: string;
  textColor?: string;
}

// Preset "fun" looks so an admin doesn't need to pick colors for the
// common cases - a real color/hex picker only matters for 'custom'
// (e.g. matching a sponsor's brand colors for a paid ad placement).
const THEME_STYLE: Record<string, string> = {
  festive: 'bg-gradient-to-r from-red-500 via-pink-500 to-red-500 text-white',
  sale: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black',
  celebration: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white',
  ad: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white',
};

const DISMISSED_KEY = 'dismissedPromoBanners';

export default function PromoBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDismissed(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'));
    } catch {
      setDismissed([]);
    }

    fetch('/api/promo-banner')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.banner) setBanner(data.banner);
      })
      .catch(() => {});
  }, []);

  if (!banner || dismissed.includes(banner._id)) return null;

  const dismiss = () => {
    const next = [...dismissed, banner._id];
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
  };

  const isCustom = banner.theme === 'custom';
  const style = isCustom
    ? { backgroundColor: banner.backgroundColor || '#111827', color: banner.textColor || '#ffffff' }
    : undefined;
  const className = isCustom ? '' : THEME_STYLE[banner.theme] || THEME_STYLE.festive;

  const content = (
    <div className={`px-4 py-2.5 flex items-center justify-between gap-3 text-sm ${className}`} style={style}>
      <div className="flex items-center gap-2 min-w-0">
        {banner.emoji && <span className="text-lg shrink-0">{banner.emoji}</span>}
        <span className="truncate font-medium">{banner.message}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold whitespace-nowrap hover:opacity-80"
          >
            {banner.linkLabel || 'Learn More'}
          </a>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            dismiss();
          }}
          aria-label="Dismiss"
          className="opacity-80 hover:opacity-100 text-lg leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );

  return content;
}
