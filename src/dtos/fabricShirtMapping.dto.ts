import { IsString, IsNotEmpty, IsOptional, MaxLength, IsArray, ArrayMinSize } from 'class-validator';

export class BulkCreateFabricShirtMappingDto {
  @IsString()
  @IsNotEmpty()
  fabricSKU: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  shirtSKUs: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFabricShirtMappingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fabricSKU: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shirtSKU: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;
}

export class UpdateFabricShirtMappingDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  shirtSKU?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  notes?: string;
}

export class GetFabricShirtMappingsDto {
  @IsString()
  @IsOptional()
  fabricSKU?: string;

  @IsString()
  @IsOptional()
  shirtSKU?: string;
}
