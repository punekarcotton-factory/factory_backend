import { IsNotEmpty, IsArray, IsInt, IsString, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialCompletionStatus } from '@/entities/preStitcherPartialCompletion.entity';

export class PartialCompletionItemDto {
  @IsNotEmpty()
  @IsString()
  option: string; // e.g., "flacket", "label"

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  completedQuantity: number;
}

export class CreatePartialCompletionDto {
  @IsNotEmpty()
  @IsString()
  assignmentId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartialCompletionItemDto)
  completedItems: PartialCompletionItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsString()
  recordedBy: string;
}

export class ReceivePartialCompletionDto {
  @IsNotEmpty()
  @IsString()
  receivedBy: string; 

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetPartialCompletionsFilterDto {
  @IsOptional()
  @IsString()
  assignmentId?: string;

  @IsOptional()
  @IsString()
  deliveryMemoId?: string;

  @IsOptional()
  @IsString()
  preStitcherId?: string;

  @IsOptional()
  @IsString()
  status?: PartialCompletionStatus;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
