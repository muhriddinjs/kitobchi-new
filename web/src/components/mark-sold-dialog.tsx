"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch, authHeaders } from "@/lib/api";
import type { BuyerCandidate, Listing } from "@/lib/types";

const SOURCE_LABELS: Record<BuyerCandidate["source"], string> = {
  chat: "saytda yozgan",
  contact: "raqamingizni soʻragan",
};

// Recording the buyer is what makes the rating mean anything: only the
// person named here can review the seller afterwards. It stays optional
// because the book may well have gone to someone with no account.
export default function MarkSoldDialog({
  listingId,
  onDone,
  onCancel,
}: {
  listingId: string;
  onDone: (listing: Listing) => void;
  onCancel: () => void;
}) {
  const [candidates, setCandidates] = useState<BuyerCandidate[] | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const list = await apiFetch<BuyerCandidate[]>(
          `/listings/${listingId}/buyer-candidates`,
          { headers: authHeaders() },
        );
        if (!cancelled) setCandidates(list);
      } catch {
        if (!cancelled) setCandidates([]);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = await apiFetch<Listing>(
        `/listings/${listingId}/mark-sold`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(selected ? { soldToUserId: selected } : {}),
        },
      );
      onDone(updated);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Amalni bajarib boʻlmadi. Qayta urinib koʻring.",
      );
      setSubmitting(false);
    }
  }

  if (candidates === null) {
    return <p className="mt-2 text-xs text-ink-soft">Yuklanmoqda...</p>;
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-3">
      <p className="text-xs font-medium text-ink">Kim sotib oldi?</p>

      {candidates.length === 0 ? (
        <p className="text-xs text-ink-soft">
          Bu eʼlon boʻyicha hech kim siz bilan bogʻlanmagan, shuning uchun
          xaridorni tanlab boʻlmaydi. Eʼlon xaridorsiz sotilgan deb
          belgilanadi — bunda hech kim sizga baho qoldira olmaydi.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {candidates.map((candidate) => (
            <label
              key={candidate.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-light"
            >
              <input
                type="radio"
                name="buyer"
                value={candidate.id}
                checked={selected === candidate.id}
                onChange={() => setSelected(candidate.id)}
                className="accent-brand"
              />
              <span className="text-ink">{candidate.name}</span>
              <span className="text-xs text-ink-soft">
                ({SOURCE_LABELS[candidate.source]})
              </span>
            </label>
          ))}

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-light">
            <input
              type="radio"
              name="buyer"
              value=""
              checked={selected === ""}
              onChange={() => setSelected("")}
              className="accent-brand"
            />
            <span className="text-ink-soft">Xaridor bu roʻyxatda yoʻq</span>
          </label>
        </div>
      )}

      <p className="text-xs text-ink-soft">
        Faqat siz tanlagan xaridor keyinchalik sizga baho qoldira oladi.
      </p>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Saqlanmoqda..." : "Sotildi deb belgilash"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-ink-soft underline hover:text-ink"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
