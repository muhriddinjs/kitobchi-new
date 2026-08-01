import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LISTING_INCLUDE } from '../common/prisma-selects';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminListingsDto } from './dto/query-admin-listings.dto';
import { BanUserDto } from './dto/ban-user.dto';

const ADMIN_USER_SELECT = {
  id: true,
  name: true,
  // Admins moderating a marketplace need to be able to identify accounts,
  // so unlike the public selects this one keeps the phone.
  phone: true,
  role: true,
  bannedAt: true,
  banReason: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
  _count: { select: { listings: true } },
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findUsers(query: QueryAdminUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.UserWhereInput = {};
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
      ];
    }
    if (query.banned === true) where.bannedAt = { not: null };
    if (query.banned === false) where.bannedAt = null;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: ADMIN_USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, page, limit, total };
  }

  // Banning also hides everything the account currently has listed —
  // otherwise the listings stay up and the ban only stops them logging in.
  async banUser(adminId: string, userId: string, dto: BanUserDto) {
    if (userId === adminId) {
      throw new BadRequestException('Oʻzingizni bloklay olmaysiz');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Administratorni bloklab boʻlmaydi');
    }
    if (user.bannedAt) {
      throw new BadRequestException('Bu foydalanuvchi allaqachon bloklangan');
    }

    return this.prisma.$transaction(async (tx) => {
      const banned = await tx.user.update({
        where: { id: userId },
        data: { bannedAt: new Date(), banReason: dto.reason },
        select: ADMIN_USER_SELECT,
      });

      const { count } = await tx.listing.updateMany({
        where: { sellerId: userId, status: { in: ['ACTIVE', 'RESERVED'] } },
        data: { status: 'HIDDEN' },
      });

      return { user: banned, hiddenListings: count };
    });
  }

  // Deliberately does not un-hide the listings that banning hid: after a ban
  // the listings should be reviewed individually, not restored in bulk.
  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (!user.bannedAt) {
      throw new BadRequestException('Bu foydalanuvchi bloklanmagan');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { bannedAt: null, banReason: null },
      select: ADMIN_USER_SELECT,
    });
  }

  // Unlike the public browse, this sees every status including HIDDEN —
  // that's the point, so moderation can be proactive instead of only
  // reacting to whatever gets reported.
  async findListings(query: QueryAdminListingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ListingWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.q) {
      where.book = {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { isbn: { contains: query.q } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: LISTING_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, page, limit, total };
  }

  async setListingHidden(id: string, hidden: boolean) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Eʼlon topilmadi');

    return this.prisma.listing.update({
      where: { id },
      data: { status: hidden ? 'HIDDEN' : 'ACTIVE' },
      include: LISTING_INCLUDE,
    });
  }
}
