import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_analytics')
export class UserAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  action: string; // 'login', 'logout', 'certificate_created', 'certificate_viewed', etc.

  @Column({ type: 'timestamp' })
  @Index()
  actionDate: Date;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  duration: number; // session duration in seconds

  @Column({ nullable: true })
  pageUrl: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 