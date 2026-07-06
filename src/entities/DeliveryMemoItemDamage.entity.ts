import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DeliveryMemoItemEntity } from './deliveryMemoItem.entity';
import { DeliveryMemoEntity } from './deliverymemo.entity';

export interface DeliveryMemoItemDamage {
  _id: string;
  deliveryMemoItemId: string;
  deliveryMemoId: string;
  fabricSKU: string;
  shirtSKUs: string[];
  damagedShirtQuantity: number;
  damagedFabricQuantity: number;
  stage: string;
  notes?: string;
  performedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('shirt_quantity_damages')
export class DeliveryMemoItemDamageEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'uuid' })
  @Index()
  deliveryMemoItemId: string;

  @ManyToOne(() => DeliveryMemoItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryMemoItemId' })
  deliveryMemoItem: DeliveryMemoItemEntity;

  @Column({ type: 'uuid' })
  @Index()
  deliveryMemoId: string;

  @ManyToOne(() => DeliveryMemoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryMemoId' })
  deliveryMemo: DeliveryMemoEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  fabricSKU: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  shirtSKUs: { sku: string; quantity: number }[];

  @Column({ type: 'integer', default: 0 })
  damagedShirtQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  damagedFabricQuantity: number;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  stage: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  performedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
