import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsDataService } from './analytics-data.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as os from 'os';
import * as process from 'process';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private analyticsDataService: AnalyticsDataService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async collectSystemMetrics(): Promise<void> {
    try {
      await this.trackCpuUsage();
      await this.trackMemoryUsage();
      await this.trackDiskUsage();
      await this.trackNetworkUsage();
      await this.trackProcessMetrics();
    } catch (error) {
      this.logger.error(`Failed to collect system metrics: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectPerformanceMetrics(): Promise<void> {
    try {
      await this.trackResponseTimeMetrics();
      await this.trackErrorRateMetrics();
      await this.trackDatabaseMetrics();
      await this.trackCacheMetrics();
    } catch (error) {
      this.logger.error(`Failed to collect performance metrics: ${error.message}`);
    }
  }

  async trackCpuUsage(): Promise<void> {
    const cpuUsage = os.loadavg()[0]; // 1-minute load average
    const cpuPercentage = (cpuUsage / os.cpus().length) * 100;

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'cpu_usage',
      value: Math.round(cpuPercentage * 100) / 100,
      unit: 'percentage',
      component: 'system',
      status: this.getMetricStatus(cpuPercentage, 70, 90),
      description: 'CPU usage percentage',
      thresholds: {
        warning: 70,
        critical: 90,
      },
    });
  }

  async trackMemoryUsage(): Promise<void> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'memory_usage',
      value: Math.round(memoryPercentage * 100) / 100,
      unit: 'percentage',
      component: 'system',
      status: this.getMetricStatus(memoryPercentage, 80, 95),
      description: 'Memory usage percentage',
      thresholds: {
        warning: 80,
        critical: 95,
      },
      metadata: {
        totalMemory: totalMemory,
        freeMemory: freeMemory,
        usedMemory: usedMemory,
      },
    });
  }

  async trackDiskUsage(): Promise<void> {
    // This would typically use a library like 'diskusage' or 'node-df'
    // For now, we'll track a placeholder metric
    const diskUsage = 0; // Placeholder

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'disk_usage',
      value: diskUsage,
      unit: 'percentage',
      component: 'system',
      status: this.getMetricStatus(diskUsage, 80, 95),
      description: 'Disk usage percentage',
      thresholds: {
        warning: 80,
        critical: 95,
      },
    });
  }

  async trackNetworkUsage(): Promise<void> {
    // This would typically use network monitoring libraries
    // For now, we'll track a placeholder metric
    const networkUsage = 0; // Placeholder

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'network_usage',
      value: networkUsage,
      unit: 'mbps',
      component: 'network',
      status: this.getMetricStatus(networkUsage, 80, 95),
      description: 'Network usage',
      thresholds: {
        warning: 80,
        critical: 95,
      },
    });
  }

  async trackProcessMetrics(): Promise<void> {
    const processMemory = process.memoryUsage();
    const heapUsagePercentage = (processMemory.heapUsed / processMemory.heapTotal) * 100;

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'heap_usage',
      value: Math.round(heapUsagePercentage * 100) / 100,
      unit: 'percentage',
      component: 'process',
      status: this.getMetricStatus(heapUsagePercentage, 80, 95),
      description: 'Node.js heap usage percentage',
      thresholds: {
        warning: 80,
        critical: 95,
      },
      metadata: {
        heapUsed: processMemory.heapUsed,
        heapTotal: processMemory.heapTotal,
        external: processMemory.external,
        rss: processMemory.rss,
      },
    });
  }

  async trackResponseTimeMetrics(): Promise<void> {
    // This would typically be integrated with request tracking middleware
    // For now, we'll track a placeholder metric
    const avgResponseTime = 0; // Placeholder - would be calculated from actual requests

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'response_time',
      value: avgResponseTime,
      unit: 'milliseconds',
      component: 'api',
      status: this.getMetricStatus(avgResponseTime, 1000, 5000),
      description: 'Average API response time',
      thresholds: {
        warning: 1000,
        critical: 5000,
      },
    });
  }

  async trackErrorRateMetrics(): Promise<void> {
    // This would typically be calculated from error tracking
    // For now, we'll track a placeholder metric
    const errorRate = 0; // Placeholder - would be calculated from actual errors

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'error_rate',
      value: errorRate,
      unit: 'percentage',
      component: 'api',
      status: this.getMetricStatus(errorRate, 5, 15),
      description: 'API error rate percentage',
      thresholds: {
        warning: 5,
        critical: 15,
      },
    });
  }

  async trackDatabaseMetrics(): Promise<void> {
    // This would typically use database monitoring libraries
    // For now, we'll track placeholder metrics
    const dbConnectionCount = 0; // Placeholder
    const dbQueryTime = 0; // Placeholder

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'database_connections',
      value: dbConnectionCount,
      unit: 'count',
      component: 'database',
      status: this.getMetricStatus(dbConnectionCount, 80, 95),
      description: 'Active database connections',
      thresholds: {
        warning: 80,
        critical: 95,
      },
    });

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'database_query_time',
      value: dbQueryTime,
      unit: 'milliseconds',
      component: 'database',
      status: this.getMetricStatus(dbQueryTime, 100, 500),
      description: 'Average database query time',
      thresholds: {
        warning: 100,
        critical: 500,
      },
    });
  }

  async trackCacheMetrics(): Promise<void> {
    // This would typically use cache monitoring libraries
    // For now, we'll track placeholder metrics
    const cacheHitRate = 0; // Placeholder
    const cacheSize = 0; // Placeholder

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'cache_hit_rate',
      value: cacheHitRate,
      unit: 'percentage',
      component: 'cache',
      status: this.getMetricStatus(cacheHitRate, 70, 50, true), // Lower is worse for hit rate
      description: 'Cache hit rate percentage',
      thresholds: {
        warning: 70,
        critical: 50,
      },
    });

    await this.analyticsDataService.trackSystemMetric({
      metricType: 'cache_size',
      value: cacheSize,
      unit: 'mb',
      component: 'cache',
      status: this.getMetricStatus(cacheSize, 80, 95),
      description: 'Cache size in MB',
      thresholds: {
        warning: 80,
        critical: 95,
      },
    });
  }

  async getSystemHealth(): Promise<Record<string, any>> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const metrics = await this.analyticsDataService.getSystemMetrics({
        startDate: oneHourAgo.toISOString(),
        endDate: now.toISOString(),
      });

      const healthStatus = {
        cpu: this.calculateComponentHealth(metrics, 'cpu_usage'),
        memory: this.calculateComponentHealth(metrics, 'memory_usage'),
        disk: this.calculateComponentHealth(metrics, 'disk_usage'),
        network: this.calculateComponentHealth(metrics, 'network_usage'),
        database: this.calculateComponentHealth(metrics, 'database_connections'),
        api: this.calculateComponentHealth(metrics, 'response_time'),
        cache: this.calculateComponentHealth(metrics, 'cache_hit_rate'),
        overall: 'good',
      };

      // Calculate overall health
      const criticalCount = Object.values(healthStatus).filter(status => status === 'critical').length;
      const warningCount = Object.values(healthStatus).filter(status => status === 'warning').length;

      if (criticalCount > 0) {
        healthStatus.overall = 'critical';
      } else if (warningCount > 0) {
        healthStatus.overall = 'warning';
      }

      return {
        status: healthStatus,
        lastUpdated: now.toISOString(),
        metrics: metrics.slice(0, 10), // Return last 10 metrics
      };
    } catch (error) {
      this.logger.error(`Failed to get system health: ${error.message}`);
      throw error;
    }
  }

  async getPerformanceAlerts(): Promise<any[]> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const metrics = await this.analyticsDataService.getSystemMetrics({
        startDate: oneHourAgo.toISOString(),
        endDate: now.toISOString(),
      });

      const alerts: any[] = [];

      metrics.forEach(metric => {
        if (metric.status === 'critical' || metric.status === 'warning') {
          alerts.push({
            id: metric.id,
            metricType: metric.metricType,
            value: metric.value,
            status: metric.status,
            component: metric.component,
            recordedAt: metric.recordedAt,
            description: metric.description,
            severity: metric.status === 'critical' ? 'high' : 'medium',
          });
        }
      });

      return alerts.sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (b.severity === 'high' && a.severity !== 'high') return 1;
        return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
      });
    } catch (error) {
      this.logger.error(`Failed to get performance alerts: ${error.message}`);
      throw error;
    }
  }

  async getPerformanceTrends(timeRange: string = '24h'): Promise<Record<string, any>> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const metrics = await this.analyticsDataService.getSystemMetrics({
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        groupBy: 'metricType',
      });

      const trends: Record<string, any> = {};

      metrics.forEach(metric => {
        if (!trends[metric.group]) {
          trends[metric.group] = {
            avgValue: parseFloat(metric.avgValue) || 0,
            maxValue: parseFloat(metric.maxValue) || 0,
            minValue: parseFloat(metric.minValue) || 0,
            count: parseInt(metric.count) || 0,
          };
        }
      });

      return {
        trends,
        timeRange,
        generatedAt: now.toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get performance trends: ${error.message}`);
      throw error;
    }
  }

  private getMetricStatus(value: number, warningThreshold: number, criticalThreshold: number, lowerIsWorse: boolean = false): string {
    if (lowerIsWorse) {
      if (value <= criticalThreshold) return 'critical';
      if (value <= warningThreshold) return 'warning';
    } else {
      if (value >= criticalThreshold) return 'critical';
      if (value >= warningThreshold) return 'warning';
    }
    return 'normal';
  }

  private calculateComponentHealth(metrics: any[], metricType: string): string {
    const componentMetrics = metrics.filter(m => m.group === metricType);
    if (componentMetrics.length === 0) return 'unknown';

    const latestMetric = componentMetrics[0];
    return latestMetric.status || 'normal';
  }
} 