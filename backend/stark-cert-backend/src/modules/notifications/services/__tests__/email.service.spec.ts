import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailService, EmailOptions } from '../email.service';
import { NotificationDelivery, DeliveryStatus, DeliveryChannel } from '../../entities/notification-delivery.entity';
import { NotificationTemplate } from '../../entities/notification-template.entity';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let deliveryRepository: Repository<NotificationDelivery>;
  let templateRepository: Repository<NotificationTemplate>;
  let configService: ConfigService;

  const mockDeliveryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    })),
  };

  const mockTemplateRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTransporter = {
    verify: jest.fn(),
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getRepositoryToken(NotificationDelivery),
          useValue: mockDeliveryRepository,
        },
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: mockTemplateRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    deliveryRepository = module.get<Repository<NotificationDelivery>>(getRepositoryToken(NotificationDelivery));
    templateRepository = module.get<Repository<NotificationTemplate>>(getRepositoryToken(NotificationTemplate));
    configService = module.get<ConfigService>(ConfigService);

    // Mock nodemailer
    (nodemailer.createTransporter as jest.Mock).mockReturnValue(mockTransporter);
    mockTransporter.verify.mockResolvedValue(true);
    mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' });

    // Mock config values
    mockConfigService.get
      .mockReturnValue('smtp.gmail.com') // SMTP_HOST
      .mockReturnValue(587) // SMTP_PORT
      .mockReturnValue(false) // SMTP_SECURE
      .mockReturnValue('test@example.com') // SMTP_USER
      .mockReturnValue('password') // SMTP_PASS
      .mockReturnValue('noreply@certshield.com'); // SMTP_FROM

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize transporter with correct config', async () => {
      expect(nodemailer.createTransporter).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password',
        },
      });
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
      
      // Recreate service to trigger initialization
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: getRepositoryToken(NotificationDelivery),
            useValue: mockDeliveryRepository,
          },
          {
            provide: getRepositoryToken(NotificationTemplate),
            useValue: mockTemplateRepository,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const emailService = module.get<EmailService>(EmailService);
      
      // The service should still be created even if initialization fails
      expect(emailService).toBeDefined();
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        text: 'Test email content',
      };

      const result = await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@certshield.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        text: 'Test email content',
        attachments: undefined,
      });
      expect(result).toBe(true);
    });

    it('should send email with template', async () => {
      const mockTemplate = {
        id: 'template-123',
        subject: 'Welcome {{name}}',
        content: 'Hello {{name}}, welcome to CertShield!',
        htmlContent: '<h1>Hello {{name}}</h1><p>Welcome to CertShield!</p>',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        templateId: 'template-123',
        templateData: { name: 'John Doe' },
      };

      const result = await service.sendEmail(emailOptions);

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'template-123', type: 'email' },
      });
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@certshield.com',
        to: 'recipient@example.com',
        subject: 'Welcome John Doe',
        html: '<h1>Hello John Doe</h1><p>Welcome to CertShield!</p>',
        text: 'Hello John Doe, welcome to CertShield!',
        attachments: undefined,
      });
      expect(result).toBe(true);
    });

    it('should handle template not found', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null);

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        templateId: 'non-existent-template',
        templateData: { name: 'John Doe' },
      };

      const result = await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@certshield.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        text: undefined,
        attachments: undefined,
      });
      expect(result).toBe(true);
    });

    it('should handle email sending failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      };

      const result = await service.sendEmail(emailOptions);

      expect(result).toBe(false);
    });

    it('should send email with attachments', async () => {
      const attachments = [
        {
          filename: 'certificate.pdf',
          content: 'base64-content',
        },
      ];

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Certificate',
        html: '<h1>Your certificate</h1>',
        attachments,
      };

      const result = await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@certshield.com',
        to: 'recipient@example.com',
        subject: 'Certificate',
        html: '<h1>Your certificate</h1>',
        text: undefined,
        attachments,
      });
      expect(result).toBe(true);
    });
  });

  describe('sendBulkEmail', () => {
    it('should send bulk emails successfully', async () => {
      const emails: EmailOptions[] = [
        {
          to: 'user1@example.com',
          subject: 'Bulk Email 1',
          html: '<h1>Email 1</h1>',
        },
        {
          to: 'user2@example.com',
          subject: 'Bulk Email 2',
          html: '<h1>Email 2</h1>',
        },
      ];

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      const result = await service.sendBulkEmail(emails);

      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: 2,
        failed: 0,
      });
    });

    it('should handle failures in bulk emails', async () => {
      const emails: EmailOptions[] = [
        {
          to: 'user1@example.com',
          subject: 'Bulk Email 1',
          html: '<h1>Email 1</h1>',
        },
        {
          to: 'user2@example.com',
          subject: 'Bulk Email 2',
          html: '<h1>Email 2</h1>',
        },
      ];

      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'test-id' })
        .mockRejectedValueOnce(new Error('SMTP error'));

      const result = await service.sendBulkEmail(emails);

      expect(result).toEqual({
        success: 1,
        failed: 1,
      });
    });
  });

  describe('trackDelivery', () => {
    it('should track successful delivery', async () => {
      const mockDelivery = {
        id: 'delivery-123',
        notificationId: 'notification-123',
        channel: DeliveryChannel.EMAIL,
        recipient: 'test@example.com',
        status: DeliveryStatus.DELIVERED,
        sentAt: new Date(),
        errorMessage: null,
        deliveryData: { messageId: 'test-id' },
      };

      mockDeliveryRepository.create.mockReturnValue(mockDelivery);
      mockDeliveryRepository.save.mockResolvedValue(mockDelivery);

      const result = await service.trackDelivery(
        'notification-123',
        'test@example.com',
        true,
        undefined,
        { messageId: 'test-id' }
      );

      expect(mockDeliveryRepository.create).toHaveBeenCalledWith({
        notificationId: 'notification-123',
        channel: DeliveryChannel.EMAIL,
        recipient: 'test@example.com',
        status: DeliveryStatus.DELIVERED,
        sentAt: expect.any(Date),
        errorMessage: undefined,
        deliveryData: { messageId: 'test-id' },
      });
      expect(result).toEqual(mockDelivery);
    });

    it('should track failed delivery', async () => {
      const mockDelivery = {
        id: 'delivery-123',
        notificationId: 'notification-123',
        channel: DeliveryChannel.EMAIL,
        recipient: 'test@example.com',
        status: DeliveryStatus.FAILED,
        sentAt: null,
        errorMessage: 'SMTP error',
        deliveryData: null,
      };

      mockDeliveryRepository.create.mockReturnValue(mockDelivery);
      mockDeliveryRepository.save.mockResolvedValue(mockDelivery);

      const result = await service.trackDelivery(
        'notification-123',
        'test@example.com',
        false,
        'SMTP error'
      );

      expect(mockDeliveryRepository.create).toHaveBeenCalledWith({
        notificationId: 'notification-123',
        channel: DeliveryChannel.EMAIL,
        recipient: 'test@example.com',
        status: DeliveryStatus.FAILED,
        sentAt: null,
        errorMessage: 'SMTP error',
        deliveryData: null,
      });
      expect(result).toEqual(mockDelivery);
    });
  });

  describe('getDeliveryStats', () => {
    it('should return delivery statistics', async () => {
      const mockStats = {
        total: '100',
        delivered: '85',
        failed: '10',
        bounced: '5',
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockDeliveryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDeliveryStats();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('delivery.channel = :channel', { channel: DeliveryChannel.EMAIL });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered',
        'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed',
        'SUM(CASE WHEN status = :bounced THEN 1 ELSE 0 END) as bounced',
      ]);
      expect(result).toEqual({
        total: 100,
        delivered: 85,
        failed: 10,
        bounced: 5,
        deliveryRate: 85,
      });
    });

    it('should return delivery statistics with date range', async () => {
      const mockStats = {
        total: '50',
        delivered: '45',
        failed: '3',
        bounced: '2',
      };

      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockDeliveryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDeliveryStats(dateRange);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('delivery.createdAt BETWEEN :start AND :end', dateRange);
      expect(result).toEqual({
        total: 50,
        delivered: 45,
        failed: 3,
        bounced: 2,
        deliveryRate: 90,
      });
    });

    it('should handle zero total deliveries', async () => {
      const mockStats = {
        total: '0',
        delivered: '0',
        failed: '0',
        bounced: '0',
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockDeliveryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDeliveryStats();

      expect(result).toEqual({
        total: 0,
        delivered: 0,
        failed: 0,
        bounced: 0,
        deliveryRate: 0,
      });
    });
  });

  describe('error handling', () => {
    it('should handle transporter not initialized', async () => {
      // Mock transporter as null
      (nodemailer.createTransporter as jest.Mock).mockReturnValue(null);

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      };

      const result = await service.sendEmail(emailOptions);

      expect(result).toBe(false);
    });

    it('should handle missing SMTP configuration', async () => {
      mockConfigService.get.mockReturnValue(null);

      const emailOptions: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      };

      const result = await service.sendEmail(emailOptions);

      expect(result).toBe(false);
    });
  });
}); 