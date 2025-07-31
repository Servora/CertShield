import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsDataService } from './services/analytics-data.service';
import { AnalyticsEntity } from './entities/analytics.entity';
import { CertificateAnalytics } from './entities/certificate-analytics.entity';
import { UserAnalytics } from './entities/user-analytics.entity';
import { SystemMetrics } from './entities/system-metrics.entity';
import { TimeRange, MetricType } from './dto/analytics-filter.dto';

describe('AnalyticsDataService', () => {
  let service: AnalyticsDataService;
  let analyticsRepository: Repository<AnalyticsEntity>;
  let certificateAnalyticsRepository: Repository<CertificateAnalytics>;
  let userAnalyticsRepository: Repository<UserAnalytics>;
  let systemMetricsRepository: Repository<SystemMetrics>;

  const mockAnalyticsRepository = {
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  const mockCertificateAnalyticsRepository = {
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  const mockUserAnalyticsRepository = {
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  const mockSystemMetricsRepository = {
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsDataService,
        {
          provide: getRepositoryToken(AnalyticsEntity),
          useValue: mockAnalyticsRepository,
        },
        {
          provide: getRepositoryToken(CertificateAnalytics),
          useValue: mockCertificateAnalyticsRepository,
        },
        {
          provide: getRepositoryToken(UserAnalytics),
          useValue: mockUserAnalyticsRepository,
        },
        {
          provide: getRepositoryToken(SystemMetrics),
          useValue: mockSystemMetricsRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsDataService>(AnalyticsDataService);
    analyticsRepository = module.get<Repository<AnalyticsEntity>>(getRepositoryToken(AnalyticsEntity));
    certificateAnalyticsRepository = module.get<Repository<CertificateAnalytics>>(getRepositoryToken(CertificateAnalytics));
    userAnalyticsRepository = module.get<Repository<UserAnalytics>>(getRepositoryToken(UserAnalytics));
    systemMetricsRepository = module.get<Repository<SystemMetrics>>(getRepositoryToken(SystemMetrics));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackCertificateAction', () => {
    it('should track certificate action successfully', async () => {
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

      mockCertificateAnalyticsRepository.save.mockResolvedValue(certificateAction);

      const result = await service.trackCertificateAction(certificateAction);

      expect(mockCertificateAnalyticsRepository.save).toHaveBeenCalledWith(certificateAction);
      expect(result).toEqual(certificateAction);
    });

    it('should handle tracking errors gracefully', async () => {
      const certificateAction = {
        certificateId: 'cert-123',
        action: 'issued',
        actionDate: new Date(),
      };

      mockCertificateAnalyticsRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.trackCertificateAction(certificateAction)).rejects.toThrow('Database error');
    });
  });

  describe('trackUserAction', () => {
    it('should track user action successfully', async () => {
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

      mockUserAnalyticsRepository.save.mockResolvedValue(userAction);

      const result = await service.trackUserAction(userAction);

      expect(mockUserAnalyticsRepository.save).toHaveBeenCalledWith(userAction);
      expect(result).toEqual(userAction);
    });
  });

  describe('trackSystemMetric', () => {
    it('should track system metric successfully', async () => {
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

      mockSystemMetricsRepository.save.mockResolvedValue(systemMetric);

      const result = await service.trackSystemMetric(systemMetric);

      expect(mockSystemMetricsRepository.save).toHaveBeenCalledWith(systemMetric);
      expect(result).toEqual(systemMetric);
    });
  });

  describe('aggregateAnalytics', () => {
    it('should aggregate analytics data for certificates', async () => {
      const mockData = [
        { action: 'issued', count: 10 },
        { action: 'verified', count: 25 },
        { action: 'revoked', count: 2 },
      ];

      mockCertificateAnalyticsRepository.createQueryBuilder().getMany.mockResolvedValue(mockData);

      const result = await service.aggregateAnalytics('certificates', TimeRange.LAST_7_DAYS);

      expect(result).toEqual(mockData);
    });

    it('should aggregate analytics data for users', async () => {
      const mockData = [
        { action: 'login', count: 50 },
        { action: 'certificate_created', count: 15 },
      ];

      mockUserAnalyticsRepository.createQueryBuilder().getMany.mockResolvedValue(mockData);

      const result = await service.aggregateAnalytics('users', TimeRange.LAST_30_DAYS);

      expect(result).toEqual(mockData);
    });

    it('should aggregate analytics data for system metrics', async () => {
      const mockData = [
        { metricType: 'cpu_usage', average: 65.2 },
        { metricType: 'memory_usage', average: 78.5 },
      ];

      mockSystemMetricsRepository.createQueryBuilder().getMany.mockResolvedValue(mockData);

      const result = await service.aggregateAnalytics('system', TimeRange.LAST_24_HOURS);

      expect(result).toEqual(mockData);
    });
  });

  describe('getCertificateAnalytics', () => {
    it('should return certificate analytics with filters', async () => {
      const mockData = [
        {
          certificateId: 'cert-123',
          action: 'issued',
          actionDate: new Date(),
          issuerId: 'issuer-123',
        },
      ];

      mockCertificateAnalyticsRepository.createQueryBuilder().getMany.mockResolvedValue(mockData);

      const filters = {
        timeRange: TimeRange.LAST_7_DAYS,
        issuerId: 'issuer-123',
        action: 'issued',
      };

      const result = await service.getCertificateAnalytics(filters);

      expect(result).toEqual(mockData);
    });
  });

  describe('getUserAnalytics', () => {
    it('should return user analytics with filters', async () => {
      const mockData = [
        {
          userId: 'user-123',
          action: 'login',
          actionDate: new Date(),
          sessionId: 'session-123',
        },
      ];

      mockUserAnalyticsRepository.createQueryBuilder().getMany.mockResolvedValue(mockData);

      const filters = {
        timeRange: TimeRange.LAST_30_DAYS,
        userId: 'user-123',
        action: 'login',
      };

      const result = await service.getUserAnalytics(filters);

      expect(result).toEqual(mockData);
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics with filters', async () => {
      const mockData = [
        {
          metricType: 'cpu_usage',
          recordedAt: new Date(),
          value: 75.5,
          component: 'server',
        },
      ];

      mockSystemMetricsRepository.createQueryBuilder().getMany.mockResolvedValue(mockData);

      const filters = {
        timeRange: TimeRange.LAST_24_HOURS,
        metricType: MetricType.CPU_USAGE,
        component: 'server',
      };

      const result = await service.getSystemMetrics(filters);

      expect(result).toEqual(mockData);
    });
  });

  describe('getRealTimeMetrics', () => {
    it('should return real-time metrics', async () => {
      const mockData = {
        certificates: { issued: 5, verified: 12, revoked: 1 },
        users: { active: 25, new: 3 },
        system: { cpu: 65.2, memory: 78.5, responseTime: 120 },
      };

      jest.spyOn(service, 'getCertificateAnalytics').mockResolvedValue([]);
      jest.spyOn(service, 'getUserAnalytics').mockResolvedValue([]);
      jest.spyOn(service, 'getSystemMetrics').mockResolvedValue([]);

      const result = await service.getRealTimeMetrics();

      expect(result).toHaveProperty('certificates');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('system');
    });
  });

  describe('applyDateFilter', () => {
    it('should apply LAST_24_HOURS filter correctly', () => {
      const result = service['applyDateFilter'](TimeRange.LAST_24_HOURS);
      const now = new Date();
      const expectedDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
    });

    it('should apply LAST_7_DAYS filter correctly', () => {
      const result = service['applyDateFilter'](TimeRange.LAST_7_DAYS);
      const now = new Date();
      const expectedDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
    });

    it('should apply LAST_30_DAYS filter correctly', () => {
      const result = service['applyDateFilter'](TimeRange.LAST_30_DAYS);
      const now = new Date();
      const expectedDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
    });

    it('should apply LAST_90_DAYS filter correctly', () => {
      const result = service['applyDateFilter'](TimeRange.LAST_90_DAYS);
      const now = new Date();
      const expectedDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expectedDate.getTime(), -2);
    });

    it('should return null for ALL_TIME filter', () => {
      const result = service['applyDateFilter'](TimeRange.ALL_TIME);
      expect(result).toBeNull();
    });
  });
}); 