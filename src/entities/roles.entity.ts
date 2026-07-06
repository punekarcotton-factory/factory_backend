import { Tables } from '@/constants/enums';
import { Roles } from '@/interfaces/roles.interface';
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity({ name: Tables.ROLES })
export class RolesEntity extends BaseEntity implements Roles {
  @PrimaryGeneratedColumn('uuid')
  _id: string;

  @Column()
  @Unique(['roleName'])
  roleName: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
