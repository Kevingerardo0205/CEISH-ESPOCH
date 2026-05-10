import {
  IsBoolean,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EthicalAspectsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  balanceBeneficioRiesgo!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  consentimientoInformadoValido!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  proteccionDatosSensibles!: boolean;

  @ApiProperty({ example: 'Observaciones sobre ética...' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class MethodologicalAspectsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  objetivosClaros!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  metodologiaAdecuada!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  tamanoMuestraJustificado!: boolean;

  @ApiProperty({ example: 'Observaciones metodológicas...' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class LegalAspectsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  cumpleNormativaNacional!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  declaracionConflictoInteres!: boolean;

  @ApiProperty({ example: 'Observaciones legales...' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

/**
 * Anexo 10: Formulario de Evaluación para Revisión por Pleno
 */
export class Annex10Dto {
  @ApiProperty({ type: EthicalAspectsDto })
  @ValidateNested()
  @Type(() => EthicalAspectsDto)
  etica!: EthicalAspectsDto;

  @ApiProperty({ type: MethodologicalAspectsDto })
  @ValidateNested()
  @Type(() => MethodologicalAspectsDto)
  metodologia!: MethodologicalAspectsDto;

  @ApiProperty({ type: LegalAspectsDto })
  @ValidateNested()
  @Type(() => LegalAspectsDto)
  legal!: LegalAspectsDto;
}

/**
 * Anexo 9: Formulario de Evaluación para Revisión Expedita (Simplificado)
 */
export class Annex9Dto {
  @ApiProperty({ example: true })
  @IsBoolean()
  cumpleCriteriosExpedita!: boolean;

  @ApiProperty({ type: EthicalAspectsDto })
  @ValidateNested()
  @Type(() => EthicalAspectsDto)
  etica!: EthicalAspectsDto;

  @ApiProperty({ example: 'Justificación de revisión rápida...' })
  @IsString()
  justificacion!: string;
}

/**
 * Anexo 11: Formulario de Evaluación para Ensayos Clínicos
 */
export class Annex11Dto extends Annex10Dto {
  @ApiProperty({ example: true })
  @IsBoolean()
  aprobacionArcsaVerificada!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  polizaSeguroVigente!: boolean;

  @ApiProperty({ example: 'Datos específicos del fármaco...' })
  @IsOptional()
  @IsString()
  comentariosFarmaco?: string;
}
