import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType, NotificationPriority } from '../entities/notification.entity';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationAnalyticsService } from './notification-analytics.service';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  category: string;
  priority?: NotificationPriority;
  type?: NotificationType;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
  recipients?: {
    email?: string;
    phone?: string;
  };
  scheduledAt?: Date;
}

export interface SendNotificationDto {
  userId: string;
  title: string;
  message: string;
  category: string;
  priority?: NotificationPriority;
  channels?: NotificationType[];
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
  recipients?: {
    email?: string;
    phone?: string;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private smsService: SmsService,
    private inAppNotificationService: InAppNotificationService,
    private templateService: NotificationTemplateService,
    private preferencesService: NotificationPreferencesService,
    private analyticsService: NotificationAnalyticsService,
  ) {}

  async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createDto,
      priority: createDto.priority || NotificationPriority.NORMAL,
      type: createDto.type || NotificationType.IN_APP,
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.notificationRepository.save(notification);
  }

  async sendNotification(notification: Notification): Promise<boolean> {
    try {
      this.logger.log(`Sending notification ${notification.id} to user ${notification.userId}`);

      // Get user preferences
      const preferences = await this.preferencesService.getPreference(notification.userId);
      
      // Determine which channels to use
      const channels: NotificationType[] = [];
      
      if (preferences.emailEnabled && await this.preferencesService.isNotificationEnabled(
        notification.userId, 'email', notification.category
      )) {
        channels.push(NotificationType.EMAIL);
      }
      
      if (preferences.smsEnabled && await this.preferencesService.isNotificationEnabled(
        notification.userId, 'sms', notification.category
      )) {
        channels.push(NotificationType.SMS);
      }
      
      if (preferences.inAppEnabled && await this.preferencesService.isNotificationEnabled(
        notification.userId, 'in_app', notification.category
      )) {
        channels.push(NotificationType.IN_APP);
      }

      // Send through each enabled channel
      const results = await Promise.allSettled(
        channels.map(channel => this.sendToChannel(notification, channel))
      );

      // Track analytics
      await this.analyticsService.trackNotificationEvent(notification.id, 'sent');

      // Update notification status
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const newStatus = successCount > 0 ? NotificationStatus.SENT : NotificationStatus.FAILED;
      
      await this.notificationRepository.update(
        { id: notification.id },
        { 
          status: newStatus,
          sentAt: new Date(),
          updatedAt: new Date(),
        }
      );

      this.logger.log(`Notification ${notification.id} sent through ${successCount}/${channels.length} channels`);
      return successCount > 0;
    } catch (error) {
      this.logger.error(`Failed to send notification ${notification.id}`, error);
      
      await this.notificationRepository.update(
        { id: notification.id },
        { 
          status: NotificationStatus.FAILED,
          errorMessage: error.message,
          updatedAt: new Date(),
        }
      );
      
      return false;
    }
  }

  private async sendToChannel(notification: Notification, channel: NotificationType): Promise<boolean> {
    try {
      switch (channel) {
        case NotificationType.EMAIL:
          return await this.sendEmailNotification(notification);
        case NotificationType.SMS:
          return await this.sendSmsNotification(notification);
        case NotificationType.IN_APP:
          return await this.sendInAppNotification(notification);
        default:
          this.logger.warn(`Unsupported channel: ${channel}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send notification to channel ${channel}`, error);
      return false;
    }
  }

  private async sendEmailNotification(notification: Notification): Promise<boolean> {
    try {
      let emailContent = notification.message;
      let subject = notification.title;

      // Use template if specified
      if (notification.templateId) {
        const rendered = await this.templateService.renderTemplate(
          notification.templateId,
          notification.templateData || {}
        );
        emailContent = rendered.content;
        subject = rendered.subject || notification.title;
      }

      const emailOptions = {
        to: notification.recipients?.email,
        subject,
        html: emailContent,
        templateId: notification.templateId,
        templateData: notification.templateData,
      };

      const success = await this.emailService.sendEmail(emailOptions);
      
      if (success) {
        await this.analyticsService.trackNotificationEvent(notification.id, 'delivered', {
          channel: 'email',
          recipient: notification.recipients?.email,
        });
      }

      return success;
    } catch (error) {
      this.logger.error(`Email notification failed for ${notification.id}`, error);
      return false;
    }
  }

  private async sendSmsNotification(notification: Notification): Promise<boolean> {
    try {
      let message = notification.message;

      // Use template if specified
      if (notification.templateId) {
        const rendered = await this.templateService.renderTemplate(
          notification.templateId,
          notification.templateData || {}
        );
        message = rendered.content;
      }

      const smsOptions = {
        to: notification.recipients?.phone,
        message,
        templateId: notification.templateId,
        templateData: notification.templateData,
      };

      const success = await this.smsService.sendSms(smsOptions);
      
      if (success) {
        await this.analyticsService.trackNotificationEvent(notification.id, 'delivered', {
          channel: 'sms',
          recipient: notification.recipients?.phone,
        });
      }

      return success;
    } catch (error) {
      this.logger.error(`SMS notification failed for ${notification.id}`, error);
      return false;
    }
  }

  private async sendInAppNotification(notification: Notification): Promise<boolean> {
    try {
      const success = await this.inAppNotificationService.sendNotification({
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        metadata: notification.metadata,
      });

      if (success) {
        await this.analyticsService.trackNotificationEvent(notification.id, 'delivered', {
          channel: 'in_app',
        });
      }

      return success;
    } catch (error) {
      this.logger.error(`In-app notification failed for ${notification.id}`, error);
      return false;
    }
  }

  async sendBulkNotifications(sendDto: SendNotificationDto): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    let success = 0;
    let failed = 0;

    // Get all users who should receive this notification
    const userIds = await this.preferencesService.getUsersByCategory(sendDto.category);
    
    for (const userId of userIds) {
      try {
        const notification = await this.createNotification({
          userId,
          title: sendDto.title,
          message: sendDto.message,
          category: sendDto.category,
          priority: sendDto.priority,
          templateId: sendDto.templateId,
          templateData: sendDto.templateData,
          metadata: sendDto.metadata,
          recipients: sendDto.recipients,
        });

        const result = await this.sendNotification(notification);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.error(`Failed to send bulk notification to user ${userId}`, error);
      }
    }

    return { success, failed, total: userIds.length };
  }

  async getNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: NotificationStatus;
      category?: string;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, status, category, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const query = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    if (category) {
      query.andWhere('notification.category = :category', { category });
    }

    if (unreadOnly) {
      query.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    query.orderBy('notification.createdAt', 'DESC');

    const [notifications, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { notifications, total };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { 
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      }
    );

    await this.analyticsService.trackNotificationEvent(notificationId, 'opened');
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { 
        isArchived: true,
        updatedAt: new Date(),
      }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false, isArchived: false },
    });
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    read: number;
    archived: number;
    deliveryRate: number;
  }> {
    const [total, unread, read, archived] = await Promise.all([
      this.notificationRepository.count({ where: { userId } }),
      this.notificationRepository.count({ where: { userId, isRead: false, isArchived: false } }),
      this.notificationRepository.count({ where: { userId, isRead: true } }),
      this.notificationRepository.count({ where: { userId, isArchived: true } }),
    ]);

    const deliveryStats = await this.analyticsService.getDeliveryStats({ userId });

    return {
      total,
      unread,
      read,
      archived,
      deliveryRate: deliveryStats.deliveryRate,
    };
  }

  async sendCertificateNotification(
    userId: string,
    certificateId: string,
    certificateName: string,
    event: 'issued' | 'verified' | 'revoked' | 'expired',
    additionalData?: Record<string, any>
  ): Promise<Notification> {
    const eventTemplates = {
      issued: {
        title: 'Certificate Issued',
        message: `Your certificate "${certificateName}" has been issued successfully.`,
        category: 'certificate_issued',
        templateId: 'certificate-issued-template',
      },
      verified: {
        title: 'Certificate Verified',
        message: `Your certificate "${certificateName}" has been verified.`,
        category: 'certificate_verified',
        templateId: 'certificate-verified-template',
      },
      revoked: {
        title: 'Certificate Revoked',
        message: `Your certificate "${certificateName}" has been revoked.`,
        category: 'certificate_revoked',
        templateId: 'certificate-revoked-template',
      },
      expired: {
        title: 'Certificate Expired',
        message: `Your certificate "${certificateName}" has expired.`,
        category: 'certificate_expired',
        templateId: 'certificate-expired-template',
      },
    };

    const template = eventTemplates[event];
    const templateData = {
      certificateId,
      certificateName,
      ...additionalData,
    };

    const notification = await this.createNotification({
      userId,
      title: template.title,
      message: template.message,
      category: template.category,
      priority: event === 'revoked' ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
      templateId: template.templateId,
      templateData,
      metadata: {
        certificateId,
        certificateName,
        event,
        ...additionalData,
      },
    });

    await this.sendNotification(notification);
    return notification;
  }

  async sendSystemNotification(
    userIds: string[],
    title: string,
    message: string,
    category: string = 'system_maintenance',
    priority: NotificationPriority = NotificationPriority.NORMAL
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const notification = await this.createNotification({
          userId,
          title,
          message,
          category,
          priority,
        });

        const result = await this.sendNotification(notification);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.error(`Failed to send system notification to user ${userId}`, error);
      }
    }

    return { success, failed };
  }
} 