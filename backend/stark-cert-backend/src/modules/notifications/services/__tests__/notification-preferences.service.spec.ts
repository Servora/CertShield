import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreferencesService, CreatePreferenceDto, UpdatePreferenceDto } from '../notification-preferences.service';
import { NotificationPreference } from '../../entities/notification-preference.entity';

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;
  let preferenceRepository: Repository<NotificationPreference>;

  const mockPreferenceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: mockPreferenceRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationPreferencesService>(NotificationPreferencesService);
    preferenceRepository = module.get<Repository<NotificationPreference>>(getRepositoryToken(NotificationPreference));

    jest.clearAllMocks();
  });

  describe('createPreference', () => {
    it('should create user preferences successfully', async () => {
      const createDto: CreatePreferenceDto = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
        categories: {
          certificate_issued: true,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      const mockPreference = {
        id: 'preference-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPreferenceRepository.create.mockReturnValue(mockPreference);
      mockPreferenceRepository.save.mockResolvedValue(mockPreference);

      const result = await service.createPreference(createDto);

      expect(mockPreferenceRepository.create).toHaveBeenCalledWith({
        ...createDto,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(mockPreferenceRepository.save).toHaveBeenCalledWith(mockPreference);
      expect(result).toEqual(mockPreference);
    });
  });

  describe('updatePreference', () => {
    it('should update user preferences successfully', async () => {
      const updateDto: UpdatePreferenceDto = {
        emailEnabled: false,
        smsEnabled: true,
        categories: {
          certificate_issued: false,
          security_alert: true,
        },
      };

      const mockPreference = {
        id: 'preference-123',
        userId: 'user-123',
        emailEnabled: false,
        smsEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
        categories: {
          certificate_issued: false,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
        updatedAt: new Date(),
      };

      mockPreferenceRepository.update.mockResolvedValue({ affected: 1 });
      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.updatePreference('user-123', updateDto);

      expect(mockPreferenceRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        {
          ...updateDto,
          updatedAt: expect.any(Date),
        }
      );
      expect(result).toEqual(mockPreference);
    });
  });

  describe('getPreference', () => {
    it('should get existing user preferences', async () => {
      const mockPreference = {
        id: 'preference-123',
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
        categories: {
          certificate_issued: true,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.getPreference('user-123');

      expect(mockPreferenceRepository.findOne).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
      expect(result).toEqual(mockPreference);
    });

    it('should create default preferences if none exist', async () => {
      mockPreferenceRepository.findOne.mockResolvedValue(null);

      const mockDefaultPreference = {
        id: 'preference-123',
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
        categories: {
          certificate_issued: true,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPreferenceRepository.create.mockReturnValue(mockDefaultPreference);
      mockPreferenceRepository.save.mockResolvedValue(mockDefaultPreference);

      const result = await service.getPreference('user-123');

      expect(mockPreferenceRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
        categories: {
          certificate_issued: true,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockDefaultPreference);
    });
  });

  describe('deletePreference', () => {
    it('should delete user preferences', async () => {
      mockPreferenceRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deletePreference('user-123');

      expect(mockPreferenceRepository.delete).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });

  describe('isNotificationEnabled', () => {
    it('should return true for enabled notification', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        categories: {
          certificate_issued: true,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.isNotificationEnabled('user-123', 'email', 'certificate_issued');

      expect(result).toBe(true);
    });

    it('should return false for disabled channel', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailEnabled: false,
        smsEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        categories: {
          certificate_issued: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.isNotificationEnabled('user-123', 'email', 'certificate_issued');

      expect(result).toBe(false);
    });

    it('should return false for disabled category', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        categories: {
          certificate_issued: false,
          user_activity: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.isNotificationEnabled('user-123', 'email', 'certificate_issued');

      expect(result).toBe(false);
    });

    it('should respect quiet hours for non-urgent notifications', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        categories: {
          certificate_issued: true,
          user_activity: true,
        },
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      // Mock current time to be in quiet hours
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('23:30:00');

      const result = await service.isNotificationEnabled('user-123', 'email', 'certificate_issued');

      expect(result).toBe(false);
    });

    it('should allow urgent notifications during quiet hours', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        categories: {
          security_alert: true,
          certificate_revoked: true,
        },
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      // Mock current time to be in quiet hours
      jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('23:30:00');

      const result = await service.isNotificationEnabled('user-123', 'email', 'security_alert');

      expect(result).toBe(true);
    });
  });

  describe('quiet hours logic', () => {
    it('should handle same-day quiet hours', () => {
      const result = service['isInQuietHours']('23:30', '22:00', '08:00');
      expect(result).toBe(true);
    });

    it('should handle overnight quiet hours', () => {
      const result = service['isInQuietHours']('02:30', '22:00', '08:00');
      expect(result).toBe(true);
    });

    it('should handle time outside quiet hours', () => {
      const result = service['isInQuietHours']('14:30', '22:00', '08:00');
      expect(result).toBe(false);
    });

    it('should parse time correctly', () => {
      const result = service['parseTime']('14:30');
      expect(result).toBe(870); // 14 * 60 + 30
    });
  });

  describe('getBulkPreferences', () => {
    it('should get preferences for multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const mockPreferences = [
        { userId: 'user-1', emailEnabled: true },
        { userId: 'user-2', emailEnabled: false },
        { userId: 'user-3', emailEnabled: true },
      ];

      mockPreferenceRepository.find.mockResolvedValue(mockPreferences);

      const result = await service.getBulkPreferences(userIds);

      expect(mockPreferenceRepository.find).toHaveBeenCalledWith({
        where: [
          { userId: 'user-1' },
          { userId: 'user-2' },
          { userId: 'user-3' },
        ],
      });
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('updateCategoryPreference', () => {
    it('should update category preference', async () => {
      const mockPreference = {
        userId: 'user-123',
        categories: {
          certificate_issued: true,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);
      mockPreferenceRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateCategoryPreference('user-123', 'certificate_issued', false);

      expect(mockPreferenceRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        {
          categories: {
            certificate_issued: false,
            certificate_verified: true,
            certificate_revoked: true,
            certificate_expired: true,
            system_maintenance: true,
            security_alert: true,
            user_activity: false,
            bulk_message: false,
          },
          updatedAt: expect.any(Date),
        }
      );
    });
  });

  describe('updateChannelPreference', () => {
    it('should update channel preference', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);
      mockPreferenceRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateChannelPreference('user-123', 'sms', true);

      expect(mockPreferenceRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        {
          smsEnabled: true,
          updatedAt: expect.any(Date),
        }
      );
    });
  });

  describe('updateFrequencyPreference', () => {
    it('should update email frequency preference', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);
      mockPreferenceRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateFrequencyPreference('user-123', 'email', 'daily');

      expect(mockPreferenceRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        {
          emailFrequency: 'daily',
          updatedAt: expect.any(Date),
        }
      );
    });

    it('should update SMS frequency preference', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);
      mockPreferenceRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateFrequencyPreference('user-123', 'sms', 'immediate');

      expect(mockPreferenceRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        {
          smsFrequency: 'immediate',
          updatedAt: expect.any(Date),
        }
      );
    });
  });

  describe('updateQuietHours', () => {
    it('should update quiet hours preference', async () => {
      const mockPreference = {
        userId: 'user-123',
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      const newQuietHours = {
        enabled: true,
        startTime: '21:00',
        endTime: '07:00',
        timezone: 'America/New_York',
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);
      mockPreferenceRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateQuietHours('user-123', newQuietHours);

      expect(mockPreferenceRepository.update).toHaveBeenCalledWith(
        { userId: 'user-123' },
        {
          quietHours: newQuietHours,
          updatedAt: expect.any(Date),
        }
      );
    });
  });

  describe('getUsersByCategory', () => {
    it('should get users who have enabled a specific category', async () => {
      const mockPreferences = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ];

      mockPreferenceRepository.find.mockResolvedValue(mockPreferences);

      const result = await service.getUsersByCategory('certificate_issued');

      expect(mockPreferenceRepository.find).toHaveBeenCalledWith({
        where: { 'categories.certificate_issued': true },
      });
      expect(result).toEqual(['user-1', 'user-2', 'user-3']);
    });
  });

  describe('getUsersByChannel', () => {
    it('should get users who have enabled a specific channel', async () => {
      const mockPreferences = [
        { userId: 'user-1' },
        { userId: 'user-2' },
      ];

      mockPreferenceRepository.find.mockResolvedValue(mockPreferences);

      const result = await service.getUsersByChannel('email');

      expect(mockPreferenceRepository.find).toHaveBeenCalledWith({
        where: { emailEnabled: true },
      });
      expect(result).toEqual(['user-1', 'user-2']);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const result = await service.getNotificationStats('user-123');

      expect(result).toEqual({
        totalNotifications: 0,
        readNotifications: 0,
        unreadNotifications: 0,
        deliveryRate: 0,
      });
    });
  });

  describe('exportPreferences', () => {
    it('should export user preferences', async () => {
      const mockPreference = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'immediate',
        smsFrequency: 'urgent_only',
        categories: {
          certificate_issued: true,
          certificate_verified: true,
          certificate_revoked: true,
          certificate_expired: true,
          system_maintenance: true,
          security_alert: true,
          user_activity: false,
          bulk_message: false,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC',
        },
      };

      mockPreferenceRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.exportPreferences('user-123');

      expect(result).toEqual(mockPreference);
    });
  });

  describe('importPreferences', () => {
    it('should import user preferences', async () => {
      const importData: CreatePreferenceDto = {
        userId: 'user-123',
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: false,
        pushEnabled: true,
        emailFrequency: 'daily',
        smsFrequency: 'immediate',
        categories: {
          certificate_issued: true,
          certificate_verified: false,
          certificate_revoked: true,
          certificate_expired: false,
          system_maintenance: true,
          security_alert: true,
          user_activity: true,
          bulk_message: false,
        },
        quietHours: {
          enabled: true,
          startTime: '21:00',
          endTime: '07:00',
          timezone: 'America/New_York',
        },
      };

      const mockPreference = {
        id: 'preference-123',
        ...importData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPreferenceRepository.delete.mockResolvedValue({ affected: 1 });
      mockPreferenceRepository.create.mockReturnValue(mockPreference);
      mockPreferenceRepository.save.mockResolvedValue(mockPreference);

      const result = await service.importPreferences('user-123', importData);

      expect(mockPreferenceRepository.delete).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(mockPreferenceRepository.create).toHaveBeenCalledWith({
        ...importData,
        userId: 'user-123',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockPreference);
    });
  });
}); 