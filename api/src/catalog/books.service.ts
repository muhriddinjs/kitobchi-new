import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertBookDto } from './dto/upsert-book.dto';

interface OpenLibraryBook {
  title?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  publish_date?: string;
  cover?: { medium?: string; large?: string };
}

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    language?: string;
    description?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

const LOOKUP_TIMEOUT_MS = 8_000;

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWithListings(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Kitob topilmadi');

    const listings = await this.prisma.listing.findMany({
      where: { bookId: id, status: { not: 'HIDDEN' } },
      include: {
        book: true,
        seller: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            ratingAvg: true,
            ratingCount: true,
            telegramUsername: true,
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { book, listings };
  }

  async lookupByIsbn(rawIsbn: string) {
    const isbn = normalizeIsbn(rawIsbn);

    const existing = await this.prisma.book.findUnique({ where: { isbn } });
    if (existing) return existing;

    const fromOpenLibrary = await this.lookupOpenLibrary(isbn);
    if (fromOpenLibrary) return fromOpenLibrary;

    const fromGoogleBooks = await this.lookupGoogleBooks(isbn);
    if (fromGoogleBooks) return fromGoogleBooks;

    throw new NotFoundException('Kitob topilmadi');
  }

  private async lookupOpenLibrary(isbn: string) {
    try {
      const { data } = await axios.get<Record<string, OpenLibraryBook>>(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
        { timeout: LOOKUP_TIMEOUT_MS },
      );

      const record = data[`ISBN:${isbn}`];
      if (!record?.title) return null;

      return {
        isbn,
        title: record.title,
        authors: record.authors?.map((a) => a.name) ?? [],
        publisher: record.publishers?.[0]?.name ?? null,
        year: record.publish_date ? parseYear(record.publish_date) : null,
        language: null,
        coverUrl: record.cover?.large ?? record.cover?.medium ?? null,
        description: null,
        categoryId: null,
      };
    } catch (err) {
      this.logger.warn(
        `Open Library lookup failed for ${isbn}: ${String(err)}`,
      );
      return null;
    }
  }

  private async lookupGoogleBooks(isbn: string) {
    try {
      const { data } = await axios.get<{ items?: GoogleBooksVolume[] }>(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
        { timeout: LOOKUP_TIMEOUT_MS },
      );

      const info = data.items?.[0]?.volumeInfo;
      if (!info?.title) return null;

      // Google Books serves covers over http:// by default; force https.
      const cover =
        info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;

      return {
        isbn,
        title: info.title,
        authors: info.authors ?? [],
        publisher: info.publisher ?? null,
        year: info.publishedDate ? parseYear(info.publishedDate) : null,
        language: info.language ?? null,
        coverUrl: cover ? cover.replace(/^http:\/\//, 'https://') : null,
        description: info.description ?? null,
        categoryId: null,
      };
    } catch (err) {
      this.logger.warn(
        `Google Books lookup failed for ${isbn}: ${String(err)}`,
      );
      return null;
    }
  }

  async findOrCreate(dto: UpsertBookDto) {
    const isbn = dto.isbn ? normalizeIsbn(dto.isbn) : undefined;

    if (isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { isbn },
      });
      if (existing) return existing;
    }

    return this.prisma.book.create({
      data: {
        isbn: isbn || null,
        title: dto.title,
        authors: dto.authors,
        publisher: dto.publisher,
        year: dto.year,
        language: dto.language,
        coverUrl: dto.coverUrl,
        description: dto.description,
        categoryId: dto.categoryId,
      },
    });
  }
}

// "978-0-14-044913-6" and "9780140449136" refer to the same book — store and
// look up a single canonical form (digits and X only).
function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, '').toUpperCase();
}

function parseYear(dateStr: string): number | null {
  const match = dateStr.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}
