import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { NotificationDelivery, DeliveryStatus, DeliveryChannel } from '../entities/notification-delivery.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: any[];
  templateId?: string;
  templateData?: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectRepository(NotificationDelivery)
    private deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
  ) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    const emailConfig = {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransporter(emailConfig);
    
    // Verify connection
    try {
      await this.transporter.verify();
      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let { html, text, subject } = options;

      // If template is provided, render it
      if (options.templateId) {
        const template = await this.templateRepository.findOne({
          where: { id: options.templateId, type: 'email' },
        });

        if (template) {
          const compiledTemplate = handlebars.compile(template.htmlContent || template.content);
          html = compiledTemplate(options.templateData || {});
          subject = template.subject;
        }
      }

      const mailOptions = {
        from: options.from || this.configService.get('SMTP_FROM'),
        to: options.to,
        subject,
        html,
        text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      return false;
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        this.logger.error(`Bulk email failed for ${email.to}`, error);
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
      channel: DeliveryChannel.EMAIL,
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
      .where('delivery.channel = :channel', { channel: DeliveryChannel.EMAIL });

    if (dateRange) {
      query.andWhere('delivery.createdAt BETWEEN :start AND :end', dateRange);
    }

    const stats = await query
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered',
        'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed',
        'SUM(CASE WHEN status = :bounced THEN 1 ELSE 0 END) as bounced',
      ])
      .setParameters({
        delivered: DeliveryStatus.DELIVERED,
        failed: DeliveryStatus.FAILED,
        bounced: DeliveryStatus.BOUNCED,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total),
      delivered: parseInt(stats.delivered),
      failed: parseInt(stats.failed),
      bounced: parseInt(stats.bounced),
      deliveryRate: stats.total > 0 ? (parseInt(stats.delivered) / parseInt(stats.total)) * 100 : 0,
    };
  }
} 