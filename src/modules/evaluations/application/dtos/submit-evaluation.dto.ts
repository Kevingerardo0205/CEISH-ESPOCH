import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Annex9Dto,
  Annex10Dto,
  Annex11Dto,
} from './annexes/evaluation-forms.dto';

import { EvaluatorDictamen } from '../../domain/enums/evaluator-dictamen.enum';
export { EvaluatorDictamen as EvaluationResult };

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
    example: 1,
    enum: EvaluatorDictamen,
    description: 'Dictamen final de la evaluación',
  })
  @IsEnum(EvaluatorDictamen)
  result!: EvaluatorDictamen;

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

  @ApiProperty({
    example: false,
    required: false,
    description:
      'Indica si es un borrador (guarda y genera Anexo 9 sin cerrar el flujo)',
  })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
