import { IsOptional, IsString, IsDateString, IsArray, IsObject, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum TimeRange {
  LAST_24_HOURS = '24h',
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  LAST_6_MONTHS = '6m',
  LAST_YEAR = '1y',
  CUSTOM = 'custom',
}

export enum MetricType {
  CERTIFICATE_ISSUED = 'certificate_issued',
  CERTIFICATE_VERIFIED = 'certificate_verified',
  CERTIFICATE_REVOKED = 'certificate_revoked',
  USER_ACTIVITY = 'user_activity',
  SYSTEM_PERFORMANCE = 'system_performance',
  ERROR_RATE = 'error_rate',
  RESPONSE_TIME = 'response_time',
}

export class AnalyticsFilterDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metricTypes?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issuerIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientIds?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  groupBy?: string; // 'day', 'week', 'month', 'issuer', 'recipient'

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  offset?: number;
}

export class RealTimeAnalyticsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];

  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  interval?: number; // in seconds
}

export class ReportGenerationDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exportFormats?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsString()
  email?: string;
} 