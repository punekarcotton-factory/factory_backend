import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PreStitcherAssignmentEntity } from '@/entities/preStitcher.entity';

@Entity('pre_stitch_options')
export class PreStitchOptionsEntity {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  // Foreign key to PreStitcherAssignmentEntity
  @Column({ type: 'uuid', unique: true })
  assignmentId: string;

  @OneToOne(() => PreStitcherAssignmentEntity)
  @JoinColumn({ name: 'assignmentId' })
  assignment: PreStitcherAssignmentEntity;

  // Checkbox options
  @Column({ type: 'boolean', default: false })
  label: boolean;

  @Column({ type: 'boolean', default: false })
  flacket: boolean;

  @Column({ type: 'boolean', default: false })
  covering: boolean;

  @Column({ type: 'boolean', default: false })
  pocket: boolean;

  @Column({ type: 'boolean', default: false })
  shoulder: boolean;

  @Column({ type: 'boolean', default: false, name: 'chock_patti' })
  chockPatti: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
