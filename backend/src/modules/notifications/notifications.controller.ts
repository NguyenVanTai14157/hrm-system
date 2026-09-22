import { Controller, Get, Patch, Param, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Request() req: any) {
    const userId = req.auth?.user?.id ?? 'admin';
    const items = await this.notificationsService.findAllForUser(userId);
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    return { items, unreadCount };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.auth?.user?.id ?? 'admin';
    await this.notificationsService.markAsRead(id, userId);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.auth?.user?.id ?? 'admin';
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }
}
