"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch, authHeaders, getAccessToken } from "@/lib/api";

// Phone stays hidden until the buyer asks for it — keeps casual scraping of
// numbers off listing pages while still enabling the offline-deal contact.
export default function ContactSeller({
  listingId,
  phone,
  telegramUsername,
}: {
  listingId: string;
  phone: string;
  telegramUsername: string | null;
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openChat() {
    if (!getAccessToken()) {
      router.push("/login");
      return;
    }
    setOpeningChat(true);
    setError(null);
    try {
      const conversation = await apiFetch<{ id: string }>("/conversations", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ listingId }),
      });
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Suhbatni ochib boʻlmadi. Qayta urinib koʻring.",
      );
      setOpeningChat(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={openingChat}
        onClick={openChat}
        className="rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {openingChat ? "Ochilmoqda..." : "Saytda yozish"}
      </button>

      {revealed ? (
        <a
          href={`tel:${phone}`}
          className="rounded-full border border-brand px-4 py-2.5 text-center text-sm font-medium text-brand-dark hover:bg-brand-light"
        >
          {phone}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-full border border-brand px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand-light"
        >
          Raqamni koʻrsatish
        </button>
      )}

      {telegramUsername && (
        <a
          href={`https://t.me/${telegramUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-ink hover:border-brand hover:text-brand-dark"
        >
          Telegramda yozish
        </a>
      )}

      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
