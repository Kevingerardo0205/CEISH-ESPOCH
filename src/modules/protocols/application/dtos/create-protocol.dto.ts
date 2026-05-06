import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsEnum, 
  IsDateString, 
  IsArray, 
  ValidateNested, 
  IsBoolean 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GeographicCoverage } from '../../domain/enums/geographic-coverage.enum';
import { CreateInvestigatorDto } from './create-investigator.dto';
import { CreateInstitutionDto } from './create-institution.dto';

export class CreateProtocolDto {
  @ApiProperty({ example: 'Título del Protocolo de Investigación' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  principalInvestigatorId!: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  studyTypeId!: number;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  riskLevelId?: number;

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

  @ApiProperty({ example: '2026-06-01', required: false })
  @IsOptional()
  @IsDateString()
  estimatedStartDate?: Date;

  @ApiProperty({ example: '2027-06-01', required: false })
  @IsOptional()
  @IsDateString()
  estimatedEndDate?: Date;

  @ApiProperty({ enum: GeographicCoverage, example: GeographicCoverage.PROVINCIAL, required: false })
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
