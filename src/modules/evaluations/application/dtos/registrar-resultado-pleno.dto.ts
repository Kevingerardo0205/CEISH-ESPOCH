import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Resultados del pleno por protocolo (spec-003 RF-17.1, TSK-015-N08). SUSPENDIDO no es resultado del pleno. */
export const RESULTADOS_PLENO = [
  'APROBADO_DEFINITIVO',
  'APROBADO_CON_CONDICION',
  'NO_APROBADO',
] as const;

export type ResultadoPleno = (typeof RESULTADOS_PLENO)[number];

const MAX_TEXTO = 2000;

export class RegistrarResultadoPlenoDto {
  @IsIn(RESULTADOS_PLENO, {
    message:
      'El resultado debe ser APROBADO_DEFINITIVO, APROBADO_CON_CONDICION o NO_APROBADO.',
  })
  resultado!: ResultadoPleno;

  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto.' })
  @MaxLength(MAX_TEXTO, {
    message: `El motivo no puede superar ${MAX_TEXTO} caracteres.`,
  })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto.' })
  @MaxLength(MAX_TEXTO, {
    message: `Las observaciones no pueden superar ${MAX_TEXTO} caracteres.`,
  })
  observaciones?: string;

  @IsOptional()
  @IsString({ message: 'El motivo de la corrección debe ser texto.' })
  @MaxLength(MAX_TEXTO, {
    message: `El motivo de la corrección no puede superar ${MAX_TEXTO} caracteres.`,
  })
  motivoCorreccion?: string;
}
