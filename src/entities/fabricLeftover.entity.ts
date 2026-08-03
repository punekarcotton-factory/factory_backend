// src/entities/fabricLeftover.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('fabric_leftover_records')
export class FabricLeftoverEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  fabricSKU: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  deliveryMemoId: string;

  @Column({ type: 'uuid', nullable: true })
  deliveryMemoItemId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  leftoverQuantity: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  performedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
