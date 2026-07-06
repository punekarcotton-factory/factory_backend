import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { DeliveryMemoEntity } from './deliverymemo.entity';

export interface DeliveryMemoItem {
  _id: string;
  deliveryMemoId: string;
  fabricSKU: string;
  shirtSKUs: string[];
  shirtQuantity: number;
  dhap: string;
  fold: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('delivery_memo_items')
export class DeliveryMemoItemEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'uuid' })
  @Index()
  deliveryMemoId: string;

  @ManyToOne('DeliveryMemoEntity', (memo: DeliveryMemoEntity) => memo.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryMemoId' })
  deliveryMemo: DeliveryMemoEntity;

  @Column({ type: 'varchar', length: 100 })
  fabricSKU: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dhap: number;

  @Column({ type: 'jsonb', default: '[]' })
  shirtSKUs: { sku: string; quantity: number }[];

  @Column({ type: 'int', nullable: true })
  shirtQuantity: number;

  @Column({ type: 'integer' })
  fold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalDhapFold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  damagedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  returnedQuantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
