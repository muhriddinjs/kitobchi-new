// Shared Prisma select/include shapes for listing payloads.
//
// These live in `common/` rather than in `listings.service.ts` because the
// catalog module needs them too, and `listings.service.ts` already imports
// `BooksService` — importing back the other way would be a cycle.

export const SELLER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  ratingAvg: true,
  ratingCount: true,
  // NOTE: `phone` and `telegramUsername` are deliberately absent. The deal
  // happens offline so a buyer does need them, but putting them in every
  // public listing payload means anyone can scrape every seller's number
  // with a single unauthenticated request. They're served instead by
  // `GET /listings/:id/contact`, which requires a logged-in (phone-verified)
  // account and is rate-limited.
};

export const LISTING_INCLUDE = {
  book: true,
  seller: { select: SELLER_SELECT },
  images: { orderBy: { sortOrder: 'asc' as const } },
};
