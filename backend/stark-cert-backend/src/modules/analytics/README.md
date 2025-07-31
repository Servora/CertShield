# Analytics Module

A comprehensive analytics and reporting system for the CertShield backend that provides insights into certificate usage, verification patterns, and system performance metrics.

## Features

### 📊 Dashboard Analytics
- **Certificate Analytics**: Track certificate issuance, verification, revocation, and download patterns
- **User Analytics**: Monitor user activity, engagement, and behavior patterns
- **System Performance**: Real-time monitoring of system health and performance metrics
- **Comparative Analytics**: Compare current period with previous periods for trend analysis

### 📈 Real-time Monitoring
- **Live Metrics**: Real-time tracking of system performance and user activity
- **Performance Alerts**: Automated alerts for system health issues
- **System Health**: Comprehensive health monitoring with status indicators

### 📋 Report Generation
- **Multiple Formats**: Export reports in PDF, Excel, CSV, and JSON formats
- **Custom Templates**: Configurable report templates with filtering options
- **Scheduled Reports**: Automated report generation and delivery
- **Filtering & Export**: Advanced filtering with export functionality

### 🏢 Institutional Performance
- **Comparative Analysis**: Compare performance across different institutions
- **Rankings**: Institutional rankings based on various metrics
- **Performance Metrics**: Success rates, processing times, and engagement scores

## Architecture

### Entities
- `AnalyticsEntity`: Main analytics data storage
- `CertificateAnalytics`: Certificate-specific analytics tracking
- `UserAnalytics`: User behavior and activity tracking
- `SystemMetrics`: System performance metrics
- `ReportTemplate`: Configurable report templates

### Services
- `AnalyticsService`: Main service coordinating all analytics functionality
- `AnalyticsDataService`: Data collection and aggregation
- `DashboardService`: Dashboard data and visualizations
- `ReportService`: Report generation and export functionality
- `PerformanceService`: System performance monitoring

### Controllers
- `AnalyticsController`: REST API endpoints for all analytics functionality

## API Endpoints

### Dashboard & Analytics
```http
GET /analytics/dashboard          # Dashboard overview
GET /analytics/certificates       # Certificate analytics
GET /analytics/users             # User analytics
GET /analytics/system            # System metrics
GET /analytics/realtime          # Real-time metrics
```

### Performance Monitoring
```http
GET /analytics/health            # System health status
GET /analytics/alerts            # Performance alerts
GET /analytics/trends/:timeRange # Performance trends
```

### Comparative Analytics
```http
GET /analytics/comparative       # Comparative analytics
GET /analytics/institutional     # Institutional performance
```

### Report Generation
```http
POST /analytics/reports/generate # Generate custom report
GET /analytics/export/csv        # Export as CSV
GET /analytics/export/excel      # Export as Excel
GET /analytics/export/pdf        # Export as PDF
```

### Data Tracking
```http
POST /analytics/track/certificate # Track certificate action
POST /analytics/track/user        # Track user action
POST /analytics/track/system      # Track system metric
```

## Usage Examples

### Dashboard Overview
```typescript
// Get dashboard overview for last 30 days
const dashboard = await analyticsService.getDashboardOverview({
  timeRange: '30d'
});

// Get dashboard with custom date range
const dashboard = await analyticsService.getDashboardOverview({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Certificate Analytics
```typescript
// Track certificate issuance
await analyticsService.trackCertificateAction({
  certificateId: 'cert-123',
  issuerId: 'issuer-456',
  recipientId: 'recipient-789',
  action: 'issued',
  processingTime: 1500,
  status: 'success'
});

// Get certificate analytics
const analytics = await analyticsService.getCertificateAnalytics({
  timeRange: '7d',
  groupBy: 'action'
});
```

### System Performance Monitoring
```typescript
// Track system metric
await analyticsService.trackSystemMetric({
  metricType: 'cpu_usage',
  value: 75.5,
  unit: 'percentage',
  component: 'system',
  status: 'warning'
});

// Get system health
const health = await analyticsService.getSystemHealth();
```

### Report Generation
```typescript
// Generate PDF report
const report = await analyticsService.generateReport({
  templateId: 'certificate-analytics',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  exportFormats: ['pdf']
});
```

## Configuration

### Environment Variables
```env
# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_BATCH_SIZE=1000

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_ALERT_THRESHOLDS={"cpu": 80, "memory": 85, "error_rate": 5}
```

### Database Migration
The analytics module requires the following database tables:
- `analytics`
- `certificate_analytics`
- `user_analytics`
- `system_metrics`
- `report_templates`

## Performance Considerations

### Data Collection
- Analytics data collection is designed to be non-blocking
- Failed analytics operations don't affect main application flow
- Batch processing for large datasets

### Query Optimization
- Indexed queries for fast data retrieval
- Aggregated data storage for dashboard performance
- Caching for frequently accessed metrics

### Export Performance
- Streaming file generation for large exports
- Background processing for scheduled reports
- Temporary file cleanup after export

## Security

### Access Control
- Role-based access control for analytics endpoints
- Admin-only access for sensitive system metrics
- Issuer-level access for certificate analytics

### Data Privacy
- Anonymized user tracking where possible
- Configurable data retention policies
- Secure export file handling

## Monitoring & Alerts

### System Health
- CPU usage monitoring
- Memory usage tracking
- Database connection monitoring
- API response time tracking

### Performance Alerts
- Configurable thresholds for system metrics
- Automated alert generation
- Alert severity classification

## Future Enhancements

### Planned Features
- **Advanced Visualizations**: Interactive charts and graphs
- **Machine Learning**: Predictive analytics and anomaly detection
- **Custom Dashboards**: User-configurable dashboard layouts
- **API Rate Limiting**: Analytics for API usage patterns
- **Integration**: Third-party analytics platform integration

### Performance Improvements
- **Caching Layer**: Redis-based caching for analytics data
- **Data Archiving**: Automated archiving of old analytics data
- **Real-time Streaming**: WebSocket-based real-time updates
- **Distributed Processing**: Horizontal scaling for analytics processing

## Troubleshooting

### Common Issues
1. **High Memory Usage**: Check analytics data retention settings
2. **Slow Queries**: Verify database indexes are properly configured
3. **Export Failures**: Ensure sufficient disk space for temporary files
4. **Missing Data**: Check analytics tracking is properly integrated

### Debug Mode
Enable debug logging for analytics:
```typescript
// In your application configuration
analytics: {
  debug: true,
  logLevel: 'debug'
}
```

## Contributing

When contributing to the analytics module:

1. Follow the existing code structure and patterns
2. Add comprehensive tests for new features
3. Update documentation for new endpoints
4. Consider performance impact of new features
5. Ensure proper error handling and logging

## License

This module is part of the CertShield project and follows the same licensing terms. 