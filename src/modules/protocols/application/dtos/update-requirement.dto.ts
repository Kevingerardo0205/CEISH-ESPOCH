import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RequirementStatus } from '../../domain/enums/requirement-status.enum';

export class UpdateRequirementDto {
  @IsEnum(RequirementStatus)
  status!: RequirementStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  pageCount?: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
