import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('analytics')
export class AnalyticsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  metricType: string; // 'certificate_issued', 'certificate_verified', 'user_activity', etc.

  @Column()
  @Index()
  metricDate: Date;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  count: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 