"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ListingCard from "@/components/listing-card";
import EmptyState from "@/components/empty-state";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";
import type { Listing } from "@/lib/types";

type Status = "loading" | "unauthorized" | "ready";

export default function FavoritesPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        setStatus("unauthorized");
        return;
      }
      try {
        const favorites = await apiFetch<Listing[]>("/favorites", {
          headers: authHeaders(),
        });
        setListings(favorites);
        setStatus("ready");
      } catch {
        setStatus("unauthorized");
      }
    }
    void load();
  }, []);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-ink-soft sm:px-6">
        Yuklanmoqda...
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-xl text-ink">Tizimga kiring</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sevimlilaringizni koʻrish uchun{" "}
          <Link href="/login" className="underline hover:text-ink">
            tizimga kiring
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">Sevimlilar</h1>

      {listings.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Sevimlilar boʻsh"
            description="Yoqqan eʼlonni ochib, «Sevimlilarga qoʻshish» tugmasini bosing."
          />
        </div>
      )}
    </div>
  );
}
