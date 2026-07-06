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
import { PreStitcherAssignmentEntity } from './preStitcher.entity';
import { UserEntity } from './users.entity';
import { DeliveryMemoEntity } from './deliverymemo.entity';

export interface PartialCompletionItem {
  option: string; // e.g., "flacket", "label"
  completedQuantity: number; // How many shirts were completed for this option
}

export enum PartialCompletionStatus {
  HANDED_OVER = 'HANDED_OVER',
  RECEIVED_BY_NEXT_STAGE = 'RECEIVED_BY_NEXT_STAGE',
  CANCELLED = 'CANCELLED',
}

@Entity('pre_stitcher_partial_completions')
export class PreStitcherPartialCompletionEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'uuid' })
  @Index()
  assignmentId: string;

  @ManyToOne(() => PreStitcherAssignmentEntity)
  @JoinColumn({ name: 'assignmentId' })
  assignment: PreStitcherAssignmentEntity;

  @Column({ type: 'uuid' })
  @Index()
  deliveryMemoId: string;

  @ManyToOne(() => DeliveryMemoEntity)
  @JoinColumn({ name: 'deliveryMemoId' })
  deliveryMemo: DeliveryMemoEntity;

  @Column({ type: 'uuid' })
  @Index()
  preStitcherId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'preStitcherId' })
  preStitcher: UserEntity;

  @Column({ type: 'jsonb' })
  completedItems: PartialCompletionItem[];

  @Column({ type: 'int' })
  totalShirtsHandedOver: number;

  @Column({
    type: 'enum',
    enum: PartialCompletionStatus,
    default: PartialCompletionStatus.HANDED_OVER,
  })
  status: PartialCompletionStatus;

  @Column({ type: 'uuid', nullable: true })
  receivedBy: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'receivedBy' })
  receiver: UserEntity;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  recordedBy: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'recordedBy' })
  recorder: UserEntity;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
