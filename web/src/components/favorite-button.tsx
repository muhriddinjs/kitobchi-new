"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";
import { loginHref } from "@/lib/auth-redirect";

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // null = state unknown (logged out or still loading ids)
  const [favorited, setFavorited] = useState<boolean | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) return;
      setLoggedIn(true);
      try {
        const ids = await apiFetch<string[]>("/favorites/ids", {
          headers: authHeaders(),
        });
        setFavorited(ids.includes(listingId));
      } catch {
        setFavorited(false);
      }
    }
    void load();
  }, [listingId]);

  async function toggle() {
    if (!loggedIn) {
      router.push(loginHref(pathname));
      return;
    }
    if (favorited === null || busy) return;
    setBusy(true);
    // Optimistic flip; revert on failure.
    const next = !favorited;
    setFavorited(next);
    try {
      await apiFetch(`/favorites/${listingId}`, {
        method: next ? "POST" : "DELETE",
        headers: authHeaders(),
      });
    } catch {
      setFavorited(!next);
    } finally {
      setBusy(false);
    }
  }

  const active = favorited === true;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      className={`flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-border text-ink-soft hover:border-brand hover:text-brand-dark"
      }`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
      {active ? "Sevimlilarda" : "Sevimlilarga qoʻshish"}
    </button>
  );
}
