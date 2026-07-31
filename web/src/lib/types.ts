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

export interface SellerSummary {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  telegramUsername: string | null;
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
  phone: string;
  avatarUrl: string | null;
  telegramUsername: string | null;
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
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  sender: { id: string; name: string };
  createdAt: string;
}
