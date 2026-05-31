import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Matches,
} from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z_]+$/, {
    message: 'El código solo puede contener letras mayúsculas y guiones bajos',
  })
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  moduleId?: number;
}
