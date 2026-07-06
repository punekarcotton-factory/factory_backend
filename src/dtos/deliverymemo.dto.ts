import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/* =========================
   COMMON DTOs
========================= */

export class ShirtSkuDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

/* =========================
   DELIVERY MEMO ITEM
========================= */

export class DeliveryMemoItemDto {
  @IsString()
  @IsNotEmpty()
  fabricSKU!: string;

  @IsString()
  @IsNotEmpty()
  dhap!: string;

  @IsString()
  @IsNotEmpty()
  fold!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalDhapFold?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

/* =========================
   CREATE DELIVERY MEMO
========================= */

export class CreateDeliveryMemoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryMemoItemDto)
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  memos!: DeliveryMemoItemDto[];

  @IsString()
  @IsNotEmpty()
  dmNumber!: string;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

/* =========================
   UPDATE DELIVERY MEMO
   (STRUCTURE MATCHES CREATE)
========================= */

export class UpdateDeliveryMemoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryMemoItemDto)
  @IsOptional()
  memos?: DeliveryMemoItemDto[];

  @IsString()
  @IsOptional()
  dmNumber?: string;

  @IsString()
  @IsOptional()
  stage?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;
}

/* =========================
   UPDATE STAGE
========================= */

export class UpdateDeliveryMemoStageDto {
  @IsString()
  @IsNotEmpty()
  stage!: string;

  @IsString()
  @IsOptional()
  performedBy?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsObject()
  updateData?: Record<string, any>;
}

/* =========================
   ADD SHIRT DETAILS
========================= */

export class AddShirtDetailsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShirtSkuDto)
  shirtSKUs!: ShirtSkuDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  shirtQuantity?: number;

  @IsString()
  @IsOptional()
  performedBy?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

/* =========================
   UPDATE SHIRT DETAILS
========================= */

export class UpdateShirtDetailsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShirtSkuDto)
  @IsOptional()
  shirtSKUs?: ShirtSkuDto[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  shirtQuantity?: number;

  @IsString()
  @IsOptional()
  performedBy?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

/* =========================
   PARTIAL ASSIGN
========================= */

export class PartialAssignItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShirtSkuDto)
  partialShirtSKUs!: ShirtSkuDto[];
}

export class PartialAssignDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartialAssignItemDto)
  items!: PartialAssignItemDto[];

  @IsString()
  @IsOptional()
  performedBy?: string;
}
