import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BooksService } from '../catalog/books.service';
import { StorageService } from '../storage/storage.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { MarkSoldDto } from './dto/mark-sold.dto';

export const SELLER_SELECT = {
  id: true,
  name: true,
  // Classifieds model: the deal happens offline, so the buyer needs a direct
  // contact route — phone is public by design (like any classifieds site).
  phone: true,
  avatarUrl: true,
  ratingAvg: true,
  ratingCount: true,
  telegramUsername: true,
};

export const LISTING_INCLUDE = {
  book: true,
  seller: { select: SELLER_SELECT },
  images: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly booksService: BooksService,
    private readonly storageService: StorageService,
  ) {}

  async create(sellerId: string, dto: CreateListingDto) {
    const book = await this.booksService.findOrCreate(dto.book);

    return this.prisma.listing.create({
      data: {
        bookId: book.id,
        sellerId,
        type: dto.type,
        price: dto.type === 'DONATION' ? null : (dto.price ?? null),
        condition: dto.condition,
        city: dto.city,
        description: dto.description,
      },
      include: LISTING_INCLUDE,
    });
  }

  async findMany(query: QueryListingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Public browse/search hides both HIDDEN and SOLD listings. A seller's
    // own profile (sellerId filter) still shows sold ones as track record.
    const where: Prisma.ListingWhereInput = {
      status: query.sellerId
        ? { not: 'HIDDEN' }
        : { notIn: ['HIDDEN', 'SOLD'] },
    };

    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.type) where.type = query.type;
    if (query.condition) where.condition = query.condition;
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      };
    }

    const bookWhere: Prisma.BookWhereInput = {};
    if (query.category) bookWhere.categoryId = query.category;
    if (query.q) {
      // Prisma can't do case-insensitive substring matching inside a string
      // array, so authors are matched with raw SQL (unnest + ILIKE) and the
      // resulting book ids merged into the filter alongside the title match.
      const pattern = `%${query.q}%`;
      const authorMatches = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM books
        WHERE EXISTS (
          SELECT 1 FROM unnest(authors) AS author WHERE author ILIKE ${pattern}
        )
      `;
      bookWhere.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { id: { in: authorMatches.map((b) => b.id) } },
      ];
    }
    if (Object.keys(bookWhere).length > 0) where.book = bookWhere;

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, page, limit, total };
  }

  async findMine(sellerId: string) {
    return this.prisma.listing.findMany({
      where: { sellerId },
      include: LISTING_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: LISTING_INCLUDE,
    });
    if (!listing) throw new NotFoundException('Eʼlon topilmadi');
    return listing;
  }

  async update(id: string, sellerId: string, dto: UpdateListingDto) {
    await this.assertOwner(id, sellerId);
    return this.prisma.listing.update({
      where: { id },
      data: dto,
      include: LISTING_INCLUDE,
    });
  }

  async markSold(id: string, sellerId: string, dto: MarkSoldDto) {
    await this.assertOwner(id, sellerId);
    return this.prisma.listing.update({
      where: { id },
      data: { status: 'SOLD', soldToUserId: dto.soldToUserId },
      include: LISTING_INCLUDE,
    });
  }

  async hide(id: string, sellerId: string) {
    await this.assertOwner(id, sellerId);
    return this.prisma.listing.update({
      where: { id },
      data: { status: 'HIDDEN' },
    });
  }

  async addImages(id: string, sellerId: string, files: Express.Multer.File[]) {
    const listing = await this.assertOwner(id, sellerId);
    const existingCount = await this.prisma.listingImage.count({
      where: { listingId: id },
    });

    const uploads = await Promise.all(
      files.map((file) =>
        this.storageService.uploadListingImage(file.buffer, file.mimetype),
      ),
    );

    await this.prisma.listingImage.createMany({
      data: uploads.map((url, index) => ({
        listingId: listing.id,
        url,
        sortOrder: existingCount + index,
      })),
    });

    return this.findOne(id);
  }

  private async assertOwner(id: string, sellerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Eʼlon topilmadi');
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('Bu eʼlon sizga tegishli emas');
    }
    return listing;
  }
}
