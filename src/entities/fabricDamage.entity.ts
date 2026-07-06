// src/entities/fabricDamage.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('fabric_damage_records')
export class FabricDamageEntity {
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
  damagedQuantity: number;

  @Column({ type: 'varchar', length: 20 })
  action: 'DAMAGE' | 'RETURN'; // DAMAGE if < 6m, RETURN if >= 6m

  @Column({ type: 'varchar', length: 20 })
  status: 'DAMAGED' | 'RETURN';

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
