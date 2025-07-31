import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDataService } from './services/analytics-data.service';
import { DashboardService } from './services/dashboard.service';
import { ReportService } from './services/report.service';
import { PerformanceService } from './services/performance.service';
import { TimeRange, MetricType } from './dto/analytics-filter.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let analyticsDataService: AnalyticsDataService;
  let dashboardService: DashboardService;
  let reportService: ReportService;
  let performanceService: PerformanceService;

  const mockAnalyticsDataService = {
    trackCertificateAction: jest.fn(),
    trackUserAction: jest.fn(),
    trackSystemMetric: jest.fn(),
    getCertificateAnalytics: jest.fn(),
    getUserAnalytics: jest.fn(),
    getSystemMetrics: jest.fn(),
    getRealTimeMetrics: jest.fn(),
    aggregateAnalytics: jest.fn(),
  };

  const mockDashboardService = {
    getDashboardOverview: jest.fn(),
    getCertificateOverview: jest.fn(),
    getUserOverview: jest.fn(),
    getSystemOverview: jest.fn(),
    getRealTimeOverview: jest.fn(),
    getCertificateTrends: jest.fn(),
    getTopIssuers: jest.fn(),
    getTopRecipients: jest.fn(),
    getActiveUsers: jest.fn(),
    getUserEngagement: jest.fn(),
    getPerformanceTrends: jest.fn(),
  };

  const mockReportService = {
    generateReport: jest.fn(),
    getReportData: jest.fn(),
    createReportTemplate: jest.fn(),
    getReportTemplates: jest.fn(),
    updateReportTemplate: jest.fn(),
    deleteReportTemplate: jest.fn(),
  };

  const mockPerformanceService = {
    getSystemHealth: jest.fn(),
    getPerformanceAlerts: jest.fn(),
    getPerformanceTrends: jest.fn(),
    collectSystemMetrics: jest.fn(),
    collectPerformanceMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsDataService,
          useValue: mockAnalyticsDataService,
        },
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
        {
          provide: ReportService,
          useValue: mockReportService,
        },
        {
          provide: PerformanceService,
          useValue: mockPerformanceService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    analyticsDataService = module.get<AnalyticsDataService>(AnalyticsDataService);
    dashboardService = module.get<DashboardService>(DashboardService);
    reportService = module.get<ReportService>(ReportService);
    performanceService = module.get<PerformanceService>(PerformanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Dashboard Methods', () => {
    describe('getDashboardOverview', () => {
      it('should return dashboard overview', async () => {
        const mockOverview = {
          certificates: { issued: 100, verified: 85, revoked: 5 },
          users: { total: 50, active: 35 },
          system: { cpu: 65.2, memory: 78.5 },
          summary: { totalCertificates: 100, activeUsers: 35, systemHealth: 'good' },
        };

        mockDashboardService.getDashboardOverview.mockResolvedValue(mockOverview);

        const result = await service.getDashboardOverview(TimeRange.LAST_7_DAYS);

        expect(result).toEqual(mockOverview);
        expect(mockDashboardService.getDashboardOverview).toHaveBeenCalledWith(TimeRange.LAST_7_DAYS);
      });
    });

    describe('getCertificateOverview', () => {
      it('should return certificate overview', async () => {
        const mockOverview = {
          totalIssued: 100,
          totalVerified: 85,
          totalRevoked: 5,
          successRate: 85.0,
          trends: { growth: 15.2 },
          topIssuers: [],
          topRecipients: [],
        };

        mockDashboardService.getCertificateOverview.mockResolvedValue(mockOverview);

        const result = await service.getCertificateOverview(TimeRange.LAST_30_DAYS);

        expect(result).toEqual(mockOverview);
        expect(mockDashboardService.getCertificateOverview).toHaveBeenCalledWith(TimeRange.LAST_30_DAYS);
      });
    });

    describe('getUserOverview', () => {
      it('should return user overview', async () => {
        const mockOverview = {
          totalUsers: 50,
          activeUsers: 35,
          newUsers: 5,
          engagementRate: 70.0,
          averageSessionDuration: 1200,
          topUsers: [],
          userActivity: [],
        };

        mockDashboardService.getUserOverview.mockResolvedValue(mockOverview);

        const result = await service.getUserOverview(TimeRange.LAST_7_DAYS);

        expect(result).toEqual(mockOverview);
        expect(mockDashboardService.getUserOverview).toHaveBeenCalledWith(TimeRange.LAST_7_DAYS);
      });
    });

    describe('getSystemOverview', () => {
      it('should return system overview', async () => {
        const mockOverview = {
          cpuUsage: 65.2,
          memoryUsage: 78.5,
          responseTime: 125,
          errorRate: 2.1,
          systemHealth: { score: 85, status: 'good' },
          alerts: [],
          performanceTrends: [],
        };

        mockDashboardService.getSystemOverview.mockResolvedValue(mockOverview);

        const result = await service.getSystemOverview(TimeRange.LAST_24_HOURS);

        expect(result).toEqual(mockOverview);
        expect(mockDashboardService.getSystemOverview).toHaveBeenCalledWith(TimeRange.LAST_24_HOURS);
      });
    });
  });

  describe('Real-time Analytics', () => {
    describe('getRealTimeOverview', () => {
      it('should return real-time overview', async () => {
        const mockOverview = {
          certificates: { issued: 5, verified: 12, revoked: 1 },
          users: { active: 25, new: 3 },
          system: { cpu: 65.2, memory: 78.5, responseTime: 120 },
          lastUpdated: new Date(),
        };

        mockDashboardService.getRealTimeOverview.mockResolvedValue(mockOverview);

        const result = await service.getRealTimeOverview();

        expect(result).toEqual(mockOverview);
        expect(mockDashboardService.getRealTimeOverview).toHaveBeenCalled();
      });
    });

    describe('getRealTimeMetrics', () => {
      it('should return real-time metrics', async () => {
        const mockMetrics = {
          certificates: { issued: 5, verified: 12, revoked: 1 },
          users: { active: 25, new: 3 },
          system: { cpu: 65.2, memory: 78.5, responseTime: 120 },
        };

        mockAnalyticsDataService.getRealTimeMetrics.mockResolvedValue(mockMetrics);

        const result = await service.getRealTimeMetrics();

        expect(result).toEqual(mockMetrics);
        expect(mockAnalyticsDataService.getRealTimeMetrics).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Monitoring', () => {
    describe('getSystemHealth', () => {
      it('should return system health', async () => {
        const mockHealth = {
          overallStatus: 'good',
          score: 85,
          metrics: { cpu: 65.2, memory: 78.5 },
          alerts: [],
          lastUpdated: new Date(),
        };

        mockPerformanceService.getSystemHealth.mockResolvedValue(mockHealth);

        const result = await service.getSystemHealth();

        expect(result).toEqual(mockHealth);
        expect(mockPerformanceService.getSystemHealth).toHaveBeenCalled();
      });
    });

    describe('getPerformanceAlerts', () => {
      it('should return performance alerts', async () => {
        const mockAlerts = {
          alerts: [
            { type: 'warning', message: 'High CPU usage', metric: 'cpu_usage', value: 85.0 },
          ],
          criticalCount: 0,
          warningCount: 1,
          totalCount: 1,
        };

        mockPerformanceService.getPerformanceAlerts.mockResolvedValue(mockAlerts);

        const result = await service.getPerformanceAlerts();

        expect(result).toEqual(mockAlerts);
        expect(mockPerformanceService.getPerformanceAlerts).toHaveBeenCalled();
      });
    });

    describe('getPerformanceTrends', () => {
      it('should return performance trends', async () => {
        const mockTrends = {
          trends: { cpu: [65.2, 68.1, 62.8], memory: [78.5, 80.2, 75.9] },
          periods: ['2024-01-01', '2024-01-02', '2024-01-03'],
          changes: { cpu: 2.1, memory: -1.8 },
        };

        mockPerformanceService.getPerformanceTrends.mockResolvedValue(mockTrends);

        const result = await service.getPerformanceTrends();

        expect(result).toEqual(mockTrends);
        expect(mockPerformanceService.getPerformanceTrends).toHaveBeenCalled();
      });
    });
  });

  describe('Data Tracking', () => {
    describe('trackCertificateAction', () => {
      it('should track certificate action', async () => {
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

        mockAnalyticsDataService.trackCertificateAction.mockResolvedValue(certificateAction);

        const result = await service.trackCertificateAction(certificateAction);

        expect(result).toEqual(certificateAction);
        expect(mockAnalyticsDataService.trackCertificateAction).toHaveBeenCalledWith(certificateAction);
      });
    });

    describe('trackUserAction', () => {
      it('should track user action', async () => {
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

        mockAnalyticsDataService.trackUserAction.mockResolvedValue(userAction);

        const result = await service.trackUserAction(userAction);

        expect(result).toEqual(userAction);
        expect(mockAnalyticsDataService.trackUserAction).toHaveBeenCalledWith(userAction);
      });
    });

    describe('trackSystemMetric', () => {
      it('should track system metric', async () => {
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

        mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(systemMetric);

        const result = await service.trackSystemMetric(systemMetric);

        expect(result).toEqual(systemMetric);
        expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(systemMetric);
      });
    });
  });

  describe('Report Generation', () => {
    describe('generateReport', () => {
      it('should generate report', async () => {
        const reportConfig = {
          type: 'pdf',
          title: 'Certificate Analytics Report',
          filters: { timeRange: TimeRange.LAST_30_DAYS },
          charts: ['certificate_trends', 'user_engagement'],
          data: {
            certificates: { issued: 100, verified: 85, revoked: 5 },
            users: { total: 50, active: 35 },
            system: { cpu: 65.2, memory: 78.5 },
          },
        };

        const mockReport = {
          format: 'pdf',
          data: Buffer.from('test'),
          filename: 'report.pdf',
        };

        mockReportService.generateReport.mockResolvedValue(mockReport);

        const result = await service.generateReport(reportConfig);

        expect(result).toEqual(mockReport);
        expect(mockReportService.generateReport).toHaveBeenCalledWith(reportConfig);
      });
    });

    describe('getReportData', () => {
      it('should get report data', async () => {
        const mockData = [
          { action: 'issued', count: 100, date: '2024-01-01' },
          { action: 'verified', count: 85, date: '2024-01-01' },
          { action: 'revoked', count: 5, date: '2024-01-01' },
        ];

        mockReportService.getReportData.mockResolvedValue(mockData);

        const filters = { timeRange: TimeRange.LAST_30_DAYS };
        const result = await service.getReportData('certificates', filters);

        expect(result).toEqual(mockData);
        expect(mockReportService.getReportData).toHaveBeenCalledWith('certificates', filters);
      });
    });
  });

  describe('Comparative Analytics', () => {
    describe('getComparativeAnalytics', () => {
      it('should return comparative analytics', async () => {
        const currentPeriod = TimeRange.LAST_7_DAYS;
        const previousPeriod = TimeRange.LAST_30_DAYS;

        const mockCurrentData = {
          certificates: { issued: 100, verified: 85, revoked: 5 },
          users: { total: 50, active: 35 },
        };

        const mockPreviousData = {
          certificates: { issued: 80, verified: 70, revoked: 3 },
          users: { total: 45, active: 30 },
        };

        mockDashboardService.getCertificateOverview.mockResolvedValueOnce(mockCurrentData);
        mockDashboardService.getCertificateOverview.mockResolvedValueOnce(mockPreviousData);

        const result = await service.getComparativeAnalytics(currentPeriod, previousPeriod);

        expect(result).toHaveProperty('certificates');
        expect(result).toHaveProperty('users');
        expect(result).toHaveProperty('changes');
        expect(result.changes).toHaveProperty('certificates');
        expect(result.changes).toHaveProperty('users');
      });
    });

    describe('getInstitutionalPerformance', () => {
      it('should return institutional performance comparison', async () => {
        const mockInstitutions = [
          { id: 'inst-1', name: 'University A', certificates: 100, successRate: 85.0 },
          { id: 'inst-2', name: 'University B', certificates: 75, successRate: 78.0 },
          { id: 'inst-3', name: 'University C', certificates: 50, successRate: 92.0 },
        ];

        mockDashboardService.getTopIssuers.mockResolvedValue(mockInstitutions);

        const result = await service.getInstitutionalPerformance(TimeRange.LAST_30_DAYS);

        expect(result).toHaveProperty('institutions');
        expect(result).toHaveProperty('rankings');
        expect(result).toHaveProperty('metrics');
        expect(result.institutions).toHaveLength(3);
        expect(result.rankings).toBeDefined();
      });
    });
  });

  describe('Trend Analysis', () => {
    describe('getCertificateTrends', () => {
      it('should return certificate trends', async () => {
        const mockTrends = {
          dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
          issued: [10, 12, 8],
          verified: [15, 18, 22],
          revoked: [1, 0, 2],
          growthRate: 15.2,
        };

        mockDashboardService.getCertificateTrends.mockResolvedValue(mockTrends);

        const result = await service.getCertificateTrends(TimeRange.LAST_7_DAYS);

        expect(result).toEqual(mockTrends);
        expect(mockDashboardService.getCertificateTrends).toHaveBeenCalledWith(TimeRange.LAST_7_DAYS);
      });
    });

    describe('getUserEngagement', () => {
      it('should return user engagement trends', async () => {
        const mockEngagement = {
          averageActions: 25,
          averageDuration: 1800,
          engagementScore: 75.5,
          topEngagedUsers: [],
        };

        mockDashboardService.getUserEngagement.mockResolvedValue(mockEngagement);

        const result = await service.getUserEngagement(TimeRange.LAST_7_DAYS);

        expect(result).toEqual(mockEngagement);
        expect(mockDashboardService.getUserEngagement).toHaveBeenCalledWith(TimeRange.LAST_7_DAYS);
      });
    });
  });

  describe('Data Retrieval', () => {
    describe('getCertificateAnalytics', () => {
      it('should return certificate analytics', async () => {
        const mockData = [
          { certificateId: 'cert-123', action: 'issued', actionDate: new Date() },
        ];

        const filters = { timeRange: TimeRange.LAST_7_DAYS, issuerId: 'issuer-123' };

        mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockData);

        const result = await service.getCertificateAnalytics(filters);

        expect(result).toEqual(mockData);
        expect(mockAnalyticsDataService.getCertificateAnalytics).toHaveBeenCalledWith(filters);
      });
    });

    describe('getUserAnalytics', () => {
      it('should return user analytics', async () => {
        const mockData = [
          { userId: 'user-123', action: 'login', actionDate: new Date() },
        ];

        const filters = { timeRange: TimeRange.LAST_30_DAYS, userId: 'user-123' };

        mockAnalyticsDataService.getUserAnalytics.mockResolvedValue(mockData);

        const result = await service.getUserAnalytics(filters);

        expect(result).toEqual(mockData);
        expect(mockAnalyticsDataService.getUserAnalytics).toHaveBeenCalledWith(filters);
      });
    });

    describe('getSystemMetrics', () => {
      it('should return system metrics', async () => {
        const mockData = [
          { metricType: 'cpu_usage', value: 65.2, recordedAt: new Date() },
        ];

        const filters = { timeRange: TimeRange.LAST_24_HOURS, metricType: MetricType.CPU_USAGE };

        mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockData);

        const result = await service.getSystemMetrics(filters);

        expect(result).toEqual(mockData);
        expect(mockAnalyticsDataService.getSystemMetrics).toHaveBeenCalledWith(filters);
      });
    });
  });

  describe('Helper Methods', () => {
    describe('calculateComparativeAnalytics', () => {
      it('should calculate comparative analytics correctly', () => {
        const currentData = { issued: 100, verified: 85, revoked: 5 };
        const previousData = { issued: 80, verified: 70, revoked: 3 };

        const result = service['calculateComparativeAnalytics'](currentData, previousData);

        expect(result).toHaveProperty('issued');
        expect(result).toHaveProperty('verified');
        expect(result).toHaveProperty('revoked');
        expect(result.issued).toHaveProperty('current');
        expect(result.issued).toHaveProperty('previous');
        expect(result.issued).toHaveProperty('change');
        expect(result.issued).toHaveProperty('percentageChange');
      });

      it('should handle zero previous values', () => {
        const currentData = { issued: 100, verified: 85, revoked: 5 };
        const previousData = { issued: 0, verified: 0, revoked: 0 };

        const result = service['calculateComparativeAnalytics'](currentData, previousData);

        expect(result.issued.percentageChange).toBe(100);
        expect(result.verified.percentageChange).toBe(100);
        expect(result.revoked.percentageChange).toBe(100);
      });
    });

    describe('calculateInstitutionalRankings', () => {
      it('should calculate institutional rankings correctly', () => {
        const institutions = [
          { id: 'inst-1', name: 'University A', certificates: 100, successRate: 85.0 },
          { id: 'inst-2', name: 'University B', certificates: 75, successRate: 78.0 },
          { id: 'inst-3', name: 'University C', certificates: 50, successRate: 92.0 },
        ];

        const result = service['calculateInstitutionalRankings'](institutions);

        expect(result).toHaveProperty('byCertificates');
        expect(result).toHaveProperty('bySuccessRate');
        expect(result).toHaveProperty('byEfficiency');
        expect(result.byCertificates).toHaveLength(3);
        expect(result.bySuccessRate).toHaveLength(3);
        expect(result.byEfficiency).toHaveLength(3);
      });

      it('should handle empty institutions array', () => {
        const institutions = [];

        const result = service['calculateInstitutionalRankings'](institutions);

        expect(result.byCertificates).toHaveLength(0);
        expect(result.bySuccessRate).toHaveLength(0);
        expect(result.byEfficiency).toHaveLength(0);
      });
    });
  });
}); 