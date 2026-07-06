

import { IsString, IsArray, ValidateNested, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class TailorOptionDto {
  @IsString()
  option: string; // 'cuff', 'ghera', 'collar'

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class TailorAssignmentDto {
  @IsString()
  tailorId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailorOptionDto)
  options: TailorOptionDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AssignMultipleTailorsDto {
  @IsString()
  deliveryMemoId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailorAssignmentDto)
  assignments: TailorAssignmentDto[];
}

export class UpdateTailorProgressDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailorOptionDto)
  optionUpdates: TailorOptionDto[];

  @IsString()
  performedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
