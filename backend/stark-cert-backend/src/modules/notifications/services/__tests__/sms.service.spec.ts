import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SmsService, SmsOptions } from '../sms.service';
import { NotificationDelivery, DeliveryStatus, DeliveryChannel } from '../../entities/notification-delivery.entity';
import { NotificationTemplate } from '../../entities/notification-template.entity';
import * as twilio from 'twilio';

jest.mock('twilio');

describe('SmsService', () => {
  let service: SmsService;
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

  const mockTwilioClient = {
    messages: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
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

    service = module.get<SmsService>(SmsService);
    deliveryRepository = module.get<Repository<NotificationDelivery>>(getRepositoryToken(NotificationDelivery));
    templateRepository = module.get<Repository<NotificationTemplate>>(getRepositoryToken(NotificationTemplate));
    configService = module.get<ConfigService>(ConfigService);

    // Mock twilio
    (twilio as jest.Mocked<typeof twilio>).mockReturnValue(mockTwilioClient);
    mockTwilioClient.messages.create.mockResolvedValue({ sid: 'test-message-sid' });

    // Mock config values
    mockConfigService.get
      .mockReturnValue('test-account-sid') // TWILIO_ACCOUNT_SID
      .mockReturnValue('test-auth-token') // TWILIO_AUTH_TOKEN
      .mockReturnValue('+1234567890'); // TWILIO_PHONE_NUMBER

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize twilio client with correct credentials', () => {
      expect(twilio).toHaveBeenCalledWith('test-account-sid', 'test-auth-token');
    });

    it('should handle missing twilio credentials', () => {
      mockConfigService.get.mockReturnValue(null);

      // Recreate service to trigger initialization
      const module: TestingModule = Test.createTestingModule({
        providers: [
          SmsService,
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

      const smsService = module.get<SmsService>(SmsService);
      expect(smsService).toBeDefined();
    });
  });

  describe('sendSms', () => {
    it('should send SMS successfully', async () => {
      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Test SMS message',
        from: '+1987654321',
      };

      const result = await service.sendSms(smsOptions);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Test SMS message',
        from: '+1987654321',
        to: '+1234567890',
      });
      expect(result).toBe(true);
    });

    it('should send SMS with default from number', async () => {
      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Test SMS message',
      };

      const result = await service.sendSms(smsOptions);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Test SMS message',
        from: '+1234567890',
        to: '+1234567890',
      });
      expect(result).toBe(true);
    });

    it('should send SMS with template', async () => {
      const mockTemplate = {
        id: 'template-123',
        content: 'Hello {{name}}, your certificate {{certificateName}} has been issued.',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Default message',
        templateId: 'template-123',
        templateData: { name: 'John Doe', certificateName: 'Web Development' },
      };

      const result = await service.sendSms(smsOptions);

      expect(mockTemplateRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'template-123', type: 'sms' },
      });
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Hello John Doe, your certificate Web Development has been issued.',
        from: '+1234567890',
        to: '+1234567890',
      });
      expect(result).toBe(true);
    });

    it('should handle template not found', async () => {
      mockTemplateRepository.findOne.mockResolvedValue(null);

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Default message',
        templateId: 'non-existent-template',
        templateData: { name: 'John Doe' },
      };

      const result = await service.sendSms(smsOptions);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Default message',
        from: '+1234567890',
        to: '+1234567890',
      });
      expect(result).toBe(true);
    });

    it('should handle SMS sending failure', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Twilio error'));

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Test SMS message',
      };

      const result = await service.sendSms(smsOptions);

      expect(result).toBe(false);
    });

    it('should handle client not initialized', async () => {
      // Mock client as null
      (twilio as jest.Mocked<typeof twilio>).mockReturnValue(null);

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Test SMS message',
      };

      const result = await service.sendSms(smsOptions);

      expect(result).toBe(false);
    });
  });

  describe('sendBulkSms', () => {
    it('should send bulk SMS successfully', async () => {
      const smsList: SmsOptions[] = [
        {
          to: '+1234567890',
          message: 'Bulk SMS 1',
        },
        {
          to: '+1987654321',
          message: 'Bulk SMS 2',
        },
      ];

      mockTwilioClient.messages.create.mockResolvedValue({ sid: 'test-sid' });

      const result = await service.sendBulkSms(smsList);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: 2,
        failed: 0,
      });
    });

    it('should handle failures in bulk SMS', async () => {
      const smsList: SmsOptions[] = [
        {
          to: '+1234567890',
          message: 'Bulk SMS 1',
        },
        {
          to: '+1987654321',
          message: 'Bulk SMS 2',
        },
      ];

      mockTwilioClient.messages.create
        .mockResolvedValueOnce({ sid: 'test-sid' })
        .mockRejectedValueOnce(new Error('Twilio error'));

      const result = await service.sendBulkSms(smsList);

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
        channel: DeliveryChannel.SMS,
        recipient: '+1234567890',
        status: DeliveryStatus.DELIVERED,
        sentAt: new Date(),
        errorMessage: null,
        deliveryData: { sid: 'test-sid' },
      };

      mockDeliveryRepository.create.mockReturnValue(mockDelivery);
      mockDeliveryRepository.save.mockResolvedValue(mockDelivery);

      const result = await service.trackDelivery(
        'notification-123',
        '+1234567890',
        true,
        undefined,
        { sid: 'test-sid' }
      );

      expect(mockDeliveryRepository.create).toHaveBeenCalledWith({
        notificationId: 'notification-123',
        channel: DeliveryChannel.SMS,
        recipient: '+1234567890',
        status: DeliveryStatus.DELIVERED,
        sentAt: expect.any(Date),
        errorMessage: undefined,
        deliveryData: { sid: 'test-sid' },
      });
      expect(result).toEqual(mockDelivery);
    });

    it('should track failed delivery', async () => {
      const mockDelivery = {
        id: 'delivery-123',
        notificationId: 'notification-123',
        channel: DeliveryChannel.SMS,
        recipient: '+1234567890',
        status: DeliveryStatus.FAILED,
        sentAt: null,
        errorMessage: 'Twilio error',
        deliveryData: null,
      };

      mockDeliveryRepository.create.mockReturnValue(mockDelivery);
      mockDeliveryRepository.save.mockResolvedValue(mockDelivery);

      const result = await service.trackDelivery(
        'notification-123',
        '+1234567890',
        false,
        'Twilio error'
      );

      expect(mockDeliveryRepository.create).toHaveBeenCalledWith({
        notificationId: 'notification-123',
        channel: DeliveryChannel.SMS,
        recipient: '+1234567890',
        status: DeliveryStatus.FAILED,
        sentAt: null,
        errorMessage: 'Twilio error',
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
        failed: '15',
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

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('delivery.channel = :channel', { channel: DeliveryChannel.SMS });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered',
        'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed',
      ]);
      expect(result).toEqual({
        total: 100,
        delivered: 85,
        failed: 15,
        deliveryRate: 85,
      });
    });

    it('should return delivery statistics with date range', async () => {
      const mockStats = {
        total: '50',
        delivered: '45',
        failed: '5',
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
        failed: 5,
        deliveryRate: 90,
      });
    });

    it('should handle zero total deliveries', async () => {
      const mockStats = {
        total: '0',
        delivered: '0',
        failed: '0',
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
        deliveryRate: 0,
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate valid phone numbers', async () => {
      const validNumbers = [
        '+1234567890',
        '+19876543210',
        '1234567890',
        '+1-234-567-8900',
      ];

      for (const number of validNumbers) {
        const result = await service.validatePhoneNumber(number);
        expect(result).toBe(true);
      }
    });

    it('should reject invalid phone numbers', async () => {
      const invalidNumbers = [
        '123', // Too short
        'abcdefghij', // Non-numeric
        '+', // Just plus sign
        '', // Empty string
        '12345678901234567890', // Too long
      ];

      for (const number of invalidNumbers) {
        const result = await service.validatePhoneNumber(number);
        expect(result).toBe(false);
      }
    });

    it('should handle client not initialized', async () => {
      (twilio as jest.Mocked<typeof twilio>).mockReturnValue(null);

      const result = await service.validatePhoneNumber('+1234567890');

      expect(result).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should handle complex template variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        content: 'Certificate {{certificateName}} for {{recipientName}} expires on {{expiryDate}}.',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Default message',
        templateId: 'template-123',
        templateData: {
          certificateName: 'Web Development',
          recipientName: 'John Doe',
          expiryDate: '2024-12-31',
        },
      };

      const result = await service.sendSms(smsOptions);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Certificate Web Development for John Doe expires on 2024-12-31.',
        from: '+1234567890',
        to: '+1234567890',
      });
      expect(result).toBe(true);
    });

    it('should handle missing template variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        content: 'Hello {{name}}, your code is {{code}}.',
      };

      mockTemplateRepository.findOne.mockResolvedValue(mockTemplate);

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Default message',
        templateId: 'template-123',
        templateData: { name: 'John' }, // Missing 'code' variable
      };

      const result = await service.sendSms(smsOptions);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Hello John, your code is {{code}}.',
        from: '+1234567890',
        to: '+1234567890',
      });
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle twilio client errors gracefully', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Network error'));

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Test message',
      };

      const result = await service.sendSms(smsOptions);

      expect(result).toBe(false);
    });

    it('should handle missing twilio configuration', async () => {
      mockConfigService.get.mockReturnValue(null);

      const smsOptions: SmsOptions = {
        to: '+1234567890',
        message: 'Test message',
      };

      const result = await service.sendSms(smsOptions);

      expect(result).toBe(false);
    });
  });
}); 