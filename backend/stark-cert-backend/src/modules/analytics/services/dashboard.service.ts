import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsDataService } from './analytics-data.service';
import { AnalyticsFilterDto, TimeRange } from '../dto/analytics-filter.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private analyticsDataService: AnalyticsDataService) {}

  async getDashboardOverview(filter: AnalyticsFilterDto = {}): Promise<Record<string, any>> {
    try {
      const [
        certificateStats,
        userStats,
        systemStats,
        realTimeMetrics,
      ] = await Promise.all([
        this.getCertificateOverview(filter),
        this.getUserOverview(filter),
        this.getSystemOverview(filter),
        this.getRealTimeOverview(),
      ]);

      return {
        certificates: certificateStats,
        users: userStats,
        system: systemStats,
        realTime: realTimeMetrics,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard overview: ${error.message}`);
      throw error;
    }
  }

  async getCertificateOverview(filter: AnalyticsFilterDto): Promise<Record<string, any>> {
    const certificateAnalytics = await this.analyticsDataService.getCertificateAnalytics(filter);

    const totalIssued = certificateAnalytics.find(item => item.group === 'issued')?.count || 0;
    const totalVerified = certificateAnalytics.find(item => item.group === 'verified')?.count || 0;
    const totalRevoked = certificateAnalytics.find(item => item.group === 'revoked')?.count || 0;
    const totalDownloaded = certificateAnalytics.find(item => item.group === 'downloaded')?.count || 0;

    const avgProcessingTime = certificateAnalytics.reduce((sum, item) => {
      return sum + (parseFloat(item.avgProcessingTime) || 0);
    }, 0) / certificateAnalytics.length || 0;

    const successRate = certificateAnalytics.reduce((total, item) => {
      const success = parseInt(item.successCount) || 0;
      const failed = parseInt(item.failedCount) || 0;
      return total + success + failed;
    }, 0);

    const successCount = certificateAnalytics.reduce((total, item) => {
      return total + (parseInt(item.successCount) || 0);
    }, 0);

    const successPercentage = successRate > 0 ? (successCount / successRate) * 100 : 0;

    return {
      totalIssued,
      totalVerified,
      totalRevoked,
      totalDownloaded,
      avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
      successRate: Math.round(successPercentage * 100) / 100,
      trends: await this.getCertificateTrends(filter),
      topIssuers: await this.getTopIssuers(filter),
      topRecipients: await this.getTopRecipients(filter),
    };
  }

  async getUserOverview(filter: AnalyticsFilterDto): Promise<Record<string, any>> {
    const userAnalytics = await this.analyticsDataService.getUserAnalytics(filter);

    const totalActions = userAnalytics.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
    const uniqueUsers = userAnalytics.reduce((max, item) => {
      const unique = parseInt(item.uniqueUsers) || 0;
      return Math.max(max, unique);
    }, 0);

    const avgSessionDuration = userAnalytics.reduce((sum, item) => {
      return sum + (parseFloat(item.avgDuration) || 0);
    }, 0) / userAnalytics.length || 0;

    return {
      totalActions,
      uniqueUsers,
      avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
      activeUsers: await this.getActiveUsers(filter),
      userEngagement: await this.getUserEngagement(filter),
      topActions: userAnalytics.slice(0, 10),
    };
  }

  async getSystemOverview(filter: AnalyticsFilterDto): Promise<Record<string, any>> {
    const systemMetrics = await this.analyticsDataService.getSystemMetrics(filter);

    const avgResponseTime = systemMetrics.find(item => item.group === 'response_time')?.avgValue || 0;
    const avgCpuUsage = systemMetrics.find(item => item.group === 'cpu_usage')?.avgValue || 0;
    const avgMemoryUsage = systemMetrics.find(item => item.group === 'memory_usage')?.avgValue || 0;
    const errorRate = systemMetrics.find(item => item.group === 'error_rate')?.avgValue || 0;

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      systemHealth: this.calculateSystemHealth(avgCpuUsage, avgMemoryUsage, errorRate),
      performanceTrends: await this.getPerformanceTrends(filter),
    };
  }

  async getRealTimeOverview(): Promise<Record<string, any>> {
    const realTimeMetrics = await this.analyticsDataService.getRealTimeMetrics();

    return {
      certificates: realTimeMetrics.certificates || [],
      users: realTimeMetrics.users || [],
      system: realTimeMetrics.system || [],
      lastUpdated: new Date().toISOString(),
    };
  }

  async getCertificateTrends(filter: AnalyticsFilterDto): Promise<any[]> {
    // Get daily trends for the last 30 days
    const trendFilter = {
      ...filter,
      timeRange: TimeRange.LAST_30_DAYS,
      groupBy: 'day',
    };

    const trends = await this.analyticsDataService.getCertificateAnalytics(trendFilter);
    return trends.map(item => ({
      date: item.group,
      issued: item.count,
      processingTime: parseFloat(item.avgProcessingTime) || 0,
    }));
  }

  async getTopIssuers(filter: AnalyticsFilterDto): Promise<any[]> {
    const issuerFilter = {
      ...filter,
      groupBy: 'issuerId',
    };

    const issuers = await this.analyticsDataService.getCertificateAnalytics(issuerFilter);
    return issuers
      .sort((a, b) => parseInt(b.count) - parseInt(a.count))
      .slice(0, 10)
      .map(item => ({
        issuerId: item.group,
        certificatesIssued: parseInt(item.count),
        avgProcessingTime: parseFloat(item.avgProcessingTime) || 0,
        successRate: this.calculateSuccessRate(item.successCount, item.failedCount),
      }));
  }

  async getTopRecipients(filter: AnalyticsFilterDto): Promise<any[]> {
    const recipientFilter = {
      ...filter,
      groupBy: 'recipientId',
    };

    const recipients = await this.analyticsDataService.getCertificateAnalytics(recipientFilter);
    return recipients
      .sort((a, b) => parseInt(b.count) - parseInt(a.count))
      .slice(0, 10)
      .map(item => ({
        recipientId: item.group,
        certificatesReceived: parseInt(item.count),
        avgProcessingTime: parseFloat(item.avgProcessingTime) || 0,
      }));
  }

  async getActiveUsers(filter: AnalyticsFilterDto): Promise<number> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const activeFilter = {
      ...filter,
      startDate: oneDayAgo.toISOString(),
      endDate: now.toISOString(),
    };

    const userAnalytics = await this.analyticsDataService.getUserAnalytics(activeFilter);
    return userAnalytics.reduce((max, item) => {
      const unique = parseInt(item.uniqueUsers) || 0;
      return Math.max(max, unique);
    }, 0);
  }

  async getUserEngagement(filter: AnalyticsFilterDto): Promise<Record<string, any>> {
    const userAnalytics = await this.analyticsDataService.getUserAnalytics(filter);

    const totalActions = userAnalytics.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
    const uniqueUsers = userAnalytics.reduce((max, item) => {
      const unique = parseInt(item.uniqueUsers) || 0;
      return Math.max(max, unique);
    }, 0);

    const avgActionsPerUser = uniqueUsers > 0 ? totalActions / uniqueUsers : 0;

    return {
      totalActions,
      uniqueUsers,
      avgActionsPerUser: Math.round(avgActionsPerUser * 100) / 100,
      engagementScore: this.calculateEngagementScore(totalActions, uniqueUsers),
    };
  }

  async getPerformanceTrends(filter: AnalyticsFilterDto): Promise<any[]> {
    const trendFilter = {
      ...filter,
      timeRange: TimeRange.LAST_30_DAYS,
      groupBy: 'day',
    };

    const trends = await this.analyticsDataService.getSystemMetrics(trendFilter);
    return trends.map(item => ({
      date: item.group,
      avgValue: parseFloat(item.avgValue) || 0,
      maxValue: parseFloat(item.maxValue) || 0,
      minValue: parseFloat(item.minValue) || 0,
    }));
  }

  private calculateSystemHealth(cpuUsage: number, memoryUsage: number, errorRate: number): string {
    const cpuScore = cpuUsage < 70 ? 'good' : cpuUsage < 90 ? 'warning' : 'critical';
    const memoryScore = memoryUsage < 80 ? 'good' : memoryUsage < 95 ? 'warning' : 'critical';
    const errorScore = errorRate < 5 ? 'good' : errorRate < 15 ? 'warning' : 'critical';

    if (cpuScore === 'critical' || memoryScore === 'critical' || errorScore === 'critical') {
      return 'critical';
    } else if (cpuScore === 'warning' || memoryScore === 'warning' || errorScore === 'warning') {
      return 'warning';
    } else {
      return 'good';
    }
  }

  private calculateSuccessRate(successCount: string, failedCount: string): number {
    const success = parseInt(successCount) || 0;
    const failed = parseInt(failedCount) || 0;
    const total = success + failed;
    return total > 0 ? Math.round((success / total) * 100 * 100) / 100 : 0;
  }

  private calculateEngagementScore(totalActions: number, uniqueUsers: number): number {
    if (uniqueUsers === 0) return 0;
    
    const actionsPerUser = totalActions / uniqueUsers;
    // Simple scoring: 0-2 actions = low, 2-5 = medium, 5+ = high
    if (actionsPerUser < 2) return 25;
    if (actionsPerUser < 5) return 50;
    if (actionsPerUser < 10) return 75;
    return 100;
  }
} 