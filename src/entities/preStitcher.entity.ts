import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './users.entity';
import type { DeliveryMemoEntity } from './deliverymemo.entity';

export interface AssignedOption {
  option: string;
  quantity: number; // How many shirts assigned for this option
}

export interface OptionProgress {
  option: string; // e.g., "flacket", "label"
  totalQuantity: number; // Total assigned
  completedQuantity: number; // How many completed
  inProgressQuantity: number; // Remaining to complete
}

export enum PreStitcherAssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  UNASSIGNED = 'UNASSIGNED',
}

@Entity('pre_stitcher_assignments')
export class PreStitcherAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'uuid' })
  @Index()
  preStitcherId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'preStitcherId' })
  preStitcher: UserEntity;

  @Column({ type: 'uuid' })
  @Index()
  deliveryMemoId: string;

  @ManyToOne('DeliveryMemoEntity')
  @JoinColumn({ name: 'deliveryMemoId' })
  deliveryMemo: DeliveryMemoEntity;

  @Column({ type: 'jsonb', default: '[]' })
  assignedOptions: AssignedOption[];

  @Column({ type: 'jsonb', default: '[]' })
  optionProgress: OptionProgress[];

  @Column({
    type: 'enum',
    enum: PreStitcherAssignmentStatus,
    default: PreStitcherAssignmentStatus.ASSIGNED,
  })
  status: PreStitcherAssignmentStatus;

  @Column({ type: 'int', default: 0 })
  completedQuantity: number;

  @Column({ type: 'int', default: 0 })
  totalHandedOver: number;

  @Column({ type: 'int', default: 0 })
  remainingQuantity: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
