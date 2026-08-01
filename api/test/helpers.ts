import { randomUUID } from 'crypto';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { INestApplication } from '@nestjs/common';
import type {
  Listing,
  ListingStatus,
  Prisma,
  User,
  UserRole,
} from '@prisma/client';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app-setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * These suites run against the same Postgres the app uses, and against
 * whatever data already happens to be in it. So every fixture gets a random
 * id and a random phone, and teardown deletes exactly the rows it created —
 * never a truncate, which would wipe a developer's local data.
 */
export class TestHarness {
  private readonly userIds: string[] = [];
  private readonly listingIds: string[] = [];
  private readonly bookIds: string[] = [];
  private readonly jwt = new JwtService();

  constructor(
    readonly app: INestApplication,
    readonly prisma: PrismaService,
  ) {}

  static async create(): Promise<TestHarness> {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Every request in a suite comes from the same address, so the per-IP
      // limits would start rejecting partway through and make results depend
      // on how many assertions a file happens to make. Rate limiting isn't
      // what these suites are checking.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    const app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    return new TestHarness(app, app.get(PrismaService));
  }

  server(): unknown {
    return this.app.getHttpServer();
  }

  /**
   * Mints an access token directly instead of driving the OTP flow, which
   * would need a live Redis. Same secret and same claims the real
   * AuthService issues, so JwtStrategy treats it identically.
   */
  token(userId: string): string {
    return this.jwt.sign(
      { sub: userId, phone: 'test', role: 'USER', type: 'access' },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
  }

  async createUser(
    data: Partial<Prisma.UserCreateInput> & { role?: UserRole } = {},
  ): Promise<User> {
    const id = randomUUID();
    const user = await this.prisma.user.create({
      data: {
        id,
        // Random 9-digit local part: unique per fixture, valid shape.
        phone: `+998${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`,
        name: `Test ${id.slice(0, 8)}`,
        ...data,
      },
    });
    this.userIds.push(user.id);
    return user;
  }

  async createBook(): Promise<string> {
    const book = await this.prisma.book.create({
      data: { title: `Test kitob ${randomUUID().slice(0, 8)}`, authors: [] },
    });
    this.bookIds.push(book.id);
    return book.id;
  }

  async createListing(
    sellerId: string,
    data: { status?: ListingStatus; price?: number; bookId?: string } = {},
  ): Promise<Listing> {
    const bookId = data.bookId ?? (await this.createBook());
    const listing = await this.prisma.listing.create({
      data: {
        bookId,
        sellerId,
        type: 'SALE',
        price: data.price ?? 25000,
        condition: 'GOOD',
        status: data.status ?? 'ACTIVE',
        city: 'Toshkent',
      },
    });
    this.listingIds.push(listing.id);
    return listing;
  }

  /** Deletes only this run's rows, children first. */
  async teardown(): Promise<void> {
    const listingIds = { in: this.listingIds };
    const userIds = { in: this.userIds };

    await this.prisma.message.deleteMany({
      where: { conversation: { listingId: listingIds } },
    });
    await this.prisma.conversation.deleteMany({
      where: { listingId: listingIds },
    });
    await this.prisma.review.deleteMany({ where: { listingId: listingIds } });
    await this.prisma.listingContactView.deleteMany({
      where: { listingId: listingIds },
    });
    await this.prisma.favorite.deleteMany({ where: { listingId: listingIds } });
    await this.prisma.report.deleteMany({ where: { listingId: listingIds } });
    await this.prisma.listingImage.deleteMany({
      where: { listingId: listingIds },
    });
    await this.prisma.listing.deleteMany({ where: { id: listingIds } });
    await this.prisma.user.deleteMany({ where: { id: userIds } });
    await this.prisma.book.deleteMany({ where: { id: { in: this.bookIds } } });

    await this.app.close();
  }
}

export const bearer = (token: string): [string, string] => [
  'Authorization',
  `Bearer ${token}`,
];
