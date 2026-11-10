import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GeographicCoverage } from '../../domain/enums/geographic-coverage.enum';
import { CreateInvestigatorDto } from './create-investigator.dto';
import { CreateInstitutionDto } from './create-institution.dto';

export class CreateProtocolDto {
  // RF-02.2: se recorta antes de validar y de guardar; 20 a 200 caracteres después del recorte.
  // El DTO de edición (TSK-001.14) hereda estas reglas con PartialType/OmitType.
  @ApiProperty({
    example: 'Título del Protocolo de Investigación',
    minLength: 20,
    maxLength: 200,
  })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El título debe ser un texto' })
  @Length(20, 200, {
    message: 'El título debe tener entre 20 y 200 caracteres',
  })
  title!: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @IsNotEmpty()
  principalInvestigatorId!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  studyTypeId!: number;

  @ApiProperty({ example: '1.0', required: false })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  financingAmount?: number;

  @ApiProperty({ example: 'Fondos Internos ESPOCH', required: false })
  @IsOptional()
  @IsString()
  financingSources?: string;

  // E5: Datos del Patrocinador
  @ApiProperty({ example: '1790000000001', required: false })
  @IsOptional()
  @IsString()
  sponsorRuc?: string;

  @ApiProperty({ example: '022999999', required: false })
  @IsOptional()
  @IsString()
  sponsorPhone?: string;

  @ApiProperty({ example: 'Av. Panamericana Sur km 1.5', required: false })
  @IsOptional()
  @IsString()
  sponsorAddress?: string;

  @ApiProperty({ example: 'https://www.espoch.edu.ec', required: false })
  @IsOptional()
  @IsString()
  sponsorWeb?: string;

  @ApiProperty({ example: 'Facultad de Salud Pública', required: false })
  @IsOptional()
  @IsString()
  sponsorExecutingAgency?: string;

  @ApiProperty({ example: '2026-06-01', required: false })
  @IsOptional()
  @IsDateString()
  estimatedStartDate?: Date;

  @ApiProperty({ example: '2027-06-01', required: false })
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: Date;

  @ApiProperty({
    enum: GeographicCoverage,
    example: GeographicCoverage.PROVINCIAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(GeographicCoverage)
  geographicCoverage?: GeographicCoverage;

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsNumber()
  studyDurationMonths?: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isVulnerablePopulation?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  usesBiologicalSamples?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isMulticentric?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  hasExternalInstitutions?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isIndigenousPopulation?: boolean;

  // E2: Declaración Jurada
  @ApiProperty({
    example: true,
    description: 'Declaración de que la investigación no ha iniciado',
  })
  @IsBoolean()
  @IsNotEmpty()
  isAffidavitAccepted!: boolean;

  @ApiProperty({ type: [CreateInvestigatorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvestigatorDto)
  investigators!: CreateInvestigatorDto[];

  @ApiProperty({ type: [CreateInstitutionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInstitutionDto)
  institutions!: CreateInstitutionDto[];
}
