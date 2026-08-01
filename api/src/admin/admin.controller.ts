import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ReportsService } from '../reports/reports.service';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { QueryAdminListingsDto } from './dto/query-admin-listings.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly adminService: AdminService,
  ) {}

  @Get('reports')
  findOpenReports() {
    return this.reportsService.findOpen();
  }

  @Post('reports/:id/resolve')
  resolveReport(@Param('id') id: string) {
    return this.reportsService.resolve(id);
  }

  @Post('reports/:id/dismiss')
  dismissReport(@Param('id') id: string) {
    return this.reportsService.dismiss(id);
  }

  @Get('users')
  findUsers(@Query() query: QueryAdminUsersDto) {
    return this.adminService.findUsers(query);
  }

  @Post('users/:id/ban')
  banUser(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(admin.id, id, dto);
  }

  @Post('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Get('listings')
  findListings(@Query() query: QueryAdminListingsDto) {
    return this.adminService.findListings(query);
  }

  @Post('listings/:id/hide')
  hideListing(@Param('id') id: string) {
    return this.adminService.setListingHidden(id, true);
  }

  @Post('listings/:id/unhide')
  unhideListing(@Param('id') id: string) {
    return this.adminService.setListingHidden(id, false);
  }
}
