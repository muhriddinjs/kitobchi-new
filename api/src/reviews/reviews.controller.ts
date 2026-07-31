import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller({ version: '1' })
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('listings/:id/reviews')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') listingId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, listingId, dto);
  }

  @Get('users/:id/reviews')
  listForUser(@Param('id') userId: string) {
    return this.reviewsService.listForUser(userId);
  }
}
