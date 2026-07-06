import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fabrics')
export class FabricEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
