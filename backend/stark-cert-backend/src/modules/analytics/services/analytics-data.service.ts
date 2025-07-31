import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, SelectQueryBuilder } from 'typeorm';
import { AnalyticsEntity } from '../entities/analytics.entity';
import { CertificateAnalytics } from '../entities/certificate-analytics.entity';
import { UserAnalytics } from '../entities/user-analytics.entity';
import { SystemMetrics } from '../entities/system-metrics.entity';
import { AnalyticsFilterDto, TimeRange } from '../dto/analytics-filter.dto';

@Injectable()
export class AnalyticsDataService {
  private readonly logger = new Logger(AnalyticsDataService.name);

  constructor(
    @InjectRepository(AnalyticsEntity)
    private analyticsRepository: Repository<AnalyticsEntity>,
    @InjectRepository(CertificateAnalytics)
    private certificateAnalyticsRepository: Repository<CertificateAnalytics>,
    @InjectRepository(UserAnalytics)
    private userAnalyticsRepository: Repository<UserAnalytics>,
    @InjectRepository(SystemMetrics)
    private systemMetricsRepository: Repository<SystemMetrics>,
  ) {}

  async trackCertificateAction(data: {
    certificateId?: string;
    issuerId: string;
    recipientId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    processingTime?: number;
    status?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const analytics = this.certificateAnalyticsRepository.create({
        ...data,
        actionDate: new Date(),
      });
      await this.certificateAnalyticsRepository.save(analytics);
      this.logger.debug(`Tracked certificate action: ${data.action}`);
    } catch (error) {
      this.logger.error(`Failed to track certificate action: ${error.message}`);
    }
  }

  async trackUserAction(data: {
    userId: string;
    action: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    duration?: number;
    pageUrl?: string;
    referrer?: string;
    deviceInfo?: Record<string, any>;
    performanceMetrics?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const analytics = this.userAnalyticsRepository.create({
        ...data,
        actionDate: new Date(),
      });
      await this.userAnalyticsRepository.save(analytics);
      this.logger.debug(`Tracked user action: ${data.action}`);
    } catch (error) {
      this.logger.error(`Failed to track user action: ${error.message}`);
    }
  }

  async trackSystemMetric(data: {
    metricType: string;
    value: number;
    unit?: string;
    component?: string;
    endpoint?: string;
    status?: string;
    description?: string;
    thresholds?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const metric = this.systemMetricsRepository.create({
        ...data,
        recordedAt: new Date(),
      });
      await this.systemMetricsRepository.save(metric);
      this.logger.debug(`Tracked system metric: ${data.metricType}`);
    } catch (error) {
      this.logger.error(`Failed to track system metric: ${error.message}`);
    }
  }

  async aggregateAnalytics(filter: AnalyticsFilterDto): Promise<AnalyticsEntity[]> {
    const queryBuilder = this.analyticsRepository.createQueryBuilder('analytics');

    this.applyFilters(queryBuilder, filter);

    if (filter.groupBy) {
      queryBuilder.groupBy(`analytics.${filter.groupBy}`);
    }

    if (filter.limit) {
      queryBuilder.limit(filter.limit);
    }

    if (filter.offset) {
      queryBuilder.offset(filter.offset);
    }

    return queryBuilder.getMany();
  }

  async getCertificateAnalytics(filter: AnalyticsFilterDto): Promise<any[]> {
    const queryBuilder = this.certificateAnalyticsRepository.createQueryBuilder('ca');

    this.applyDateFilters(queryBuilder, filter);

    if (filter.issuerIds?.length) {
      queryBuilder.andWhere('ca.issuerId IN (:...issuerIds)', { issuerIds: filter.issuerIds });
    }

    if (filter.recipientIds?.length) {
      queryBuilder.andWhere('ca.recipientId IN (:...recipientIds)', { recipientIds: filter.recipientIds });
    }

    const groupBy = filter.groupBy || 'action';
    queryBuilder.groupBy(`ca.${groupBy}`);

    queryBuilder.select([
      `ca.${groupBy} as group`,
      'COUNT(*) as count',
      'AVG(ca.processingTime) as avgProcessingTime',
      'COUNT(CASE WHEN ca.status = :success THEN 1 END) as successCount',
      'COUNT(CASE WHEN ca.status = :failed THEN 1 END) as failedCount',
    ]);

    queryBuilder.setParameters({
      success: 'success',
      failed: 'failed',
    });

    return queryBuilder.getRawMany();
  }

  async getUserAnalytics(filter: AnalyticsFilterDto): Promise<any[]> {
    const queryBuilder = this.userAnalyticsRepository.createQueryBuilder('ua');

    this.applyDateFilters(queryBuilder, filter);

    const groupBy = filter.groupBy || 'action';
    queryBuilder.groupBy(`ua.${groupBy}`);

    queryBuilder.select([
      `ua.${groupBy} as group`,
      'COUNT(*) as count',
      'AVG(ua.duration) as avgDuration',
      'COUNT(DISTINCT ua.userId) as uniqueUsers',
    ]);

    return queryBuilder.getRawMany();
  }

  async getSystemMetrics(filter: AnalyticsFilterDto): Promise<any[]> {
    const queryBuilder = this.systemMetricsRepository.createQueryBuilder('sm');

    this.applyDateFilters(queryBuilder, filter);

    if (filter.metricTypes?.length) {
      queryBuilder.andWhere('sm.metricType IN (:...metricTypes)', { metricTypes: filter.metricTypes });
    }

    const groupBy = filter.groupBy || 'metricType';
    queryBuilder.groupBy(`sm.${groupBy}`);

    queryBuilder.select([
      `sm.${groupBy} as group`,
      'AVG(sm.value) as avgValue',
      'MAX(sm.value) as maxValue',
      'MIN(sm.value) as minValue',
      'COUNT(*) as count',
    ]);

    return queryBuilder.getRawMany();
  }

  async getRealTimeMetrics(metrics: string[] = []): Promise<Record<string, any>> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const results: Record<string, any> = {};

    // Certificate metrics
    if (metrics.length === 0 || metrics.includes('certificates')) {
      const certificateStats = await this.certificateAnalyticsRepository
        .createQueryBuilder('ca')
        .select([
          'ca.action',
          'COUNT(*) as count',
          'AVG(ca.processingTime) as avgProcessingTime',
        ])
        .where('ca.actionDate >= :oneHourAgo', { oneHourAgo })
        .groupBy('ca.action')
        .getRawMany();

      results.certificates = certificateStats;
    }

    // User activity metrics
    if (metrics.length === 0 || metrics.includes('users')) {
      const userStats = await this.userAnalyticsRepository
        .createQueryBuilder('ua')
        .select([
          'ua.action',
          'COUNT(*) as count',
          'COUNT(DISTINCT ua.userId) as uniqueUsers',
        ])
        .where('ua.actionDate >= :oneHourAgo', { oneHourAgo })
        .groupBy('ua.action')
        .getRawMany();

      results.users = userStats;
    }

    // System performance metrics
    if (metrics.length === 0 || metrics.includes('system')) {
      const systemStats = await this.systemMetricsRepository
        .createQueryBuilder('sm')
        .select([
          'sm.metricType',
          'AVG(sm.value) as avgValue',
          'MAX(sm.value) as maxValue',
        ])
        .where('sm.recordedAt >= :oneHourAgo', { oneHourAgo })
        .groupBy('sm.metricType')
        .getRawMany();

      results.system = systemStats;
    }

    return results;
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<any>, filter: AnalyticsFilterDto): void {
    this.applyDateFilters(queryBuilder, filter);

    if (filter.metricTypes?.length) {
      queryBuilder.andWhere('analytics.metricType IN (:...metricTypes)', { metricTypes: filter.metricTypes });
    }

    if (filter.category) {
      queryBuilder.andWhere('analytics.category = :category', { category: filter.category });
    }

    if (filter.subcategory) {
      queryBuilder.andWhere('analytics.subcategory = :subcategory', { subcategory: filter.subcategory });
    }
  }

  private applyDateFilters(queryBuilder: SelectQueryBuilder<any>, filter: AnalyticsFilterDto): void {
    let startDate: Date;
    let endDate: Date = new Date();

    if (filter.startDate && filter.endDate) {
      startDate = new Date(filter.startDate);
      endDate = new Date(filter.endDate);
    } else if (filter.timeRange) {
      startDate = this.getStartDateFromTimeRange(filter.timeRange);
    } else {
      // Default to last 30 days
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    queryBuilder.andWhere('actionDate BETWEEN :startDate AND :endDate', { startDate, endDate });
  }

  private getStartDateFromTimeRange(timeRange: TimeRange): Date {
    const now = new Date();
    const ms = now.getTime();

    switch (timeRange) {
      case TimeRange.LAST_24_HOURS:
        return new Date(ms - 24 * 60 * 60 * 1000);
      case TimeRange.LAST_7_DAYS:
        return new Date(ms - 7 * 24 * 60 * 60 * 1000);
      case TimeRange.LAST_30_DAYS:
        return new Date(ms - 30 * 24 * 60 * 60 * 1000);
      case TimeRange.LAST_90_DAYS:
        return new Date(ms - 90 * 24 * 60 * 60 * 1000);
      case TimeRange.LAST_6_MONTHS:
        return new Date(ms - 6 * 30 * 24 * 60 * 60 * 1000);
      case TimeRange.LAST_YEAR:
        return new Date(ms - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(ms - 30 * 24 * 60 * 60 * 1000);
    }
  }
} 