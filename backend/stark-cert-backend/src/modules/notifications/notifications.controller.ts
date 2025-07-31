import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService, CreateNotificationDto, SendNotificationDto } from './services/notifications.service';
import { NotificationTemplateService, CreateTemplateDto, UpdateTemplateDto } from './services/notification-template.service';
import { NotificationPreferencesService, CreatePreferenceDto, UpdatePreferenceDto } from './services/notification-preferences.service';
import { NotificationSchedulerService, ScheduleNotificationDto, BulkNotificationDto } from './services/notification-scheduler.service';
import { NotificationAnalyticsService, AnalyticsFilter } from './services/notification-analytics.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private templateService: NotificationTemplateService,
    private preferencesService: NotificationPreferencesService,
    private schedulerService: NotificationSchedulerService,
    private analyticsService: NotificationAnalyticsService,
    private notificationGateway: NotificationGateway,
  ) {}

  // Notification Management
  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  async createNotification(@Body() createDto: CreateNotificationDto, @Request() req) {
    try {
      const notification = await this.notificationsService.createNotification({
        ...createDto,
        userId: req.user.id,
      });
      return { success: true, notification };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Request() req,
  ) {
    try {
      const result = await this.notificationsService.getNotifications(req.user.id, {
        page,
        limit,
        status,
        category,
        unreadOnly: unreadOnly === true,
      });
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    try {
      await this.notificationsService.markAsRead(id, req.user.id);
      return { success: true };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req) {
    try {
      await this.notificationsService.markAllAsRead(req.user.id);
      return { success: true };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async deleteNotification(@Param('id') id: string, @Request() req) {
    try {
      await this.notificationsService.deleteNotification(id, req.user.id);
      return { success: true };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req) {
    try {
      const count = await this.notificationsService.getUnreadCount(req.user.id);
      return { count };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getNotificationStats(@Request() req) {
    try {
      const stats = await this.notificationsService.getNotificationStats(req.user.id);
      return stats;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Bulk Notifications
  @Post('bulk')
  @ApiOperation({ summary: 'Send bulk notifications' })
  @ApiResponse({ status: 201, description: 'Bulk notifications sent successfully' })
  async sendBulkNotifications(@Body() sendDto: SendNotificationDto) {
    try {
      const result = await this.notificationsService.sendBulkNotifications(sendDto);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Certificate Notifications
  @Post('certificate/:event')
  @ApiOperation({ summary: 'Send certificate notification' })
  @ApiResponse({ status: 201, description: 'Certificate notification sent successfully' })
  async sendCertificateNotification(
    @Param('event') event: 'issued' | 'verified' | 'revoked' | 'expired',
    @Body() data: { certificateId: string; certificateName: string; additionalData?: Record<string, any> },
    @Request() req,
  ) {
    try {
      const notification = await this.notificationsService.sendCertificateNotification(
        req.user.id,
        data.certificateId,
        data.certificateName,
        event,
        data.additionalData,
      );
      return { success: true, notification };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Templates
  @Post('templates')
  @ApiOperation({ summary: 'Create notification template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() createDto: CreateTemplateDto) {
    try {
      const template = await this.templateService.createTemplate(createDto);
      return { success: true, template };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get notification templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(@Query('type') type?: string, @Query('category') category?: string) {
    try {
      let templates;
      if (type) {
        templates = await this.templateService.getTemplatesByType(type as any);
      } else if (category) {
        templates = await this.templateService.getTemplatesByCategory(category);
      } else {
        templates = await this.templateService.getDefaultTemplates();
      }
      return { templates };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get notification template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  async getTemplate(@Param('id') id: string) {
    try {
      const template = await this.templateService.getTemplate(id);
      return { template };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update notification template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(@Param('id') id: string, @Body() updateDto: UpdateTemplateDto) {
    try {
      const template = await this.templateService.updateTemplate(id, updateDto);
      return { success: true, template };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete notification template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('id') id: string) {
    try {
      await this.templateService.deleteTemplate(id);
      return { success: true };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Preferences
  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  async getPreferences(@Request() req) {
    try {
      const preferences = await this.preferencesService.getPreference(req.user.id);
      return { preferences };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Create user notification preferences' })
  @ApiResponse({ status: 201, description: 'Preferences created successfully' })
  async createPreferences(@Body() createDto: CreatePreferenceDto, @Request() req) {
    try {
      const preferences = await this.preferencesService.createPreference({
        ...createDto,
        userId: req.user.id,
      });
      return { success: true, preferences };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(@Body() updateDto: UpdatePreferenceDto, @Request() req) {
    try {
      const preferences = await this.preferencesService.updatePreference(req.user.id, updateDto);
      return { success: true, preferences };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('preferences/category/:category')
  @ApiOperation({ summary: 'Update category preference' })
  @ApiResponse({ status: 200, description: 'Category preference updated successfully' })
  async updateCategoryPreference(
    @Param('category') category: string,
    @Body() data: { enabled: boolean },
    @Request() req,
  ) {
    try {
      const preferences = await this.preferencesService.updateCategoryPreference(
        req.user.id,
        category,
        data.enabled,
      );
      return { success: true, preferences };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('preferences/channel/:channel')
  @ApiOperation({ summary: 'Update channel preference' })
  @ApiResponse({ status: 200, description: 'Channel preference updated successfully' })
  async updateChannelPreference(
    @Param('channel') channel: 'email' | 'sms' | 'in_app' | 'push',
    @Body() data: { enabled: boolean },
    @Request() req,
  ) {
    try {
      const preferences = await this.preferencesService.updateChannelPreference(
        req.user.id,
        channel,
        data.enabled,
      );
      return { success: true, preferences };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Scheduling
  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a notification' })
  @ApiResponse({ status: 201, description: 'Notification scheduled successfully' })
  async scheduleNotification(@Body() scheduleDto: ScheduleNotificationDto) {
    try {
      const notification = await this.schedulerService.scheduleNotification(scheduleDto);
      return { success: true, notification };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('schedule/bulk')
  @ApiOperation({ summary: 'Schedule bulk notifications' })
  @ApiResponse({ status: 201, description: 'Bulk notifications scheduled successfully' })
  async scheduleBulkNotifications(@Body() bulkDto: BulkNotificationDto) {
    try {
      const notifications = await this.schedulerService.scheduleBulkNotifications(bulkDto);
      return { success: true, notifications };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Get scheduled notifications' })
  @ApiResponse({ status: 200, description: 'Scheduled notifications retrieved successfully' })
  async getScheduledNotifications(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    try {
      const notifications = await this.schedulerService.getScheduledNotifications(userId, status as any);
      return { notifications };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('schedule/:id')
  @ApiOperation({ summary: 'Cancel scheduled notification' })
  @ApiResponse({ status: 200, description: 'Scheduled notification cancelled successfully' })
  async cancelScheduledNotification(@Param('id') id: string) {
    try {
      await this.schedulerService.cancelScheduledNotification(id);
      return { success: true };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Analytics
  @Get('analytics/delivery')
  @ApiOperation({ summary: 'Get delivery statistics' })
  @ApiResponse({ status: 200, description: 'Delivery statistics retrieved successfully' })
  async getDeliveryStats(@Query() filter: AnalyticsFilter) {
    try {
      const stats = await this.analyticsService.getDeliveryStats(filter);
      return { stats };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('analytics/categories')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Category statistics retrieved successfully' })
  async getCategoryStats(@Query() filter: AnalyticsFilter) {
    try {
      const stats = await this.analyticsService.getCategoryStats(filter);
      return { stats };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('analytics/channels')
  @ApiOperation({ summary: 'Get channel statistics' })
  @ApiResponse({ status: 200, description: 'Channel statistics retrieved successfully' })
  async getChannelStats(@Query() filter: AnalyticsFilter) {
    try {
      const stats = await this.analyticsService.getChannelStats(filter);
      return { stats };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('analytics/realtime')
  @ApiOperation({ summary: 'Get real-time metrics' })
  @ApiResponse({ status: 200, description: 'Real-time metrics retrieved successfully' })
  async getRealTimeMetrics() {
    try {
      const metrics = await this.analyticsService.getRealTimeMetrics();
      return { metrics };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('analytics/report')
  @ApiOperation({ summary: 'Generate analytics report' })
  @ApiResponse({ status: 200, description: 'Analytics report generated successfully' })
  async generateReport(@Query() filter: AnalyticsFilter) {
    try {
      const report = await this.analyticsService.generateReport(filter);
      return { report };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('analytics/export')
  @ApiOperation({ summary: 'Export analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data exported successfully' })
  async exportAnalytics(@Query() filter: AnalyticsFilter) {
    try {
      const data = await this.analyticsService.exportAnalytics(filter);
      return { data };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // System Notifications
  @Post('system')
  @ApiOperation({ summary: 'Send system notification' })
  @ApiResponse({ status: 201, description: 'System notification sent successfully' })
  async sendSystemNotification(
    @Body() data: { userIds: string[]; title: string; message: string; category?: string; priority?: string },
  ) {
    try {
      const result = await this.notificationsService.sendSystemNotification(
        data.userIds,
        data.title,
        data.message,
        data.category,
        data.priority as any,
      );
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // Gateway Status
  @Get('gateway/status')
  @ApiOperation({ summary: 'Get gateway connection status' })
  @ApiResponse({ status: 200, description: 'Gateway status retrieved successfully' })
  async getGatewayStatus(@Request() req) {
    try {
      const isConnected = this.notificationGateway.isUserConnected(req.user.id);
      const connectedUsersCount = this.notificationGateway.getConnectedUsersCount();
      return {
        isConnected,
        connectedUsersCount,
        userId: req.user.id,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
} 