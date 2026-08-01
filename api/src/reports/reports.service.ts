import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REPORT_INCLUDE = {
  listing: {
    include: {
      book: true,
      seller: { select: { id: true, name: true } },
    },
  },
  reporter: { select: { id: true, name: true, phone: true } },
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, listingId: string, reason: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Eʼlon topilmadi');

    return this.prisma.report.create({
      data: { reporterId, listingId, reason },
    });
  }

  async findOpen() {
    return this.prisma.report.findMany({
      where: { status: 'OPEN' },
      include: REPORT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: string) {
    const report = await this.assertExists(id);

    return this.prisma.$transaction(async (tx) => {
      // A moderation takedown, so the seller can't quietly put it back up.
      await tx.listing.update({
        where: { id: report.listingId },
        data: { status: 'HIDDEN', moderatedAt: new Date() },
      });
      return tx.report.update({
        where: { id },
        data: { status: 'ACTIONED' },
      });
    });
  }

  async dismiss(id: string) {
    await this.assertExists(id);
    return this.prisma.report.update({
      where: { id },
      data: { status: 'REVIEWED' },
    });
  }

  private async assertExists(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Shikoyat topilmadi');
    return report;
  }
}
