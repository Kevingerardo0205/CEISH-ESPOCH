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
  abstract getMetadata(key: string): Promise<any>;

  /**
   * Subir un archivo en buffer directamente desde el backend
   */
  abstract uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void>;
}
