import { apiFetch } from "@/lib/api";
import type {
  Book,
  Category,
  Listing,
  Paginated,
  SellerProfile,
} from "@/lib/types";

// Server-side reads use the API directly and degrade to an empty result if
// the backend isn't reachable yet, so pages still render during local setup.

export async function getCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>("/categories");
  } catch {
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
  } catch {
    return { items: [], page: 1, limit: 20, total: 0 };
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    return await apiFetch<Listing>(`/listings/${id}`);
  } catch {
    return null;
  }
}

export async function getSeller(id: string): Promise<SellerProfile | null> {
  try {
    return await apiFetch<SellerProfile>(`/users/${id}`);
  } catch {
    return null;
  }
}

export async function getBook(
  id: string,
): Promise<{ book: Book; listings: Listing[] } | null> {
  try {
    return await apiFetch<{ book: Book; listings: Listing[] }>(
      `/books/${id}`,
    );
  } catch {
    return null;
  }
}
