import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push',
}

export enum TemplateCategory {
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

@Entity('notification_templates')
@Index(['name', 'type'])
@Index(['category', 'isActive'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TemplateType,
    nullable: false,
  })
  type: TemplateType;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    nullable: false,
  })
  category: TemplateCategory;

  @Column({ type: 'varchar', length: 255, nullable: false })
  subject: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'jsonb', nullable: true })
  variables: string[];

  @Column({ type: 'jsonb', nullable: true })
  defaultData: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  language: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  version: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 