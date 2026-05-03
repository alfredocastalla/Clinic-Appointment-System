import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    user: User,
    title: string,
    message: string,
    type: NotificationType,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user,
      title,
      message,
      type,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user: { id: userId } },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
  }

  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    await this.notificationRepository.delete({
      id: notificationId,
      user: { id: userId },
    });
  }
}
