import type { MetadataRoute } from "next";
import { getListings } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

// The API caps `limit` at 100, so walk pages rather than asking for
// everything at once — and stop at a fixed ceiling so a growing catalogue
// can't turn this route into an unbounded crawl of the database.
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await getListings({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    listings.push(...res.items);
    if (res.items.length < PAGE_SIZE) break;
  }

  // Several listings can share one book, and the book page is a real
  // destination of its own — but only worth listing once.
  const bookIds = new Set(listings.map((l) => l.book.id));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...listings.map((listing) => ({
      url: `${SITE_URL}/listings/${listing.id}`,
      lastModified: new Date(listing.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...[...bookIds].map((id) => ({
      url: `${SITE_URL}/books/${id}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
