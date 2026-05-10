import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'Nombre de la Institución' })
  @IsString()
  name!: string;

  @ApiProperty({ enum: ['PUBLIC', 'PRIVATE'], example: 'PUBLIC' })
  @IsEnum(['PUBLIC', 'PRIVATE'])
  type!: 'PUBLIC' | 'PRIVATE';

  @ApiProperty({ example: 'Dirección de la Institución' })
  @IsString()
  address!: string;

  @ApiProperty({ example: 'Persona de Contacto' })
  @IsString()
  contactPerson!: string;

  @ApiProperty({ example: 'contacto@institucion.com', required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ example: '032999999', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  hasInterestLetter: boolean = false;
}
