'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface ProofItem {
  name: string;
  product: string;
  createdAt: string;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function SocialProofPopup() {
  const pathname = usePathname();
  const [items, setItems] = useState<ProofItem[]>([]);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
  const cycleIndexRef = useRef(0);

  // Hide entirely on admin pages and auth pages - social proof has no
  // place there.
  const hidden =
    pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (hidden) return;
    fetch('/api/social-proof')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) setItems(data.items);
      })
      .catch(() => {});
  }, [hidden]);

  useEffect(() => {
    if (hidden || items.length === 0) return;

    // Cycle: show one popup for 5s, wait 8s, show the next, looping
    // through real recent purchases - never fabricated ones.
    let showTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      setVisibleIndex(cycleIndexRef.current % items.length);
      hideTimeout = setTimeout(() => {
        setVisibleIndex(null);
        cycleIndexRef.current += 1;
        showTimeout = setTimeout(cycle, 8000);
      }, 5000);
    };

    showTimeout = setTimeout(cycle, 3000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [hidden, items]);

  if (hidden || visibleIndex === null || !items[visibleIndex]) return null;

  const item = items[visibleIndex];

  return (
    <div
      className="fixed bottom-24 md:bottom-6 left-4 z-40 max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex items-center gap-3 transition-all duration-300"
      style={{ opacity: 1, transform: 'translateY(0)' }}
      role="status"
    >
      <div className="w-9 h-9 rounded-full bg-orange-100 text-[#f97316] flex items-center justify-center font-bold text-sm shrink-0">
        {item.name[0]}
      </div>
      <div className="text-xs leading-snug">
        <p className="text-gray-800">
          <span className="font-semibold">{item.name}</span> just bought <span className="font-semibold">{item.product}</span>
        </p>
        <p className="text-gray-400 mt-0.5">{timeAgo(item.createdAt)}</p>
      </div>
    </div>
  );
}
