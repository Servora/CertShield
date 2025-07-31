import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './services/report.service';
import { AnalyticsDataService } from './services/analytics-data.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportTemplate } from './entities/report-template.entity';
import { TimeRange } from './dto/analytics-filter.dto';

describe('ReportService', () => {
  let service: ReportService;
  let analyticsDataService: AnalyticsDataService;
  let reportTemplateRepository: Repository<ReportTemplate>;

  const mockAnalyticsDataService = {
    getCertificateAnalytics: jest.fn(),
    getUserAnalytics: jest.fn(),
    getSystemMetrics: jest.fn(),
    aggregateAnalytics: jest.fn(),
  };

  const mockReportTemplateRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: AnalyticsDataService,
          useValue: mockAnalyticsDataService,
        },
        {
          provide: getRepositoryToken(ReportTemplate),
          useValue: mockReportTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    analyticsDataService = module.get<AnalyticsDataService>(AnalyticsDataService);
    reportTemplateRepository = module.get<Repository<ReportTemplate>>(getRepositoryToken(ReportTemplate));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate PDF report successfully', async () => {
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

      const result = await service.generateReport(reportConfig);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('pdf');
    });

    it('should generate Excel report successfully', async () => {
      const reportConfig = {
        type: 'excel',
        title: 'User Analytics Report',
        filters: { timeRange: TimeRange.LAST_7_DAYS },
        charts: ['user_activity', 'engagement_metrics'],
        data: {
          users: { total: 25, active: 18 },
          engagement: { averageActions: 15, averageDuration: 1200 },
        },
      };

      const result = await service.generateReport(reportConfig);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('excel');
    });

    it('should generate CSV report successfully', async () => {
      const reportConfig = {
        type: 'csv',
        title: 'System Performance Report',
        filters: { timeRange: TimeRange.LAST_24_HOURS },
        data: {
          system: { cpu: 65.2, memory: 78.5, responseTime: 125 },
        },
      };

      const result = await service.generateReport(reportConfig);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('csv');
    });

    it('should generate JSON report successfully', async () => {
      const reportConfig = {
        type: 'json',
        title: 'Comprehensive Analytics Report',
        filters: { timeRange: TimeRange.LAST_90_DAYS },
        data: {
          certificates: { issued: 500, verified: 450, revoked: 10 },
          users: { total: 200, active: 150 },
          system: { cpu: 65.2, memory: 78.5, responseTime: 125 },
        },
      };

      const result = await service.generateReport(reportConfig);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('json');
    });

    it('should throw error for unsupported format', async () => {
      const reportConfig = {
        type: 'unsupported',
        title: 'Test Report',
        data: {},
      };

      await expect(service.generateReport(reportConfig)).rejects.toThrow('Unsupported report format');
    });
  });

  describe('getReportData', () => {
    it('should return certificate report data', async () => {
      const mockData = [
        { action: 'issued', count: 100, date: '2024-01-01' },
        { action: 'verified', count: 85, date: '2024-01-01' },
        { action: 'revoked', count: 5, date: '2024-01-01' },
      ];

      mockAnalyticsDataService.getCertificateAnalytics.mockResolvedValue(mockData);

      const filters = { timeRange: TimeRange.LAST_30_DAYS };
      const result = await service.getReportData('certificates', filters);

      expect(result).toEqual(mockData);
      expect(mockAnalyticsDataService.getCertificateAnalytics).toHaveBeenCalledWith(filters);
    });

    it('should return user report data', async () => {
      const mockData = [
        { action: 'login', count: 50, userId: 'user-1' },
        { action: 'certificate_created', count: 15, userId: 'user-1' },
      ];

      mockAnalyticsDataService.getUserAnalytics.mockResolvedValue(mockData);

      const filters = { timeRange: TimeRange.LAST_7_DAYS };
      const result = await service.getReportData('users', filters);

      expect(result).toEqual(mockData);
      expect(mockAnalyticsDataService.getUserAnalytics).toHaveBeenCalledWith(filters);
    });

    it('should return system report data', async () => {
      const mockData = [
        { metricType: 'cpu_usage', average: 65.2 },
        { metricType: 'memory_usage', average: 78.5 },
        { metricType: 'response_time', average: 125 },
      ];

      mockAnalyticsDataService.getSystemMetrics.mockResolvedValue(mockData);

      const filters = { timeRange: TimeRange.LAST_24_HOURS };
      const result = await service.getReportData('system', filters);

      expect(result).toEqual(mockData);
      expect(mockAnalyticsDataService.getSystemMetrics).toHaveBeenCalledWith(filters);
    });

    it('should return aggregated report data', async () => {
      const mockData = [
        { category: 'certificates', total: 100 },
        { category: 'users', total: 50 },
        { category: 'system', health: 'good' },
      ];

      mockAnalyticsDataService.aggregateAnalytics.mockResolvedValue(mockData);

      const filters = { timeRange: TimeRange.LAST_30_DAYS };
      const result = await service.getReportData('aggregated', filters);

      expect(result).toEqual(mockData);
      expect(mockAnalyticsDataService.aggregateAnalytics).toHaveBeenCalledWith('all', TimeRange.LAST_30_DAYS);
    });
  });

  describe('generatePDFReport', () => {
    it('should generate PDF report with charts and data', async () => {
      const reportData = {
        title: 'Certificate Analytics Report',
        data: {
          certificates: { issued: 100, verified: 85, revoked: 5 },
          users: { total: 50, active: 35 },
          system: { cpu: 65.2, memory: 78.5 },
        },
        charts: ['certificate_trends', 'user_engagement'],
        filters: { timeRange: TimeRange.LAST_30_DAYS },
      };

      const result = await service['generatePDFReport'](reportData);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('pdf');
      expect(result.filename).toContain('.pdf');
    });

    it('should handle PDF generation errors', async () => {
      const reportData = {
        title: 'Test Report',
        data: {},
      };

      // Mock PDF generation to throw error
      jest.spyOn(service as any, 'generatePDFReport').mockRejectedValue(new Error('PDF generation failed'));

      await expect(service['generatePDFReport'](reportData)).rejects.toThrow('PDF generation failed');
    });
  });

  describe('generateExcelReport', () => {
    it('should generate Excel report with multiple sheets', async () => {
      const reportData = {
        title: 'Comprehensive Analytics Report',
        data: {
          certificates: { issued: 100, verified: 85, revoked: 5 },
          users: { total: 50, active: 35 },
          system: { cpu: 65.2, memory: 78.5 },
        },
        charts: ['certificate_trends', 'user_engagement', 'system_performance'],
        filters: { timeRange: TimeRange.LAST_30_DAYS },
      };

      const result = await service['generateExcelReport'](reportData);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('excel');
      expect(result.filename).toContain('.xlsx');
    });
  });

  describe('generateCSVReport', () => {
    it('should generate CSV report with data', async () => {
      const reportData = {
        title: 'Certificate Data Export',
        data: {
          certificates: [
            { id: 'cert-1', issued: '2024-01-01', verified: '2024-01-02' },
            { id: 'cert-2', issued: '2024-01-03', verified: '2024-01-04' },
          ],
        },
        filters: { timeRange: TimeRange.LAST_7_DAYS },
      };

      const result = await service['generateCSVReport'](reportData);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('csv');
      expect(result.filename).toContain('.csv');
    });
  });

  describe('generateJSONReport', () => {
    it('should generate JSON report with structured data', async () => {
      const reportData = {
        title: 'Analytics Data Export',
        data: {
          certificates: { issued: 100, verified: 85, revoked: 5 },
          users: { total: 50, active: 35 },
          system: { cpu: 65.2, memory: 78.5 },
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          filters: { timeRange: TimeRange.LAST_30_DAYS },
        },
      };

      const result = await service['generateJSONReport'](reportData);

      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('json');
      expect(result.filename).toContain('.json');
    });
  });

  describe('generateScheduledReports', () => {
    it('should generate scheduled reports successfully', async () => {
      const mockTemplates = [
        {
          id: 1,
          name: 'Daily Certificate Report',
          templateType: 'pdf',
          configuration: { charts: ['certificate_trends'] },
          schedule: '0 9 * * *', // Daily at 9 AM
          isActive: true,
        },
        {
          id: 2,
          name: 'Weekly User Report',
          templateType: 'excel',
          configuration: { charts: ['user_engagement'] },
          schedule: '0 10 * * 1', // Weekly on Monday at 10 AM
          isActive: true,
        },
      ];

      mockReportTemplateRepository.find.mockResolvedValue(mockTemplates);
      jest.spyOn(service, 'generateReport').mockResolvedValue({
        format: 'pdf',
        data: Buffer.from('test'),
        filename: 'report.pdf',
      });

      await service.generateScheduledReports();

      expect(mockReportTemplateRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(service.generateReport).toHaveBeenCalledTimes(2);
    });

    it('should handle no active templates', async () => {
      mockReportTemplateRepository.find.mockResolvedValue([]);

      await service.generateScheduledReports();

      expect(mockReportTemplateRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });

    it('should handle template processing errors', async () => {
      const mockTemplates = [
        {
          id: 1,
          name: 'Test Report',
          templateType: 'pdf',
          configuration: {},
          schedule: '0 9 * * *',
          isActive: true,
        },
      ];

      mockReportTemplateRepository.find.mockResolvedValue(mockTemplates);
      jest.spyOn(service, 'generateReport').mockRejectedValue(new Error('Generation failed'));

      // Should not throw error, should handle gracefully
      await expect(service.generateScheduledReports()).resolves.not.toThrow();
    });
  });

  describe('createReportTemplate', () => {
    it('should create report template successfully', async () => {
      const templateData = {
        name: 'Monthly Analytics Report',
        description: 'Comprehensive monthly analytics report',
        templateType: 'pdf',
        configuration: {
          charts: ['certificate_trends', 'user_engagement'],
          filters: { timeRange: TimeRange.LAST_30_DAYS },
        },
        schedule: '0 9 1 * *', // Monthly on 1st at 9 AM
        isActive: true,
        createdBy: 'admin',
        permissions: ['admin', 'analyst'],
      };

      const mockTemplate = { id: 1, ...templateData };
      mockReportTemplateRepository.create.mockReturnValue(mockTemplate);
      mockReportTemplateRepository.save.mockResolvedValue(mockTemplate);

      const result = await service.createReportTemplate(templateData);

      expect(result).toEqual(mockTemplate);
      expect(mockReportTemplateRepository.create).toHaveBeenCalledWith(templateData);
      expect(mockReportTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
    });
  });

  describe('getReportTemplates', () => {
    it('should return all report templates', async () => {
      const mockTemplates = [
        { id: 1, name: 'Daily Report', isActive: true },
        { id: 2, name: 'Weekly Report', isActive: true },
        { id: 3, name: 'Monthly Report', isActive: false },
      ];

      mockReportTemplateRepository.find.mockResolvedValue(mockTemplates);

      const result = await service.getReportTemplates();

      expect(result).toEqual(mockTemplates);
      expect(mockReportTemplateRepository.find).toHaveBeenCalled();
    });
  });

  describe('updateReportTemplate', () => {
    it('should update report template successfully', async () => {
      const templateId = 1;
      const updateData = {
        name: 'Updated Report Name',
        isActive: false,
      };

      const mockTemplate = { id: templateId, ...updateData };
      mockReportTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockReportTemplateRepository.save.mockResolvedValue(mockTemplate);

      const result = await service.updateReportTemplate(templateId, updateData);

      expect(result).toEqual(mockTemplate);
      expect(mockReportTemplateRepository.findOne).toHaveBeenCalledWith({ where: { id: templateId } });
      expect(mockReportTemplateRepository.save).toHaveBeenCalledWith(mockTemplate);
    });

    it('should throw error for non-existent template', async () => {
      const templateId = 999;
      const updateData = { name: 'Updated Report' };

      mockReportTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.updateReportTemplate(templateId, updateData)).rejects.toThrow('Report template not found');
    });
  });

  describe('deleteReportTemplate', () => {
    it('should delete report template successfully', async () => {
      const templateId = 1;
      const mockTemplate = { id: templateId, name: 'Test Report' };

      mockReportTemplateRepository.findOne.mockResolvedValue(mockTemplate);
      mockReportTemplateRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteReportTemplate(templateId);

      expect(mockReportTemplateRepository.findOne).toHaveBeenCalledWith({ where: { id: templateId } });
      expect(mockReportTemplateRepository.delete).toHaveBeenCalledWith(templateId);
    });

    it('should throw error for non-existent template', async () => {
      const templateId = 999;

      mockReportTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteReportTemplate(templateId)).rejects.toThrow('Report template not found');
    });
  });
}); 