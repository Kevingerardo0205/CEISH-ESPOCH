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
import { GeographicCoverage } from '../../domain/enums/geographic-coverage.enum';
import { CreateInvestigatorDto } from './create-investigator.dto';
import { CreateInstitutionDto } from './create-institution.dto';

export class CreateProtocolDto {
  @IsString()
  title!: string;

  @IsNumber()
  principalInvestigatorId!: number;

  @IsNumber()
  studyTypeId!: number;

  @IsOptional()
  @IsNumber()
  riskLevelId?: number;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsNumber()
  financingAmount?: number;

  @IsOptional()
  @IsString()
  financingSources?: string;

  @IsOptional()
  @IsDateString()
  estimatedStartDate?: Date;

  @IsOptional()
  @IsDateString()
  estimatedEndDate?: Date;

  @IsOptional()
  @IsEnum(GeographicCoverage)
  geographicCoverage?: GeographicCoverage;

  @IsOptional()
  @IsNumber()
  studyDurationMonths?: number;

  @IsOptional()
  @IsBoolean()
  isVulnerablePopulation?: boolean;

  @IsOptional()
  @IsBoolean()
  usesBiologicalSamples?: boolean;

  @IsOptional()
  @IsBoolean()
  isMulticentric?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvestigatorDto)
  investigators!: CreateInvestigatorDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInstitutionDto)
  institutions!: CreateInstitutionDto[];
}
