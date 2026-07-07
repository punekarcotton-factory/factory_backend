import { IsNotEmpty } from 'class-validator';
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@interfaces/users.interface';
import { RolesEntity } from '@/entities/roles.entity';
import { Tables } from '@/constants/enums';

@Entity({ name: Tables.USER })
export class UserEntity extends BaseEntity implements User {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column()
  @IsNotEmpty()
  @Unique(['email'])
  email: string;

  @Column()
  @IsNotEmpty()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  roleId: string;

  @Column({ nullable: true })
  roleName: string;

  @ManyToOne(() => RolesEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: RolesEntity;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ nullable: true })
  tailorIdentifierId: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
