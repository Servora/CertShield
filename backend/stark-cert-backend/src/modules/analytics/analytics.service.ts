import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsDataService } from './services/analytics-data.service';
import { DashboardService } from './services/dashboard.service';
import { ReportService } from './services/report.service';
import { PerformanceService } from './services/performance.service';
import { AnalyticsFilterDto, RealTimeAnalyticsDto } from './dto/analytics-filter.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private analyticsDataService: AnalyticsDataService,
    private dashboardService: DashboardService,
    private reportService: ReportService,
    private performanceService: PerformanceService,
  ) {}

  // Dashboard Methods
  async getDashboardOverview(filter: AnalyticsFilterDto = {}): Promise<Record<string, any>> {
    try {
      return await this.dashboardService.getDashboardOverview(filter);
    } catch (error) {
      this.logger.error(`Failed to get dashboard overview: ${error.message}`);
      throw error;
    }
  }

  async getCertificateAnalytics(filter: AnalyticsFilterDto): Promise<any[]> {
    try {
      return await this.analyticsDataService.getCertificateAnalytics(filter);
    } catch (error) {
      this.logger.error(`Failed to get certificate analytics: ${error.message}`);
      throw error;
    }
  }

  async getUserAnalytics(filter: AnalyticsFilterDto): Promise<any[]> {
    try {
      return await this.analyticsDataService.getUserAnalytics(filter);
    } catch (error) {
      this.logger.error(`Failed to get user analytics: ${error.message}`);
      throw error;
    }
  }

  async getSystemMetrics(filter: AnalyticsFilterDto): Promise<any[]> {
    try {
      return await this.analyticsDataService.getSystemMetrics(filter);
    } catch (error) {
      this.logger.error(`Failed to get system metrics: ${error.message}`);
      throw error;
    }
  }

  // Real-time Analytics
  async getRealTimeMetrics(dto: RealTimeAnalyticsDto): Promise<Record<string, any>> {
    try {
      return await this.analyticsDataService.getRealTimeMetrics(dto.metrics);
    } catch (error) {
      this.logger.error(`Failed to get real-time metrics: ${error.message}`);
      throw error;
    }
  }

  // Performance Monitoring
  async getSystemHealth(): Promise<Record<string, any>> {
    try {
      return await this.performanceService.getSystemHealth();
    } catch (error) {
      this.logger.error(`Failed to get system health: ${error.message}`);
      throw error;
    }
  }

  async getPerformanceAlerts(): Promise<any[]> {
    try {
      return await this.performanceService.getPerformanceAlerts();
    } catch (error) {
      this.logger.error(`Failed to get performance alerts: ${error.message}`);
      throw error;
    }
  }

  async getPerformanceTrends(timeRange: string = '24h'): Promise<Record<string, any>> {
    try {
      return await this.performanceService.getPerformanceTrends(timeRange);
    } catch (error) {
      this.logger.error(`Failed to get performance trends: ${error.message}`);
      throw error;
    }
  }

  // Data Tracking Methods
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
      await this.analyticsDataService.trackCertificateAction(data);
    } catch (error) {
      this.logger.error(`Failed to track certificate action: ${error.message}`);
      // Don't throw error to avoid breaking the main flow
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
      await this.analyticsDataService.trackUserAction(data);
    } catch (error) {
      this.logger.error(`Failed to track user action: ${error.message}`);
      // Don't throw error to avoid breaking the main flow
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
      await this.analyticsDataService.trackSystemMetric(data);
    } catch (error) {
      this.logger.error(`Failed to track system metric: ${error.message}`);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Report Generation
  async generateReport(reportDto: any): Promise<{ filePath: string; fileName: string }> {
    try {
      return await this.reportService.generateReport(reportDto);
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`);
      throw error;
    }
  }

  // Comparative Analytics
  async getComparativeAnalytics(filter: AnalyticsFilterDto): Promise<Record<string, any>> {
    try {
      const [currentPeriod, previousPeriod] = await Promise.all([
        this.getPeriodData(filter),
        this.getPreviousPeriodData(filter),
      ]);

      return {
        currentPeriod,
        previousPeriod,
        comparison: this.calculateComparison(currentPeriod, previousPeriod),
        trends: await this.calculateTrends(currentPeriod, previousPeriod),
      };
    } catch (error) {
      this.logger.error(`Failed to get comparative analytics: ${error.message}`);
      throw error;
    }
  }

  // Institutional Performance Analytics
  async getInstitutionalPerformance(filter: AnalyticsFilterDto): Promise<Record<string, any>> {
    try {
      const certificateAnalytics = await this.analyticsDataService.getCertificateAnalytics({
        ...filter,
        groupBy: 'issuerId',
      });

      const institutionalStats = await Promise.all(
        certificateAnalytics.map(async (issuer) => {
          const issuerFilter = {
            ...filter,
            issuerIds: [issuer.group],
          };

          const [certificates, users, system] = await Promise.all([
            this.analyticsDataService.getCertificateAnalytics(issuerFilter),
            this.analyticsDataService.getUserAnalytics(issuerFilter),
            this.analyticsDataService.getSystemMetrics(issuerFilter),
          ]);

          return {
            issuerId: issuer.group,
            certificatesIssued: parseInt(issuer.count) || 0,
            avgProcessingTime: parseFloat(issuer.avgProcessingTime) || 0,
            successRate: this.calculateSuccessRate(issuer.successCount, issuer.failedCount),
            userEngagement: this.calculateUserEngagement(users),
            systemPerformance: this.calculateSystemPerformance(system),
          };
        })
      );

      return {
        institutions: institutionalStats,
        rankings: this.calculateRankings(institutionalStats),
        summary: this.calculateInstitutionalSummary(institutionalStats),
      };
    } catch (error) {
      this.logger.error(`Failed to get institutional performance: ${error.message}`);
      throw error;
    }
  }

  // Helper Methods
  private async getPeriodData(filter: AnalyticsFilterDto): Promise<any> {
    return await this.dashboardService.getDashboardOverview(filter);
  }

  private async getPreviousPeriodData(filter: AnalyticsFilterDto): Promise<any> {
    // Calculate previous period based on current filter
    const previousFilter = this.calculatePreviousPeriodFilter(filter);
    return await this.dashboardService.getDashboardOverview(previousFilter);
  }

  private calculatePreviousPeriodFilter(filter: AnalyticsFilterDto): AnalyticsFilterDto {
    if (filter.startDate && filter.endDate) {
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      const duration = endDate.getTime() - startDate.getTime();
      
      const previousStartDate = new Date(startDate.getTime() - duration);
      const previousEndDate = new Date(startDate.getTime());

      return {
        ...filter,
        startDate: previousStartDate.toISOString(),
        endDate: previousEndDate.toISOString(),
      };
    }
    return filter;
  }

  private calculateComparison(current: any, previous: any): Record<string, any> {
    const comparison: Record<string, any> = {};

    // Compare certificate metrics
    if (current.certificates && previous.certificates) {
      comparison.certificates = {
        totalIssued: this.calculatePercentageChange(
          current.certificates.totalIssued,
          previous.certificates.totalIssued
        ),
        totalVerified: this.calculatePercentageChange(
          current.certificates.totalVerified,
          previous.certificates.totalVerified
        ),
        successRate: this.calculatePercentageChange(
          current.certificates.successRate,
          previous.certificates.successRate
        ),
      };
    }

    // Compare user metrics
    if (current.users && previous.users) {
      comparison.users = {
        totalActions: this.calculatePercentageChange(
          current.users.totalActions,
          previous.users.totalActions
        ),
        uniqueUsers: this.calculatePercentageChange(
          current.users.uniqueUsers,
          previous.users.uniqueUsers
        ),
        activeUsers: this.calculatePercentageChange(
          current.users.activeUsers,
          previous.users.activeUsers
        ),
      };
    }

    // Compare system metrics
    if (current.system && previous.system) {
      comparison.system = {
        avgResponseTime: this.calculatePercentageChange(
          current.system.avgResponseTime,
          previous.system.avgResponseTime
        ),
        avgCpuUsage: this.calculatePercentageChange(
          current.system.avgCpuUsage,
          previous.system.avgCpuUsage
        ),
        errorRate: this.calculatePercentageChange(
          current.system.errorRate,
          previous.system.errorRate
        ),
      };
    }

    return comparison;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  private async calculateTrends(current: any, previous: any): Promise<any[]> {
    // Calculate trends over time
    const trends = [];
    
    // Add trend calculations based on the data
    // This is a simplified implementation
    return trends;
  }

  private calculateSuccessRate(successCount: string, failedCount: string): number {
    const success = parseInt(successCount) || 0;
    const failed = parseInt(failedCount) || 0;
    const total = success + failed;
    return total > 0 ? Math.round((success / total) * 100 * 100) / 100 : 0;
  }

  private calculateUserEngagement(users: any[]): number {
    if (users.length === 0) return 0;
    
    const totalActions = users.reduce((sum, user) => sum + (parseInt(user.count) || 0), 0);
    const uniqueUsers = users.reduce((max, user) => {
      const unique = parseInt(user.uniqueUsers) || 0;
      return Math.max(max, unique);
    }, 0);

    return uniqueUsers > 0 ? Math.round((totalActions / uniqueUsers) * 100) / 100 : 0;
  }

  private calculateSystemPerformance(system: any[]): number {
    if (system.length === 0) return 100;
    
    const avgPerformance = system.reduce((sum, metric) => {
      return sum + (parseFloat(metric.avgValue) || 0);
    }, 0) / system.length;

    return Math.round(avgPerformance * 100) / 100;
  }

  private calculateRankings(institutionalStats: any[]): Record<string, any[]> {
    const rankings = {
      byCertificatesIssued: [...institutionalStats].sort((a, b) => b.certificatesIssued - a.certificatesIssued),
      bySuccessRate: [...institutionalStats].sort((a, b) => b.successRate - a.successRate),
      byUserEngagement: [...institutionalStats].sort((a, b) => b.userEngagement - a.userEngagement),
      bySystemPerformance: [...institutionalStats].sort((a, b) => b.systemPerformance - a.systemPerformance),
    };

    return rankings;
  }

  private calculateInstitutionalSummary(institutionalStats: any[]): Record<string, any> {
    if (institutionalStats.length === 0) {
      return {
        totalInstitutions: 0,
        avgCertificatesIssued: 0,
        avgSuccessRate: 0,
        avgUserEngagement: 0,
        avgSystemPerformance: 0,
      };
    }

    const totalInstitutions = institutionalStats.length;
    const avgCertificatesIssued = institutionalStats.reduce((sum, inst) => sum + inst.certificatesIssued, 0) / totalInstitutions;
    const avgSuccessRate = institutionalStats.reduce((sum, inst) => sum + inst.successRate, 0) / totalInstitutions;
    const avgUserEngagement = institutionalStats.reduce((sum, inst) => sum + inst.userEngagement, 0) / totalInstitutions;
    const avgSystemPerformance = institutionalStats.reduce((sum, inst) => sum + inst.systemPerformance, 0) / totalInstitutions;

    return {
      totalInstitutions,
      avgCertificatesIssued: Math.round(avgCertificatesIssued * 100) / 100,
      avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      avgUserEngagement: Math.round(avgUserEngagement * 100) / 100,
      avgSystemPerformance: Math.round(avgSystemPerformance * 100) / 100,
    };
  }
} 