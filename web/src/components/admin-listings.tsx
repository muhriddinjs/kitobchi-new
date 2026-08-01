"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, authHeaders } from "@/lib/api";
import { LISTING_STATUS_LABELS, formatPrice } from "@/lib/format";
import type { Listing, ListingStatus, Paginated } from "@/lib/types";

const STATUS_OPTIONS: ListingStatus[] = [
  "ACTIVE",
  "RESERVED",
  "SOLD",
  "HIDDEN",
];

export default function AdminListings() {
  // `queryInput` is what's being typed; `search` is what was actually
  // submitted. Keeping them apart means the fetch never runs on a keystroke
  // and never reads a stale value out of a memoised closure.
  const [queryInput, setQueryInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Listing> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  // The fetch lives inside the effect rather than in a memoised callback:
  // React 19's lint rule rejects calling one that updates state. The
  // handlers below flip `loading` on; this only ever turns it back off.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set("q", search);
        if (status) params.set("status", status);
        const res = await apiFetch<Paginated<Listing>>(
          `/admin/listings?${params}`,
          { headers: authHeaders() },
        );
        if (cancelled) return;
        setData(res);
        setError(null);
      } catch {
        if (!cancelled) setError("Eʼlonlarni yuklab boʻlmadi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [page, search, status]);

  async function setHidden(id: string, hidden: boolean) {
    setActingOn(id);
    setError(null);
    try {
      const updated = await apiFetch<Listing>(
        `/admin/listings/${id}/${hidden ? "hide" : "unhide"}`,
        { method: "POST", headers: authHeaders() },
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((l) => (l.id === id ? updated : l)),
            }
          : prev,
      );
    } catch {
      setError("Amalni bajarib boʻlmadi. Qayta urinib koʻring.");
    } finally {
      setActingOn(null);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="mt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setPage(1);
          setSearch(queryInput);
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input
          type="search"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Sarlavha yoki ISBN..."
          className="min-w-48 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setLoading(true);
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">Barcha holatlar</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {LISTING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Qidirish
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">Yuklanmoqda...</p>
      ) : !data || data.items.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Eʼlon topilmadi.</p>
      ) : (
        <>
          <p className="mt-4 text-xs text-ink-soft">Jami: {data.total}</p>
          <ul className="mt-2 flex flex-col gap-3">
            {data.items.map((listing) => {
              const cover = listing.images[0]?.url ?? listing.book.coverUrl;
              const hidden = listing.status === "HIDDEN";
              return (
                <li
                  key={listing.id}
                  className="flex gap-4 rounded-xl border border-border bg-white p-4"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-muted">
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="line-clamp-1 font-serif text-base text-ink hover:underline"
                    >
                      {listing.book.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      <Link
                        href={`/sellers/${listing.seller.id}`}
                        className="hover:underline"
                      >
                        {listing.seller.name}
                      </Link>{" "}
                      · {listing.city}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {formatPrice(listing.price)} ·{" "}
                      <span className={hidden ? "text-red-700" : undefined}>
                        {LISTING_STATUS_LABELS[listing.status]}
                      </span>
                    </p>

                    <button
                      type="button"
                      disabled={actingOn === listing.id}
                      onClick={() => setHidden(listing.id, !hidden)}
                      className={`mt-2 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                        hidden
                          ? "border border-border text-ink-soft hover:border-brand hover:text-brand-dark"
                          : "bg-status-sold text-white hover:opacity-90"
                      }`}
                    >
                      {hidden ? "Qaytarish" : "Yashirish"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => p - 1);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft disabled:opacity-40"
              >
                Oldingi
              </button>
              <span className="text-xs text-ink-soft">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => p + 1);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft disabled:opacity-40"
              >
                Keyingi
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
