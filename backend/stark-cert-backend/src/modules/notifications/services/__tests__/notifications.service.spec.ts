import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService, CreateNotificationDto, SendNotificationDto } from '../notifications.service';
import { EmailService } from '../email.service';
import { SmsService } from '../sms.service';
import { InAppNotificationService } from '../in-app-notification.service';
import { NotificationTemplateService } from '../notification-template.service';
import { NotificationPreferencesService } from '../notification-preferences.service';
import { NotificationAnalyticsService } from '../notification-analytics.service';
import { Notification, NotificationStatus, NotificationType, NotificationPriority, NotificationCategory } from '../../entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let emailService: EmailService;
  let smsService: SmsService;
  let inAppNotificationService: InAppNotificationService;
  let templateService: NotificationTemplateService;
  let preferencesService: NotificationPreferencesService;
  let analyticsService: NotificationAnalyticsService;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    trackDelivery: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
    trackDelivery: jest.fn(),
  };

  const mockInAppNotificationService = {
    sendNotification: jest.fn(),
  };

  const mockTemplateService = {
    renderTemplate: jest.fn(),
  };

  const mockPreferencesService = {
    getPreference: jest.fn(),
    isNotificationEnabled: jest.fn(),
    getUsersByCategory: jest.fn(),
  };

  const mockAnalyticsService = {
    trackNotificationEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
        {
          provide: InAppNotificationService,
          useValue: mockInAppNotificationService,
        },
        {
          provide: NotificationTemplateService,
          useValue: mockTemplateService,
        },
        {
          provide: NotificationPreferencesService,
          useValue: mockPreferencesService,
        },
        {
          provide: NotificationAnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    emailService = module.get<EmailService>(EmailService);
    smsService = module.get<SmsService>(SmsService);
    inAppNotificationService = module.get<InAppNotificationService>(InAppNotificationService);
    templateService = module.get<NotificationTemplateService>(NotificationTemplateService);
    preferencesService = module.get<NotificationPreferencesService>(NotificationPreferencesService);
    analyticsService = module.get<NotificationAnalyticsService>(NotificationAnalyticsService);

    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const createDto: CreateNotificationDto = {
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        category: NotificationCategory.CERTIFICATE_ISSUED,
        priority: NotificationPriority.NORMAL,
      };

      const mockNotification = {
        id: 'notification-123',
        ...createDto,
        status: NotificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createNotification(createDto);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        ...createDto,
        priority: NotificationPriority.NORMAL,
        type: NotificationType.IN_APP,
        status: NotificationStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });

    it('should create a notification with custom priority and type', async () => {
      const createDto: CreateNotificationDto = {
        userId: 'user-123',
        title: 'Urgent Notification',
        message: 'This is an urgent notification',
        category: NotificationCategory.SECURITY_ALERT,
        priority: NotificationPriority.HIGH,
        type: NotificationType.EMAIL,
      };

      const mockNotification = {
        id: 'notification-123',
        ...createDto,
        status: NotificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createNotification(createDto);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: NotificationStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('sendNotification', () => {
    it('should send notification through enabled channels', async () => {
      const notification = {
        id: 'notification-123',
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        category: NotificationCategory.CERTIFICATE_ISSUED,
        priority: NotificationPriority.NORMAL,
        recipients: { email: 'test@example.com' },
      };

      const mockPreference = {
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        categories: {
          certificate_issued: true,
        },
      };

      mockPreferencesService.getPreference.mockResolvedValue(mockPreference);
      mockPreferencesService.isNotificationEnabled
        .mockResolvedValueOnce(true) // email
        .mockResolvedValueOnce(false) // sms
        .mockResolvedValueOnce(true); // in_app

      mockEmailService.sendEmail.mockResolvedValue(true);
      mockInAppNotificationService.sendNotification.mockResolvedValue(true);
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendNotification(notification as any);

      expect(mockPreferencesService.getPreference).toHaveBeenCalledWith('user-123');
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockInAppNotificationService.sendNotification).toHaveBeenCalled();
      expect(mockAnalyticsService.trackNotificationEvent).toHaveBeenCalledWith(notification.id, 'sent');
      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { id: notification.id },
        {
          status: NotificationStatus.SENT,
          sentAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }
      );
      expect(result).toBe(true);
    });

    it('should handle notification failure', async () => {
      const notification = {
        id: 'notification-123',
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        category: NotificationCategory.CERTIFICATE_ISSUED,
        priority: NotificationPriority.NORMAL,
      };

      const mockPreference = {
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: false,
        categories: {
          certificate_issued: true,
        },
      };

      mockPreferencesService.getPreference.mockResolvedValue(mockPreference);
      mockPreferencesService.isNotificationEnabled.mockResolvedValue(true);
      mockEmailService.sendEmail.mockResolvedValue(false);
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendNotification(notification as any);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { id: notification.id },
        {
          status: NotificationStatus.FAILED,
          sentAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }
      );
      expect(result).toBe(false);
    });

    it('should handle exceptions during sending', async () => {
      const notification = {
        id: 'notification-123',
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        category: NotificationCategory.CERTIFICATE_ISSUED,
        priority: NotificationPriority.NORMAL,
      };

      mockPreferencesService.getPreference.mockRejectedValue(new Error('Database error'));

      const result = await service.sendNotification(notification as any);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { id: notification.id },
        {
          status: NotificationStatus.FAILED,
          errorMessage: 'Database error',
          updatedAt: expect.any(Date),
        }
      );
      expect(result).toBe(false);
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send bulk notifications successfully', async () => {
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Bulk Notification',
        message: 'This is a bulk notification',
        category: NotificationCategory.BULK_MESSAGE,
        priority: NotificationPriority.NORMAL,
      };

      const mockNotification = {
        id: 'notification-123',
        ...sendDto,
        status: NotificationStatus.PENDING,
      };

      mockPreferencesService.getUsersByCategory.mockResolvedValue(['user-1', 'user-2']);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockPreferencesService.isNotificationEnabled.mockResolvedValue(true);
      mockEmailService.sendEmail.mockResolvedValue(true);
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendBulkNotifications(sendDto);

      expect(mockPreferencesService.getUsersByCategory).toHaveBeenCalledWith(NotificationCategory.BULK_MESSAGE);
      expect(result).toEqual({
        success: 2,
        failed: 0,
        total: 2,
      });
    });

    it('should handle failures in bulk notifications', async () => {
      const sendDto: SendNotificationDto = {
        userId: 'user-123',
        title: 'Bulk Notification',
        message: 'This is a bulk notification',
        category: NotificationCategory.BULK_MESSAGE,
        priority: NotificationPriority.NORMAL,
      };

      const mockNotification = {
        id: 'notification-123',
        ...sendDto,
        status: NotificationStatus.PENDING,
      };

      mockPreferencesService.getUsersByCategory.mockResolvedValue(['user-1', 'user-2']);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockPreferencesService.isNotificationEnabled
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      mockEmailService.sendEmail.mockResolvedValue(true);
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendBulkNotifications(sendDto);

      expect(result).toEqual({
        success: 1,
        failed: 1,
        total: 2,
      });
    });
  });

  describe('getNotifications', () => {
    it('should get user notifications with pagination', async () => {
      const mockNotifications = [
        { id: 'notification-1', title: 'Test 1' },
        { id: 'notification-2', title: 'Test 2' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockNotifications, 2]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getNotifications('user-123', {
        page: 1,
        limit: 20,
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('notification.userId = :userId', { userId: 'user-123' });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result).toEqual({
        notifications: mockNotifications,
        total: 2,
      });
    });

    it('should filter notifications by status and category', async () => {
      const mockNotifications = [{ id: 'notification-1', title: 'Test 1' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockNotifications, 1]),
      };

      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getNotifications('user-123', {
        status: NotificationStatus.SENT,
        category: NotificationCategory.CERTIFICATE_ISSUED,
        unreadOnly: true,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.status = :status', { status: NotificationStatus.SENT });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.category = :category', { category: NotificationCategory.CERTIFICATE_ISSUED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.isRead = :isRead', { isRead: false });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});

      await service.markAsRead('notification-123', 'user-123');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { id: 'notification-123', userId: 'user-123' },
        {
          isRead: true,
          readAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }
      );
      expect(mockAnalyticsService.trackNotificationEvent).toHaveBeenCalledWith('notification-123', 'opened');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationRepository.update.mockResolvedValue({ affected: 5 });

      await service.markAllAsRead('user-123');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123', isRead: false },
        {
          isRead: true,
          readAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-123');

      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false, isArchived: false },
      });
      expect(result).toBe(5);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      mockNotificationRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // unread
        .mockResolvedValueOnce(7) // read
        .mockResolvedValueOnce(2); // archived

      const mockDeliveryStats = {
        deliveryRate: 95.5,
      };

      mockAnalyticsService.getDeliveryStats.mockResolvedValue(mockDeliveryStats);

      const result = await service.getNotificationStats('user-123');

      expect(result).toEqual({
        total: 10,
        unread: 3,
        read: 7,
        archived: 2,
        deliveryRate: 95.5,
      });
    });
  });

  describe('sendCertificateNotification', () => {
    it('should send certificate issued notification', async () => {
      const mockNotification = {
        id: 'notification-123',
        userId: 'user-123',
        title: 'Certificate Issued',
        message: 'Your certificate "Web Development" has been issued successfully.',
        category: 'certificate_issued',
        priority: NotificationPriority.NORMAL,
        templateId: 'certificate-issued-template',
        templateData: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
          issueDate: new Date(),
          expiryDate: new Date(),
        },
        metadata: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
          event: 'issued',
        },
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockPreferencesService.getPreference.mockResolvedValue({
        emailEnabled: true,
        categories: { certificate_issued: true },
      });
      mockPreferencesService.isNotificationEnabled.mockResolvedValue(true);
      mockEmailService.sendEmail.mockResolvedValue(true);
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendCertificateNotification(
        'user-123',
        'cert-123',
        'Web Development',
        'issued',
        { issueDate: new Date(), expiryDate: new Date() }
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Certificate Issued',
        message: 'Your certificate "Web Development" has been issued successfully.',
        category: 'certificate_issued',
        priority: NotificationPriority.NORMAL,
        templateId: 'certificate-issued-template',
        templateData: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
          issueDate: expect.any(Date),
          expiryDate: expect.any(Date),
        },
        metadata: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
          event: 'issued',
          issueDate: expect.any(Date),
          expiryDate: expect.any(Date),
        },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should send certificate revoked notification with high priority', async () => {
      const mockNotification = {
        id: 'notification-123',
        userId: 'user-123',
        title: 'Certificate Revoked',
        message: 'Your certificate "Web Development" has been revoked.',
        category: 'certificate_revoked',
        priority: NotificationPriority.HIGH,
        templateId: 'certificate-revoked-template',
        templateData: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
        },
        metadata: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
          event: 'revoked',
        },
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockPreferencesService.getPreference.mockResolvedValue({
        emailEnabled: true,
        categories: { certificate_revoked: true },
      });
      mockPreferencesService.isNotificationEnabled.mockResolvedValue(true);
      mockEmailService.sendEmail.mockResolvedValue(true);
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendCertificateNotification(
        'user-123',
        'cert-123',
        'Web Development',
        'revoked'
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Certificate Revoked',
        message: 'Your certificate "Web Development" has been revoked.',
        category: 'certificate_revoked',
        priority: NotificationPriority.HIGH,
        templateId: 'certificate-revoked-template',
        templateData: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
        },
        metadata: {
          certificateId: 'cert-123',
          certificateName: 'Web Development',
          event: 'revoked',
        },
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('sendSystemNotification', () => {
    it('should send system notification to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const mockNotification = {
        id: 'notification-123',
        userId: 'user-1',
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight',
        category: 'system_maintenance',
        priority: NotificationPriority.NORMAL,
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockPreferencesService.getPreference.mockResolvedValue({
        emailEnabled: true,
        categories: { system_maintenance: true },
      });
      mockPreferencesService.isNotificationEnabled.mockResolvedValue(true);
      mockEmailService.sendEmail.mockResolvedValue(true);
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendSystemNotification(
        userIds,
        'System Maintenance',
        'Scheduled maintenance tonight',
        'system_maintenance',
        NotificationPriority.NORMAL
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        success: 3,
        failed: 0,
      });
    });

    it('should handle failures in system notifications', async () => {
      const userIds = ['user-1', 'user-2'];
      const mockNotification = {
        id: 'notification-123',
        userId: 'user-1',
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight',
        category: 'system_maintenance',
        priority: NotificationPriority.NORMAL,
      };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockPreferencesService.getPreference.mockResolvedValue({
        emailEnabled: true,
        categories: { system_maintenance: true },
      });
      mockPreferencesService.isNotificationEnabled.mockResolvedValue(true);
      mockEmailService.sendEmail
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Email failed'));
      mockAnalyticsService.trackNotificationEvent.mockResolvedValue({});
      mockNotificationRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.sendSystemNotification(
        userIds,
        'System Maintenance',
        'Scheduled maintenance tonight',
        'system_maintenance',
        NotificationPriority.NORMAL
      );

      expect(result).toEqual({
        success: 1,
        failed: 1,
      });
    });
  });
}); 