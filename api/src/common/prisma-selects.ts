// Shared Prisma select shapes for listing payloads.
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

// A `select`, not an `include`: with `include` Prisma returns every scalar
// column on the model, so any field added to Listing later would silently
// become public — which is exactly how `soldToUserId` ended up exposed.
// Listing fields have to be named here to be served.
export const LISTING_SELECT = {
  id: true,
  type: true,
  price: true,
  condition: true,
  status: true,
  moderatedAt: true,
  description: true,
  city: true,
  createdAt: true,
  updatedAt: true,
  bookId: true,
  sellerId: true,
  book: true,
  seller: { select: SELLER_SELECT },
  images: {
    select: { id: true, url: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  // NOTE: `soldToUserId` is deliberately absent — who bought a given book
  // isn't public information. `GET /listings/:id/can-review` answers the
  // only question the UI actually needs from it.
};
