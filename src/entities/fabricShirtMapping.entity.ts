import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FabricEntity } from './fabric.entity';

@Entity('fabric_shirt_mappings')
@Index(['fabricSKU', 'shirtSKU'], { unique: true }) // Prevent duplicate mappings
export class FabricShirtMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  fabricSKU: string;

  @ManyToOne(() => FabricEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fabricSKU', referencedColumnName: 'sku' })
  fabric: FabricEntity;

  @Column({ type: 'varchar', length: 100 })
  shirtSKU: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
