import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reviewerId: string, listingId: string, dto: CreateReviewDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Eʼlon topilmadi');
    if (listing.sellerId === reviewerId) {
      throw new BadRequestException('Oʻz eʼloningizni baholab boʻlmaydi');
    }
    if (listing.status !== 'SOLD') {
      throw new BadRequestException(
        'Faqat sotilgan eʼlon boʻyicha baho berish mumkin',
      );
    }

    // Who counts as "the buyer": the explicitly recorded one if the seller
    // set it on mark-sold, otherwise anyone who had a conversation about
    // this listing (the pragmatic MVP rule).
    if (listing.soldToUserId) {
      if (listing.soldToUserId !== reviewerId) {
        throw new ForbiddenException('Bu eʼlonning xaridori emassiz');
      }
    } else {
      const conversation = await this.prisma.conversation.findUnique({
        where: { listingId_buyerId: { listingId, buyerId: reviewerId } },
      });
      if (!conversation) {
        throw new ForbiddenException(
          'Baho berish uchun sotuvchi bilan shu eʼlon boʻyicha suhbatingiz boʻlishi kerak',
        );
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            listingId,
            reviewerId,
            revieweeId: listing.sellerId,
            rating: dto.rating,
            comment: dto.comment ?? null,
          },
          include: { reviewer: { select: { id: true, name: true } } },
        });

        // Keep the denormalized rating on the seller in sync.
        const agg = await tx.review.aggregate({
          where: { revieweeId: listing.sellerId },
          _avg: { rating: true },
          _count: true,
        });
        await tx.user.update({
          where: { id: listing.sellerId },
          data: {
            ratingAvg: agg._avg.rating ?? 0,
            ratingCount: agg._count,
          },
        });

        return review;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException('Bu eʼlonni allaqachon baholagansiz');
      }
      throw err;
    }
  }

  async listForUser(userId: string) {
    return this.prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        listing: {
          select: { id: true, book: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
