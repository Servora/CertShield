import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDelivery, DeliveryStatus, DeliveryChannel } from '../entities/notification-delivery.entity';
import { Notification } from '../entities/notification.entity';

export interface InAppNotificationOptions {
  userId: string;
  title: string;
  message: string;
  category: string;
  priority?: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
}

@Injectable()
export class InAppNotificationService {
  private readonly logger = new Logger(InAppNotificationService.name);
  private connectedUsers: Map<string, any> = new Map();

  constructor(
    @InjectRepository(NotificationDelivery)
    private deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(options: InAppNotificationOptions): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: options.userId,
      title: options.title,
      message: options.message,
      type: 'in_app',
      category: options.category,
      priority: options.priority || 'normal',
      metadata: options.metadata,
      status: 'pending',
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Send real-time notification if user is connected
    await this.sendRealTimeNotification(options.userId, savedNotification);

    return savedNotification;
  }

  async sendRealTimeNotification(userId: string, notification: Notification): Promise<void> {
    try {
      const userSocket = this.connectedUsers.get(userId);
      if (userSocket) {
        userSocket.emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          category: notification.category,
          priority: notification.priority,
          createdAt: notification.createdAt,
          metadata: notification.metadata,
        });
        
        this.logger.log(`Real-time notification sent to user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send real-time notification to user ${userId}`, error);
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      return await this.notificationRepository.save(notification);
    }

    throw new Error('Notification not found');
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      category?: string;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, unreadOnly = false, category } = options;
    const skip = (page - 1) * limit;

    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.type = :type', { type: 'in_app' });

    if (unreadOnly) {
      query.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    if (category) {
      query.andWhere('notification.category = :category', { category });
    }

    const [notifications, total] = await query
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, type: 'in_app', isRead: false },
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
  }

  async archiveNotification(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (notification) {
      notification.isArchived = true;
      return await this.notificationRepository.save(notification);
    }

    throw new Error('Notification not found');
  }

  async trackDelivery(
    notificationId: string,
    userId: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<NotificationDelivery> {
    const delivery = this.deliveryRepository.create({
      notificationId,
      channel: DeliveryChannel.IN_APP,
      recipient: userId,
      status: success ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
      sentAt: success ? new Date() : null,
      errorMessage,
    });

    return await this.deliveryRepository.save(delivery);
  }

  // WebSocket connection management
  addUserConnection(userId: string, socket: any): void {
    this.connectedUsers.set(userId, socket);
    this.logger.log(`User ${userId} connected to notifications`);
  }

  removeUserConnection(userId: string): void {
    this.connectedUsers.delete(userId);
    this.logger.log(`User ${userId} disconnected from notifications`);
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  async getDeliveryStats(dateRange?: { start: Date; end: Date }) {
    const query = this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.channel = :channel', { channel: DeliveryChannel.IN_APP });

    if (dateRange) {
      query.andWhere('delivery.createdAt BETWEEN :start AND :end', dateRange);
    }

    const stats = await query
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered',
        'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed',
      ])
      .setParameters({
        delivered: DeliveryStatus.DELIVERED,
        failed: DeliveryStatus.FAILED,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total),
      delivered: parseInt(stats.delivered),
      failed: parseInt(stats.failed),
      deliveryRate: stats.total > 0 ? (parseInt(stats.delivered) / parseInt(stats.total)) * 100 : 0,
    };
  }
} 