import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsEntity } from './entities/analytics.entity';
import { CertificateAnalytics } from './entities/certificate-analytics.entity';
import { UserAnalytics } from './entities/user-analytics.entity';
import { SystemMetrics } from './entities/system-metrics.entity';
import { ReportTemplate } from './entities/report-template.entity';

export const createTestingModule = async () => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
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
        dropSchema: true,
      }),
      AnalyticsModule,
    ],
  }).compile();
};

export const createMockAnalyticsData = () => ({
  certificateAction: {
    certificateId: 'cert-test-123',
    issuerId: 'issuer-test-123',
    recipientId: 'recipient-test-123',
    action: 'issued',
    actionDate: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    location: 'US',
    processingTime: 150,
    status: 'success',
    metadata: { template: 'standard' },
  },
  userAction: {
    userId: 'user-test-123',
    action: 'login',
    actionDate: new Date(),
    sessionId: 'session-test-123',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    location: 'US',
    duration: 300,
    pageUrl: '/dashboard',
    referrer: '/login',
    deviceInfo: { browser: 'Chrome', os: 'Windows' },
    performanceMetrics: { loadTime: 1200 },
    metadata: { source: 'web' },
  },
  systemMetric: {
    metricType: 'cpu_usage',
    recordedAt: new Date(),
    value: 75.5,
    unit: 'percentage',
    component: 'server',
    endpoint: '/api/certificates',
    metadata: { serverId: 'server-test-1' },
    status: 'warning',
    description: 'High CPU usage detected',
    thresholds: { warning: 70, critical: 90 },
  },
});

export const createMockReportConfig = () => ({
  type: 'pdf',
  title: 'Test Analytics Report',
  filters: { timeRange: 'LAST_7_DAYS' },
  charts: ['certificate_trends', 'user_engagement'],
  data: {
    certificates: { issued: 100, verified: 85, revoked: 5 },
    users: { total: 50, active: 35 },
    system: { cpu: 65.2, memory: 78.5 },
  },
});

export const createMockResponse = () => ({
  setHeader: jest.fn(),
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as any);

export const seedTestData = async (analyticsService: any) => {
  const mockData = createMockAnalyticsData();

  // Seed certificate actions
  await analyticsService.trackCertificateAction(mockData.certificateAction);
  await analyticsService.trackCertificateAction({
    ...mockData.certificateAction,
    certificateId: 'cert-test-456',
    action: 'verified',
  });

  // Seed user actions
  await analyticsService.trackUserAction(mockData.userAction);
  await analyticsService.trackUserAction({
    ...mockData.userAction,
    userId: 'user-test-456',
    action: 'certificate_created',
  });

  // Seed system metrics
  await analyticsService.trackSystemMetric(mockData.systemMetric);
  await analyticsService.trackSystemMetric({
    ...mockData.systemMetric,
    metricType: 'memory_usage',
    value: 78.5,
    status: 'normal',
  });

  return mockData;
};

export const cleanupTestData = async (module: TestingModule) => {
  const connection = module.get('DATABASE_CONNECTION');
  if (connection) {
    await connection.close();
  }
};

export const mockRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
  })),
};

export const mockService = {
  trackCertificateAction: jest.fn(),
  trackUserAction: jest.fn(),
  trackSystemMetric: jest.fn(),
  getCertificateAnalytics: jest.fn(),
  getUserAnalytics: jest.fn(),
  getSystemMetrics: jest.fn(),
  getRealTimeMetrics: jest.fn(),
  aggregateAnalytics: jest.fn(),
  getDashboardOverview: jest.fn(),
  getCertificateOverview: jest.fn(),
  getUserOverview: jest.fn(),
  getSystemOverview: jest.fn(),
  getRealTimeOverview: jest.fn(),
  getSystemHealth: jest.fn(),
  getPerformanceAlerts: jest.fn(),
  getPerformanceTrends: jest.fn(),
  generateReport: jest.fn(),
  getReportData: jest.fn(),
};

export const mockGuard = {
  canActivate: jest.fn(() => true),
};

export const createMockModule = async () => {
  return Test.createTestingModule({
    providers: [
      {
        provide: 'AnalyticsService',
        useValue: mockService,
      },
      {
        provide: 'AnalyticsDataService',
        useValue: mockService,
      },
      {
        provide: 'DashboardService',
        useValue: mockService,
      },
      {
        provide: 'ReportService',
        useValue: mockService,
      },
      {
        provide: 'PerformanceService',
        useValue: mockService,
      },
    ],
  }).compile();
}; 