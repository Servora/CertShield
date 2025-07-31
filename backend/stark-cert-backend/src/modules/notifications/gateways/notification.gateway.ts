import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { NotificationPreferencesService } from '../services/notification-preferences.service';

interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  createdAt: Date;
  isRead: boolean;
  metadata?: Record<string, any>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, Socket>();

  constructor(
    private notificationsService: NotificationsService,
    private preferencesService: NotificationPreferencesService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId || client.handshake.query.userId;
    
    if (!userId) {
      this.logger.warn('Connection attempt without userId');
      client.disconnect();
      return;
    }

    this.connectedUsers.set(userId, client);
    this.logger.log(`User ${userId} connected to notifications`);

    // Join user-specific room
    client.join(`user:${userId}`);

    // Send unread count
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    client.emit('unreadCount', { count: unreadCount });

    // Send recent notifications
    const { notifications } = await this.notificationsService.getNotifications(userId, {
      limit: 10,
      unreadOnly: true,
    });

    client.emit('recentNotifications', notifications);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId || client.handshake.query.userId;
    
    if (userId) {
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected from notifications`);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId || client.handshake.query.userId;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      await this.notificationsService.markAsRead(data.notificationId, userId);
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });
      
      client.emit('notificationRead', { notificationId: data.notificationId });
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.auth.userId || client.handshake.query.userId;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      await this.notificationsService.markAllAsRead(userId);
      client.emit('unreadCount', { count: 0 });
      client.emit('allNotificationsRead');
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark all notifications as read' });
    }
  }

  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @MessageBody() data: { page?: number; limit?: number; unreadOnly?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId || client.handshake.query.userId;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const result = await this.notificationsService.getNotifications(userId, data);
      client.emit('notifications', result);
    } catch (error) {
      this.logger.error(`Failed to get notifications: ${error.message}`);
      client.emit('error', { message: 'Failed to get notifications' });
    }
  }

  @SubscribeMessage('getNotificationStats')
  async handleGetNotificationStats(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.auth.userId || client.handshake.query.userId;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const stats = await this.notificationsService.getNotificationStats(userId);
      client.emit('notificationStats', stats);
    } catch (error) {
      this.logger.error(`Failed to get notification stats: ${error.message}`);
      client.emit('error', { message: 'Failed to get notification stats' });
    }
  }

  @SubscribeMessage('updatePreferences')
  async handleUpdatePreferences(
    @MessageBody() data: { preferences: any },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId || client.handshake.query.userId;
    
    if (!userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      await this.preferencesService.updatePreference(userId, data.preferences);
      client.emit('preferencesUpdated', { success: true });
    } catch (error) {
      this.logger.error(`Failed to update preferences: ${error.message}`);
      client.emit('error', { message: 'Failed to update preferences' });
    }
  }

  // Method to send real-time notification to a specific user
  async sendNotificationToUser(userId: string, notification: NotificationPayload) {
    const client = this.connectedUsers.get(userId);
    
    if (client) {
      client.emit('newNotification', notification);
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });
      
      this.logger.log(`Real-time notification sent to user ${userId}`);
    } else {
      this.logger.debug(`User ${userId} not connected, notification queued`);
    }
  }

  // Method to send notification to multiple users
  async sendNotificationToUsers(userIds: string[], notification: NotificationPayload) {
    const connectedUserIds = userIds.filter(id => this.connectedUsers.has(id));
    
    if (connectedUserIds.length > 0) {
      this.server.to(connectedUserIds.map(id => `user:${id}`)).emit('newNotification', notification);
      
      // Update unread counts for connected users
      for (const userId of connectedUserIds) {
        const unreadCount = await this.notificationsService.getUnreadCount(userId);
        const client = this.connectedUsers.get(userId);
        if (client) {
          client.emit('unreadCount', { count: unreadCount });
        }
      }
      
      this.logger.log(`Real-time notification sent to ${connectedUserIds.length} users`);
    }
  }

  // Method to broadcast system notifications
  async broadcastSystemNotification(notification: NotificationPayload) {
    this.server.emit('systemNotification', notification);
    this.logger.log('System notification broadcasted to all connected users');
  }

  // Method to send notification to users in a specific room
  async sendNotificationToRoom(room: string, notification: NotificationPayload) {
    this.server.to(room).emit('roomNotification', {
      room,
      notification,
    });
    this.logger.log(`Notification sent to room: ${room}`);
  }

  // Method to get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Method to get list of connected user IDs
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Method to check if a user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Method to force disconnect a user
  disconnectUser(userId: string): boolean {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.disconnect();
      this.connectedUsers.delete(userId);
      this.logger.log(`User ${userId} forcefully disconnected`);
      return true;
    }
    return false;
  }

  // Method to send typing indicator
  async sendTypingIndicator(userId: string, isTyping: boolean) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.broadcast.to(`user:${userId}`).emit('typingIndicator', { userId, isTyping });
    }
  }

  // Method to send notification delivery status
  async sendDeliveryStatus(userId: string, notificationId: string, status: string) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('deliveryStatus', { notificationId, status });
    }
  }

  // Method to send notification analytics
  async sendAnalyticsUpdate(userId: string, analytics: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('analyticsUpdate', analytics);
    }
  }

  // Method to handle notification preferences update
  async handlePreferencesUpdate(userId: string, preferences: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('preferencesUpdated', preferences);
    }
  }

  // Method to send notification queue status
  async sendQueueStatus(userId: string, queueStatus: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('queueStatus', queueStatus);
    }
  }

  // Method to send notification template updates
  async sendTemplateUpdate(userId: string, template: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('templateUpdate', template);
    }
  }

  // Method to send notification channel status
  async sendChannelStatus(userId: string, channelStatus: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('channelStatus', channelStatus);
    }
  }
} 