import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConditionBadge from "@/components/condition-badge";
import StarRating from "@/components/star-rating";
import ReportListingButton from "@/components/report-listing-button";
import ContactSeller from "@/components/contact-seller";
import FavoriteButton from "@/components/favorite-button";
import ListingGallery from "@/components/listing-gallery";
import ReviewForm from "@/components/review-form";
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <ListingGallery
            images={listing.images}
            coverFallback={book.coverUrl}
            alt={book.title}
            status={listing.status}
          />

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
              <ContactSeller listingId={listing.id} />
              <FavoriteButton listingId={listing.id} />
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

          {listing.status === "SOLD" && (
            <ReviewForm listingId={listing.id} />
          )}

          <ReportListingButton listingId={listing.id} />
        </aside>
      </div>
    </div>
  );
}
