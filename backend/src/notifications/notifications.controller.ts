import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/types';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  getUserNotifications(@Request() req: RequestWithUser) {
    return this.service.getUserNotifications(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: RequestWithUser) {
    return this.service.markAllAsRead(req.user.id);
  }
}
