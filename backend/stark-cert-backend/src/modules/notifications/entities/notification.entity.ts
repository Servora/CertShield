import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';
import { NotificationDelivery } from './notification-delivery.entity';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationCategory {
  CERTIFICATE_ISSUED = 'certificate_issued',
  CERTIFICATE_VERIFIED = 'certificate_verified',
  CERTIFICATE_REVOKED = 'certificate_revoked',
  CERTIFICATE_EXPIRED = 'certificate_expired',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',
  USER_ACTIVITY = 'user_activity',
  BULK_MESSAGE = 'bulk_message',
  CUSTOM = 'custom',
}

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['category', 'createdAt'])
@Index(['priority', 'scheduledAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.IN_APP,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    nullable: false,
  })
  category: NotificationCategory;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  recipients: {
    email?: string;
    phone?: string;
    userId?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  templateId: string;

  @Column({ type: 'jsonb', nullable: true })
  templateData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => NotificationTemplate, { nullable: true })
  template: NotificationTemplate;

  @OneToMany(() => NotificationDelivery, (delivery) => delivery.notification)
  deliveries: NotificationDelivery[];
} 