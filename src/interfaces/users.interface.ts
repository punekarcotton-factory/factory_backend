import { Roles } from './roles.interface';

export interface User {
  _id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  role?: Roles;
  roleName?: string;
  isActive?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
