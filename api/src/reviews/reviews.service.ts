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

    // Only the buyer the seller actually recorded may review. The previous
    // fallback — anyone who had opened a conversation about the listing —
    // meant a rating could be moved by sending a single message, which is
    // no basis for a rating buyers are meant to trust.
    if (!listing.soldToUserId) {
      throw new ForbiddenException(
        'Sotuvchi bu eʼlon boʻyicha xaridorni qayd etmagan',
      );
    }
    if (listing.soldToUserId !== reviewerId) {
      throw new ForbiddenException('Bu eʼlonning xaridori emassiz');
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

  // Lets the listing page decide whether to offer the review form at all,
  // without putting `soldToUserId` into the public listing payload — who
  // bought a book isn't everyone's business.
  async canReview(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { status: true, soldToUserId: true },
    });
    if (!listing) throw new NotFoundException('Eʼlon topilmadi');

    if (listing.status !== 'SOLD' || listing.soldToUserId !== userId) {
      return { canReview: false };
    }

    const existing = await this.prisma.review.findUnique({
      where: { listingId_reviewerId: { listingId, reviewerId: userId } },
    });

    return { canReview: !existing };
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
