import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'El código del rol debe contener solo letras mayúsculas, números y guiones bajos (ej: ADMIN_TI).',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;
}
