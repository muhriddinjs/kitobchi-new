export type ListingType = "SALE" | "DONATION";
export type ListingCondition = "NEW" | "GOOD" | "FAIR" | "WORN";
export type ListingStatus = "ACTIVE" | "RESERVED" | "SOLD" | "HIDDEN";

export interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  parentId: string | null;
}

export interface Book {
  id: string;
  isbn: string | null;
  title: string;
  authors: string[];
  publisher: string | null;
  year: number | null;
  language: string | null;
  coverUrl: string | null;
  description: string | null;
  categoryId: string | null;
}

// Contact details are not part of listing payloads — fetch them from
// `GET /listings/:id/contact` (auth required). See SellerContact below.
export interface SellerSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
}

export interface SellerContact {
  phone: string;
  telegramUsername: string | null;
}

/** Someone who chatted about a listing or asked for the seller's number. */
export interface BuyerCandidate {
  id: string;
  name: string;
  avatarUrl: string | null;
  source: "chat" | "contact";
}

export interface ListingImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface Listing {
  id: string;
  book: Book;
  seller: SellerSummary;
  type: ListingType;
  price: number | null;
  condition: ListingCondition;
  status: ListingStatus;
  description: string | null;
  city: string;
  images: ListingImage[];
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  listing: {
    id: string;
    book: { id: string; title: string; coverUrl: string | null };
    images: ListingImage[];
  };
  buyer: ChatParticipant;
  seller: ChatParticipant;
  /** Last message only (list preview). */
  messages: {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
  }[];
  /** Present in the conversation list response. */
  unreadCount?: number;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string; avatarUrl: string | null };
  listing: { id: string; book: { title: string } };
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  sender: { id: string; name: string };
  createdAt: string;
}
