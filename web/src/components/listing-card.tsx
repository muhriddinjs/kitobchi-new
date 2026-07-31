import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import ConditionBadge from "@/components/condition-badge";
import StarRating from "@/components/star-rating";

export default function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0]?.url ?? listing.book.coverUrl;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition hover:border-brand hover:shadow-sm"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-paper-muted">
        {cover ? (
          <Image
            src={cover}
            alt={listing.book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-soft">
            <span className="font-serif text-sm">Muqova yoʻq</span>
          </div>
        )}

        {listing.type === "DONATION" && (
          <span className="absolute left-2 top-2 rounded-full bg-status-donation-bg px-2 py-0.5 text-xs font-medium text-status-donation">
            Hadya
          </span>
        )}
        {listing.status === "SOLD" && (
          <span className="absolute left-2 top-2 rounded-full bg-status-sold-bg px-2 py-0.5 text-xs font-medium text-status-sold">
            Sotildi
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 font-serif text-sm leading-snug text-ink">
          {listing.book.title}
        </h3>
        {listing.book.authors.length > 0 && (
          <p className="line-clamp-1 text-xs text-ink-soft">
            {listing.book.authors.join(", ")}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span
            className={
              listing.type === "DONATION"
                ? "text-sm font-semibold text-status-donation"
                : "text-sm font-semibold text-brand-dark"
            }
          >
            {formatPrice(listing.price)}
          </span>
          <ConditionBadge condition={listing.condition} />
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-ink-soft">
          <span className="min-w-0 truncate">{listing.city}</span>
          <StarRating
            value={listing.seller.ratingAvg}
            count={listing.seller.ratingCount}
          />
        </div>
      </div>
    </Link>
  );
}
