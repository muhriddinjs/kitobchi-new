import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class BooksService {
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

  async lookupByIsbn(isbn: string) {
    const existing = await this.prisma.book.findUnique({ where: { isbn } });
    if (existing) return existing;

    const { data } = await axios.get<Record<string, OpenLibraryBook>>(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    );

    const record = data[`ISBN:${isbn}`];
    if (!record) throw new NotFoundException('Kitob topilmadi');

    return {
      isbn,
      title: record.title ?? '',
      authors: record.authors?.map((a) => a.name) ?? [],
      publisher: record.publishers?.[0]?.name ?? null,
      year: record.publish_date ? parseYear(record.publish_date) : null,
      language: null,
      coverUrl: record.cover?.large ?? record.cover?.medium ?? null,
      description: null,
      categoryId: null,
    };
  }

  async findOrCreate(dto: UpsertBookDto) {
    if (dto.isbn) {
      const existing = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existing) return existing;
    }

    return this.prisma.book.create({
      data: {
        isbn: dto.isbn,
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

function parseYear(dateStr: string): number | null {
  const match = dateStr.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}
