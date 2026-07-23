'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || escalated) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Something went wrong. Please try again.');
        setSending(false);
        return;
      }

      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);

      if (data.escalate) {
        setEscalated(true);
        if (data.requiresLogin) {
          setNeedsLogin(true);
        } else if (data.ticketId) {
          setTicketId(data.ticketId);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSending(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Contact support"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-[#f97316] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M12 2a10 10 0 0 0-10 10 9.9 9.9 0 0 0 1.32 4.95L2 22l5.29-1.39A9.9 9.9 0 0 0 12 22a10 10 0 0 0 0-20m0 2a8 8 0 0 1 8 8 8 8 0 0 1-8 8 7.9 7.9 0 0 1-4-1.09l-.29-.17-2.99.79.8-2.92-.19-.3A7.9 7.9 0 0 1 4 12a8 8 0 0 1 8-8m-.02 3.5c-.55 0-1 .45-1 1v3.5c0 .28.11.54.3.72l2.5 2.5a1 1 0 0 0 1.42-1.42l-2.2-2.2V8.5c0-.55-.44-1-1.02-1z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-36 md:bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[28rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-[#f97316] text-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-sm">SammyStore Support</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/90 hover:text-white">
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Ask about funding your wallet, orders, refunds, or coupons - I can help right away.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-[#f97316] text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm bg-white text-gray-400 border border-gray-200 rounded-bl-sm">
                  Typing...
                </div>
              </div>
            )}
            {needsLogin && (
              <div className="text-xs text-center text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <Link href="/login" className="text-[#f97316] font-semibold hover:underline">Log in</Link> to connect with our support team.
              </div>
            )}
            {ticketId && (
              <div className="text-xs text-center text-gray-500 bg-green-50 border border-green-200 rounded-lg p-2">
                You're connected with our support team.{' '}
                <Link href="/support" className="text-[#f97316] font-semibold hover:underline">View your ticket</Link>
              </div>
            )}
            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          </div>

          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={escalated ? 'This chat has ended' : 'Type your question...'}
              disabled={sending || escalated}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={sending || escalated || !input.trim()}
              className="px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
