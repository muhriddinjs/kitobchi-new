import Link from "next/link";
import ListingCard from "@/components/listing-card";
import EmptyState from "@/components/empty-state";
import { getCategories, getListings } from "@/lib/queries";

export default async function HomePage() {
  const [categories, newest] = await Promise.all([
    getCategories(),
    getListings({ sort: "newest", limit: "12" }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-border bg-brand-light px-6 py-10 sm:px-10 sm:py-14">
        <h1 className="max-w-xl font-serif text-3xl leading-tight text-brand-dark sm:text-4xl">
          Kerakli kitobingizni toping, oʻqiganingizni ikkinchi hayot bilan taʼminlang
        </h1>
        <p className="mt-3 max-w-lg text-sm text-ink-soft sm:text-base">
          Toshkentda ishlatilgan kitoblarni soting, sotib oling yoki hadya
          qiling — barchasi bevosita sotuvchi bilan aloqada.
        </p>
        <form action="/search" className="mt-6 flex max-w-md gap-2">
          <input
            type="search"
            name="q"
            placeholder="Kitob yoki muallif qidiring..."
            className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Qidirish
          </button>
        </form>
      </section>

      {categories.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl text-ink">Kategoriyalar</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/search?category=${category.id}`}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm text-ink-soft hover:border-brand hover:text-brand-dark"
              >
                {category.nameUz}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">Yangi eʼlonlar</h2>
          <Link
            href="/search"
            className="text-sm font-medium text-brand-dark hover:underline"
          >
            Barchasini koʻrish
          </Link>
        </div>

        {newest.items.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {newest.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Hozircha eʼlonlar yoʻq"
              description="API ishga tushirilgach, yangi eʼlonlar shu yerda koʻrinadi."
            />
          </div>
        )}
      </section>
    </div>
  );
}
