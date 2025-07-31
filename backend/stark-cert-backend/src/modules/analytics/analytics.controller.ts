import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto, RealTimeAnalyticsDto, ReportGenerationDto } from './dto/analytics-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['24h', '7d', '30d', '90d', '6m', '1y', 'custom'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, type: String })
  async getDashboardOverview(@Query() filter: AnalyticsFilterDto) {
    try {
      return await this.analyticsService.getDashboardOverview(filter);
    } catch (error) {
      throw new HttpException(
        `Failed to get dashboard overview: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('certificates')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get certificate analytics' })
  @ApiResponse({ status: 200, description: 'Certificate analytics retrieved successfully' })
  async getCertificateAnalytics(@Query() filter: AnalyticsFilterDto) {
    try {
      return await this.analyticsService.getCertificateAnalytics(filter);
    } catch (error) {
      throw new HttpException(
        `Failed to get certificate analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics(@Query() filter: AnalyticsFilterDto) {
    try {
      return await this.analyticsService.getUserAnalytics(filter);
    } catch (error) {
      throw new HttpException(
        `Failed to get user analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('system')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved successfully' })
  async getSystemMetrics(@Query() filter: AnalyticsFilterDto) {
    try {
      return await this.analyticsService.getSystemMetrics(filter);
    } catch (error) {
      throw new HttpException(
        `Failed to get system metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('realtime')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get real-time metrics' })
  @ApiResponse({ status: 200, description: 'Real-time metrics retrieved successfully' })
  async getRealTimeMetrics(@Query() dto: RealTimeAnalyticsDto) {
    try {
      return await this.analyticsService.getRealTimeMetrics(dto);
    } catch (error) {
      throw new HttpException(
        `Failed to get real-time metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status retrieved successfully' })
  async getSystemHealth() {
    try {
      return await this.analyticsService.getSystemHealth();
    } catch (error) {
      throw new HttpException(
        `Failed to get system health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get performance alerts' })
  @ApiResponse({ status: 200, description: 'Performance alerts retrieved successfully' })
  async getPerformanceAlerts() {
    try {
      return await this.analyticsService.getPerformanceAlerts();
    } catch (error) {
      throw new HttpException(
        `Failed to get performance alerts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trends/:timeRange')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get performance trends' })
  @ApiResponse({ status: 200, description: 'Performance trends retrieved successfully' })
  async getPerformanceTrends(@Param('timeRange') timeRange: string) {
    try {
      return await this.analyticsService.getPerformanceTrends(timeRange);
    } catch (error) {
      throw new HttpException(
        `Failed to get performance trends: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('comparative')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Get comparative analytics' })
  @ApiResponse({ status: 200, description: 'Comparative analytics retrieved successfully' })
  async getComparativeAnalytics(@Query() filter: AnalyticsFilterDto) {
    try {
      return await this.analyticsService.getComparativeAnalytics(filter);
    } catch (error) {
      throw new HttpException(
        `Failed to get comparative analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('institutional')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get institutional performance analytics' })
  @ApiResponse({ status: 200, description: 'Institutional performance analytics retrieved successfully' })
  async getInstitutionalPerformance(@Query() filter: AnalyticsFilterDto) {
    try {
      return await this.analyticsService.getInstitutionalPerformance(filter);
    } catch (error) {
      throw new HttpException(
        `Failed to get institutional performance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reports/generate')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Generate analytics report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  async generateReport(@Body() reportDto: ReportGenerationDto, @Res() res: Response) {
    try {
      const report = await this.analyticsService.generateReport(reportDto);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
      
      // Stream the file to the response
      const fs = require('fs');
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);
      
      // Clean up the file after streaming
      fileStream.on('end', () => {
        fs.unlink(report.filePath, (err) => {
          if (err) {
            console.error('Failed to delete temporary report file:', err);
          }
        });
      });
    } catch (error) {
      throw new HttpException(
        `Failed to generate report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('track/certificate')
  @ApiOperation({ summary: 'Track certificate action' })
  @ApiResponse({ status: 200, description: 'Certificate action tracked successfully' })
  async trackCertificateAction(@Body() data: {
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
  }) {
    try {
      await this.analyticsService.trackCertificateAction(data);
      return { message: 'Certificate action tracked successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to track certificate action: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('track/user')
  @ApiOperation({ summary: 'Track user action' })
  @ApiResponse({ status: 200, description: 'User action tracked successfully' })
  async trackUserAction(@Body() data: {
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
  }) {
    try {
      await this.analyticsService.trackUserAction(data);
      return { message: 'User action tracked successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to track user action: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('track/system')
  @ApiOperation({ summary: 'Track system metric' })
  @ApiResponse({ status: 200, description: 'System metric tracked successfully' })
  async trackSystemMetric(@Body() data: {
    metricType: string;
    value: number;
    unit?: string;
    component?: string;
    endpoint?: string;
    status?: string;
    description?: string;
    thresholds?: Record<string, any>;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.analyticsService.trackSystemMetric(data);
      return { message: 'System metric tracked successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to track system metric: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export/csv')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Export analytics data as CSV' })
  @ApiResponse({ status: 200, description: 'CSV export generated successfully' })
  async exportCSV(@Query() filter: AnalyticsFilterDto, @Res() res: Response) {
    try {
      const reportDto = {
        templateId: 'csv-export',
        exportFormats: ['csv'],
        filters: filter,
      };

      const report = await this.analyticsService.generateReport(reportDto);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_export_${new Date().toISOString().split('T')[0]}.csv"`);
      
      const fs = require('fs');
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlink(report.filePath, (err) => {
          if (err) {
            console.error('Failed to delete temporary CSV file:', err);
          }
        });
      });
    } catch (error) {
      throw new HttpException(
        `Failed to export CSV: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export/excel')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Export analytics data as Excel' })
  @ApiResponse({ status: 200, description: 'Excel export generated successfully' })
  async exportExcel(@Query() filter: AnalyticsFilterDto, @Res() res: Response) {
    try {
      const reportDto = {
        templateId: 'excel-export',
        exportFormats: ['excel'],
        filters: filter,
      };

      const report = await this.analyticsService.generateReport(reportDto);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      
      const fs = require('fs');
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlink(report.filePath, (err) => {
          if (err) {
            console.error('Failed to delete temporary Excel file:', err);
          }
        });
      });
    } catch (error) {
      throw new HttpException(
        `Failed to export Excel: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export/pdf')
  @Roles(UserRole.ADMIN, UserRole.ISSUER)
  @ApiOperation({ summary: 'Export analytics data as PDF' })
  @ApiResponse({ status: 200, description: 'PDF export generated successfully' })
  async exportPDF(@Query() filter: AnalyticsFilterDto, @Res() res: Response) {
    try {
      const reportDto = {
        templateId: 'pdf-export',
        exportFormats: ['pdf'],
        filters: filter,
      };

      const report = await this.analyticsService.generateReport(reportDto);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_export_${new Date().toISOString().split('T')[0]}.pdf"`);
      
      const fs = require('fs');
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlink(report.filePath, (err) => {
          if (err) {
            console.error('Failed to delete temporary PDF file:', err);
          }
        });
      });
    } catch (error) {
      throw new HttpException(
        `Failed to export PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 