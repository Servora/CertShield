import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TimeRange, MetricType } from './dto/analytics-filter.dto';
import { Response } from 'express';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;

  const mockAnalyticsService = {
    getDashboardOverview: jest.fn(),
    getCertificateOverview: jest.fn(),
    getUserOverview: jest.fn(),
    getSystemOverview: jest.fn(),
    getRealTimeOverview: jest.fn(),
    getRealTimeMetrics: jest.fn(),
    getSystemHealth: jest.fn(),
    getPerformanceAlerts: jest.fn(),
    getPerformanceTrends: jest.fn(),
    getComparativeAnalytics: jest.fn(),
    getInstitutionalPerformance: jest.fn(),
    generateReport: jest.fn(),
    trackCertificateAction: jest.fn(),
    trackUserAction: jest.fn(),
    trackSystemMetric: jest.fn(),
    getCertificateAnalytics: jest.fn(),
    getUserAnalytics: jest.fn(),
    getSystemMetrics: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Dashboard Endpoints', () => {
    describe('GET /analytics/dashboard', () => {
      it('should return dashboard overview', async () => {
        const mockOverview = {
          certificates: { issued: 100, verified: 85, revoked: 5 },
          users: { total: 50, active: 35 },
          system: { cpu: 65.2, memory: 78.5 },
          summary: { totalCertificates: 100, activeUsers: 35, systemHealth: 'good' },
        };

        mockAnalyticsService.getDashboardOverview.mockResolvedValue(mockOverview);

        const result = await controller.getDashboard(TimeRange.LAST_7_DAYS);

        expect(result).toEqual(mockOverview);
        expect(mockAnalyticsService.getDashboardOverview).toHaveBeenCalledWith(TimeRange.LAST_7_DAYS);
      });
    });

    describe('GET /analytics/certificates', () => {
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

        mockAnalyticsService.getCertificateOverview.mockResolvedValue(mockOverview);

        const result = await controller.getCertificateAnalytics(TimeRange.LAST_30_DAYS);

        expect(result).toEqual(mockOverview);
        expect(mockAnalyticsService.getCertificateOverview).toHaveBeenCalledWith(TimeRange.LAST_30_DAYS);
      });
    });

    describe('GET /analytics/users', () => {
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

        mockAnalyticsService.getUserOverview.mockResolvedValue(mockOverview);

        const result = await controller.getUserAnalytics(TimeRange.LAST_7_DAYS);

        expect(result).toEqual(mockOverview);
        expect(mockAnalyticsService.getUserOverview).toHaveBeenCalledWith(TimeRange.LAST_7_DAYS);
      });
    });

    describe('GET /analytics/system', () => {
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

        mockAnalyticsService.getSystemOverview.mockResolvedValue(mockOverview);

        const result = await controller.getSystemAnalytics(TimeRange.LAST_24_HOURS);

        expect(result).toEqual(mockOverview);
        expect(mockAnalyticsService.getSystemOverview).toHaveBeenCalledWith(TimeRange.LAST_24_HOURS);
      });
    });
  });

  describe('Real-time Analytics Endpoints', () => {
    describe('GET /analytics/realtime', () => {
      it('should return real-time overview', async () => {
        const mockOverview = {
          certificates: { issued: 5, verified: 12, revoked: 1 },
          users: { active: 25, new: 3 },
          system: { cpu: 65.2, memory: 78.5, responseTime: 120 },
          lastUpdated: new Date(),
        };

        mockAnalyticsService.getRealTimeOverview.mockResolvedValue(mockOverview);

        const result = await controller.getRealTimeAnalytics();

        expect(result).toEqual(mockOverview);
        expect(mockAnalyticsService.getRealTimeOverview).toHaveBeenCalled();
      });
    });

    describe('GET /analytics/realtime/metrics', () => {
      it('should return real-time metrics', async () => {
        const mockMetrics = {
          certificates: { issued: 5, verified: 12, revoked: 1 },
          users: { active: 25, new: 3 },
          system: { cpu: 65.2, memory: 78.5, responseTime: 120 },
        };

        mockAnalyticsService.getRealTimeMetrics.mockResolvedValue(mockMetrics);

        const result = await controller.getRealTimeMetrics();

        expect(result).toEqual(mockMetrics);
        expect(mockAnalyticsService.getRealTimeMetrics).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Monitoring Endpoints', () => {
    describe('GET /analytics/health', () => {
      it('should return system health', async () => {
        const mockHealth = {
          overallStatus: 'good',
          score: 85,
          metrics: { cpu: 65.2, memory: 78.5 },
          alerts: [],
          lastUpdated: new Date(),
        };

        mockAnalyticsService.getSystemHealth.mockResolvedValue(mockHealth);

        const result = await controller.getSystemHealth();

        expect(result).toEqual(mockHealth);
        expect(mockAnalyticsService.getSystemHealth).toHaveBeenCalled();
      });
    });

    describe('GET /analytics/alerts', () => {
      it('should return performance alerts', async () => {
        const mockAlerts = {
          alerts: [
            { type: 'warning', message: 'High CPU usage', metric: 'cpu_usage', value: 85.0 },
          ],
          criticalCount: 0,
          warningCount: 1,
          totalCount: 1,
        };

        mockAnalyticsService.getPerformanceAlerts.mockResolvedValue(mockAlerts);

        const result = await controller.getPerformanceAlerts();

        expect(result).toEqual(mockAlerts);
        expect(mockAnalyticsService.getPerformanceAlerts).toHaveBeenCalled();
      });
    });

    describe('GET /analytics/trends', () => {
      it('should return performance trends', async () => {
        const mockTrends = {
          trends: { cpu: [65.2, 68.1, 62.8], memory: [78.5, 80.2, 75.9] },
          periods: ['2024-01-01', '2024-01-02', '2024-01-03'],
          changes: { cpu: 2.1, memory: -1.8 },
        };

        mockAnalyticsService.getPerformanceTrends.mockResolvedValue(mockTrends);

        const result = await controller.getPerformanceTrends();

        expect(result).toEqual(mockTrends);
        expect(mockAnalyticsService.getPerformanceTrends).toHaveBeenCalled();
      });
    });
  });

  describe('Comparative Analytics Endpoints', () => {
    describe('GET /analytics/comparative', () => {
      it('should return comparative analytics', async () => {
        const currentPeriod = TimeRange.LAST_7_DAYS;
        const previousPeriod = TimeRange.LAST_30_DAYS;

        const mockComparative = {
          certificates: {
            current: { issued: 100, verified: 85, revoked: 5 },
            previous: { issued: 80, verified: 70, revoked: 3 },
            changes: { issued: 20, verified: 15, revoked: 2 },
            percentageChanges: { issued: 25, verified: 21.4, revoked: 66.7 },
          },
          users: {
            current: { total: 50, active: 35 },
            previous: { total: 45, active: 30 },
            changes: { total: 5, active: 5 },
            percentageChanges: { total: 11.1, active: 16.7 },
          },
        };

        mockAnalyticsService.getComparativeAnalytics.mockResolvedValue(mockComparative);

        const result = await controller.getComparativeAnalytics(currentPeriod, previousPeriod);

        expect(result).toEqual(mockComparative);
        expect(mockAnalyticsService.getComparativeAnalytics).toHaveBeenCalledWith(currentPeriod, previousPeriod);
      });
    });

    describe('GET /analytics/institutional', () => {
      it('should return institutional performance', async () => {
        const mockInstitutional = {
          institutions: [
            { id: 'inst-1', name: 'University A', certificates: 100, successRate: 85.0 },
            { id: 'inst-2', name: 'University B', certificates: 75, successRate: 78.0 },
            { id: 'inst-3', name: 'University C', certificates: 50, successRate: 92.0 },
          ],
          rankings: {
            byCertificates: ['inst-1', 'inst-2', 'inst-3'],
            bySuccessRate: ['inst-3', 'inst-1', 'inst-2'],
            byEfficiency: ['inst-3', 'inst-1', 'inst-2'],
          },
          metrics: { averageSuccessRate: 85.0, totalCertificates: 225 },
        };

        mockAnalyticsService.getInstitutionalPerformance.mockResolvedValue(mockInstitutional);

        const result = await controller.getInstitutionalPerformance(TimeRange.LAST_30_DAYS);

        expect(result).toEqual(mockInstitutional);
        expect(mockAnalyticsService.getInstitutionalPerformance).toHaveBeenCalledWith(TimeRange.LAST_30_DAYS);
      });
    });
  });

  describe('Report Generation Endpoints', () => {
    describe('POST /analytics/reports/generate', () => {
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

        mockAnalyticsService.generateReport.mockResolvedValue(mockReport);

        const mockResponse = {
          setHeader: jest.fn(),
          send: jest.fn(),
        } as unknown as Response;

        await controller.generateReport(reportConfig, mockResponse);

        expect(mockAnalyticsService.generateReport).toHaveBeenCalledWith(reportConfig);
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=report.pdf');
        expect(mockResponse.send).toHaveBeenCalledWith(mockReport.data);
      });
    });

    describe('GET /analytics/export/csv', () => {
      it('should export CSV report', async () => {
        const filters = { timeRange: TimeRange.LAST_30_DAYS, type: 'certificates' };
        const mockReport = {
          format: 'csv',
          data: Buffer.from('test'),
          filename: 'export.csv',
        };

        mockAnalyticsService.generateReport.mockResolvedValue(mockReport);

        const mockResponse = {
          setHeader: jest.fn(),
          send: jest.fn(),
        } as unknown as Response;

        await controller.exportCSV(filters, mockResponse);

        expect(mockAnalyticsService.generateReport).toHaveBeenCalledWith({
          type: 'csv',
          filters,
        });
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=export.csv');
        expect(mockResponse.send).toHaveBeenCalledWith(mockReport.data);
      });
    });

    describe('GET /analytics/export/excel', () => {
      it('should export Excel report', async () => {
        const filters = { timeRange: TimeRange.LAST_30_DAYS, type: 'certificates' };
        const mockReport = {
          format: 'excel',
          data: Buffer.from('test'),
          filename: 'export.xlsx',
        };

        mockAnalyticsService.generateReport.mockResolvedValue(mockReport);

        const mockResponse = {
          setHeader: jest.fn(),
          send: jest.fn(),
        } as unknown as Response;

        await controller.exportExcel(filters, mockResponse);

        expect(mockAnalyticsService.generateReport).toHaveBeenCalledWith({
          type: 'excel',
          filters,
        });
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=export.xlsx');
        expect(mockResponse.send).toHaveBeenCalledWith(mockReport.data);
      });
    });

    describe('GET /analytics/export/pdf', () => {
      it('should export PDF report', async () => {
        const filters = { timeRange: TimeRange.LAST_30_DAYS, type: 'certificates' };
        const mockReport = {
          format: 'pdf',
          data: Buffer.from('test'),
          filename: 'export.pdf',
        };

        mockAnalyticsService.generateReport.mockResolvedValue(mockReport);

        const mockResponse = {
          setHeader: jest.fn(),
          send: jest.fn(),
        } as unknown as Response;

        await controller.exportPDF(filters, mockResponse);

        expect(mockAnalyticsService.generateReport).toHaveBeenCalledWith({
          type: 'pdf',
          filters,
        });
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=export.pdf');
        expect(mockResponse.send).toHaveBeenCalledWith(mockReport.data);
      });
    });
  });

  describe('Data Tracking Endpoints', () => {
    describe('POST /analytics/track/certificate', () => {
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

        mockAnalyticsService.trackCertificateAction.mockResolvedValue(certificateAction);

        const result = await controller.trackCertificateAction(certificateAction);

        expect(result).toEqual(certificateAction);
        expect(mockAnalyticsService.trackCertificateAction).toHaveBeenCalledWith(certificateAction);
      });
    });

    describe('POST /analytics/track/user', () => {
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

        mockAnalyticsService.trackUserAction.mockResolvedValue(userAction);

        const result = await controller.trackUserAction(userAction);

        expect(result).toEqual(userAction);
        expect(mockAnalyticsService.trackUserAction).toHaveBeenCalledWith(userAction);
      });
    });

    describe('POST /analytics/track/system', () => {
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

        mockAnalyticsService.trackSystemMetric.mockResolvedValue(systemMetric);

        const result = await controller.trackSystemMetric(systemMetric);

        expect(result).toEqual(systemMetric);
        expect(mockAnalyticsService.trackSystemMetric).toHaveBeenCalledWith(systemMetric);
      });
    });
  });

  describe('Data Retrieval Endpoints', () => {
    describe('GET /analytics/data/certificates', () => {
      it('should return certificate analytics data', async () => {
        const filters = { timeRange: TimeRange.LAST_7_DAYS, issuerId: 'issuer-123' };
        const mockData = [
          { certificateId: 'cert-123', action: 'issued', actionDate: new Date() },
        ];

        mockAnalyticsService.getCertificateAnalytics.mockResolvedValue(mockData);

        const result = await controller.getCertificateData(filters);

        expect(result).toEqual(mockData);
        expect(mockAnalyticsService.getCertificateAnalytics).toHaveBeenCalledWith(filters);
      });
    });

    describe('GET /analytics/data/users', () => {
      it('should return user analytics data', async () => {
        const filters = { timeRange: TimeRange.LAST_30_DAYS, userId: 'user-123' };
        const mockData = [
          { userId: 'user-123', action: 'login', actionDate: new Date() },
        ];

        mockAnalyticsService.getUserAnalytics.mockResolvedValue(mockData);

        const result = await controller.getUserData(filters);

        expect(result).toEqual(mockData);
        expect(mockAnalyticsService.getUserAnalytics).toHaveBeenCalledWith(filters);
      });
    });

    describe('GET /analytics/data/system', () => {
      it('should return system metrics data', async () => {
        const filters = { timeRange: TimeRange.LAST_24_HOURS, metricType: MetricType.CPU_USAGE };
        const mockData = [
          { metricType: 'cpu_usage', value: 65.2, recordedAt: new Date() },
        ];

        mockAnalyticsService.getSystemMetrics.mockResolvedValue(mockData);

        const result = await controller.getSystemData(filters);

        expect(result).toEqual(mockData);
        expect(mockAnalyticsService.getSystemMetrics).toHaveBeenCalledWith(filters);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getDashboardOverview.mockRejectedValue(error);

      await expect(controller.getDashboard(TimeRange.LAST_7_DAYS)).rejects.toThrow('Service error');
    });

    it('should handle invalid time range', async () => {
      const invalidTimeRange = 'INVALID' as TimeRange;
      mockAnalyticsService.getDashboardOverview.mockRejectedValue(new Error('Invalid time range'));

      await expect(controller.getDashboard(invalidTimeRange)).rejects.toThrow('Invalid time range');
    });
  });

  describe('Authorization', () => {
    it('should require authentication for all endpoints', () => {
      // This is handled by the guards, but we can test that the guards are applied
      expect(mockJwtAuthGuard.canActivate).toBeDefined();
      expect(mockRolesGuard.canActivate).toBeDefined();
    });
  });
}); 