import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

@Entity('certificate_analytics')
export class CertificateAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  certificateId: string;

  @Column()
  @Index()
  issuerId: string;

  @Column({ nullable: true })
  @Index()
  recipientId: string;

  @Column()
  @Index()
  action: string; // 'issued', 'verified', 'revoked', 'downloaded', 'printed'

  @Column({ type: 'timestamp' })
  @Index()
  actionDate: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  processingTime: number; // in milliseconds

  @Column({ nullable: true })
  status: string; // 'success', 'failed', 'pending'

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 