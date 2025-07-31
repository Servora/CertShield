import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as twilio from 'twilio';
import { NotificationDelivery, DeliveryStatus, DeliveryChannel } from '../entities/notification-delivery.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';

export interface SmsOptions {
  to: string;
  message: string;
  from?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: twilio.Twilio;

  constructor(
    private configService: ConfigService,
    @InjectRepository(NotificationDelivery)
    private deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
  ) {
    this.initializeClient();
  }

  private initializeClient() {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      this.logger.log('SMS service initialized successfully');
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  async sendSms(options: SmsOptions): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized');
      }

      let { message } = options;

      // If template is provided, render it
      if (options.templateId) {
        const template = await this.templateRepository.findOne({
          where: { id: options.templateId, type: 'sms' },
        });

        if (template) {
          // Simple template replacement for SMS
          let templateMessage = template.content;
          if (options.templateData) {
            Object.keys(options.templateData).forEach(key => {
              templateMessage = templateMessage.replace(`{{${key}}}`, options.templateData[key]);
            });
          }
          message = templateMessage;
        }
      }

      const twilioOptions = {
        body: message,
        from: options.from || this.configService.get('TWILIO_PHONE_NUMBER'),
        to: options.to,
      };

      const result = await this.client.messages.create(twilioOptions);
      
      this.logger.log(`SMS sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${options.to}`, error);
      return false;
    }
  }

  async sendBulkSms(smsList: SmsOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const sms of smsList) {
      try {
        const result = await this.sendSms(sms);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.error(`Bulk SMS failed for ${sms.to}`, error);
      }
    }

    return { success, failed };
  }

  async trackDelivery(
    notificationId: string,
    recipient: string,
    success: boolean,
    errorMessage?: string,
    deliveryData?: any,
  ): Promise<NotificationDelivery> {
    const delivery = this.deliveryRepository.create({
      notificationId,
      channel: DeliveryChannel.SMS,
      recipient,
      status: success ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
      sentAt: success ? new Date() : null,
      errorMessage,
      deliveryData,
    });

    return await this.deliveryRepository.save(delivery);
  }

  async getDeliveryStats(dateRange?: { start: Date; end: Date }) {
    const query = this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.channel = :channel', { channel: DeliveryChannel.SMS });

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

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Basic phone number validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
    } catch (error) {
      this.logger.error('Phone number validation failed', error);
      return false;
    }
  }
} 