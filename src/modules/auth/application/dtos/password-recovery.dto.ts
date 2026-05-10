import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'investigador@espoch.edu.ec',
    description: 'Correo institucional del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ConfirmEmailDto {
  @ApiProperty({ example: 'investigador@espoch.edu.ec' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de verificación enviado al correo',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  code!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'investigador@espoch.edu.ec' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  code!: string;

  @ApiProperty({ example: 'NuevaClave123!', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword!: string;
}
