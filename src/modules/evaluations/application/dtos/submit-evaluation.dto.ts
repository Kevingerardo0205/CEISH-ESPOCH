import { IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

export class SubmitEvaluationDto {
  @IsNumber()
  assignmentId!: number;

  @IsOptional()
  @IsObject()
  ethicalAspects?: any;

  @IsOptional()
  @IsObject()
  methodologicalAspects?: any;

  @IsOptional()
  @IsObject()
  legalAspects?: any;

  @IsString()
  result!: string; // e.g., 'APROBADO', 'CON_OBSERVACIONES', 'RECHAZADO'

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  reportPath?: string;
}
