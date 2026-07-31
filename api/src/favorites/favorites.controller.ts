import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { FavoritesService } from './favorites.service';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'favorites', version: '1' })
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.list(user.id);
  }

  @Get('ids')
  listingIds(@CurrentUser() user: AuthenticatedUser) {
    return this.favoritesService.listingIds(user.id);
  }

  @Post(':listingId')
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.add(user.id, listingId);
  }

  @Delete(':listingId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.favoritesService.remove(user.id, listingId);
  }
}
