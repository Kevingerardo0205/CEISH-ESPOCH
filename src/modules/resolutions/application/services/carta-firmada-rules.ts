/** Códigos de catalogo.tipos_estudio (StudyTypeCode): EX exento, EC ensayo clínico. */
const CODIGO_ESTUDIO_EXENTO = 'EX';
const CODIGO_ENSAYO_CLINICO = 'EC';
import type { ResultadoPleno } from '../../../evaluations/domain/services/calcular-resultado-pleno';
import type { TipoResolucion } from './resultado-resolucion.service';

/**
 * TSK-015-N09 — spec-003 RF-17.2 y RF-17.4 (v1.6.6). Reglas puras de la carta firmada.
 * Sin acceso a datos ni a almacenamiento.
 */

/** Anexos de la carta firmada (catalogos.tipos_documento, TSK-015-N14). */
export const ANEXOS_CARTA = [
  'ANEXO_13',
  'ANEXO_14',
  'ANEXO_15',
  'ANEXO_16',
] as const;
export type AnexoCarta = (typeof ANEXOS_CARTA)[number];

/** Tamaño máximo del PDF de la carta firmada (RF-17.4). */
export const TAMANO_MAXIMO_CARTA_BYTES = 10 * 1024 * 1024;

/** Cabecera que debe tener el contenido del archivo (verificación real, no solo el tipo declarado). */
export const CABECERA_PDF = '%PDF-';

/** Tipo de resolución de cada resultado (APROBADO=1, CON_OBSERVACIONES=2, RECHAZADO=3). */
const TIPO_RESOLUCION_POR_RESULTADO: Record<ResultadoPleno, TipoResolucion> = {
  APROBADO_DEFINITIVO: 1,
  APROBADO_CON_CONDICION: 2,
  NO_APROBADO: 3,
};

/**
 * Anexo exigido (RF-17.2): APROBADO_DEFINITIVO → 13 (observacional/intervención) o 14 (ensayo clínico);
 * APROBADO_CON_CONDICION → 15; NO_APROBADO → 16. El EX no pasa por el pleno: devuelve null.
 */
export function anexoParaResultado(
  resultado: ResultadoPleno,
  tipoEstudio: string,
): AnexoCarta | null {
  if (esEstudioExento(tipoEstudio)) return null;
  switch (resultado) {
    case 'APROBADO_DEFINITIVO':
      return tipoEstudio === CODIGO_ENSAYO_CLINICO ? 'ANEXO_14' : 'ANEXO_13';
    case 'APROBADO_CON_CONDICION':
      return 'ANEXO_15';
    case 'NO_APROBADO':
      return 'ANEXO_16';
    default:
      return null;
  }
}

export function esEstudioExento(tipoEstudio: string): boolean {
  return tipoEstudio === CODIGO_ESTUDIO_EXENTO;
}

/** numero_version independiente por convocatoria-protocolo: máximo existente + 1. */
export function numeroVersionSiguiente(maximoExistente: number): number {
  return maximoExistente + 1;
}

/** El motivo del reemplazo es obligatorio desde la versión 2. */
export function requiereMotivo(numeroVersion: number): boolean {
  return numeroVersion > 1;
}

export function tipoResolucionParaResultado(
  resultado: ResultadoPleno,
): TipoResolucion {
  return TIPO_RESOLUCION_POR_RESULTADO[resultado];
}

/** Prefijo de la clave de una versión: `protocols/{id}/resolutions/{cpId}/v{n}/`. */
export function prefijoClaveCarta(
  protocoloId: number,
  convocatoriaProtocoloId: string,
  numeroVersion: number,
): string {
  return `protocols/${protocoloId}/resolutions/${convocatoriaProtocoloId}/v${numeroVersion}/`;
}

/** Etiqueta de la decisión para el asunto y el cuerpo del correo (igual que el legacy). */
export function etiquetaDecision(resultado: ResultadoPleno): string {
  switch (resultado) {
    case 'APROBADO_DEFINITIVO':
      return 'Protocolo Aprobado';
    case 'NO_APROBADO':
      return 'Protocolo Rechazado';
    default:
      return 'Aprobado con Observaciones / Subsanación';
  }
}
