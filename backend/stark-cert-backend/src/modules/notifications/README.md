# Notification System

A comprehensive notification system for CertShield that supports email, SMS, and in-app notifications with real-time delivery, analytics, and user preference management.

## Features

### ✅ Core Features
- **Multi-channel Delivery**: Email, SMS, and in-app notifications
- **Real-time Updates**: WebSocket-based instant notifications
- **Template System**: Professional and customizable email/SMS templates
- **User Preferences**: Granular control over notification settings
- **Scheduling**: Support for scheduled and bulk notifications
- **Analytics**: Comprehensive delivery tracking and insights
- **Quiet Hours**: Configurable do-not-disturb periods

### ✅ Delivery Channels

#### Email Notifications
- SMTP integration with configurable providers
- HTML and text email support
- Template rendering with Handlebars
- Bulk email delivery
- Delivery tracking and bounce handling

#### SMS Notifications
- Twilio integration for SMS delivery
- Template support for SMS messages
- Phone number validation
- Bulk SMS delivery
- Delivery status tracking

#### In-App Notifications
- Real-time WebSocket delivery
- User-specific notification rooms
- Read/unread status tracking
- Notification preferences respect
- Real-time unread count updates

### ✅ Template System
- Professional email templates with HTML support
- SMS template support with variable substitution
- Category-based template organization
- Template validation and testing
- Default templates for common scenarios

### ✅ User Preferences
- Channel-specific preferences (email, SMS, in-app)
- Category-based notification filtering
- Frequency settings (immediate, daily, weekly)
- Quiet hours configuration
- Timezone support

### ✅ Scheduling & Bulk Messaging
- Scheduled notification delivery
- Bulk notification campaigns
- Retry logic with exponential backoff
- Queue management and monitoring
- Cancellation and rescheduling support

### ✅ Analytics & Reporting
- Delivery rate tracking
- Channel performance metrics
- Category-based analytics
- User engagement statistics
- Real-time metrics dashboard
- Export capabilities

## Architecture

```
notifications/
├── services/
│   ├── notifications.service.ts          # Main orchestration service
│   ├── email.service.ts                  # Email delivery service
│   ├── sms.service.ts                    # SMS delivery service
│   ├── in-app-notification.service.ts    # In-app notification service
│   ├── notification-template.service.ts   # Template management
│   ├── notification-preferences.service.ts # User preferences
│   ├── notification-scheduler.service.ts  # Scheduling and bulk messaging
│   └── notification-analytics.service.ts  # Analytics and reporting
├── entities/
│   ├── notification.entity.ts            # Main notification entity
│   ├── notification-template.entity.ts    # Template entity
│   ├── notification-preference.entity.ts  # User preferences entity
│   ├── notification-delivery.entity.ts    # Delivery tracking entity
│   └── notification-analytics.entity.ts   # Analytics entity
├── gateways/
│   └── notification.gateway.ts           # WebSocket gateway
├── dto/
│   └── create-notification.dto.ts        # API DTOs
├── notifications.controller.ts            # REST API controller
└── notifications.module.ts               # Module configuration
```

## Configuration

### Environment Variables

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@certshield.com

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL for WebSocket CORS
FRONTEND_URL=http://localhost:3000
```

### Database Tables

The system creates the following database tables:

- `notifications` - Main notification records
- `notification_templates` - Email and SMS templates
- `notification_preferences` - User notification settings
- `notification_deliveries` - Delivery tracking
- `notification_analytics` - Analytics events

## API Endpoints

### Notifications

```typescript
// Create notification
POST /notifications
{
  "userId": "uuid",
  "title": "Certificate Issued",
  "message": "Your certificate has been issued",
  "category": "certificate_issued",
  "priority": "normal",
  "templateId": "optional-template-id",
  "templateData": { "certificateName": "Web Development" }
}

// Get user notifications
GET /notifications?page=1&limit=20&unreadOnly=true

// Mark as read
PUT /notifications/:id/read

// Mark all as read
PUT /notifications/read-all

// Get unread count
GET /notifications/unread-count

// Get notification stats
GET /notifications/stats
```

### Templates

```typescript
// Create template
POST /notifications/templates
{
  "name": "Certificate Issued Email",
  "type": "email",
  "subject": "Certificate Issued - {{certificateName}}",
  "content": "Your certificate {{certificateName}} has been issued",
  "htmlContent": "<div>...</div>",
  "variables": ["certificateName", "issueDate"],
  "category": "certificate_issued"
}

// Get templates
GET /notifications/templates?type=email&category=certificate_issued

// Update template
PUT /notifications/templates/:id

// Delete template
DELETE /notifications/templates/:id
```

### Preferences

```typescript
// Get user preferences
GET /notifications/preferences

// Update preferences
PUT /notifications/preferences
{
  "emailEnabled": true,
  "smsEnabled": false,
  "inAppEnabled": true,
  "categories": {
    "certificate_issued": true,
    "certificate_revoked": true
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00",
    "timezone": "UTC"
  }
}

// Update category preference
PUT /notifications/preferences/category/:category
{
  "enabled": true
}
```

### Scheduling

```typescript
// Schedule notification
POST /notifications/schedule
{
  "userId": "uuid",
  "title": "Reminder",
  "message": "Don't forget to renew your certificate",
  "category": "certificate_expired",
  "scheduledAt": "2024-01-15T10:00:00Z"
}

// Schedule bulk notifications
POST /notifications/schedule/bulk
{
  "userIds": ["uuid1", "uuid2"],
  "title": "System Maintenance",
  "message": "Scheduled maintenance tonight",
  "category": "system_maintenance",
  "scheduledAt": "2024-01-15T22:00:00Z"
}

// Get scheduled notifications
GET /notifications/schedule?userId=uuid&status=pending

// Cancel scheduled notification
DELETE /notifications/schedule/:id
```

### Analytics

```typescript
// Get delivery stats
GET /notifications/analytics/delivery?startDate=2024-01-01&endDate=2024-01-31

// Get category stats
GET /notifications/analytics/categories

// Get channel stats
GET /notifications/analytics/channels

// Get real-time metrics
GET /notifications/analytics/realtime

// Generate report
GET /notifications/analytics/report

// Export analytics
GET /notifications/analytics/export
```

## WebSocket Events

### Client Events

```typescript
// Mark notification as read
socket.emit('markAsRead', { notificationId: 'uuid' });

// Mark all as read
socket.emit('markAllAsRead');

// Get notifications
socket.emit('getNotifications', { page: 1, limit: 20 });

// Get notification stats
socket.emit('getNotificationStats');

// Update preferences
socket.emit('updatePreferences', { preferences: {...} });
```

### Server Events

```typescript
// New notification
socket.on('newNotification', (notification) => {
  console.log('New notification:', notification);
});

// Unread count update
socket.on('unreadCount', ({ count }) => {
  console.log('Unread count:', count);
});

// Recent notifications
socket.on('recentNotifications', (notifications) => {
  console.log('Recent notifications:', notifications);
});

// Notification read confirmation
socket.on('notificationRead', ({ notificationId }) => {
  console.log('Notification read:', notificationId);
});
```

## Usage Examples

### Certificate Lifecycle Notifications

```typescript
// Certificate issued
await notificationsService.sendCertificateNotification(
  userId,
  certificateId,
  certificateName,
  'issued',
  { issueDate: new Date(), expiryDate: expiryDate }
);

// Certificate revoked
await notificationsService.sendCertificateNotification(
  userId,
  certificateId,
  certificateName,
  'revoked'
);

// Certificate expired
await notificationsService.sendCertificateNotification(
  userId,
  certificateId,
  certificateName,
  'expired'
);
```

### System Notifications

```typescript
// Send system maintenance notification
await notificationsService.sendSystemNotification(
  userIds,
  'System Maintenance',
  'Scheduled maintenance tonight from 10 PM to 2 AM',
  'system_maintenance',
  'normal'
);
```

### Bulk Notifications

```typescript
// Send bulk notification
const result = await notificationsService.sendBulkNotifications({
  userId: 'all', // Special keyword for all users
  title: 'New Feature Available',
  message: 'Check out our new certificate verification feature',
  category: 'user_activity',
  priority: 'normal'
});
```

### Template Usage

```typescript
// Create template
const template = await templateService.createTemplate({
  name: 'Welcome Email',
  type: 'email',
  subject: 'Welcome to CertShield, {{name}}!',
  content: 'Welcome {{name}}, thank you for joining CertShield!',
  htmlContent: '<h1>Welcome {{name}}!</h1><p>Thank you for joining CertShield!</p>',
  variables: ['name'],
  category: 'user_activity'
});

// Use template in notification
await notificationsService.createNotification({
  userId,
  title: 'Welcome',
  message: 'Welcome to CertShield!',
  category: 'user_activity',
  templateId: template.id,
  templateData: { name: 'John Doe' }
});
```

## Performance Considerations

### Real-time Delivery
- WebSocket connections are lightweight and efficient
- User-specific rooms prevent unnecessary broadcasts
- Connection pooling and cleanup prevent memory leaks

### Bulk Operations
- Batch processing for large notification campaigns
- Database transactions for consistency
- Retry logic with exponential backoff

### Analytics
- Asynchronous event tracking
- Database indexing for fast queries
- Caching for frequently accessed metrics

## Security

### Authentication
- JWT-based authentication for API endpoints
- User-specific WebSocket connections
- Authorization checks for all operations

### Data Protection
- Encrypted sensitive data
- Audit logging for all operations
- GDPR-compliant data handling

### Rate Limiting
- API rate limiting to prevent abuse
- WebSocket connection limits
- Bulk operation throttling

## Monitoring

### Health Checks
- Service health monitoring
- Database connection monitoring
- External service status (SMTP, SMS)

### Metrics
- Delivery success rates
- Response times
- Error rates and types
- User engagement metrics

### Alerts
- High failure rates
- Service downtime
- Unusual activity patterns

## Testing

### Unit Tests
- Service method testing
- Template rendering tests
- Preference validation tests

### Integration Tests
- API endpoint testing
- WebSocket event testing
- Database operation testing

### End-to-End Tests
- Complete notification flow testing
- Multi-channel delivery testing
- User preference testing

## Deployment

### Docker Support
- Containerized application
- Environment-based configuration
- Health check endpoints

### Environment Configuration
- Development, staging, production configs
- Environment-specific templates
- Feature flags for gradual rollout

### Scaling
- Horizontal scaling support
- Database connection pooling
- Redis for session management (optional)

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP configuration
   - Verify email credentials
   - Check firewall settings

2. **SMS not delivering**
   - Verify Twilio credentials
   - Check phone number format
   - Review Twilio logs

3. **WebSocket connection issues**
   - Check CORS configuration
   - Verify authentication
   - Check network connectivity

4. **Template rendering errors**
   - Validate template syntax
   - Check variable names
   - Test with sample data

### Debug Mode
Enable debug logging for detailed troubleshooting:

```typescript
// In your environment
DEBUG=notifications:*
```

## Contributing

### Code Style
- Follow NestJS conventions
- Use TypeScript strict mode
- Comprehensive error handling
- Detailed documentation

### Testing
- Write tests for new features
- Maintain test coverage
- Include integration tests

### Documentation
- Update API documentation
- Add usage examples
- Document configuration changes 