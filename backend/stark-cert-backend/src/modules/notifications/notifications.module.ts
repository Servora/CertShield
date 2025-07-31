import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { InAppNotificationService } from './services/in-app-notification.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { NotificationAnalyticsService } from './services/notification-analytics.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { NotificationAnalytics } from './entities/notification-analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      NotificationPreference,
      NotificationDelivery,
      NotificationAnalytics,
    ]),
    ConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    InAppNotificationService,
    NotificationTemplateService,
    NotificationPreferencesService,
    NotificationSchedulerService,
    NotificationAnalyticsService,
    NotificationGateway,
  ],
  exports: [
    NotificationsService,
    EmailService,
    SmsService,
    InAppNotificationService,
    NotificationTemplateService,
    NotificationPreferencesService,
    NotificationSchedulerService,
    NotificationAnalyticsService,
    NotificationGateway,
  ],
})
export class NotificationsModule {} 