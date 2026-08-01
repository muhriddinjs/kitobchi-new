"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, apiFetch, authHeaders, getAccessToken } from "@/lib/api";
import { loginHref } from "@/lib/auth-redirect";
import type { SellerContact } from "@/lib/types";

// Contact details never travel with the public listing payload — they're
// fetched on demand and only for logged-in users, so numbers can't be
// harvested straight off the listing pages.
export default function ContactSeller({ listingId }: { listingId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [contact, setContact] = useState<SellerContact | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openChat() {
    if (!getAccessToken()) {
      router.push(loginHref(pathname));
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

  async function revealContact() {
    if (!getAccessToken()) {
      router.push(loginHref(pathname));
      return;
    }
    setRevealing(true);
    setError(null);
    try {
      const data = await apiFetch<SellerContact>(
        `/listings/${listingId}/contact`,
        { headers: authHeaders() },
      );
      setContact(data);
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Aloqa maʼlumotlarini olib boʻlmadi. Qayta urinib koʻring.",
      );
    } finally {
      setRevealing(false);
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

      {contact ? (
        <>
          <a
            href={`tel:${contact.phone}`}
            className="rounded-full border border-brand px-4 py-2.5 text-center text-sm font-medium text-brand-dark hover:bg-brand-light"
          >
            {contact.phone}
          </a>
          {contact.telegramUsername && (
            <a
              href={`https://t.me/${contact.telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-ink hover:border-brand hover:text-brand-dark"
            >
              Telegramda yozish
            </a>
          )}
        </>
      ) : (
        <button
          type="button"
          disabled={revealing}
          onClick={revealContact}
          className="rounded-full border border-brand px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-brand-light disabled:opacity-50"
        >
          {revealing ? "Olinmoqda..." : "Aloqa maʼlumotlarini koʻrsatish"}
        </button>
      )}

      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
