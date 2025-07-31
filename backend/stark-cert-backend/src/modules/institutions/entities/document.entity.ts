import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn,
} from 'typeorm';
import { Institution } from './institution.entity';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // e.g. 'certificate', 'license', etc.

  @Column()
  url: string;

  @ManyToOne(() => Institution, (institution) => institution.documents, { onDelete: 'CASCADE' })
  institution: Institution;

  @CreateDateColumn()
  uploadedAt: Date;
}