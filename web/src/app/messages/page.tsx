"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";
import { formatMessageTime } from "@/lib/format";
import type { Conversation } from "@/lib/types";

type Status = "loading" | "unauthorized" | "ready";

export default function MessagesPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setStatus("unauthorized");
        return;
      }
      try {
        const [me, convos] = await Promise.all([
          apiFetch<{ id: string }>("/users/me", { headers: authHeaders() }),
          apiFetch<Conversation[]>("/conversations", {
            headers: authHeaders(),
          }),
        ]);
        setMyId(me.id);
        setConversations(convos);
        setStatus("ready");
      } catch {
        setStatus("unauthorized");
      }
    }
    void load();
  }, []);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-soft sm:px-6">
        Yuklanmoqda...
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-xl text-ink">Tizimga kiring</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Xabarlaringizni koʻrish uchun{" "}
          <Link href="/login" className="underline hover:text-ink">
            tizimga kiring
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">Xabarlar</h1>

      {conversations.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Hozircha suhbatlar yoʻq. Eʼlon sahifasida «Saytda yozish» tugmasi
          orqali sotuvchi bilan suhbat boshlashingiz mumkin.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {conversations.map((conversation) => {
            const other =
              conversation.buyer.id === myId
                ? conversation.seller
                : conversation.buyer;
            const last = conversation.messages[0];
            const cover =
              conversation.listing.images[0]?.url ??
              conversation.listing.book.coverUrl;
            const unread = conversation.unreadCount ?? 0;

            return (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 hover:border-brand"
                >
                  <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-paper-muted">
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-ink">
                        {other.name}
                      </p>
                      {last && (
                        <span className="shrink-0 text-xs text-ink-soft">
                          {formatMessageTime(last.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-ink-soft">
                      {conversation.listing.book.title}
                    </p>
                    {last && (
                      <p
                        className={`mt-0.5 truncate text-xs ${
                          unread > 0
                            ? "font-semibold text-ink"
                            : "text-ink-soft"
                        }`}
                      >
                        {last.senderId === myId ? "Siz: " : ""}
                        {last.text}
                      </p>
                    )}
                  </div>

                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
