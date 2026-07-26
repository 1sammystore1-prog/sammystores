'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// A small, dismissible-for-the-day banner promoting the referral program
// more visibly than the buried /referrals page - shown to logged-in
// users on their main pages. Dismissing hides it until tomorrow (not
// forever), since the goal is visibility, not a one-time nag someone
// clicks away and never sees again.
const DISMISS_KEY = 'referralBannerDismissedDate';
const HIDDEN_PATHS = ['/admin', '/login', '/register', '/referrals'];

// Module-level cache (survives across navigations within the same page
// load, resets on a full page refresh) - the referral code never changes
// for a given user, so there's no reason to re-fetch it on every single
// route change just to decide whether to show this banner.
let cachedReferralCode: string | null = null;
let cachedFetchAttempted = false;

export default function ReferralBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (HIDDEN_PATHS.some((p) => pathname?.startsWith(p))) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const today = new Date().toDateString();
    if (localStorage.getItem(DISMISS_KEY) === today) return;

    if (cachedFetchAttempted) {
      if (cachedReferralCode) {
        setReferralCode(cachedReferralCode);
        setVisible(true);
      }
      return;
    }

    cachedFetchAttempted = true;
    fetch('/api/account/referrals', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.referralCode) {
          cachedReferralCode = data.referralCode;
          setReferralCode(data.referralCode);
          setVisible(true);
        }
      })
      .catch(() => {
        cachedFetchAttempted = false; // allow retrying on a later navigation if this one failed
      });
  }, [pathname]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toDateString());
    setVisible(false);
  };

  if (!visible) return null;

  const referralLink = `https://www.sammystorelogs.com/register?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
  };

  return (
    <div className="bg-gradient-to-r from-[#fb923c] to-[#ea580c] text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">🎁</span>
        <span className="truncate">
          Earn <strong>₦500</strong> for every friend you refer -{' '}
          <Link href="/referrals" className="underline font-semibold whitespace-nowrap">
            get your link
          </Link>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copyLink}
          className="hidden sm:inline-block bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
        >
          Copy Link
        </button>
        <button onClick={dismiss} aria-label="Dismiss" className="text-white/80 hover:text-white text-lg leading-none">
          ✕
        </button>
      </div>
    </div>
  );
}
