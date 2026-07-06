
import { KanchButtonAssignmentStatus, KanchButtonReturnStatus } from '@/constants/KanchButtonStatus.enum';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface KanchButtonDetails {
  _id: string;
  name: string;
  phoneNumber: string;
  status: string;
  returnStatus: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('kanch_button_details')
export class KanchButtonDetailsEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: KanchButtonAssignmentStatus,
    default: KanchButtonAssignmentStatus.NOT_ASSIGNED,
  })
  status: KanchButtonAssignmentStatus;

  @Column({
    type: 'enum',
    enum: KanchButtonReturnStatus,
    default: KanchButtonReturnStatus.NOT_COMPLETED,
  })
  returnStatus: KanchButtonReturnStatus;

  @Column({ type: 'integer', default: 0 })
  completedShirts: number;

  @Column({ type: 'integer', default: 0 })
  totalShirts: number;

  @Column({ type: 'jsonb', nullable: true })
  progressEntries: Array<{
    completedQuantity: number;
    performedBy: string;
    notes?: string;
    timestamp: string;
  }>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
