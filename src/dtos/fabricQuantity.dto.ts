import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum QuantityOperation {
  ADD = 'ADD',
  DAMAGE = 'DAMAGE',
  RETURN = 'RETURN',
}

export class UpdateFabricQuantityDto {
  @IsEnum(QuantityOperation)
  operation: QuantityOperation;

  @IsNumber()
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @IsOptional()
  @IsString()
  performedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
