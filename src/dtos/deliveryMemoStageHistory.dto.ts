import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateStageHistoryDto {
  @IsString()
  @IsNotEmpty()
  deliveryMemoId: string;

  @IsString()
  @IsNotEmpty()
  stage: string;

  @IsString()
  @IsOptional()
  performedBy?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
