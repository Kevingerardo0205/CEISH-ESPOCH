import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePlaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
