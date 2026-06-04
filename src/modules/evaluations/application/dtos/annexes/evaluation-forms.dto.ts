import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
 * ANEXO 9: Guía para evaluación expedita
 * Triple evaluación: Ética, Metodológica y Jurídica
 */
export class Annex9Dto {
  // Evaluación Ética
  @ApiProperty({ enum: AspectResult })
  @IsEnum(AspectResult)
  eticaResult!: AspectResult;

  @ApiProperty({
    required: false,
    description: 'Plazo para absolver observaciones éticas',
  })
  @IsOptional()
  @IsString()
  eticaPlazo?: string;

  @ApiProperty({
    required: false,
    description: 'Observaciones detalladas de la evaluación ética',
  })
  @IsOptional()
  @IsString()
  eticaObservaciones?: string;

  // Evaluación Metodológica
  @ApiProperty({ enum: AspectResult })
  @IsEnum(AspectResult)
  metodologiaResult!: AspectResult;

  @ApiProperty({
    required: false,
    description: 'Plazo para absolver observaciones metodológicas',
  })
  @IsOptional()
  @IsString()
  metodologiaPlazo?: string;

  @ApiProperty({
    required: false,
    description: 'Observaciones detalladas de la evaluación metodológica',
  })
  @IsOptional()
  @IsString()
  metodologiaObservaciones?: string;

  // Evaluación Jurídica
  @ApiProperty({ enum: AspectResult })
  @IsEnum(AspectResult)
  juridicaResult!: AspectResult;

  @ApiProperty({
    required: false,
    description: 'Plazo para absolver observaciones jurídicas',
  })
  @IsOptional()
  @IsString()
  juridicaPlazo?: string;

  @ApiProperty({
    required: false,
    description: 'Observaciones detalladas de la evaluación jurídica',
  })
  @IsOptional()
  @IsString()
  juridicaObservaciones?: string;
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
 * ANEXO 11: Guía para evaluación de ensayos clínicos
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
