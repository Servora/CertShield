import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationCategory } from './notification.entity';
import { DeliveryChannel } from './notification-delivery.entity';

export enum AnalyticsMetric {
  DELIVERY_RATE = 'delivery_rate',
  OPEN_RATE = 'open_rate',
  CLICK_RATE = 'click_rate',
  BOUNCE_RATE = 'bounce_rate',
  COMPLAINT_RATE = 'complaint_rate',
  UNSUBSCRIBE_RATE = 'unsubscribe_rate',
  RESPONSE_TIME = 'response_time',
  ERROR_RATE = 'error_rate',
}

@Entity('notification_analytics')
@Index(['date', 'category'])
@Index(['channel', 'metric'])
@Index(['userId', 'date'])
export class NotificationAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    nullable: false,
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: DeliveryChannel,
    nullable: false,
  })
  channel: DeliveryChannel;

  @Column({
    type: 'enum',
    enum: AnalyticsMetric,
    nullable: false,
  })
  metric: AnalyticsMetric;

  @Column({ type: 'date', nullable: false })
  date: Date;

  @Column({ type: 'int', default: 0 })
  totalSent: number;

  @Column({ type: 'int', default: 0 })
  totalDelivered: number;

  @Column({ type: 'int', default: 0 })
  totalOpened: number;

  @Column({ type: 'int', default: 0 })
  totalClicked: number;

  @Column({ type: 'int', default: 0 })
  totalBounced: number;

  @Column({ type: 'int', default: 0 })
  totalComplained: number;

  @Column({ type: 'int', default: 0 })
  totalUnsubscribed: number;

  @Column({ type: 'int', default: 0 })
  totalFailed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  deliveryRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  openRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  clickRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  bounceRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  complaintRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  unsubscribeRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  errorRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageResponseTime: number;

  @Column({ type: 'jsonb', nullable: true })
  hourlyBreakdown: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  deviceBreakdown: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  locationBreakdown: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 