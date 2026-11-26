import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ANEXOS_CARTA, type AnexoCarta } from '../services/carta-firmada-rules';

const MAX_CLAVE = 500;
const MAX_MOTIVO = 2000;

/** POST …/cartas/upload-url: el anexo se valida contra el resultado del pleno y el tipo de estudio. */
export class SolicitarSubidaCartaDto {
  @IsIn(ANEXOS_CARTA, {
    message: 'El anexo debe ser ANEXO_13, ANEXO_14, ANEXO_15 o ANEXO_16.',
  })
  anexoCodigo!: AnexoCarta;
}

/** POST …/cartas: registra la versión subida. La clave la genera el backend en upload-url. */
export class RegistrarCartaFirmadaDto {
  @IsString({ message: 'La clave del archivo debe ser texto.' })
  @MinLength(1, { message: 'La clave del archivo es obligatoria.' })
  @MaxLength(MAX_CLAVE, {
    message: `La clave del archivo no puede superar ${MAX_CLAVE} caracteres.`,
  })
  claveArchivo!: string;

  @IsIn(ANEXOS_CARTA, {
    message: 'El anexo debe ser ANEXO_13, ANEXO_14, ANEXO_15 o ANEXO_16.',
  })
  anexoCodigo!: AnexoCarta;

  @IsOptional()
  @IsString({ message: 'El motivo del reemplazo debe ser texto.' })
  @MaxLength(MAX_MOTIVO, {
    message: `El motivo del reemplazo no puede superar ${MAX_MOTIVO} caracteres.`,
  })
  motivoReemplazo?: string;
}
