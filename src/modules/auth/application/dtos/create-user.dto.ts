import {
  IsString,
  IsEmail,
  IsArray,
  IsBoolean,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: '0601234567' })
  @IsString()
  nationalId!: string;

  @ApiProperty({ example: 'Administrador Sistema' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'admin@espoch.edu.ec' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    minLength: 8,
    required: false,
    description:
      'Si se omite, se generará un OTP y se enviará una invitación al usuario.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: ['admin_ti'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  roles!: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}
