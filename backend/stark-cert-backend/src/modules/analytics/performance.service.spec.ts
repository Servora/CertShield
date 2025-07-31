import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './services/performance.service';
import { AnalyticsDataService } from './services/analytics-data.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemMetrics } from './entities/system-metrics.entity';
import { MetricType } from './dto/analytics-filter.dto';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let analyticsDataService: AnalyticsDataService;
  let systemMetricsRepository: Repository<SystemMetrics>;

  const mockAnalyticsDataService = {
    trackSystemMetric: jest.fn(),
    getSystemMetrics: jest.fn(),
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
        PerformanceService,
        {
          provide: AnalyticsDataService,
          useValue: mockAnalyticsDataService,
        },
        {
          provide: getRepositoryToken(SystemMetrics),
          useValue: mockSystemMetricsRepository,
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    analyticsDataService = module.get<AnalyticsDataService>(AnalyticsDataService);
    systemMetricsRepository = module.get<Repository<SystemMetrics>>(getRepositoryToken(SystemMetrics));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('collectSystemMetrics', () => {
    it('should collect system metrics successfully', async () => {
      const mockMetrics = [
        { metricType: 'cpu_usage', value: 65.2, status: 'normal' },
        { metricType: 'memory_usage', value: 78.5, status: 'warning' },
        { metricType: 'disk_usage', value: 45.8, status: 'normal' },
      ];

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockMetrics);

      await service.collectSystemMetrics();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledTimes(3);
    });

    it('should handle metric collection errors gracefully', async () => {
      mockAnalyticsDataService.trackSystemMetric.mockRejectedValue(new Error('Collection failed'));

      // Should not throw error, should handle gracefully
      await expect(service.collectSystemMetrics()).resolves.not.toThrow();
    });
  });

  describe('collectPerformanceMetrics', () => {
    it('should collect performance metrics successfully', async () => {
      const mockMetrics = [
        { metricType: 'response_time', value: 125, status: 'normal' },
        { metricType: 'error_rate', value: 2.1, status: 'normal' },
        { metricType: 'throughput', value: 1500, status: 'good' },
      ];

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockMetrics);

      await service.collectPerformanceMetrics();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledTimes(3);
    });
  });

  describe('trackCpuUsage', () => {
    it('should track CPU usage successfully', async () => {
      const mockCpuMetric = {
        metricType: 'cpu_usage',
        recordedAt: new Date(),
        value: 65.2,
        unit: 'percentage',
        component: 'server',
        status: 'normal',
        description: 'CPU usage within normal range',
        thresholds: { warning: 70, critical: 90 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockCpuMetric);

      const result = await service.trackCpuUsage();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'cpu_usage',
          unit: 'percentage',
          component: 'server',
        })
      );
      expect(result).toEqual(mockCpuMetric);
    });

    it('should set correct status based on CPU usage', async () => {
      // Test normal CPU usage
      jest.spyOn(service as any, 'getCpuUsage').mockResolvedValue(65.2);
      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue({ status: 'normal' });

      await service.trackCpuUsage();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'normal',
        })
      );

      // Test warning CPU usage
      jest.spyOn(service as any, 'getCpuUsage').mockResolvedValue(75.0);
      await service.trackCpuUsage();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'warning',
        })
      );

      // Test critical CPU usage
      jest.spyOn(service as any, 'getCpuUsage').mockResolvedValue(95.0);
      await service.trackCpuUsage();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'critical',
        })
      );
    });
  });

  describe('trackMemoryUsage', () => {
    it('should track memory usage successfully', async () => {
      const mockMemoryMetric = {
        metricType: 'memory_usage',
        recordedAt: new Date(),
        value: 78.5,
        unit: 'percentage',
        component: 'server',
        status: 'warning',
        description: 'Memory usage above normal threshold',
        thresholds: { warning: 75, critical: 90 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockMemoryMetric);

      const result = await service.trackMemoryUsage();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'memory_usage',
          unit: 'percentage',
          component: 'server',
        })
      );
      expect(result).toEqual(mockMemoryMetric);
    });
  });

  describe('trackDiskUsage', () => {
    it('should track disk usage successfully', async () => {
      const mockDiskMetric = {
        metricType: 'disk_usage',
        recordedAt: new Date(),
        value: 45.8,
        unit: 'percentage',
        component: 'storage',
        status: 'normal',
        description: 'Disk usage within normal range',
        thresholds: { warning: 80, critical: 95 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockDiskMetric);

      const result = await service.trackDiskUsage();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'disk_usage',
          unit: 'percentage',
          component: 'storage',
        })
      );
      expect(result).toEqual(mockDiskMetric);
    });
  });

  describe('trackNetworkUsage', () => {
    it('should track network usage successfully', async () => {
      const mockNetworkMetric = {
        metricType: 'network_usage',
        recordedAt: new Date(),
        value: 1250,
        unit: 'bytes_per_second',
        component: 'network',
        status: 'normal',
        description: 'Network usage within normal range',
        thresholds: { warning: 1000, critical: 2000 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockNetworkMetric);

      const result = await service.trackNetworkUsage();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'network_usage',
          unit: 'bytes_per_second',
          component: 'network',
        })
      );
      expect(result).toEqual(mockNetworkMetric);
    });
  });

  describe('trackProcessMetrics', () => {
    it('should track process metrics successfully', async () => {
      const mockProcessMetric = {
        metricType: 'process_metrics',
        recordedAt: new Date(),
        value: 15,
        unit: 'count',
        component: 'application',
        status: 'normal',
        description: 'Active processes within normal range',
        metadata: { activeProcesses: 15, totalProcesses: 25 },
        thresholds: { warning: 20, critical: 30 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockProcessMetric);

      const result = await service.trackProcessMetrics();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'process_metrics',
          unit: 'count',
          component: 'application',
        })
      );
      expect(result).toEqual(mockProcessMetric);
    });
  });

  describe('trackResponseTimeMetrics', () => {
    it('should track response time metrics successfully', async () => {
      const mockResponseTimeMetric = {
        metricType: 'response_time',
        recordedAt: new Date(),
        value: 125,
        unit: 'milliseconds',
        component: 'api',
        endpoint: '/api/certificates',
        status: 'normal',
        description: 'API response time within acceptable range',
        thresholds: { warning: 200, critical: 500 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockResponseTimeMetric);

      const result = await service.trackResponseTimeMetrics();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'response_time',
          unit: 'milliseconds',
          component: 'api',
        })
      );
      expect(result).toEqual(mockResponseTimeMetric);
    });
  });

  describe('trackErrorRateMetrics', () => {
    it('should track error rate metrics successfully', async () => {
      const mockErrorRateMetric = {
        metricType: 'error_rate',
        recordedAt: new Date(),
        value: 2.1,
        unit: 'percentage',
        component: 'api',
        status: 'normal',
        description: 'Error rate within acceptable range',
        thresholds: { warning: 5, critical: 10 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockErrorRateMetric);

      const result = await service.trackErrorRateMetrics();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'error_rate',
          unit: 'percentage',
          component: 'api',
        })
      );
      expect(result).toEqual(mockErrorRateMetric);
    });
  });

  describe('trackDatabaseMetrics', () => {
    it('should track database metrics successfully', async () => {
      const mockDatabaseMetric = {
        metricType: 'database_metrics',
        recordedAt: new Date(),
        value: 85,
        unit: 'percentage',
        component: 'database',
        status: 'normal',
        description: 'Database performance within normal range',
        metadata: { connections: 25, queries: 150 },
        thresholds: { warning: 80, critical: 95 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockDatabaseMetric);

      const result = await service.trackDatabaseMetrics();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'database_metrics',
          unit: 'percentage',
          component: 'database',
        })
      );
      expect(result).toEqual(mockDatabaseMetric);
    });
  });

  describe('trackCacheMetrics', () => {
    it('should track cache metrics successfully', async () => {
      const mockCacheMetric = {
        metricType: 'cache_metrics',
        recordedAt: new Date(),
        value: 92.5,
        unit: 'percentage',
        component: 'cache',
        status: 'good',
        description: 'Cache hit rate is excellent',
        metadata: { hitRate: 92.5, missRate: 7.5 },
        thresholds: { warning: 80, critical: 60 },
      };

      mockAnalyticsDataService.trackSystemMetric.mockResolvedValue(mockCacheMetric);

      const result = await service.trackCacheMetrics();

      expect(mockAnalyticsDataService.trackSystemMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          metricType: 'cache_metrics',
          unit: 'percentage',
          component: 'cache',
        })
      );
      expect(result).toEqual(mockCacheMetric);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      const mockMetrics = [
        { metricType: 'cpu_usage', value: 65.2, status: 'normal' },
        { metricType: 'memory_usage', value: 78.5, status: 'warning' },
        { metricType: 'response_time', value: 125, status: 'normal' },
        { metricType: 'error_rate', value: 2.1, status: 'normal' },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockMetrics);

      const result = await service.getSystemHealth();

      expect(result).toHaveProperty('overallStatus');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should calculate health score correctly', async () => {
      const mockMetrics = [
        { metricType: 'cpu_usage', value: 65.2, status: 'normal' },
        { metricType: 'memory_usage', value: 78.5, status: 'warning' },
        { metricType: 'response_time', value: 125, status: 'normal' },
        { metricType: 'error_rate', value: 2.1, status: 'normal' },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockMetrics);

      const result = await service.getSystemHealth();

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.overallStatus).toBeDefined();
    });
  });

  describe('getPerformanceAlerts', () => {
    it('should return performance alerts', async () => {
      const mockMetrics = [
        { metricType: 'cpu_usage', value: 85.0, status: 'warning' },
        { metricType: 'memory_usage', value: 92.0, status: 'critical' },
        { metricType: 'response_time', value: 500, status: 'critical' },
        { metricType: 'error_rate', value: 8.5, status: 'warning' },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockMetrics);

      const result = await service.getPerformanceAlerts();

      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('criticalCount');
      expect(result).toHaveProperty('warningCount');
      expect(result).toHaveProperty('totalCount');
      expect(result.alerts).toBeInstanceOf(Array);
    });

    it('should categorize alerts correctly', async () => {
      const mockMetrics = [
        { metricType: 'cpu_usage', value: 95.0, status: 'critical' },
        { metricType: 'memory_usage', value: 75.0, status: 'warning' },
        { metricType: 'response_time', value: 125, status: 'normal' },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockMetrics);

      const result = await service.getPerformanceAlerts();

      expect(result.criticalCount).toBe(1);
      expect(result.warningCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends', async () => {
      const mockMetrics = [
        { date: '2024-01-01', cpu: 65.2, memory: 78.5, responseTime: 125 },
        { date: '2024-01-02', cpu: 68.1, memory: 80.2, responseTime: 118 },
        { date: '2024-01-03', cpu: 62.8, memory: 75.9, responseTime: 132 },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockMetrics);

      const result = await service.getPerformanceTrends();

      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('periods');
      expect(result).toHaveProperty('changes');
      expect(result.trends).toHaveProperty('cpu');
      expect(result.trends).toHaveProperty('memory');
      expect(result.trends).toHaveProperty('responseTime');
    });
  });

  describe('determineMetricStatus', () => {
    it('should determine normal status correctly', () => {
      const thresholds = { warning: 70, critical: 90 };
      const value = 65.2;

      const result = service['determineMetricStatus'](value, thresholds);

      expect(result).toBe('normal');
    });

    it('should determine warning status correctly', () => {
      const thresholds = { warning: 70, critical: 90 };
      const value = 75.0;

      const result = service['determineMetricStatus'](value, thresholds);

      expect(result).toBe('warning');
    });

    it('should determine critical status correctly', () => {
      const thresholds = { warning: 70, critical: 90 };
      const value = 95.0;

      const result = service['determineMetricStatus'](value, thresholds);

      expect(result).toBe('critical');
    });

    it('should handle missing thresholds', () => {
      const thresholds = {};
      const value = 65.2;

      const result = service['determineMetricStatus'](value, thresholds);

      expect(result).toBe('normal');
    });
  });

  describe('getCpuUsage', () => {
    it('should return CPU usage percentage', async () => {
      const result = await service['getCpuUsage']();

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
      expect(typeof result).toBe('number');
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage percentage', async () => {
      const result = await service['getMemoryUsage']();

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
      expect(typeof result).toBe('number');
    });
  });

  describe('getDiskUsage', () => {
    it('should return disk usage percentage', async () => {
      const result = await service['getDiskUsage']();

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
      expect(typeof result).toBe('number');
    });
  });

  describe('getNetworkUsage', () => {
    it('should return network usage in bytes per second', async () => {
      const result = await service['getNetworkUsage']();

      expect(result).toBeGreaterThanOrEqual(0);
      expect(typeof result).toBe('number');
    });
  });

  describe('getProcessMetrics', () => {
    it('should return process metrics', async () => {
      const result = await service['getProcessMetrics']();

      expect(result).toHaveProperty('activeProcesses');
      expect(result).toHaveProperty('totalProcesses');
      expect(typeof result.activeProcesses).toBe('number');
      expect(typeof result.totalProcesses).toBe('number');
    });
  });

  describe('getResponseTimeMetrics', () => {
    it('should return response time metrics', async () => {
      const result = await service['getResponseTimeMetrics']();

      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('p95ResponseTime');
      expect(result).toHaveProperty('p99ResponseTime');
      expect(typeof result.averageResponseTime).toBe('number');
    });
  });

  describe('getErrorRateMetrics', () => {
    it('should return error rate metrics', async () => {
      const result = await service['getErrorRateMetrics']();

      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('errorCount');
      expect(typeof result.errorRate).toBe('number');
    });
  });

  describe('getDatabaseMetrics', () => {
    it('should return database metrics', async () => {
      const result = await service['getDatabaseMetrics']();

      expect(result).toHaveProperty('connectionCount');
      expect(result).toHaveProperty('queryCount');
      expect(result).toHaveProperty('performance');
      expect(typeof result.performance).toBe('number');
    });
  });

  describe('getCacheMetrics', () => {
    it('should return cache metrics', async () => {
      const result = await service['getCacheMetrics']();

      expect(result).toHaveProperty('hitRate');
      expect(result).toHaveProperty('missRate');
      expect(result).toHaveProperty('size');
      expect(typeof result.hitRate).toBe('number');
    });
  });
}); 