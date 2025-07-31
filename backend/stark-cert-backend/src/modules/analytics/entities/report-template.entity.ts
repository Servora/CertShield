import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('report_templates')
export class ReportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  @Index()
  templateType: string; // 'certificate_analytics', 'user_analytics', 'system_performance', 'custom'

  @Column({ type: 'jsonb' })
  configuration: Record<string, any>;

  @Column({ type: 'jsonb' })
  filters: Record<string, any>;

  @Column({ type: 'jsonb' })
  charts: Record<string, any>[];

  @Column({ type: 'jsonb' })
  exportFormats: string[]; // ['pdf', 'excel', 'csv', 'json']

  @Column({ type: 'jsonb', nullable: true })
  schedule: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 