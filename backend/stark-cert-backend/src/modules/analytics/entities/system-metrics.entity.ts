import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('system_metrics')
export class SystemMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  metricType: string; // 'cpu_usage', 'memory_usage', 'response_time', 'error_rate', etc.

  @Column({ type: 'timestamp' })
  @Index()
  recordedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ nullable: true })
  unit: string; // 'percentage', 'milliseconds', 'bytes', etc.

  @Column({ nullable: true })
  component: string; // 'api', 'database', 'file_storage', etc.

  @Column({ nullable: true })
  endpoint: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  status: string; // 'normal', 'warning', 'critical'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  thresholds: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 