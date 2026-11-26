export abstract class IStorageService {
  /**
   * Generar URL prefirmada para subir un archivo (método PUT)
   */
  abstract generateUploadUrl(
    key: string,
    contentType: string,
    expiresSeconds?: number,
  ): Promise<string>;

  /**
   * Obtener URL prefirmada para descargar/visualizar un archivo (método GET)
   */
  abstract getDownloadUrl(
    key: string,
    expiresSeconds?: number,
  ): Promise<string>;

  /**
   * Eliminar un archivo del bucket
   */
  abstract deleteFile(key: string): Promise<void>;

  /**
   * Eliminar múltiples archivos del bucket en lote
   */
  abstract deleteMultipleFiles(keys: string[]): Promise<void>;

  /**
   * Obtener metadatos básicos de un objeto (ContentType, ContentLength, etc.)
   */
  abstract getMetadata(key: string): Promise<Record<string, unknown>>;

  /**
   * Leer un rango de bytes [start, end] (inclusive) de un objeto. Lo usa la verificación de
   * cartas firmadas para comprobar la cabecera `%PDF-` (TSK-015-N09, RF-17.4 v1.6.6).
   */
  abstract readRange(key: string, start: number, end: number): Promise<Buffer>;

  /**
   * Subir un archivo en buffer directamente desde el backend
   */
  abstract uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void>;
}
