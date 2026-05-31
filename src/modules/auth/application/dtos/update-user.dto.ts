import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: '0601234567', required: false })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ example: 'Juan Pérez Actualizado', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'juan.perez@test.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'NuevaClave123!', minLength: 8, required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiProperty({ example: '0998887776', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Ecuatoriana', required: false })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ example: 'Docente Investigador', required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ example: 'ESPOCH', required: false })
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiProperty({ example: '1005-2021-224536', required: false })
  @IsOptional()
  @IsString()
  senescytRegistration?: string;
}
