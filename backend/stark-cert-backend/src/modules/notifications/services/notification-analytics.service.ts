import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationAnalytics } from '../entities/notification-analytics.entity';
import { NotificationDelivery, DeliveryStatus, DeliveryChannel } from '../entities/notification-delivery.entity';
import { Notification, NotificationStatus, NotificationCategory } from '../entities/notification.entity';

export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  category?: NotificationCategory;
  channel?: DeliveryChannel;
  userId?: string;
}

export interface DeliveryStats {
  total: number;
  delivered: number;
  failed: number;
  bounced: number;
  deliveryRate: number;
  averageDeliveryTime: number;
}

export interface CategoryStats {
  category: string;
  totalSent: number;
  totalDelivered: number;
  deliveryRate: number;
  averageOpenRate: number;
  averageClickRate: number;
}

export interface ChannelStats {
  channel: DeliveryChannel;
  totalSent: number;
  totalDelivered: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  costPerDelivery: number;
}

export interface UserEngagementStats {
  userId: string;
  totalNotifications: number;
  readNotifications: number;
  unreadNotifications: number;
  readRate: number;
  averageResponseTime: number;
  preferredChannels: DeliveryChannel[];
}

@Injectable()
export class NotificationAnalyticsService {
  private readonly logger = new Logger(NotificationAnalyticsService.name);

  constructor(
    @InjectRepository(NotificationAnalytics)
    private analyticsRepository: Repository<NotificationAnalytics>,
    @InjectRepository(NotificationDelivery)
    private deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async trackNotificationEvent(
    notificationId: string,
    event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed',
    metadata?: Record<string, any>,
  ): Promise<NotificationAnalytics> {
    const analytics = this.analyticsRepository.create({
      notificationId,
      event,
      eventTimestamp: new Date(),
      metadata,
      createdAt: new Date(),
    });

    return await this.analyticsRepository.save(analytics);
  }

  async getDeliveryStats(filter?: AnalyticsFilter): Promise<DeliveryStats> {
    const query = this.deliveryRepository.createQueryBuilder('delivery');

    if (filter?.startDate && filter?.endDate) {
      query.andWhere('delivery.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    if (filter?.category) {
      query.leftJoin('delivery.notification', 'notification');
      query.andWhere('notification.category = :category', { category: filter.category });
    }

    if (filter?.channel) {
      query.andWhere('delivery.channel = :channel', { channel: filter.channel });
    }

    if (filter?.userId) {
      query.leftJoin('delivery.notification', 'notification');
      query.andWhere('notification.userId = :userId', { userId: filter.userId });
    }

    const stats = await query
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as delivered',
        'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed',
        'SUM(CASE WHEN status = :bounced THEN 1 ELSE 0 END) as bounced',
        'AVG(EXTRACT(EPOCH FROM (sentAt - createdAt))) as avgDeliveryTime',
      ])
      .setParameters({
        delivered: DeliveryStatus.DELIVERED,
        failed: DeliveryStatus.FAILED,
        bounced: DeliveryStatus.BOUNCED,
      })
      .getRawOne();

    const total = parseInt(stats.total);
    const delivered = parseInt(stats.delivered);
    const failed = parseInt(stats.failed);
    const bounced = parseInt(stats.bounced);
    const avgDeliveryTime = parseFloat(stats.avgDeliveryTime) || 0;

    return {
      total,
      delivered,
      failed,
      bounced,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      averageDeliveryTime: avgDeliveryTime,
    };
  }

  async getCategoryStats(filter?: AnalyticsFilter): Promise<CategoryStats[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoin('notification.deliveries', 'delivery')
      .select([
        'notification.category as category',
        'COUNT(DISTINCT notification.id) as totalSent',
        'SUM(CASE WHEN delivery.status = :delivered THEN 1 ELSE 0 END) as totalDelivered',
        'AVG(CASE WHEN delivery.status = :delivered THEN 1 ELSE 0 END) as deliveryRate',
      ])
      .setParameter('delivered', DeliveryStatus.DELIVERED)
      .groupBy('notification.category');

    if (filter?.startDate && filter?.endDate) {
      query.andWhere('notification.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    const results = await query.getRawMany();

    return results.map(result => ({
      category: result.category,
      totalSent: parseInt(result.totalSent),
      totalDelivered: parseInt(result.totalDelivered),
      deliveryRate: parseFloat(result.deliveryRate) * 100,
      averageOpenRate: 0, // Placeholder - would need email tracking
      averageClickRate: 0, // Placeholder - would need email tracking
    }));
  }

  async getChannelStats(filter?: AnalyticsFilter): Promise<ChannelStats[]> {
    const query = this.deliveryRepository
      .createQueryBuilder('delivery')
      .select([
        'delivery.channel as channel',
        'COUNT(*) as totalSent',
        'SUM(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as totalDelivered',
        'AVG(CASE WHEN status = :delivered THEN 1 ELSE 0 END) as deliveryRate',
        'AVG(EXTRACT(EPOCH FROM (sentAt - createdAt))) as avgDeliveryTime',
      ])
      .setParameter('delivered', DeliveryStatus.DELIVERED)
      .groupBy('delivery.channel');

    if (filter?.startDate && filter?.endDate) {
      query.andWhere('delivery.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    const results = await query.getRawMany();

    return results.map(result => ({
      channel: result.channel,
      totalSent: parseInt(result.totalSent),
      totalDelivered: parseInt(result.totalDelivered),
      deliveryRate: parseFloat(result.deliveryRate) * 100,
      averageDeliveryTime: parseFloat(result.avgDeliveryTime) || 0,
      costPerDelivery: this.getCostPerDelivery(result.channel),
    }));
  }

  private getCostPerDelivery(channel: DeliveryChannel): number {
    // Placeholder costs - in real implementation, these would be configurable
    const costs = {
      [DeliveryChannel.EMAIL]: 0.001, // $0.001 per email
      [DeliveryChannel.SMS]: 0.05, // $0.05 per SMS
      [DeliveryChannel.IN_APP]: 0, // Free
      [DeliveryChannel.PUSH]: 0, // Free
    };

    return costs[channel] || 0;
  }

  async getUserEngagementStats(userId: string, filter?: AnalyticsFilter): Promise<UserEngagementStats> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoin('notification.deliveries', 'delivery')
      .where('notification.userId = :userId', { userId });

    if (filter?.startDate && filter?.endDate) {
      query.andWhere('notification.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    const notifications = await query.getMany();
    const totalNotifications = notifications.length;
    const readNotifications = notifications.filter(n => n.isRead).length;
    const unreadNotifications = totalNotifications - readNotifications;

    // Get preferred channels
    const channelStats = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoin('delivery.notification', 'notification')
      .where('notification.userId = :userId', { userId })
      .select(['delivery.channel', 'COUNT(*) as count'])
      .groupBy('delivery.channel')
      .orderBy('count', 'DESC')
      .getRawMany();

    const preferredChannels = channelStats
      .slice(0, 3)
      .map(stat => stat.channel as DeliveryChannel);

    return {
      userId,
      totalNotifications,
      readNotifications,
      unreadNotifications,
      readRate: totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0,
      averageResponseTime: 0, // Placeholder
      preferredChannels,
    };
  }

  async getRealTimeMetrics(): Promise<{
    notificationsSentToday: number;
    deliveryRateToday: number;
    averageDeliveryTime: number;
    activeUsers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [sentToday, deliveryStats, activeUsers] = await Promise.all([
      this.notificationRepository.count({
        where: {
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          } as any,
        },
      }),
      this.getDeliveryStats({ startDate: today, endDate: tomorrow }),
      this.getActiveUsersCount(),
    ]);

    return {
      notificationsSentToday: sentToday,
      deliveryRateToday: deliveryStats.deliveryRate,
      averageDeliveryTime: deliveryStats.averageDeliveryTime,
      activeUsers,
    };
  }

  private async getActiveUsersCount(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('COUNT(DISTINCT notification.userId)', 'count')
      .where('notification.createdAt >= :date', { date: thirtyDaysAgo })
      .getRawOne();

    return parseInt(result.count);
  }

  async generateReport(filter?: AnalyticsFilter): Promise<{
    summary: {
      totalNotifications: number;
      totalDelivered: number;
      overallDeliveryRate: number;
      averageDeliveryTime: number;
    };
    categoryBreakdown: CategoryStats[];
    channelBreakdown: ChannelStats[];
    topPerformers: {
      bestCategory: string;
      bestChannel: DeliveryChannel;
      mostEngagedUser: string;
    };
  }> {
    const [deliveryStats, categoryStats, channelStats] = await Promise.all([
      this.getDeliveryStats(filter),
      this.getCategoryStats(filter),
      this.getChannelStats(filter),
    ]);

    // Find top performers
    const bestCategory = categoryStats.reduce((best, current) =>
      current.deliveryRate > best.deliveryRate ? current : best,
    ).category;

    const bestChannel = channelStats.reduce((best, current) =>
      current.deliveryRate > best.deliveryRate ? current : best,
    ).channel;

    // Placeholder for most engaged user
    const mostEngagedUser = 'placeholder-user-id';

    return {
      summary: {
        totalNotifications: deliveryStats.total,
        totalDelivered: deliveryStats.delivered,
        overallDeliveryRate: deliveryStats.deliveryRate,
        averageDeliveryTime: deliveryStats.averageDeliveryTime,
      },
      categoryBreakdown: categoryStats,
      channelBreakdown: channelStats,
      topPerformers: {
        bestCategory,
        bestChannel,
        mostEngagedUser,
      },
    };
  }

  async exportAnalytics(filter?: AnalyticsFilter): Promise<{
    deliveryStats: DeliveryStats;
    categoryStats: CategoryStats[];
    channelStats: ChannelStats[];
    rawData: any[];
  }> {
    const [deliveryStats, categoryStats, channelStats] = await Promise.all([
      this.getDeliveryStats(filter),
      this.getCategoryStats(filter),
      this.getChannelStats(filter),
    ]);

    // Get raw data for export
    const query = this.deliveryRepository.createQueryBuilder('delivery');
    if (filter?.startDate && filter?.endDate) {
      query.andWhere('delivery.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }
    const rawData = await query.getMany();

    return {
      deliveryStats,
      categoryStats,
      channelStats,
      rawData,
    };
  }

  async getNotificationEffectiveness(notificationId: string): Promise<{
    sent: boolean;
    delivered: boolean;
    opened: boolean;
    clicked: boolean;
    responseTime: number;
    engagementScore: number;
  }> {
    const analytics = await this.analyticsRepository.find({
      where: { notificationId },
      order: { eventTimestamp: 'ASC' },
    });

    const events = analytics.map(a => a.event);
    const sent = events.includes('sent');
    const delivered = events.includes('delivered');
    const opened = events.includes('opened');
    const clicked = events.includes('clicked');

    // Calculate engagement score
    let engagementScore = 0;
    if (sent) engagementScore += 25;
    if (delivered) engagementScore += 25;
    if (opened) engagementScore += 25;
    if (clicked) engagementScore += 25;

    // Calculate response time (time from sent to opened/clicked)
    let responseTime = 0;
    if (sent && (opened || clicked)) {
      const sentTime = analytics.find(a => a.event === 'sent')?.eventTimestamp;
      const actionTime = analytics.find(a => a.event === 'opened' || a.event === 'clicked')?.eventTimestamp;
      
      if (sentTime && actionTime) {
        responseTime = actionTime.getTime() - sentTime.getTime();
      }
    }

    return {
      sent,
      delivered,
      opened,
      clicked,
      responseTime,
      engagementScore,
    };
  }
} 