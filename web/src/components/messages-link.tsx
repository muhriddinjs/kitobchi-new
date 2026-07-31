"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";

const POLL_MS = 30_000;

export default function MessagesLink() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!getAccessToken()) return;
      try {
        const res = await apiFetch<{ conversations: number }>(
          "/conversations/unread-count",
          { headers: authHeaders() },
        );
        if (!cancelled) setUnread(res.conversations);
      } catch {
        // Badge is best-effort; stay quiet on errors.
      }
    }

    void check();
    const interval = setInterval(() => void check(), POLL_MS);
    // Re-check when the tab regains focus (e.g. after reading a thread).
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <Link
      href="/messages"
      className="relative hidden text-ink-soft hover:text-ink sm:inline"
    >
      Xabarlar
      {unread > 0 && (
        <span className="absolute -right-3 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
