import Image from "next/image";
import { notFound } from "next/navigation";
import ListingCard from "@/components/listing-card";
import EmptyState from "@/components/empty-state";
import StarRating from "@/components/star-rating";
import { getListings, getSeller, getSellerReviews } from "@/lib/queries";
import { formatMessageTime } from "@/lib/format";

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) notFound();

  const [listings, reviews] = await Promise.all([
    getListings({ sellerId: id, limit: "24" }),
    getSellerReviews(id),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-paper-muted">
          {seller.avatarUrl && (
            <Image
              src={seller.avatarUrl}
              alt={seller.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          )}
        </div>
        <div>
          <h1 className="font-serif text-2xl text-ink">{seller.name}</h1>
          <StarRating value={seller.ratingAvg} count={seller.ratingCount} />
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Eʼlonlari</h2>
        {listings.items.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {listings.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState title="Hozircha eʼlonlar yoʻq" />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-ink">
          Sharhlar{reviews.length > 0 && ` (${reviews.length})`}
        </h2>

        {reviews.length > 0 ? (
          <ul className="mt-4 flex max-w-2xl flex-col gap-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-border bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">
                    {review.reviewer.name}
                  </p>
                  <span className="text-xs text-ink-soft">
                    {formatMessageTime(review.createdAt)}
                  </span>
                </div>
                <div className="mt-1 text-sm text-amber-500" aria-label={`${review.rating} yulduz`}>
                  {"★".repeat(review.rating)}
                  <span className="text-border">
                    {"★".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {review.listing.book.title}
                </p>
                {review.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-ink">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">
            Hozircha sharhlar yoʻq.
          </p>
        )}
      </section>
    </div>
  );
}
