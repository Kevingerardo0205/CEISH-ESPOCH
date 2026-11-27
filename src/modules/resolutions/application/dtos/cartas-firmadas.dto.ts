import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const MAX_CLAVE = 500;
const MAX_MOTIVO = 2000;

/**
 * POST …/cartas/upload-url (TSK-015-N27-6): sin campos. El anexo lo deriva el backend del resultado
 * del pleno (RF-17.1 v1.6.8). El ValidationPipe global (`forbidNonWhitelisted`) responde 400 si el
 * cliente envía cualquier propiedad, como `anexoCodigo`.
 */
export class SolicitarSubidaCartaDto {}

/**
 * POST …/cartas (TSK-015-N27-6): registra la versión subida. La clave la genera el backend en
 * upload-url. El anexo lo deriva el backend (sin `anexoCodigo`).
 */
export class RegistrarCartaFirmadaDto {
  @IsString({ message: 'La clave del archivo debe ser texto.' })
  @MinLength(1, { message: 'La clave del archivo es obligatoria.' })
  @MaxLength(MAX_CLAVE, {
    message: `La clave del archivo no puede superar ${MAX_CLAVE} caracteres.`,
  })
  claveArchivo!: string;

  @IsOptional()
  @IsString({ message: 'El motivo del reemplazo debe ser texto.' })
  @MaxLength(MAX_MOTIVO, {
    message: `El motivo del reemplazo no puede superar ${MAX_MOTIVO} caracteres.`,
  })
  motivoReemplazo?: string;
}
