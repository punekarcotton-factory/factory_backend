// users.dto.ts
import { IsEmail, IsString, IsOptional, IsUUID, ValidateIf, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  public email: string;

  @IsString()
  @IsOptional()
  public password: string;

  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsString()
  public phone: string;

  @IsOptional()
  @IsUUID()
  public roleId?: string;

  @IsOptional()
  @IsString()
  public createdBy?: string;

  @IsOptional()
  @IsString()
  // @IsIn(['Admin', 'User', 'Manager', 'Employee', 'SuperAdmin'])
  public roleName?: string;
}

export class LoginUserDto {
  @ValidateIf(o => !o.phone)
  @IsEmail({}, { message: 'email must be a valid email' })
  public email?: string;

  @ValidateIf(o => !o.email) 
  @IsString({ message: 'phone must be a string' })
  public phone?: string;

  @IsString({ message: 'password is required' })
  public password: string;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  public email?: string;

  @IsString()
  @IsOptional()
  public firstName?: string;

  @IsString()
  @IsOptional()
  public lastName?: string;

  @IsString()
  @IsOptional()
  public phone?: string;

  @IsOptional()
  @IsUUID()
  public roleId?: string;

  @IsOptional()
  @IsString()
  public roleName?: string;

  @IsOptional()
  @IsString()
  public updatedBy?: string;
}

export class ReassignTasksDto {
  @IsUUID()
  @IsNotEmpty()
  public fromUserId: string;

  @IsUUID()
  @IsNotEmpty()
  public toUserId: string;

  @IsOptional()
  @IsUUID('all', { each: true })
  public memoIds?: string[];
}
