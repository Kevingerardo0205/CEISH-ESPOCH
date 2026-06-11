import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Resultados para áreas específicas (Anexo 9)
 */
export enum AspectResult {
  APROBADO = 'APROBADO',
  NO_APROBADO = 'NO_APROBADO',
  CON_OBSERVACIONES = 'CON_OBSERVACIONES',
}

/**
 * Resultados globales (Anexo 10 y 11)
 */
export enum GlobalResult {
  APROBADO = 'APROBADO',
  APROBADO_CONDICIONADO = 'APROBADO_CONDICIONADO',
  NO_APROBADO = 'NO_APROBADO',
}

/**
 * Estados para los ítems individuales del checklist
 */
export enum ChecklistItemState {
  C = 'C', // Cumple
  NC = 'NC', // No cumple
  NA = 'NA', // No aplica
}

/**
 * DTO para la respuesta individual de un ítem del checklist
 */
export class EvaluationItemResponseDto {
  @ApiProperty({
    example: 'ET_2',
    description: 'Código del ítem (ej. ET_1, MET_5)',
  })
  @IsString()
  itemCodigo!: string;

  @ApiProperty({
    enum: ChecklistItemState,
    example: 'NC',
    description: 'Estado: C (Cumple), NC (No cumple), NA (No aplica)',
  })
  @IsEnum(ChecklistItemState)
  estado!: ChecklistItemState;

  @ApiProperty({
    required: false,
    example: 'Falta describir riesgos de confidencialidad.',
    description: 'Observación del evaluador',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

/**
 * DTO para el detalle de un aspecto (Ético, Metodológico o Jurídico)
 */
export class Annex9AspectDetailDto {
  @ApiProperty({ enum: AspectResult })
  @IsEnum(AspectResult)
  resultado!: AspectResult;

  @ApiProperty({
    required: false,
    description: 'Plazo para absolver observaciones',
  })
  @IsOptional()
  @IsString()
  plazo?: string;

  @ApiProperty({
    required: false,
    description: 'Observaciones generales del aspecto',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiProperty({
    type: [EvaluationItemResponseDto],
    description: 'Checklist de ítems individuales del aspecto',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemResponseDto)
  items!: EvaluationItemResponseDto[];
}

/**
 * ANEXO 9: Guía para evaluación expedita
 * Triple evaluación: Ética, Metodológica y Jurídica con checklist de ítems
 */
export class Annex9Dto {
  @ApiProperty({ type: Annex9AspectDetailDto })
  @ValidateNested()
  @Type(() => Annex9AspectDetailDto)
  etica!: Annex9AspectDetailDto;

  @ApiProperty({ type: Annex9AspectDetailDto })
  @ValidateNested()
  @Type(() => Annex9AspectDetailDto)
  metodologia!: Annex9AspectDetailDto;

  @ApiProperty({ type: Annex9AspectDetailDto })
  @ValidateNested()
  @Type(() => Annex9AspectDetailDto)
  juridica!: Annex9AspectDetailDto;
}

/**
 * ANEXO 10: Guía para evaluación en pleno
 */
export class Annex10Dto {
  @ApiProperty({ enum: GlobalResult })
  @IsEnum(GlobalResult)
  resultado!: GlobalResult;

  @ApiProperty({
    description: 'Describir requisitos/aspectos a completar para aprobación',
    required: false,
  })
  @IsOptional()
  @IsString()
  condicionesDescripcion?: string;
}

/**
 * ANEXO 11: Guía para evaluación de ensayos clínicos (Obsoleto en la práctica pero conservado para compatibilidad)
 */
export class Annex11Dto {
  @ApiProperty({
    enum: GlobalResult,
    description: 'Aprobado, Condicionado o No aprobado',
  })
  @IsEnum(GlobalResult)
  resultado!: GlobalResult;

  @ApiProperty({
    required: false,
    description: 'Fecha en la que se realizó la evaluación',
  })
  @IsOptional()
  @IsDateString()
  fechaEvaluacion?: string;
}
