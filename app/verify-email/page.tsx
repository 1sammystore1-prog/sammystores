'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMsg('This verification link is missing information. Please use the link from your email exactly as sent.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMsg(data.message);
        } else {
          setStatus('error');
          setMsg(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMsg('Network error. Please try again.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <Logo variant="stacked" />
        </div>

        {status === 'verifying' && <p className="text-gray-500 text-sm">Verifying your email...</p>}

        {status === 'success' && (
          <>
            <p className="text-green-600 font-semibold mb-2">✓ {msg}</p>
            <Link href="/dashboard" className="btn-primary inline-block px-6 py-3 mt-2">
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-red-600 font-semibold mb-4">{msg}</p>
            <Link href="/settings" className="text-[#f97316] font-semibold hover:underline text-sm">
              Go to Settings to request a new link
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
