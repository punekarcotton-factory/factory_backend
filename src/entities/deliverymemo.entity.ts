import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { DeliveryMemoItemEntity } from './deliveryMemoItem.entity';
import { DeliveryMemoStageHistoryEntity } from './deliveryMemoStageHistory.entity';
import { PreStitcherAssignmentEntity } from './preStitcher.entity';
import { TailorDetailsEntity } from './TailorDetails.entity';
import { KanchButtonDetailsEntity } from './KanchButtonDetails.entity';
import { TailorAssignmentStatus, TailorReturnStatus } from '@/constants/tailorStatus.enum';
import { KanchButtonAssignmentStatus, KanchButtonReturnStatus } from '@/constants/KanchButtonStatus.enum';
import { MemoStatus } from '@/constants/MemoStatus.enum';

export interface DeliveryMemo {
  _id: string;
  dmNumber?: string;
  assignedPreStitcherId?: string | null;
  createdBy?: string;
  stage: string;
  notes?: string;
  isJobWork?: boolean;
  jobWorkWorkerId?: string | null;
  jobWorkWorkerName?: string | null;
  jobWorkWorkerPhone?: string | null;
  jobWorkStatus?: string | null;
  fabricGiven?: number | null;
  fabricSKU?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
@Entity('delivery_memos')
export class DeliveryMemoEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'boolean', default: false })
  isJobWork: boolean;

  @Column({ type: 'uuid', nullable: true })
  jobWorkWorkerId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  jobWorkWorkerName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  jobWorkWorkerPhone: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'PENDING' })
  jobWorkStatus: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  fabricGiven: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fabricSKU: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  assignedPreStitcherId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stage: string;

  @Column({
    type: 'enum',
    enum: MemoStatus,
    default: MemoStatus.ACTIVE,
  })
  status: MemoStatus;

  @OneToMany(() => DeliveryMemoItemEntity, item => item.deliveryMemo)
  items: DeliveryMemoItemEntity[];

  @OneToMany(() => DeliveryMemoStageHistoryEntity, history => history.deliveryMemo)
  stageHistory: DeliveryMemoStageHistoryEntity[];

  @OneToMany(() => PreStitcherAssignmentEntity, assignment => assignment.deliveryMemo)
  preStitcherAssignments: PreStitcherAssignmentEntity[];

  @ManyToOne(() => TailorDetailsEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'tailorDetailsId' })
  tailorDetails?: TailorDetailsEntity;

  @Column({ type: 'uuid', nullable: true })
  tailorDetailsId?: string;

  @Column({
    type: 'enum',
    enum: TailorAssignmentStatus,
    default: TailorAssignmentStatus.NOT_ASSIGNED,
  })
  tailorAssignmentStatus: TailorAssignmentStatus;

  @Column({
    type: 'enum',
    enum: TailorReturnStatus,
    default: TailorReturnStatus.NOT_COMPLETED,
  })
  tailorReturnStatus: TailorReturnStatus;

  @ManyToOne(() => KanchButtonDetailsEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'kanchButtonId' })
  KanchButtonDetails?: KanchButtonDetailsEntity;

  @Column({ type: 'uuid', nullable: true })
  KanchButtonDetailsId?: string;

  @Column({
    type: 'enum',
    enum: KanchButtonAssignmentStatus,
    default: KanchButtonAssignmentStatus.NOT_ASSIGNED,
  })
  kanchButtonAssignmentStatus: KanchButtonAssignmentStatus;

  @Column({
    type: 'enum',
    enum: KanchButtonReturnStatus,
    default: KanchButtonReturnStatus.NOT_COMPLETED,
  })
  kanchButtonReturnStatus: KanchButtonReturnStatus;

  // OPTIONAL: total for whole memo
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  totalDhapFold: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  dmNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  closedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
