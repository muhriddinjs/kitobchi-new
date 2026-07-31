import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LISTING_INCLUDE } from '../listings/listings.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.status === 'HIDDEN') {
      throw new NotFoundException('Eʼlon topilmadi');
    }

    // Idempotent: favoriting twice is a no-op, not an error.
    return this.prisma.favorite.upsert({
      where: { userId_listingId: { userId, listingId } },
      update: {},
      create: { userId, listingId },
    });
  }

  async remove(userId: string, listingId: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId, listingId },
    });
    return { ok: true };
  }

  // Lightweight id list so the client can mark hearts without pulling
  // every favorited listing's full payload.
  async listingIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      select: { listingId: true },
    });
    return rows.map((r) => r.listingId);
  }

  async list(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId, listing: { status: { not: 'HIDDEN' } } },
      include: { listing: { include: LISTING_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.listing);
  }
}
