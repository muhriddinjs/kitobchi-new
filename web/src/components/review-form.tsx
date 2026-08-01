"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch, authHeaders, getAccessToken } from "@/lib/api";

// Only the buyer the seller recorded may review, and only once. Asking the
// API first keeps everyone else from seeing a button that would just fail.
export default function ReviewForm({ listingId }: { listingId: string }) {
  const [allowed, setAllowed] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken()) return;
    let cancelled = false;

    async function run() {
      try {
        const res = await apiFetch<{ canReview: boolean }>(
          `/listings/${listingId}/can-review`,
          { headers: authHeaders() },
        );
        if (!cancelled) setAllowed(res.canReview);
      } catch {
        // Stay hidden if we can't tell.
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (!allowed) return null;

  if (done) {
    return (
      <p className="rounded-xl border border-border bg-white p-4 text-sm text-brand-dark">
        Bahoyingiz uchun rahmat!
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-brand px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand-light"
      >
        Sotuvchini baholash
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Iltimos, yulduzchalardan birini tanlang.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/listings/${listingId}/reviews`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Baho yuborilmadi. Qayta urinib koʻring.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4"
    >
      <p className="text-sm font-medium text-ink">Sotuvchini baholang</p>

      <div className="flex gap-1" role="radiogroup" aria-label="Baho">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} yulduz`}
            onClick={() => setRating(value)}
            className={`text-2xl transition ${
              value <= rating ? "text-amber-500" : "text-border"
            } hover:scale-110`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Izoh (ixtiyoriy)"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
      />

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {submitting ? "Yuborilmoqda..." : "Yuborish"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-soft underline hover:text-ink"
        >
          Bekor qilish
        </button>
      </div>
    </form>
  );
}
