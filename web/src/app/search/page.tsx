import ListingCard from "@/components/listing-card";
import EmptyState from "@/components/empty-state";
import { getCategories, getListings } from "@/lib/queries";

const CONDITIONS = [
  { value: "NEW", label: "Yangidek" },
  { value: "GOOD", label: "Yaxshi" },
  { value: "FAIR", label: "Oʻrtacha" },
  { value: "WORN", label: "Eskirgan" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [categories, results] = await Promise.all([
    getCategories(),
    getListings({
      q: params.q,
      category: params.category,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      condition: params.condition,
      city: params.city,
      type: params.type,
      page: params.page,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-serif text-2xl text-ink">
        {params.q ? `"${params.q}" boʻyicha natijalar` : "Barcha eʼlonlar"}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <form className="flex flex-col gap-5 rounded-xl border border-border bg-white p-4 h-fit">
          <input type="hidden" name="q" value={params.q ?? ""} />

          <div>
            <label className="text-xs font-medium text-ink-soft">
              Kategoriya
            </label>
            <select
              name="category"
              defaultValue={params.category ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Barchasi</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameUz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-soft">Turi</label>
            <select
              name="type"
              defaultValue={params.type ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Barchasi</option>
              <option value="SALE">Sotiladi</option>
              <option value="DONATION">Hadya</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-soft">
              Holati
            </label>
            <select
              name="condition"
              defaultValue={params.condition ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Barchasi</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-soft">
              Narx oraligʻi (soʻm)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                name="minPrice"
                placeholder="dan"
                defaultValue={params.minPrice ?? ""}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="gacha"
                defaultValue={params.maxPrice ?? ""}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-soft">
              Shahar
            </label>
            <input
              type="text"
              name="city"
              placeholder="Toshkent"
              defaultValue={params.city ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Filtrlash
          </button>
        </form>

        <div>
          {results.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {results.items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Hech narsa topilmadi"
              description="Filtrlarni oʻzgartirib qayta urinib koʻring."
            />
          )}
        </div>
      </div>
    </div>
  );
}
