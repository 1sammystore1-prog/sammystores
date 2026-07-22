'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { href: '/admin/catalog', label: 'My Catalog', icon: '📦' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const NavLinks = () => (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 text-sm font-mono font-bold px-4 py-3 rounded-lg transition-all ${
              active
                ? 'bg-[#f97316] text-black'
                : 'text-gray-600 hover:bg-orange-50 hover:text-[#f97316]'
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label.toUpperCase()}</span>
          </Link>
        );
      })}
      <div className="my-2 border-t border-gray-200" />
      <Link
        href="/dashboard"
        className="flex items-center gap-3 text-sm font-mono font-bold px-4 py-3 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
      >
        <span className="text-lg">🚪</span>
        <span>EXIT TO SITE</span>
      </Link>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-[#f97316] text-[#f97316] font-mono font-bold text-sm"
        >
          <span className="text-lg leading-none">☰</span>
          MENU
        </button>
        <span className="font-mono font-bold text-sm text-gray-500">ADMIN</span>
      </div>

      {/* Mobile drawer + overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80%] bg-white h-full p-4 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono font-bold text-gray-500 text-sm">ADMIN MENU</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>
            <NavLinks />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:min-h-screen bg-white border-r border-gray-200 p-4 md:sticky md:top-0">
        <div className="mb-6 px-2">
          <p className="font-mono font-bold text-gray-500 text-xs">SYSTEM_CONTROL_CENTER</p>
        </div>
        <NavLinks />
      </aside>
    </>
  );
}
