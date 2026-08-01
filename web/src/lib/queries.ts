import { apiFetch } from "@/lib/api";
import type {
  Book,
  Category,
  Listing,
  Paginated,
  Review,
  SellerProfile,
} from "@/lib/types";

// Server-side reads use the API directly and degrade to an empty result if
// the backend isn't reachable yet, so pages still render during local setup.
//
// The degrading is deliberate, but silent degrading is not: an unreachable
// API and a genuinely empty catalogue look identical on the page, so the
// failure is logged. This is server-side output — it lands in the Vercel
// function logs, not in anyone's browser.
function logFailure(what: string, err: unknown): void {
  console.error(`[queries] ${what} failed:`, err);
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories");
  } catch (err) {
    logFailure("getCategories", err);
    return [];
  }
}

export interface ListingFilters {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  city?: string;
  type?: string;
  sellerId?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export async function getListings(
  filters: ListingFilters = {},
): Promise<Paginated<Listing>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }

  try {
    return await apiFetch<Paginated<Listing>>(`/listings?${params}`);
  } catch (err) {
    logFailure("getListings", err);
    return { items: [], page: 1, limit: 20, total: 0 };
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    return await apiFetch<Listing>(`/listings/${id}`);
  } catch (err) {
    logFailure(`getListing(${id})`, err);
    return null;
  }
}

export async function getSeller(id: string): Promise<SellerProfile | null> {
  try {
    return await apiFetch<SellerProfile>(`/users/${id}`);
  } catch (err) {
    logFailure(`getSeller(${id})`, err);
    return null;
  }
}

export async function getSellerReviews(id: string): Promise<Review[]> {
  try {
    return await apiFetch<Review[]>(`/users/${id}/reviews`);
  } catch (err) {
    logFailure(`getSellerReviews(${id})`, err);
    return [];
  }
}

export async function getBook(
  id: string,
): Promise<{ book: Book; listings: Listing[] } | null> {
  try {
    return await apiFetch<{ book: Book; listings: Listing[] }>(
      `/books/${id}`,
    );
  } catch (err) {
    logFailure(`getBook(${id})`, err);
    return null;
  }
}
