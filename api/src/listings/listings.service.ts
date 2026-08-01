import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BooksService } from '../catalog/books.service';
import { StorageService } from '../storage/storage.service';
import { LISTING_INCLUDE } from '../common/prisma-selects';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { MarkSoldDto } from './dto/mark-sold.dto';

const CANDIDATE_SELECT = { id: true, name: true, avatarUrl: true };

export interface Candidate {
  id: string;
  name: string;
  avatarUrl: string | null;
  source: 'chat' | 'contact';
}

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

  // Seller contact details, served only to logged-in users so the numbers
  // can't be harvested from the public listing endpoints. See the note on
  // SELLER_SELECT in common/prisma-selects.ts.
  async contact(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: {
        sellerId: true,
        status: true,
        seller: { select: { phone: true, telegramUsername: true } },
      },
    });
    if (!listing || listing.status === 'HIDDEN') {
      throw new NotFoundException('Eʼlon topilmadi');
    }

    // Remember who asked, so the seller has someone to attribute the sale
    // to when the deal happens over the phone rather than in site chat.
    // The seller looking at their own listing isn't a lead.
    if (listing.sellerId !== userId) {
      await this.prisma.listingContactView.upsert({
        where: { listingId_userId: { listingId: id, userId } },
        update: {},
        create: { listingId: id, userId },
      });
    }

    return listing.seller;
  }

  // Everyone who showed concrete interest in this listing: opened a chat
  // about it, or asked for the seller's number. This is the set the seller
  // picks from when marking the listing sold.
  async buyerCandidates(id: string, sellerId: string) {
    await this.assertOwner(id, sellerId);

    const [conversations, contactViews] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { listingId: id },
        select: { buyer: { select: CANDIDATE_SELECT } },
      }),
      this.prisma.listingContactView.findMany({
        where: { listingId: id },
        select: { user: { select: CANDIDATE_SELECT } },
      }),
    ]);

    const byId = new Map<string, Candidate>();
    for (const { buyer } of conversations) {
      byId.set(buyer.id, { ...buyer, source: 'chat' });
    }
    for (const { user } of contactViews) {
      // Someone who did both is a stronger lead — chat wins as the label.
      if (!byId.has(user.id)) byId.set(user.id, { ...user, source: 'contact' });
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
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
    const listing = await this.assertOwner(id, sellerId);
    if (listing.status === 'SOLD') {
      throw new BadRequestException(
        'Bu eʼlon allaqachon sotilgan deb belgilangan',
      );
    }

    // Recording a buyer is optional (the sale may have gone to someone with
    // no account), but if one is named it has to be a real user who
    // actually showed interest — otherwise the review permission it grants
    // could be handed to anyone, including an account the seller controls.
    if (dto.soldToUserId) {
      if (dto.soldToUserId === sellerId) {
        throw new BadRequestException(
          'Xaridor sifatida oʻzingizni tanlay olmaysiz',
        );
      }
      const candidates = await this.buyerCandidates(id, sellerId);
      if (!candidates.some((c) => c.id === dto.soldToUserId)) {
        throw new BadRequestException(
          'Bu foydalanuvchi eʼlon boʻyicha siz bilan bogʻlanmagan',
        );
      }
    }

    return this.prisma.listing.update({
      where: { id },
      data: { status: 'SOLD', soldToUserId: dto.soldToUserId ?? null },
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
