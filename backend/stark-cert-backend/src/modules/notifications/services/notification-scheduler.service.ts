import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationStatus, NotificationPriority } from '../entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';

export interface ScheduleNotificationDto {
  userId: string;
  title: string;
  message: string;
  category: string;
  priority: NotificationPriority;
  scheduledAt: Date;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface BulkNotificationDto {
  userIds: string[];
  title: string;
  message: string;
  category: string;
  priority: NotificationPriority;
  scheduledAt?: Date;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationsService: NotificationsService,
    private preferencesService: NotificationPreferencesService,
  ) {}

  async scheduleNotification(scheduleDto: ScheduleNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...scheduleDto,
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.notificationRepository.save(notification);
  }

  async scheduleBulkNotifications(bulkDto: BulkNotificationDto): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of bulkDto.userIds) {
      const notification = this.notificationRepository.create({
        userId,
        title: bulkDto.title,
        message: bulkDto.message,
        category: bulkDto.category,
        priority: bulkDto.priority,
        scheduledAt: bulkDto.scheduledAt,
        templateId: bulkDto.templateId,
        templateData: bulkDto.templateData,
        metadata: bulkDto.metadata,
        status: NotificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      notifications.push(notification);
    }

    return await this.notificationRepository.save(notifications);
  }

  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, status: NotificationStatus.PENDING },
      { status: NotificationStatus.CANCELLED, updatedAt: new Date() },
    );
  }

  async rescheduleNotification(
    notificationId: string,
    newScheduledAt: Date,
  ): Promise<Notification> {
    await this.notificationRepository.update(
      { id: notificationId },
      { scheduledAt: newScheduledAt, updatedAt: new Date() },
    );

    return await this.notificationRepository.findOne({ where: { id: notificationId } });
  }

  async getScheduledNotifications(
    userId?: string,
    status?: NotificationStatus,
  ): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('notification');

    if (userId) {
      query.where('notification.userId = :userId', { userId });
    }

    if (status) {
      query.andWhere('notification.status = :status', { status });
    } else {
      query.andWhere('notification.status = :status', { status: NotificationStatus.PENDING });
    }

    query.andWhere('notification.scheduledAt IS NOT NULL');
    query.orderBy('notification.scheduledAt', 'ASC');

    return await query.getMany();
  }

  async getUpcomingNotifications(limit: number = 100): Promise<Notification[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

    return await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduledAt: {
          $gte: now,
          $lte: futureDate,
        } as any,
      },
      order: { scheduledAt: 'ASC' },
      take: limit,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date();
      const scheduledNotifications = await this.notificationRepository.find({
        where: {
          status: NotificationStatus.PENDING,
          scheduledAt: {
            $lte: now,
          } as any,
        },
        take: 50, // Process in batches
      });

      this.logger.log(`Processing ${scheduledNotifications.length} scheduled notifications`);

      for (const notification of scheduledNotifications) {
        try {
          // Check user preferences before sending
          const isEnabled = await this.preferencesService.isNotificationEnabled(
            notification.userId,
            'email',
            notification.category,
          );

          if (isEnabled) {
            await this.notificationsService.sendNotification(notification);
          } else {
            // Mark as cancelled if user has disabled this category
            await this.notificationRepository.update(
              { id: notification.id },
              { status: NotificationStatus.CANCELLED, updatedAt: new Date() },
            );
          }
        } catch (error) {
          this.logger.error(`Failed to process scheduled notification ${notification.id}`, error);
          
          // Update retry count and schedule retry
          const retryCount = (notification.retryCount || 0) + 1;
          const maxRetries = 3;
          
          if (retryCount < maxRetries) {
            const nextRetryAt = new Date(now.getTime() + Math.pow(2, retryCount) * 60 * 1000); // Exponential backoff
            await this.notificationRepository.update(
              { id: notification.id },
              { retryCount, nextRetryAt, updatedAt: new Date() },
            );
          } else {
            await this.notificationRepository.update(
              { id: notification.id },
              { status: NotificationStatus.FAILED, updatedAt: new Date() },
            );
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to process scheduled notifications', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.notificationRepository.delete({
        createdAt: {
          $lt: thirtyDaysAgo,
        } as any,
        status: NotificationStatus.DELIVERED,
      });

      this.logger.log(`Cleaned up ${result.affected} old notifications`);
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications', error);
    }
  }

  async sendImmediateBulkNotification(bulkDto: BulkNotificationDto): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    let success = 0;
    let failed = 0;

    for (const userId of bulkDto.userIds) {
      try {
        // Check user preferences
        const isEnabled = await this.preferencesService.isNotificationEnabled(
          userId,
          'email',
          bulkDto.category,
        );

        if (isEnabled) {
          const notification = await this.notificationsService.createNotification({
            userId,
            title: bulkDto.title,
            message: bulkDto.message,
            category: bulkDto.category,
            priority: bulkDto.priority,
            templateId: bulkDto.templateId,
            templateData: bulkDto.templateData,
            metadata: bulkDto.metadata,
          });

          await this.notificationsService.sendNotification(notification);
          success++;
        } else {
          // Count as failed if user has disabled this category
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.error(`Failed to send bulk notification to user ${userId}`, error);
      }
    }

    return { success, failed, total: bulkDto.userIds.length };
  }

  async getSchedulerStats(): Promise<{
    pendingNotifications: number;
    scheduledNotifications: number;
    failedNotifications: number;
    averageProcessingTime: number;
  }> {
    const [pending, scheduled, failed] = await Promise.all([
      this.notificationRepository.count({ where: { status: NotificationStatus.PENDING } }),
      this.notificationRepository.count({ where: { scheduledAt: { $ne: null } as any } }),
      this.notificationRepository.count({ where: { status: NotificationStatus.FAILED } }),
    ]);

    // Calculate average processing time (placeholder)
    const averageProcessingTime = 0;

    return {
      pendingNotifications: pending,
      scheduledNotifications: scheduled,
      failedNotifications: failed,
      averageProcessingTime,
    };
  }

  async retryFailedNotifications(): Promise<{
    retried: number;
    stillFailed: number;
  }> {
    const failedNotifications = await this.notificationRepository.find({
      where: { status: NotificationStatus.FAILED },
      take: 100,
    });

    let retried = 0;
    let stillFailed = 0;

    for (const notification of failedNotifications) {
      try {
        await this.notificationsService.sendNotification(notification);
        retried++;
      } catch (error) {
        stillFailed++;
        this.logger.error(`Retry failed for notification ${notification.id}`, error);
      }
    }

    return { retried, stillFailed };
  }

  async getNotificationQueueStatus(): Promise<{
    queueSize: number;
    nextScheduledTime: Date | null;
    processingRate: number;
  }> {
    const queueSize = await this.notificationRepository.count({
      where: { status: NotificationStatus.PENDING },
    });

    const nextScheduled = await this.notificationRepository.findOne({
      where: { status: NotificationStatus.PENDING },
      order: { scheduledAt: 'ASC' },
    });

    // Placeholder for processing rate
    const processingRate = 0;

    return {
      queueSize,
      nextScheduledTime: nextScheduled?.scheduledAt || null,
      processingRate,
    };
  }
} 