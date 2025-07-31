import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDataService } from './services/analytics-data.service';
import { ReportService } from './services/report.service';
import { DashboardService } from './services/dashboard.service';
import { PerformanceService } from './services/performance.service';
import { AnalyticsEntity } from './entities/analytics.entity';
import { CertificateAnalytics } from './entities/certificate-analytics.entity';
import { UserAnalytics } from './entities/user-analytics.entity';
import { SystemMetrics } from './entities/system-metrics.entity';
import { ReportTemplate } from './entities/report-template.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalyticsEntity,
      CertificateAnalytics,
      UserAnalytics,
      SystemMetrics,
      ReportTemplate,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsDataService,
    ReportService,
    DashboardService,
    PerformanceService,
  ],
  exports: [
    AnalyticsService,
    AnalyticsDataService,
    ReportService,
    DashboardService,
    PerformanceService,
  ],
})
export class AnalyticsModule {} 