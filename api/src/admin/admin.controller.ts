import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportsService } from '../reports/reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly reportsService: ReportsService) {}

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
}
