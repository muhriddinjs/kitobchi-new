import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ReportsService } from '../reports/reports.service';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { MarkSoldDto } from './dto/mark-sold.dto';
import { CreateReportDto } from '../reports/dto/create-report.dto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB per image
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller({ path: 'listings', version: '1' })
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly reportsService: ReportsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListingDto,
  ) {
    return this.listingsService.create(user.id, dto);
  }

  @Get()
  findMany(@Query() query: QueryListingsDto) {
    return this.listingsService.findMany(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listingsService.findMine(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  // Contact details are behind auth so they can't be scraped anonymously,
  // and tighter than the global limit so a single account can't walk the
  // whole catalogue collecting numbers either.
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @Get(':id/contact')
  contact(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.contact(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/buyer-candidates')
  buyerCandidates(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.listingsService.buyerCandidates(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/mark-sold')
  markSold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MarkSoldDto,
  ) {
    return this.listingsService.markSold(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('images', 6, {
      limits: { fileSize: MAX_IMAGE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Faqat JPEG, PNG yoki WebP rasm yuklash mumkin',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  addImages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.listingsService.addImages(id, user.id, files);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  hide(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.hide(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/report')
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(user.id, id, dto.reason);
  }
}
