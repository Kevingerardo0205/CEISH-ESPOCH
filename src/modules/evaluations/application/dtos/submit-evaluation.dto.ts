import {
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Annex9Dto,
  Annex10Dto,
  Annex11Dto,
} from './annexes/evaluation-forms.dto';

export enum EvaluationResult {
  APROBADO = 'APROBADO',
  APROBADO_CON_OBSERVACIONES = 'APROBADO_CON_OBSERVACIONES',
  RECHAZADO = 'RECHAZADO',
  PENDIENTE_SUBSANACION = 'PENDIENTE_SUBSANACION',
}

export class SubmitEvaluationDto {
  @ApiProperty({ example: 1, description: 'ID de la asignación de evaluación' })
  @IsNumber()
  assignmentId!: number;

  @ApiProperty({
    type: Annex9Dto,
    required: false,
    description: 'Datos del Anexo 9 (Solo para revisión Expedita)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Annex9Dto)
  annex9?: Annex9Dto;

  @ApiProperty({
    type: Annex10Dto,
    required: false,
    description: 'Datos del Anexo 10 (Solo para revisión por Pleno)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Annex10Dto)
  annex10?: Annex10Dto;

  @ApiProperty({
    type: Annex11Dto,
    required: false,
    description: 'Datos del Anexo 11 (Solo para Ensayos Clínicos)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Annex11Dto)
  annex11?: Annex11Dto;

  @ApiProperty({
    example: 'APROBADO',
    enum: EvaluationResult,
    description: 'Dictamen final de la evaluación',
  })
  @IsEnum(EvaluationResult)
  result!: EvaluationResult;

  @ApiProperty({
    example: 'El protocolo cumple con los estándares éticos.',
    required: false,
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({
    example: '/storage/evaluations/report-123.pdf',
    required: false,
    description: 'Ruta al PDF firmado',
  })
  @IsOptional()
  @IsString()
  reportPath?: string;
}
