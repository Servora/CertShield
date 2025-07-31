import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './services/dashboard.service';
import { AnalyticsDataService } from './services/analytics-data.service';
import { TimeRange } from './dto/analytics-filter.dto';

describe('DashboardService', () => {
  let service: DashboardService;
  let analyticsDataService: AnalyticsDataService;

  const mockAnalyticsDataService = {
    getCertificateAnalytics: jest.fn(),
    getUserAnalytics: jest.fn(),
    getSystemMetrics: jest.fn(),
    aggregateAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: AnalyticsDataService,
          useValue: mockAnalyticsDataService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    analyticsDataService = module.get<AnalyticsDataService>(AnalyticsDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardOverview', () => {
    it('should return comprehensive dashboard overview', async () => {
      const mockCertificateData = [
        { action: 'issued', count: 15 },
        { action: 'verified', count: 42 },
        { action: 'revoked', count: 3 },
      ];

      const mockUserData = [
        { action: 'login', count: 120 },
        { action: 'certificate_created', count: 25 },
      ];

      const mockSystemData = [
        { metricType: 'cpu_usage', average: 65.2 },
        { metricType: 'memory_usage', average: 78.5 },
        { metricType: 'response_time', average: 125 },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockCertificateData);
      mockAnalyticsDataService.getUserAnalytics.mockResolvedValue(mockUserData);
      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockSystemData);

      const result = await service.getDashboardOverview(TimeRange.LAST_7_DAYS);

      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalCertificates');
      expect(result.summary).toHaveProperty('activeUsers');
      expect(result.summary).toHaveProperty('systemHealth');
    });
  });

  describe('getCertificateOverview', () => {
    it('should return certificate overview with trends', async () => {
      const mockData = [
        { action: 'issued', count: 15, date: '2024-01-01' },
        { action: 'verified', count: 42, date: '2024-01-01' },
        { action: 'revoked', count: 3, date: '2024-01-01' },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockData);

      const result = await service.getCertificateOverview(TimeRange.LAST_7_DAYS);

      expect(result).toHaveProperty('totalIssued');
      expect(result).toHaveProperty('totalVerified');
      expect(result).toHaveProperty('totalRevoked');
      expect(result).toHaveProperty('successRate');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('topIssuers');
      expect(result).toHaveProperty('topRecipients');
    });

    it('should calculate success rate correctly', async () => {
      const mockData = [
        { action: 'issued', count: 100 },
        { action: 'verified', count: 80 },
        { action: 'revoked', count: 5 },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockData);

      const result = await service.getCertificateOverview(TimeRange.LAST_30_DAYS);

      // Success rate should be (verified / (issued + verified)) * 100
      const expectedSuccessRate = (80 / (100 + 80)) * 100;
      expect(result.successRate).toBeCloseTo(expectedSuccessRate, 1);
    });
  });

  describe('getUserOverview', () => {
    it('should return user overview with engagement metrics', async () => {
      const mockData = [
        { action: 'login', count: 120, userId: 'user-1' },
        { action: 'certificate_created', count: 25, userId: 'user-1' },
        { action: 'certificate_viewed', count: 85, userId: 'user-1' },
      ];

      mockAnalyticsDataService.getUserAnalytics.mockResolvedValue(mockData);

      const result = await service.getUserOverview(TimeRange.LAST_7_DAYS);

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('newUsers');
      expect(result).toHaveProperty('engagementRate');
      expect(result).toHaveProperty('averageSessionDuration');
      expect(result).toHaveProperty('topUsers');
      expect(result).toHaveProperty('userActivity');
    });
  });

  describe('getSystemOverview', () => {
    it('should return system overview with performance metrics', async () => {
      const mockData = [
        { metricType: 'cpu_usage', average: 65.2, status: 'normal' },
        { metricType: 'memory_usage', average: 78.5, status: 'warning' },
        { metricType: 'response_time', average: 125, status: 'normal' },
        { metricType: 'error_rate', average: 2.1, status: 'normal' },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockData);

      const result = await service.getSystemOverview(TimeRange.LAST_24_HOURS);

      expect(result).toHaveProperty('cpuUsage');
      expect(result).toHaveProperty('memoryUsage');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('systemHealth');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('performanceTrends');
    });
  });

  describe('getRealTimeOverview', () => {
    it('should return real-time overview', async () => {
      const mockCertificateData = [
        { action: 'issued', count: 5 },
        { action: 'verified', count: 12 },
      ];

      const mockUserData = [
        { action: 'login', count: 25 },
        { action: 'active', count: 15 },
      ];

      const mockSystemData = [
        { metricType: 'cpu_usage', value: 65.2 },
        { metricType: 'memory_usage', value: 78.5 },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockCertificateData);
      mockAnalyticsDataService.getUserAnalytics.mockResolvedValue(mockUserData);
      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockSystemData);

      const result = await service.getRealTimeOverview();

      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('system');
      expect(result).toHaveProperty('lastUpdated');
    });
  });

  describe('getCertificateTrends', () => {
    it('should return certificate trends over time', async () => {
      const mockData = [
        { date: '2024-01-01', issued: 10, verified: 15, revoked: 1 },
        { date: '2024-01-02', issued: 12, verified: 18, revoked: 0 },
        { date: '2024-01-03', issued: 8, verified: 22, revoked: 2 },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockData);

      const result = await service.getCertificateTrends(TimeRange.LAST_7_DAYS);

      expect(result).toHaveProperty('dates');
      expect(result).toHaveProperty('issued');
      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('revoked');
      expect(result).toHaveProperty('growthRate');
    });
  });

  describe('getTopIssuers', () => {
    it('should return top certificate issuers', async () => {
      const mockData = [
        { issuerId: 'issuer-1', count: 50, name: 'University A' },
        { issuerId: 'issuer-2', count: 35, name: 'University B' },
        { issuerId: 'issuer-3', count: 25, name: 'University C' },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockData);

      const result = await service.getTopIssuers(TimeRange.LAST_30_DAYS, 10);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('issuerId');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('percentage');
    });
  });

  describe('getTopRecipients', () => {
    it('should return top certificate recipients', async () => {
      const mockData = [
        { recipientId: 'recipient-1', count: 15, name: 'John Doe' },
        { recipientId: 'recipient-2', count: 12, name: 'Jane Smith' },
        { recipientId: 'recipient-3', count: 8, name: 'Bob Johnson' },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockData);

      const result = await service.getTopRecipients(TimeRange.LAST_30_DAYS, 10);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('recipientId');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('percentage');
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users data', async () => {
      const mockData = [
        { userId: 'user-1', sessionCount: 5, lastActivity: new Date() },
        { userId: 'user-2', sessionCount: 3, lastActivity: new Date() },
        { userId: 'user-3', sessionCount: 7, lastActivity: new Date() },
      ];

      mockAnalyticsDataService.getUserAnalytics.mockResolvedValue(mockData);

      const result = await service.getActiveUsers(TimeRange.LAST_24_HOURS);

      expect(result).toHaveProperty('totalActive');
      expect(result).toHaveProperty('uniqueUsers');
      expect(result).toHaveProperty('averageSessions');
      expect(result).toHaveProperty('userList');
    });
  });

  describe('getUserEngagement', () => {
    it('should return user engagement metrics', async () => {
      const mockData = [
        { userId: 'user-1', actions: 25, duration: 1800 },
        { userId: 'user-2', actions: 18, duration: 1200 },
        { userId: 'user-3', actions: 32, duration: 2400 },
      ];

      mockAnalyticsDataService.getUserAnalytics.mockResolvedValue(mockData);

      const result = await service.getUserEngagement(TimeRange.LAST_7_DAYS);

      expect(result).toHaveProperty('averageActions');
      expect(result).toHaveProperty('averageDuration');
      expect(result).toHaveProperty('engagementScore');
      expect(result).toHaveProperty('topEngagedUsers');
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends', async () => {
      const mockData = [
        { date: '2024-01-01', cpu: 65.2, memory: 78.5, responseTime: 125 },
        { date: '2024-01-02', cpu: 68.1, memory: 80.2, responseTime: 118 },
        { date: '2024-01-03', cpu: 62.8, memory: 75.9, responseTime: 132 },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockData);

      const result = await service.getPerformanceTrends(TimeRange.LAST_7_DAYS);

      expect(result).toHaveProperty('dates');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('trends');
    });
  });

  describe('calculateSystemHealth', () => {
    it('should calculate system health correctly', () => {
      const metrics = {
        cpu: 65.2,
        memory: 78.5,
        responseTime: 125,
        errorRate: 2.1,
      };

      const result = service['calculateSystemHealth'](metrics);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('alerts');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return critical status for high metrics', () => {
      const metrics = {
        cpu: 95.0,
        memory: 90.0,
        responseTime: 500,
        errorRate: 15.0,
      };

      const result = service['calculateSystemHealth'](metrics);

      expect(result.status).toBe('critical');
      expect(result.alerts).toHaveLength(4);
    });
  });

  describe('calculateSuccessRate', () => {
    it('should calculate success rate correctly', () => {
      const issued = 100;
      const verified = 80;
      const revoked = 5;

      const result = service['calculateSuccessRate'](issued, verified, revoked);

      // Success rate should be (verified / (issued + verified)) * 100
      const expected = (80 / (100 + 80)) * 100;
      expect(result).toBeCloseTo(expected, 1);
    });

    it('should handle zero values', () => {
      const result = service['calculateSuccessRate'](0, 0, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement score correctly', () => {
      const actions = 25;
      const duration = 1800; // 30 minutes in seconds
      const sessions = 3;

      const result = service['calculateEngagementScore'](actions, duration, sessions);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should handle zero values', () => {
      const result = service['calculateEngagementScore'](0, 0, 0);
      expect(result).toBe(0);
    });
  });
}); 