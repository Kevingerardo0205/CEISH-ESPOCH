import { IsEmail, IsNotEmpty, IsString, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterInvestigatorDto {
  // Autenticación e Identidad
  @ApiProperty({ example: 'investigador@espoch.edu.ec' })
  @IsEmail()
  @IsNotEmpty({ message: 'El email es requerido' })
  email!: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @ApiProperty({ example: '0601234567' })
  @IsString()
  @IsNotEmpty({ message: 'El número de identificación es requerido' })
  nationalId!: string;

  @ApiProperty({ example: 'CEDULA', enum: ['CEDULA', 'PASAPORTE'] })
  @IsString()
  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  documentType!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty({ message: 'El primer nombre es requerido' })
  firstName!: string;

  @ApiProperty({ example: 'Andrés', required: false })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El primer apellido es requerido' })
  firstLastName!: string;

  @ApiProperty({ example: 'García', required: false })
  @IsString()
  @IsOptional()
  secondLastName?: string;

  @ApiProperty({ example: 'Ecuatoriana' })
  @IsString()
  @IsNotEmpty({ message: 'La nacionalidad es requerida' })
  nationality!: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  phone!: string;

  // Aceptaciones Legales
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  acceptsTerms!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  acceptsRegulations!: boolean;
}
