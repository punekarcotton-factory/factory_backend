import { IsEmail, IsString, IsOptional, IsUUID, ValidateIf, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  tailorIdentifierId?: string;
}

export class LoginUserDto {
  @ValidateIf(o => !o.phone)
  @IsEmail({}, { message: 'email must be a valid email' })
  email?: string;

  @ValidateIf(o => !o.email)
  @IsString({ message: 'phone must be a string' })
  phone?: string;

  @IsString({ message: 'password is required' })
  password!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  tailorId?: string;

  @IsOptional()
  @IsString()
  tailorIdentifierId?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class ReassignTasksDto {
  @IsUUID()
  @IsNotEmpty()
  fromUserId!: string;

  @IsUUID()
  @IsNotEmpty()
  toUserId!: string;

  @IsOptional()
  @IsUUID('all', { each: true })
  memoIds?: string[];
}
