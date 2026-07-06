import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested, Min } from 'class-validator';

export class OptionQuantityDto {
  @IsNotEmpty()
  @IsString()
  option: string; // e.g., "flacket", "label"

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
export class OptionProgressUpdateDto {
  @IsNotEmpty()
  @IsString()
  option: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  completedQuantity: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class PreStitcherAssignmentDto {
  @IsNotEmpty()
  @IsUUID()
  preStitcherId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionQuantityDto)
  options: OptionQuantityDto[];
}

export class AssignMultiplePreStitchersDto {
  @IsNotEmpty()
  @IsUUID()
  deliveryMemoId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreStitcherAssignmentDto)
  assignments: PreStitcherAssignmentDto[];
}
export class UpdateAssignmentProgressDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionProgressUpdateDto)
  optionUpdates: OptionProgressUpdateDto[];

  @IsNotEmpty()
  @IsString()
  performedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
export class PreStitchOptionsDto {
  @IsOptional()
  @IsBoolean()
  label?: boolean;

  @IsOptional()
  @IsBoolean()
  flacket?: boolean;

  @IsOptional()
  @IsBoolean()
  covering?: boolean;

  @IsOptional()
  @IsBoolean()
  pocket?: boolean;

  @IsOptional()
  @IsBoolean()
  shoulder?: boolean;

  @IsOptional()
  @IsBoolean()
  chockPatti?: boolean;
}

export class AssignPreStitcherDto {
  @IsNotEmpty()
  @IsUUID()
  preStitcherId: string;

  @IsNotEmpty()
  @IsUUID()
  deliveryMemoId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreStitchOptionsDto)
  options?: PreStitchOptionsDto;

  @IsString()
  @IsOptional()
  notes?: string;
}
