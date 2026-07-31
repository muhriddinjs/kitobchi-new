"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, authHeaders, getAccessToken } from "@/lib/api";

export default function ReportListingButton({
  listingId,
}: {
  listingId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(Boolean(getAccessToken()));
  }, []);

  if (hasToken === null) return null;

  if (!hasToken) {
    return (
      <p className="text-xs text-ink-soft">
        Shikoyat qilish uchun{" "}
        <Link href="/login" className="underline hover:text-ink">
          tizimga kiring
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return <p className="text-xs text-ink-soft">Shikoyatingiz qabul qilindi.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink-soft underline hover:text-ink"
      >
        Shikoyat qilish
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/listings/${listingId}/report`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });
      setDone(true);
    } catch {
      setError("Shikoyat yuborilmadi. Qayta urinib koʻring.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label className="text-xs font-medium text-ink-soft">
        Nima uchun shikoyat qilyapsiz?
      </label>
      <textarea
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={300}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
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
