import { Controller, Get, Post, Patch, Delete, Param, Body, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post()
  async create(@Body() body: { username: string; employeeId?: string; displayName?: string; password?: string; roleName?: string }) {
    return this.usersService.create(body);
  }

  // Đặt trước @Delete(':id') để tránh bị shadow bởi route tổng quát
  @Delete('employee/:employeeId')
  async removeEmployeeAndUser(@Param('employeeId') employeeId: string) {
    return this.usersService.removeEmployeeAndUser(employeeId);
  }

  // Bulk delete - đặt trước @Delete(':id')
  @Post('bulk-delete')
  async bulkRemove(@Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Danh sách ID không hợp lệ hoặc rỗng.');
    }
    return this.usersService.bulkRemove(ids);
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('roleName') roleName: string) {
    return this.usersService.updateRole(id, roleName);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: 'ACTIVE' | 'LOCKED') {
    return this.usersService.updateStatus(id, status);
  }

  @Post(':id/send-password')
  async sendPassword(@Param('id') id: string) {
    return this.usersService.sendPassword(id);
  }

  @Post(':id/change-password')
  async changePassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
    return this.usersService.changePassword(id, newPassword);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
