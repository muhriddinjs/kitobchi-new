import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConditionBadge from "@/components/condition-badge";
import StarRating from "@/components/star-rating";
import ReportListingButton from "@/components/report-listing-button";
import { formatPrice } from "@/lib/format";
import { getListing } from "@/lib/queries";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) notFound();

  const { book, seller } = listing;
  const cover = listing.images[0]?.url ?? book.coverUrl;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-paper-muted">
            {cover ? (
              <Image
                src={cover}
                alt={book.title}
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

            {listing.status === "SOLD" && (
              <span className="absolute left-3 top-3 rounded-full bg-status-sold-bg px-3 py-1 text-sm font-medium text-status-sold">
                Sotildi
              </span>
            )}
          </div>

          {listing.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {listing.images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-paper-muted"
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Link
              href={`/books/${book.id}`}
              className="font-serif text-2xl text-ink hover:underline"
            >
              {book.title}
            </Link>
            {book.authors.length > 0 && (
              <p className="mt-1 text-ink-soft">{book.authors.join(", ")}</p>
            )}

            {listing.description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
                {listing.description}
              </p>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-center justify-between">
              <span
                className={
                  listing.type === "DONATION"
                    ? "font-serif text-2xl text-status-donation"
                    : "font-serif text-2xl text-brand-dark"
                }
              >
                {formatPrice(listing.price)}
              </span>
              <ConditionBadge condition={listing.condition} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">{listing.city}</p>

            <div className="mt-5 flex flex-col gap-2">
              <button className="rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
                Saytda yozish
              </button>
              {seller.telegramUsername && (
                <a
                  href={`https://t.me/${seller.telegramUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-ink hover:border-brand hover:text-brand-dark"
                >
                  Telegramda yozish
                </a>
              )}
              <button className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand-dark">
                Sevimlilarga qoʻshish
              </button>
            </div>
          </div>

          <Link
            href={`/sellers/${seller.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 hover:border-brand"
          >
            <div className="relative h-11 w-11 overflow-hidden rounded-full bg-paper-muted">
              {seller.avatarUrl && (
                <Image
                  src={seller.avatarUrl}
                  alt={seller.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{seller.name}</p>
              <StarRating
                value={seller.ratingAvg}
                count={seller.ratingCount}
              />
            </div>
          </Link>

          <ReportListingButton listingId={listing.id} />
        </aside>
      </div>
    </div>
  );
}
