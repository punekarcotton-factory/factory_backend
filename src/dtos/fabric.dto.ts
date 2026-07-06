import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateFabricDto {
  @IsString()
  @IsNotEmpty()
  public sku: string;

  @IsString()
  @IsOptional()
  public title: string;

  @IsString()
  @IsOptional()
  public color: string;

  @IsOptional()
  @IsBoolean()
  public isDeleted?: boolean;

  @IsNumber()
  @IsNotEmpty()
  public quantity: number;

  @IsString()
  @IsOptional()
  public notes?: string;
}
