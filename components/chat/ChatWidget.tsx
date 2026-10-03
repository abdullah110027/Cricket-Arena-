'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Minimize2, SendHorizonal, Sparkles, X } from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatWidgetProps = {
  pageMode?: boolean;
};

const MAX_MESSAGE_LENGTH = 500;

export function ChatWidget({ pageMode = false }: ChatWidgetProps) {
  const [open, setOpen] = useState(pageMode);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am the Cricket Arena assistant. I can help with venues, booking steps, advance payments, remaining cash, and general platform questions.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    setError('');
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: trimmed };
    setMessages((current) => [...current, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const payload = await response.json().catch(() => ({ error: 'The assistant is temporarily unavailable.' }));
      if (!response.ok) {
        throw new Error(payload.error || 'The assistant could not respond right now.');
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: payload.reply || 'I can help with venue and booking questions.',
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not respond right now.');
    } finally {
      setLoading(false);
    }
  };

  const renderWindow = (
    <div className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl ${pageMode ? 'mx-auto w-full max-w-3xl' : 'w-[360px] max-w-[calc(100vw-1.5rem)]'}`}>
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Cricket Arena AI</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300">Assistant</p>
          </div>
        </div>
        {!pageMode ? (
          <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white" aria-label="Close chat">
            <Minimize2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex h-[420px] flex-col bg-slate-50">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              Ask about venues, bookings, prices, or payment details.
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${message.role === 'user' ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                {message.content}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                Thinking…
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>
        ) : null}

        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Ask about a venue, booking, or payment…"
              className="min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || !input.trim()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              aria-label="Send message"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (pageMode) {
    return (
      <main className="container-shell py-10 sm:py-16">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">AI support</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Cricket Arena assistant</h1>
        </div>
        {renderWindow}
      </main>
    );
  }

  if (!open) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl transition hover:scale-105 hover:bg-emerald-700"
          aria-label="Open Cricket Arena AI assistant"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {renderWindow}
    </div>
  );
}
