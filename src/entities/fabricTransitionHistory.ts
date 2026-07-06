import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export interface FabricTransactionHistory {
  _id: string;
  fabricSKU: string;
  transactionType: 'DEDUCT' | 'ADD' | 'INITIAL' | 'DAMAGE' | 'RETURN';
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  deliveryMemoId?: string;
  deliveryMemoItemId?: string;
  performedBy?: string;
  notes?: string;
  damageId?: string;
  returnId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

@Entity('fabric_transaction_history')
export class FabricTransactionHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  fabricSKU: string;

  @Column({ type: 'varchar', length: 50 })
  transactionType: 'DEDUCT' | 'ADD' | 'INITIAL' | 'DAMAGE' | 'RETURN';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityChanged: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  previousQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  newQuantity: number;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  deliveryMemoId: string;

  @Column({ type: 'uuid', nullable: true })
  deliveryMemoItemId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  performedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  damageId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  returnId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
