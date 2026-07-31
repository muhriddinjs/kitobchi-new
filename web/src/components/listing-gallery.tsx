"use client";

import { useState } from "react";
import Image from "next/image";
import type { ListingImage, ListingStatus } from "@/lib/types";

export default function ListingGallery({
  images,
  coverFallback,
  alt,
  status,
}: {
  images: ListingImage[];
  coverFallback: string | null;
  alt: string;
  status: ListingStatus;
}) {
  const urls = images.length > 0 ? images.map((i) => i.url) : [];
  const [active, setActive] = useState(0);
  const main = urls[active] ?? coverFallback;

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-paper-muted">
        {main ? (
          <Image
            src={main}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft">
            <span className="font-serif text-sm">Rasm yoʻq</span>
          </div>
        )}

        {status === "SOLD" && (
          <span className="absolute left-3 top-3 rounded-full bg-status-sold-bg px-3 py-1 text-sm font-medium text-status-sold">
            Sotildi
          </span>
        )}
      </div>

      {urls.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Rasm ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-lg bg-paper-muted ${
                i === active
                  ? "ring-2 ring-brand"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
