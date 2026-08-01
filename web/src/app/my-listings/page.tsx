"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import MarkSoldDialog from "@/components/mark-sold-dialog";
import type { Listing } from "@/lib/types";

type Status = "loading" | "unauthorized" | "ready";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Faol",
  RESERVED: "Band qilingan",
  SOLD: "Sotilgan",
  HIDDEN: "Yashirilgan",
};

export default function MyListingsPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [listings, setListings] = useState<Listing[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);
  // Which listing has its "who bought it?" picker open.
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setStatus("unauthorized");
        return;
      }
      try {
        const mine = await apiFetch<Listing[]>("/listings/me", {
          headers: authHeaders(),
        });
        setListings(mine);
        setStatus("ready");
      } catch {
        setStatus("unauthorized");
      }
    }
    void load();
  }, []);

  function onMarkedSold(updated: Listing) {
    setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSellingId(null);
  }

  async function hide(id: string) {
    if (!window.confirm("Eʼlonni yashirishni tasdiqlaysizmi?")) return;
    setActingOn(id);
    setError(null);
    try {
      await apiFetch(`/listings/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "HIDDEN" } : l)),
      );
    } catch {
      setError("Amalni bajarib boʻlmadi. Qayta urinib koʻring.");
    } finally {
      setActingOn(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-ink-soft sm:px-6">
        Yuklanmoqda...
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-xl text-ink">Tizimga kiring</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Eʼlonlaringizni koʻrish uchun{" "}
          <Link href="/login" className="underline hover:text-ink">
            tizimga kiring
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Mening eʼlonlarim</h1>
        <Link
          href="/listings/new"
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + Yangi eʼlon
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {listings.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Hozircha eʼlon joylamagansiz.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {listings.map((listing) => {
            const cover = listing.images[0]?.url ?? listing.book.coverUrl;
            return (
              <li
                key={listing.id}
                className="flex gap-4 rounded-xl border border-border bg-white p-4"
              >
                <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-lg bg-paper-muted sm:w-20">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={listing.book.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-ink-soft">
                      Rasm yoʻq
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="line-clamp-1 font-serif text-base text-ink hover:underline"
                  >
                    {listing.book.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {formatPrice(listing.price)} ·{" "}
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </p>

                  <div className="mt-auto pt-2">
                    {listing.status === "ACTIVE" &&
                      (sellingId === listing.id ? (
                        <MarkSoldDialog
                          listingId={listing.id}
                          onDone={onMarkedSold}
                          onCancel={() => setSellingId(null)}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={actingOn === listing.id}
                            onClick={() => setSellingId(listing.id)}
                            className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                          >
                            Sotildi deb belgilash
                          </button>
                          <button
                            type="button"
                            disabled={actingOn === listing.id}
                            onClick={() => hide(listing.id)}
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand-dark disabled:opacity-50"
                          >
                            Yashirish
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
