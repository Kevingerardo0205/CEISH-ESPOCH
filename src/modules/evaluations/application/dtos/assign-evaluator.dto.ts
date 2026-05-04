import { IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EvaluatorAssignmentDto {
  @IsNumber()
  evaluatorId!: number;

  @IsOptional()
  @IsNumber()
  profileId?: number;

  @IsOptional()
  @IsNumber()
  modalityId?: number;
}

export class AssignEvaluatorsDto {
  @IsNumber()
  protocolId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluatorAssignmentDto)
  evaluators!: EvaluatorAssignmentDto[];
}
