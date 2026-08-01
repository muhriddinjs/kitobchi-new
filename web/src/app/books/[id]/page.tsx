import Image from "next/image";
import { notFound } from "next/navigation";
import ListingCard from "@/components/listing-card";
import EmptyState from "@/components/empty-state";
import { getBook } from "@/lib/queries";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getBook(id);
  if (!data) return { title: "Kitob topilmadi" };

  const { book, listings } = data;
  const authors = book.authors.join(", ");
  const title = authors ? `${book.title} — ${authors}` : book.title;

  const description =
    book.description?.trim() ||
    (listings.length > 0
      ? `Kitobchida bu kitob boʻyicha ${listings.length} ta eʼlon bor.`
      : `"${book.title}" kitobini Kitobchida qidiring.`);

  return {
    title,
    description,
    alternates: { canonical: `/books/${id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/books/${id}`,
      images: book.coverUrl ? [book.coverUrl] : undefined,
    },
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getBook(id);

  if (!data) notFound();
  const { book, listings } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[220px_1fr]">
        <div className="relative aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-xl bg-paper-muted">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              sizes="220px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft">
              <span className="font-serif text-sm">Muqova yoʻq</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="font-serif text-2xl text-ink sm:text-3xl">
            {book.title}
          </h1>
          {book.authors.length > 0 && (
            <p className="mt-1 text-ink-soft">{book.authors.join(", ")}</p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:max-w-md">
            {book.publisher && (
              <>
                <dt className="text-ink-soft">Nashriyot</dt>
                <dd className="text-ink">{book.publisher}</dd>
              </>
            )}
            {book.year && (
              <>
                <dt className="text-ink-soft">Yili</dt>
                <dd className="text-ink">{book.year}</dd>
              </>
            )}
            {book.isbn && (
              <>
                <dt className="text-ink-soft">ISBN</dt>
                <dd className="text-ink">{book.isbn}</dd>
              </>
            )}
            {book.language && (
              <>
                <dt className="text-ink-soft">Til</dt>
                <dd className="text-ink">{book.language}</dd>
              </>
            )}
          </dl>

          {book.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
              {book.description}
            </p>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-ink">
          Ushbu kitobning eʼlonlari
        </h2>

        {listings.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Bu kitob uchun eʼlonlar yoʻq"
              description="Birinchi boʻlib ushbu kitobni sotishga qoʻying."
            />
          </div>
        )}
      </section>
    </div>
  );
}
