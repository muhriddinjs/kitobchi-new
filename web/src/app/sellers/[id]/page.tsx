import Image from "next/image";
import { notFound } from "next/navigation";
import ListingCard from "@/components/listing-card";
import EmptyState from "@/components/empty-state";
import StarRating from "@/components/star-rating";
import { getListings, getSeller } from "@/lib/queries";

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) notFound();

  const listings = await getListings({ sellerId: id, limit: "24" });

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
    </div>
  );
}
