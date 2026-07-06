import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { DeliveryMemoEntity } from './deliverymemo.entity';
import { Tables } from '@/constants/enums';

export interface DeliveryMemoStageHistory {
  _id: string;
  deliveryMemoId: string;
  stage: string;
  enteredAt: Date;
  performedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Entity({ name: Tables.DELIVERY_MEMO_STAGE_HISTORY })
export class DeliveryMemoStageHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'uuid' })
  @Index()
  deliveryMemoId: string;

  @ManyToOne('DeliveryMemoEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryMemoId' })
  deliveryMemo: DeliveryMemoEntity;

  @Column({ type: 'varchar', length: 255 })
  stage: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  enteredAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  performedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
