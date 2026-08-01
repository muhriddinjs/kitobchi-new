import type { ListingCondition, ListingStatus } from "@/lib/types";

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: "Yangidek",
  GOOD: "Yaxshi",
  FAIR: "Oʻrtacha",
  WORN: "Eskirgan",
};

export function formatPrice(price: number | null): string {
  if (price === null) return "Bepul";
  return `${price.toLocaleString("uz-UZ")} soʻm`;
}

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  ACTIVE: "Faol",
  RESERVED: "Band qilingan",
  SOLD: "Sotilgan",
  HIDDEN: "Yashirilgan",
};

// "01.08.2026" — for admin tables where the exact day matters more than
// the compact chat-style relative form.
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// "14:05" for today, "31.07 14:05" otherwise — compact chat timestamps.
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return time;
  const day = date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${day} ${time}`;
}
