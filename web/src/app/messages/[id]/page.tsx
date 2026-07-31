"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, authHeaders, getAccessToken } from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import type { ChatMessage, Conversation } from "@/lib/types";

type Status = "loading" | "unauthorized" | "ready";

const POLL_MS = 5000;

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [status, setStatus] = useState<Status>("loading");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!getAccessToken()) {
        setStatus("unauthorized");
        return;
      }
      try {
        const [me, convo, msgs] = await Promise.all([
          apiFetch<{ id: string }>("/users/me", { headers: authHeaders() }),
          apiFetch<Conversation>(`/conversations/${id}`, {
            headers: authHeaders(),
          }),
          apiFetch<ChatMessage[]>(`/conversations/${id}/messages`, {
            headers: authHeaders(),
          }),
        ]);
        if (cancelled) return;
        setMyId(me.id);
        setConversation(convo);
        setMessages(msgs);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("unauthorized");
      }
    }
    void load();

    // Poll for new messages while the thread is open.
    const interval = setInterval(() => {
      if (!getAccessToken()) return;
      apiFetch<ChatMessage[]>(`/conversations/${id}/messages`, {
        headers: authHeaders(),
      })
        .then((msgs) => {
          if (!cancelled) {
            setMessages((prev) => {
              // Only scroll when something new actually arrived.
              shouldScrollRef.current = msgs.length !== prev.length;
              return msgs;
            });
          }
        })
        .catch(() => undefined);
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (shouldScrollRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const message = await apiFetch<ChatMessage>(
        `/conversations/${id}/messages`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ text: trimmed }),
        },
      );
      shouldScrollRef.current = true;
      setMessages((prev) => [...prev, message]);
      setText("");
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Xabar yuborilmadi. Qayta urinib koʻring.",
      );
    } finally {
      setSending(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-soft sm:px-6">
        Yuklanmoqda...
      </div>
    );
  }

  if (status === "unauthorized" || !conversation) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-xl text-ink">Suhbat topilmadi</h1>
        <p className="mt-2 text-sm text-ink-soft">
          <Link href="/messages" className="underline hover:text-ink">
            Xabarlarga qaytish
          </Link>
        </p>
      </div>
    );
  }

  const other =
    conversation.buyer.id === myId ? conversation.seller : conversation.buyer;

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{other.name}</p>
          <Link
            href={`/listings/${conversation.listing.id}`}
            className="truncate text-xs text-ink-soft underline hover:text-ink"
          >
            {conversation.listing.book.title}
          </Link>
        </div>
        <Link
          href="/messages"
          className="shrink-0 text-xs text-ink-soft underline hover:text-ink"
        >
          ← Xabarlar
        </Link>
      </div>

      <div className="flex min-h-[40vh] flex-1 flex-col gap-2 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">
            Suhbatni boshlang — birinchi xabarni yozing.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === myId;
          return (
            <div
              key={message.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? "rounded-br-sm bg-brand text-white"
                    : "rounded-bl-sm bg-white text-ink border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
                <p
                  className={`mt-0.5 text-right text-[10px] ${
                    mine ? "text-white/70" : "text-ink-soft"
                  }`}
                >
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="pb-2 text-xs text-red-700">{error}</p>}

      <form onSubmit={send} className="flex gap-2 border-t border-border pt-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Xabar yozing..."
          maxLength={2000}
          className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {sending ? "..." : "Yuborish"}
        </button>
      </form>
    </div>
  );
}
