import { TailorAssignmentStatus, TailorReturnStatus } from '@/constants/tailorStatus.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface TailorDetails {
  _id: string;
  name: string;
  phoneNumber: string;
  status: string;
  returnStatus: string;
  cuff: boolean;
  ghera: boolean;
  collar: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('tailor_details')
export class TailorDetailsEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: TailorAssignmentStatus,
    default: TailorAssignmentStatus.NOT_ASSIGNED,
  })
  status: TailorAssignmentStatus;

  @Column({
    type: 'enum',
    enum: TailorReturnStatus,
    default: TailorReturnStatus.NOT_COMPLETED,
  })
  returnStatus: TailorReturnStatus;

  @Column({ type: 'boolean', default: false })
  cuff: boolean;

  @Column({ type: 'boolean', default: false })
  ghera: boolean;

  @Column({ type: 'boolean', default: false })
  collar: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
