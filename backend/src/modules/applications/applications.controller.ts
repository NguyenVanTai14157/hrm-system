import { Controller, Get, Post, Body, Patch, Param, Query, Request, Delete } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@Body() data: { employeeId: string; type: string; reason?: string; description?: string; payload: any }) {
    return this.applicationsService.create(data);
  }

  @Get('stats')
  getStats(@Query('employeeId') employeeId?: string) {
    return this.applicationsService.getStats(employeeId);
  }

  @Get('dashboard-cards')
  getDashboardCards(
    @Query('employeeId') employeeId?: string,
    @Query('isAdmin') isAdmin?: string,
  ) {
    return this.applicationsService.getDashboardCards(employeeId, isAdmin === 'true');
  }

  @Get()
  findAll(@Query() query: { status?: string; type?: string; employeeId?: string }) {
    return this.applicationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Request() req: any, @Body() body: { comment?: string; isBypass?: boolean }) {
    const approverId = req.auth?.user?.id ?? 'admin';
    return this.applicationsService.updateStatus(id, 'APPROVED', approverId, body?.comment, body?.isBypass);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Request() req: any, @Body() body: { comment?: string }) {
    const approverId = req.auth?.user?.id ?? 'admin';
    return this.applicationsService.updateStatus(id, 'REJECTED', approverId, body?.comment);
  }

  @Patch(':id/revert')
  revert(@Param('id') id: string) {
    return this.applicationsService.revertStatus(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }
}

