"use client";

import { useState } from "react";

// Phone stays hidden until the buyer asks for it — keeps casual scraping of
// numbers off listing pages while still enabling the offline-deal contact.
export default function ContactSeller({
  phone,
  telegramUsername,
}: {
  phone: string;
  telegramUsername: string | null;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {revealed ? (
        <a
          href={`tel:${phone}`}
          className="rounded-full bg-brand px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-dark"
        >
          {phone}
        </a>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
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
    </div>
  );
}
