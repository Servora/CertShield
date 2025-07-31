import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from '../entities/notification-preference.entity';

export interface CreatePreferenceDto {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  smsFrequency: 'immediate' | 'urgent_only';
  categories: {
    certificate_issued: boolean;
    certificate_verified: boolean;
    certificate_revoked: boolean;
    certificate_expired: boolean;
    system_maintenance: boolean;
    security_alert: boolean;
    user_activity: boolean;
    bulk_message: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
}

export interface UpdatePreferenceDto {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  inAppEnabled?: boolean;
  pushEnabled?: boolean;
  emailFrequency?: 'immediate' | 'daily' | 'weekly';
  smsFrequency?: 'immediate' | 'urgent_only';
  categories?: Partial<{
    certificate_issued: boolean;
    certificate_verified: boolean;
    certificate_revoked: boolean;
    certificate_expired: boolean;
    system_maintenance: boolean;
    security_alert: boolean;
    user_activity: boolean;
    bulk_message: boolean;
  }>;
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
}

@Injectable()
export class NotificationPreferencesService {
  private readonly logger = new Logger(NotificationPreferencesService.name);

  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  async createPreference(createDto: CreatePreferenceDto): Promise<NotificationPreference> {
    const preference = this.preferenceRepository.create({
      ...createDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.preferenceRepository.save(preference);
  }

  async updatePreference(userId: string, updateDto: UpdatePreferenceDto): Promise<NotificationPreference> {
    await this.preferenceRepository.update(
      { userId },
      {
        ...updateDto,
        updatedAt: new Date(),
      },
    );

    return await this.getPreference(userId);
  }

  async getPreference(userId: string): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({ where: { userId } });

    if (!preference) {
      // Create default preferences if none exist
      preference = await this.createPreference({
        userId,
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
      });
    }

    return preference;
  }

  async deletePreference(userId: string): Promise<void> {
    await this.preferenceRepository.delete({ userId });
  }

  async isNotificationEnabled(
    userId: string,
    channel: 'email' | 'sms' | 'in_app' | 'push',
    category: string,
  ): Promise<boolean> {
    const preference = await this.getPreference(userId);

    // Check if the channel is enabled
    const channelEnabled = preference[`${channel}Enabled`];
    if (!channelEnabled) {
      return false;
    }

    // Check if the category is enabled
    const categoryEnabled = preference.categories[category];
    if (categoryEnabled === false) {
      return false;
    }

    // Check quiet hours for non-urgent notifications
    if (category !== 'security_alert' && category !== 'certificate_revoked') {
      if (preference.quietHours.enabled) {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', {
          hour12: false,
          timeZone: preference.quietHours.timezone,
        });

        const startTime = preference.quietHours.startTime;
        const endTime = preference.quietHours.endTime;

        if (this.isInQuietHours(currentTime, startTime, endTime)) {
          return false;
        }
      }
    }

    return true;
  }

  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.parseTime(currentTime);
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    if (start <= end) {
      // Same day quiet hours (e.g., 22:00 to 08:00)
      return current >= start || current <= end;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return current >= start || current <= end;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async getBulkPreferences(userIds: string[]): Promise<NotificationPreference[]> {
    return await this.preferenceRepository.find({
      where: userIds.map(id => ({ userId: id })),
    });
  }

  async updateCategoryPreference(
    userId: string,
    category: string,
    enabled: boolean,
  ): Promise<NotificationPreference> {
    const preference = await this.getPreference(userId);
    const updatedCategories = {
      ...preference.categories,
      [category]: enabled,
    };

    return await this.updatePreference(userId, { categories: updatedCategories });
  }

  async updateChannelPreference(
    userId: string,
    channel: 'email' | 'sms' | 'in_app' | 'push',
    enabled: boolean,
  ): Promise<NotificationPreference> {
    const updateData = { [`${channel}Enabled`]: enabled };
    return await this.updatePreference(userId, updateData);
  }

  async updateFrequencyPreference(
    userId: string,
    channel: 'email' | 'sms',
    frequency: 'immediate' | 'daily' | 'weekly' | 'urgent_only',
  ): Promise<NotificationPreference> {
    const updateData = { [`${channel}Frequency`]: frequency };
    return await this.updatePreference(userId, updateData);
  }

  async updateQuietHours(
    userId: string,
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
    },
  ): Promise<NotificationPreference> {
    return await this.updatePreference(userId, { quietHours });
  }

  async getUsersByCategory(category: string): Promise<string[]> {
    const preferences = await this.preferenceRepository.find({
      where: { [`categories.${category}`]: true },
    });

    return preferences.map(pref => pref.userId);
  }

  async getUsersByChannel(channel: 'email' | 'sms' | 'in_app' | 'push'): Promise<string[]> {
    const preferences = await this.preferenceRepository.find({
      where: { [`${channel}Enabled`]: true },
    });

    return preferences.map(pref => pref.userId);
  }

  async getNotificationStats(userId: string): Promise<{
    totalNotifications: number;
    readNotifications: number;
    unreadNotifications: number;
    deliveryRate: number;
  }> {
    // This would typically query notification analytics
    // For now, return placeholder data
    return {
      totalNotifications: 0,
      readNotifications: 0,
      unreadNotifications: 0,
      deliveryRate: 0,
    };
  }

  async exportPreferences(userId: string): Promise<NotificationPreference> {
    return await this.getPreference(userId);
  }

  async importPreferences(userId: string, preferences: CreatePreferenceDto): Promise<NotificationPreference> {
    // Delete existing preferences
    await this.deletePreference(userId);

    // Create new preferences
    return await this.createPreference({
      ...preferences,
      userId,
    });
  }
} 