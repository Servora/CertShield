import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsDataService } from './analytics-data.service';
import { DashboardService } from './dashboard.service';
import { ReportTemplate } from '../entities/report-template.entity';
import { ReportGenerationDto, AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(ReportTemplate)
    private reportTemplateRepository: Repository<ReportTemplate>,
    private analyticsDataService: AnalyticsDataService,
    private dashboardService: DashboardService,
  ) {}

  async generateReport(reportDto: ReportGenerationDto): Promise<{ filePath: string; fileName: string }> {
    try {
      const template = await this.reportTemplateRepository.findOne({
        where: { id: reportDto.templateId },
      });

      if (!template) {
        throw new Error('Report template not found');
      }

      const filter: AnalyticsFilterDto = {
        startDate: reportDto.startDate,
        endDate: reportDto.endDate,
        ...reportDto.filters,
      };

      const data = await this.getReportData(template, filter);
      const exportFormats = reportDto.exportFormats || template.exportFormats;

      if (exportFormats.includes('pdf')) {
        return await this.generatePDFReport(template, data, filter);
      } else if (exportFormats.includes('excel')) {
        return await this.generateExcelReport(template, data, filter);
      } else if (exportFormats.includes('csv')) {
        return await this.generateCSVReport(template, data, filter);
      } else {
        return await this.generateJSONReport(template, data, filter);
      }
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`);
      throw error;
    }
  }

  async getReportData(template: ReportTemplate, filter: AnalyticsFilterDto): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    // Get dashboard overview data
    data.overview = await this.dashboardService.getDashboardOverview(filter);

    // Get specific analytics based on template type
    switch (template.templateType) {
      case 'certificate_analytics':
        data.certificates = await this.analyticsDataService.getCertificateAnalytics(filter);
        data.trends = await this.getCertificateTrends(filter);
        break;
      case 'user_analytics':
        data.users = await this.analyticsDataService.getUserAnalytics(filter);
        data.engagement = await this.dashboardService.getUserEngagement(filter);
        break;
      case 'system_performance':
        data.system = await this.analyticsDataService.getSystemMetrics(filter);
        data.performance = await this.dashboardService.getPerformanceTrends(filter);
        break;
      case 'custom':
        data.custom = await this.getCustomReportData(template, filter);
        break;
    }

    return data;
  }

  private async generatePDFReport(
    template: ReportTemplate,
    data: Record<string, any>,
    filter: AnalyticsFilterDto,
  ): Promise<{ filePath: string; fileName: string }> {
    const doc = new PDFDocument();
    const fileName = `report_${template.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add report header
    doc.fontSize(24).text('CertShield Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Template: ${template.name}`, { align: 'center' });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Add date range
    if (filter.startDate && filter.endDate) {
      doc.fontSize(12).text(`Period: ${filter.startDate} to ${filter.endDate}`, { align: 'center' });
      doc.moveDown();
    }

    // Add overview section
    doc.fontSize(16).text('Overview', { underline: true });
    doc.moveDown();
    this.addPDFOverviewSection(doc, data.overview);

    // Add specific sections based on template type
    switch (template.templateType) {
      case 'certificate_analytics':
        this.addPDFCertificateSection(doc, data);
        break;
      case 'user_analytics':
        this.addPDFUserSection(doc, data);
        break;
      case 'system_performance':
        this.addPDFSystemSection(doc, data);
        break;
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({ filePath, fileName });
      });
      stream.on('error', reject);
    });
  }

  private async generateExcelReport(
    template: ReportTemplate,
    data: Record<string, any>,
    filter: AnalyticsFilterDto,
  ): Promise<{ filePath: string; fileName: string }> {
    const workbook = new ExcelJS.Workbook();
    const fileName = `report_${template.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Add overview worksheet
    const overviewSheet = workbook.addWorksheet('Overview');
    this.addExcelOverviewSheet(overviewSheet, data.overview);

    // Add specific worksheets based on template type
    switch (template.templateType) {
      case 'certificate_analytics':
        this.addExcelCertificateSheet(workbook, data);
        break;
      case 'user_analytics':
        this.addExcelUserSheet(workbook, data);
        break;
      case 'system_performance':
        this.addExcelSystemSheet(workbook, data);
        break;
    }

    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
  }

  private async generateCSVReport(
    template: ReportTemplate,
    data: Record<string, any>,
    filter: AnalyticsFilterDto,
  ): Promise<{ filePath: string; fileName: string }> {
    const fileName = `report_${template.name}_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let csvContent = '';

    // Add header
    csvContent += 'Metric,Value\n';

    // Add overview data
    csvContent += this.convertToCSV(data.overview);

    // Add specific data based on template type
    switch (template.templateType) {
      case 'certificate_analytics':
        csvContent += this.convertCertificateDataToCSV(data);
        break;
      case 'user_analytics':
        csvContent += this.convertUserDataToCSV(data);
        break;
      case 'system_performance':
        csvContent += this.convertSystemDataToCSV(data);
        break;
    }

    fs.writeFileSync(filePath, csvContent);
    return { filePath, fileName };
  }

  private async generateJSONReport(
    template: ReportTemplate,
    data: Record<string, any>,
    filter: AnalyticsFilterDto,
  ): Promise<{ filePath: string; fileName: string }> {
    const fileName = `report_${template.name}_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const reportData = {
      template: template.name,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filter.startDate,
        endDate: filter.endDate,
      },
      data,
    };

    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    return { filePath, fileName };
  }

  // PDF Helper Methods
  private addPDFOverviewSection(doc: PDFKit.PDFDocument, overview: any): void {
    doc.fontSize(14).text('Certificate Statistics', { underline: true });
    doc.fontSize(12).text(`Total Issued: ${overview.certificates.totalIssued}`);
    doc.fontSize(12).text(`Total Verified: ${overview.certificates.totalVerified}`);
    doc.fontSize(12).text(`Success Rate: ${overview.certificates.successRate}%`);
    doc.moveDown();

    doc.fontSize(14).text('User Statistics', { underline: true });
    doc.fontSize(12).text(`Total Actions: ${overview.users.totalActions}`);
    doc.fontSize(12).text(`Unique Users: ${overview.users.uniqueUsers}`);
    doc.fontSize(12).text(`Active Users: ${overview.users.activeUsers}`);
    doc.moveDown();

    doc.fontSize(14).text('System Statistics', { underline: true });
    doc.fontSize(12).text(`Avg Response Time: ${overview.system.avgResponseTime}ms`);
    doc.fontSize(12).text(`CPU Usage: ${overview.system.avgCpuUsage}%`);
    doc.fontSize(12).text(`Memory Usage: ${overview.system.avgMemoryUsage}%`);
    doc.fontSize(12).text(`Error Rate: ${overview.system.errorRate}%`);
    doc.moveDown();
  }

  private addPDFCertificateSection(doc: PDFKit.PDFDocument, data: any): void {
    doc.addPage();
    doc.fontSize(16).text('Certificate Analytics', { align: 'center' });
    doc.moveDown();

    if (data.certificates) {
      doc.fontSize(14).text('Certificate Actions', { underline: true });
      data.certificates.forEach((item: any) => {
        doc.fontSize(12).text(`${item.group}: ${item.count} (${item.avgProcessingTime}ms avg)`);
      });
      doc.moveDown();
    }

    if (data.trends) {
      doc.fontSize(14).text('Trends', { underline: true });
      data.trends.slice(0, 10).forEach((item: any) => {
        doc.fontSize(12).text(`${item.date}: ${item.issued} issued`);
      });
    }
  }

  private addPDFUserSection(doc: PDFKit.PDFDocument, data: any): void {
    doc.addPage();
    doc.fontSize(16).text('User Analytics', { align: 'center' });
    doc.moveDown();

    if (data.users) {
      doc.fontSize(14).text('User Actions', { underline: true });
      data.users.forEach((item: any) => {
        doc.fontSize(12).text(`${item.group}: ${item.count} actions`);
      });
      doc.moveDown();
    }

    if (data.engagement) {
      doc.fontSize(14).text('Engagement Metrics', { underline: true });
      doc.fontSize(12).text(`Engagement Score: ${data.engagement.engagementScore}%`);
      doc.fontSize(12).text(`Avg Actions per User: ${data.engagement.avgActionsPerUser}`);
    }
  }

  private addPDFSystemSection(doc: PDFKit.PDFDocument, data: any): void {
    doc.addPage();
    doc.fontSize(16).text('System Performance', { align: 'center' });
    doc.moveDown();

    if (data.system) {
      doc.fontSize(14).text('System Metrics', { underline: true });
      data.system.forEach((item: any) => {
        doc.fontSize(12).text(`${item.group}: ${item.avgValue} (avg)`);
      });
      doc.moveDown();
    }

    if (data.performance) {
      doc.fontSize(14).text('Performance Trends', { underline: true });
      data.performance.slice(0, 10).forEach((item: any) => {
        doc.fontSize(12).text(`${item.date}: ${item.avgValue} avg`);
      });
    }
  }

  // Excel Helper Methods
  private addExcelOverviewSheet(worksheet: ExcelJS.Worksheet, overview: any): void {
    worksheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 15 },
    ];

    // Add certificate data
    worksheet.addRow({ category: 'Certificates', metric: 'Total Issued', value: overview.certificates.totalIssued });
    worksheet.addRow({ category: 'Certificates', metric: 'Total Verified', value: overview.certificates.totalVerified });
    worksheet.addRow({ category: 'Certificates', metric: 'Success Rate', value: `${overview.certificates.successRate}%` });

    // Add user data
    worksheet.addRow({ category: 'Users', metric: 'Total Actions', value: overview.users.totalActions });
    worksheet.addRow({ category: 'Users', metric: 'Unique Users', value: overview.users.uniqueUsers });
    worksheet.addRow({ category: 'Users', metric: 'Active Users', value: overview.users.activeUsers });

    // Add system data
    worksheet.addRow({ category: 'System', metric: 'Avg Response Time', value: `${overview.system.avgResponseTime}ms` });
    worksheet.addRow({ category: 'System', metric: 'CPU Usage', value: `${overview.system.avgCpuUsage}%` });
    worksheet.addRow({ category: 'System', metric: 'Memory Usage', value: `${overview.system.avgMemoryUsage}%` });
    worksheet.addRow({ category: 'System', metric: 'Error Rate', value: `${overview.system.errorRate}%` });
  }

  private addExcelCertificateSheet(workbook: ExcelJS.Workbook, data: any): void {
    const worksheet = workbook.addWorksheet('Certificate Analytics');
    
    if (data.certificates) {
      worksheet.columns = [
        { header: 'Action', key: 'action', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Avg Processing Time', key: 'avgProcessingTime', width: 20 },
        { header: 'Success Count', key: 'successCount', width: 15 },
        { header: 'Failed Count', key: 'failedCount', width: 15 },
      ];

      data.certificates.forEach((item: any) => {
        worksheet.addRow({
          action: item.group,
          count: item.count,
          avgProcessingTime: `${item.avgProcessingTime}ms`,
          successCount: item.successCount,
          failedCount: item.failedCount,
        });
      });
    }
  }

  private addExcelUserSheet(workbook: ExcelJS.Workbook, data: any): void {
    const worksheet = workbook.addWorksheet('User Analytics');
    
    if (data.users) {
      worksheet.columns = [
        { header: 'Action', key: 'action', width: 20 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Unique Users', key: 'uniqueUsers', width: 15 },
        { header: 'Avg Duration', key: 'avgDuration', width: 15 },
      ];

      data.users.forEach((item: any) => {
        worksheet.addRow({
          action: item.group,
          count: item.count,
          uniqueUsers: item.uniqueUsers,
          avgDuration: `${item.avgDuration}s`,
        });
      });
    }
  }

  private addExcelSystemSheet(workbook: ExcelJS.Workbook, data: any): void {
    const worksheet = workbook.addWorksheet('System Performance');
    
    if (data.system) {
      worksheet.columns = [
        { header: 'Metric Type', key: 'metricType', width: 20 },
        { header: 'Avg Value', key: 'avgValue', width: 15 },
        { header: 'Max Value', key: 'maxValue', width: 15 },
        { header: 'Min Value', key: 'minValue', width: 15 },
        { header: 'Count', key: 'count', width: 15 },
      ];

      data.system.forEach((item: any) => {
        worksheet.addRow({
          metricType: item.group,
          avgValue: item.avgValue,
          maxValue: item.maxValue,
          minValue: item.minValue,
          count: item.count,
        });
      });
    }
  }

  // CSV Helper Methods
  private convertToCSV(data: any): string {
    let csv = '';
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        csv += this.convertToCSV(value);
      } else {
        csv += `${key},${value}\n`;
      }
    }
    return csv;
  }

  private convertCertificateDataToCSV(data: any): string {
    let csv = '\nCertificate Analytics\n';
    csv += 'Action,Count,Avg Processing Time,Success Count,Failed Count\n';
    
    if (data.certificates) {
      data.certificates.forEach((item: any) => {
        csv += `${item.group},${item.count},${item.avgProcessingTime},${item.successCount},${item.failedCount}\n`;
      });
    }
    
    return csv;
  }

  private convertUserDataToCSV(data: any): string {
    let csv = '\nUser Analytics\n';
    csv += 'Action,Count,Unique Users,Avg Duration\n';
    
    if (data.users) {
      data.users.forEach((item: any) => {
        csv += `${item.group},${item.count},${item.uniqueUsers},${item.avgDuration}\n`;
      });
    }
    
    return csv;
  }

  private convertSystemDataToCSV(data: any): string {
    let csv = '\nSystem Performance\n';
    csv += 'Metric Type,Avg Value,Max Value,Min Value,Count\n';
    
    if (data.system) {
      data.system.forEach((item: any) => {
        csv += `${item.group},${item.avgValue},${item.maxValue},${item.minValue},${item.count}\n`;
      });
    }
    
    return csv;
  }

  // Helper methods
  private async getCertificateTrends(filter: AnalyticsFilterDto): Promise<any[]> {
    // Implementation for getting certificate trends
    return [];
  }

  private async getCustomReportData(template: ReportTemplate, filter: AnalyticsFilterDto): Promise<any> {
    // Implementation for custom report data based on template configuration
    return {};
  }

  // Scheduled report generation
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateScheduledReports(): Promise<void> {
    try {
      const templates = await this.reportTemplateRepository.find({
        where: { isActive: true },
      });

      for (const template of templates) {
        if (template.schedule?.enabled) {
          await this.generateScheduledReport(template);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to generate scheduled reports: ${error.message}`);
    }
  }

  private async generateScheduledReport(template: ReportTemplate): Promise<void> {
    try {
      const reportDto: ReportGenerationDto = {
        templateId: template.id,
        exportFormats: template.exportFormats,
        filters: template.filters,
      };

      const report = await this.generateReport(reportDto);
      this.logger.log(`Generated scheduled report: ${report.fileName}`);

      // TODO: Send report via email if configured
      if (template.schedule?.email) {
        // await this.sendReportEmail(template.schedule.email, report);
      }
    } catch (error) {
      this.logger.error(`Failed to generate scheduled report for template ${template.id}: ${error.message}`);
    }
  }
} 