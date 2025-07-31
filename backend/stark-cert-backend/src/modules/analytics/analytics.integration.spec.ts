import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDataService } from './services/analytics-data.service';
import { DashboardService } from './services/dashboard.service';
import { ReportService } from './services/report.service';
import { PerformanceService } from './services/performance.service';
import { AnalyticsEntity } from './entities/analytics.entity';
import { CertificateAnalytics } from './entities/certificate-analytics.entity';
import { UserAnalytics } from './entities/user-analytics.entity';
import { SystemMetrics } from './entities/system-metrics.entity';
import { ReportTemplate } from './entities/report-template.entity';
import { TimeRange, MetricType } from './dto/analytics-filter.dto';
import { ConfigModule } from '@nestjs/config';

describe('AnalyticsModule Integration', () => {
  let module: TestingModule;
  let analyticsController: AnalyticsController;
  let analyticsService: AnalyticsService;
  let analyticsDataService: AnalyticsDataService;
  let dashboardService: DashboardService;
  let reportService: ReportService;
  let performanceService: PerformanceService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            AnalyticsEntity,
            CertificateAnalytics,
            UserAnalytics,
            SystemMetrics,
            ReportTemplate,
          ],
          synchronize: true,
          logging: false,
        }),
        AnalyticsModule,
      ],
    }).compile();

    analyticsController = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    analyticsDataService = module.get<AnalyticsDataService>(AnalyticsDataService);
    dashboardService = module.get<DashboardService>(DashboardService);
    reportService = module.get<ReportService>(ReportService);
    performanceService = module.get<PerformanceService>(PerformanceService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Module Initialization', () => {
    it('should initialize all services correctly', () => {
      expect(analyticsController).toBeDefined();
      expect(analyticsService).toBeDefined();
      expect(analyticsDataService).toBeDefined();
      expect(dashboardService).toBeDefined();
      expect(reportService).toBeDefined();
      expect(performanceService).toBeDefined();
    });
  });

  describe('Data Tracking Integration', () => {
    it('should track certificate action through complete flow', async () => {
      const certificateAction = {
        certificateId: 'cert-123',
        issuerId: 'issuer-123',
        recipientId: 'recipient-123',
        action: 'issued',
        actionDate: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        location: 'US',
        processingTime: 150,
        status: 'success',
        metadata: { template: 'standard' },
      };

      const result = await analyticsController.trackCertificateAction(certificateAction);

      expect(result).toBeDefined();
      expect(result.certificateId).toBe(certificateAction.certificateId);
      expect(result.action).toBe(certificateAction.action);
      expect(result.status).toBe(certificateAction.status);
    });

    it('should track user action through complete flow', async () => {
      const userAction = {
        userId: 'user-123',
        action: 'login',
        actionDate: new Date(),
        sessionId: 'session-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        location: 'US',
        duration: 300,
        pageUrl: '/dashboard',
        referrer: '/login',
        deviceInfo: { browser: 'Chrome', os: 'Windows' },
        performanceMetrics: { loadTime: 1200 },
        metadata: { source: 'web' },
      };

      const result = await analyticsController.trackUserAction(userAction);

      expect(result).toBeDefined();
      expect(result.userId).toBe(userAction.userId);
      expect(result.action).toBe(userAction.action);
    });

    it('should track system metric through complete flow', async () => {
      const systemMetric = {
        metricType: 'cpu_usage',
        recordedAt: new Date(),
        value: 75.5,
        unit: 'percentage',
        component: 'server',
        endpoint: '/api/certificates',
        metadata: { serverId: 'server-1' },
        status: 'warning',
        description: 'High CPU usage detected',
        thresholds: { warning: 70, critical: 90 },
      };

      const result = await analyticsController.trackSystemMetric(systemMetric);

      expect(result).toBeDefined();
      expect(result.metricType).toBe(systemMetric.metricType);
      expect(result.value).toBe(systemMetric.value);
      expect(result.status).toBe(systemMetric.status);
    });
  });

  describe('Dashboard Integration', () => {
    beforeEach(async () => {
      // Seed some test data
      await analyticsController.trackCertificateAction({
        certificateId: 'cert-1',
        issuerId: 'issuer-1',
        recipientId: 'recipient-1',
        action: 'issued',
        actionDate: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        location: 'US',
        processingTime: 150,
        status: 'success',
        metadata: { template: 'standard' },
      });

      await analyticsController.trackUserAction({
        userId: 'user-1',
        action: 'login',
        actionDate: new Date(),
        sessionId: 'session-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        location: 'US',
        duration: 300,
        pageUrl: '/dashboard',
        referrer: '/login',
        deviceInfo: { browser: 'Chrome', os: 'Windows' },
        performanceMetrics: { loadTime: 1200 },
        metadata: { source: 'web' },
      });

      await analyticsController.trackSystemMetric({
        metricType: 'cpu_usage',
        recordedAt: new Date(),
        value: 65.2,
        unit: 'percentage',
        component: 'server',
        endpoint: '/api/certificates',
        metadata: { serverId: 'server-1' },
        status: 'normal',
        description: 'CPU usage within normal range',
        thresholds: { warning: 70, critical: 90 },
      });
    });

    it('should return dashboard overview with real data', async () => {
      const result = await analyticsController.getDashboard(TimeRange.LAST_7_DAYS);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('summary');
    });

    it('should return certificate analytics with real data', async () => {
      const result = await analyticsController.getCertificateAnalytics(TimeRange.LAST_7_DAYS);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalIssued');
      expect(result).toHaveProperty('totalVerified');
      expect(result).toHaveProperty('totalRevoked');
      expect(result).toHaveProperty('successRate');
    });

    it('should return user analytics with real data', async () => {
      const result = await analyticsController.getUserAnalytics(TimeRange.LAST_7_DAYS);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('engagementRate');
    });

    it('should return system analytics with real data', async () => {
      const result = await analyticsController.getSystemAnalytics(TimeRange.LAST_24_HOURS);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('cpuUsage');
      expect(result).toHaveProperty('memoryUsage');
      expect(result).toHaveProperty('systemHealth');
    });
  });

  describe('Real-time Analytics Integration', () => {
    it('should return real-time overview', async () => {
      const result = await analyticsController.getRealTimeAnalytics();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should return real-time metrics', async () => {
      const result = await analyticsController.getRealTimeMetrics();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('system');
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should return system health', async () => {
      const result = await analyticsController.getSystemHealth();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overallStatus');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should return performance alerts', async () => {
      const result = await analyticsController.getPerformanceAlerts();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('criticalCount');
      expect(result).toHaveProperty('warningCount');
      expect(result).toHaveProperty('totalCount');
    });

    it('should return performance trends', async () => {
      const result = await analyticsController.getPerformanceTrends();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('periods');
      expect(result).toHaveProperty('changes');
    });
  });

  describe('Data Retrieval Integration', () => {
    it('should return certificate analytics data', async () => {
      const filters = { timeRange: TimeRange.LAST_7_DAYS };
      const result = await analyticsController.getCertificateData(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return user analytics data', async () => {
      const filters = { timeRange: TimeRange.LAST_7_DAYS };
      const result = await analyticsController.getUserData(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return system metrics data', async () => {
      const filters = { timeRange: TimeRange.LAST_24_HOURS, metricType: MetricType.CPU_USAGE };
      const result = await analyticsController.getSystemData(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Report Generation Integration', () => {
    it('should generate PDF report', async () => {
      const reportConfig = {
        type: 'pdf',
        title: 'Test Analytics Report',
        filters: { timeRange: TimeRange.LAST_7_DAYS },
        charts: ['certificate_trends'],
        data: {
          certificates: { issued: 1, verified: 0, revoked: 0 },
          users: { total: 1, active: 1 },
          system: { cpu: 65.2, memory: 78.5 },
        },
      };

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as any;

      await analyticsController.generateReport(reportConfig, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should export CSV report', async () => {
      const filters = { timeRange: TimeRange.LAST_7_DAYS, type: 'certificates' };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as any;

      await analyticsController.exportCSV(filters, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should export Excel report', async () => {
      const filters = { timeRange: TimeRange.LAST_7_DAYS, type: 'certificates' };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as any;

      await analyticsController.exportExcel(filters, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should export PDF report', async () => {
      const filters = { timeRange: TimeRange.LAST_7_DAYS, type: 'certificates' };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as any;

      await analyticsController.exportPDF(filters, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('Comparative Analytics Integration', () => {
    it('should return comparative analytics', async () => {
      const currentPeriod = TimeRange.LAST_7_DAYS;
      const previousPeriod = TimeRange.LAST_30_DAYS;

      const result = await analyticsController.getComparativeAnalytics(currentPeriod, previousPeriod);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('changes');
    });

    it('should return institutional performance', async () => {
      const result = await analyticsController.getInstitutionalPerformance(TimeRange.LAST_30_DAYS);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('institutions');
      expect(result).toHaveProperty('rankings');
      expect(result).toHaveProperty('metrics');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid time range gracefully', async () => {
      const invalidTimeRange = 'INVALID' as TimeRange;

      try {
        await analyticsController.getDashboard(invalidTimeRange);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Invalid time range');
      }
    });

    it('should handle missing data gracefully', async () => {
      const result = await analyticsController.getCertificateAnalytics(TimeRange.LAST_90_DAYS);

      expect(result).toBeDefined();
      expect(result.totalIssued).toBeGreaterThanOrEqual(0);
      expect(result.totalVerified).toBeGreaterThanOrEqual(0);
      expect(result.totalRevoked).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Service Layer Integration', () => {
    it('should coordinate between services correctly', async () => {
      // Test that the main service coordinates with other services
      const dashboardResult = await analyticsService.getDashboardOverview(TimeRange.LAST_7_DAYS);
      expect(dashboardResult).toBeDefined();

      const healthResult = await analyticsService.getSystemHealth();
      expect(healthResult).toBeDefined();

      const realTimeResult = await analyticsService.getRealTimeMetrics();
      expect(realTimeResult).toBeDefined();
    });

    it('should handle data aggregation correctly', async () => {
      const certificateData = await analyticsService.getCertificateAnalytics({
        timeRange: TimeRange.LAST_7_DAYS,
      });
      expect(certificateData).toBeDefined();

      const userData = await analyticsService.getUserAnalytics({
        timeRange: TimeRange.LAST_7_DAYS,
      });
      expect(userData).toBeDefined();

      const systemData = await analyticsService.getSystemMetrics({
        timeRange: TimeRange.LAST_24_HOURS,
      });
      expect(systemData).toBeDefined();
    });
  });
}); 