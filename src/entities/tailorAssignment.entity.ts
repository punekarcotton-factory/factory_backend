import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DeliveryMemoEntity } from './deliverymemo.entity';
import { TailorDetailsEntity } from './TailorDetails.entity';

export enum TailorAssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  UNASSIGNED = 'UNASSIGNED',
}

@Entity('tailor_assignments')
export class TailorAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'uuid' })
  tailorId: string;

  @ManyToOne(() => TailorDetailsEntity)
  @JoinColumn({ name: 'tailorId' })
  tailor: TailorDetailsEntity;

  @Column({ type: 'uuid' })
  deliveryMemoId: string;

  @ManyToOne(() => DeliveryMemoEntity)
  @JoinColumn({ name: 'deliveryMemoId' })
  deliveryMemo: DeliveryMemoEntity;

  @Column({ type: 'jsonb', default: [] })
  assignedOptions: Array<{
    option: string; // 'cuff', 'ghera', 'collar'
    quantity: number;
  }>;

  @Column({ type: 'jsonb', default: [] })
  optionProgress: Array<{
    option: string;
    totalQuantity: number;
    completedQuantity: number;
    inProgressQuantity: number;
  }>;

  @Column({
    type: 'enum',
    enum: TailorAssignmentStatus,
    default: TailorAssignmentStatus.ASSIGNED,
  })
  status: TailorAssignmentStatus;

  @Column({ type: 'int', default: 0 })
  completedQuantity: number;

  @Column({ type: 'jsonb', nullable: true })
  progressEntries: Array<{
    completedQuantity: number;
    optionUpdates: Array<{ option: string; completedQuantity: number }>;
    performedBy: string;
    notes?: string;
    timestamp: string;
  }>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
