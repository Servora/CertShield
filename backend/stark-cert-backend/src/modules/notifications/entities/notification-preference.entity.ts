import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationCategory } from './notification.entity';

export enum ChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum PreferenceLevel {
  NONE = 'none',
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  ALL = 'all',
}

@Entity('notification_preferences')
@Index(['userId', 'category'])
@Index(['userId', 'channel'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    nullable: false,
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: ChannelType,
    nullable: false,
  })
  channel: ChannelType;

  @Column({
    type: 'enum',
    enum: PreferenceLevel,
    default: PreferenceLevel.NORMAL,
  })
  level: PreferenceLevel;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  schedule: {
    startTime?: string;
    endTime?: string;
    timezone?: string;
    daysOfWeek?: number[];
  };

  @Column({ type: 'jsonb', nullable: true })
  filters: {
    priority?: string[];
    tags?: string[];
    excludeTags?: string[];
  };

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 