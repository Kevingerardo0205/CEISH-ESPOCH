import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Matches } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, { message: 'El código solo puede contener letras mayúsculas y guiones bajos' })
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
