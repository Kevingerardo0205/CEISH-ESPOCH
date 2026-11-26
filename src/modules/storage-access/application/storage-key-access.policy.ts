import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '../../../shared/enums/permission.enum';
import { ProtocolsService } from '../../protocols/application/services/protocols.service';
import { IProtocolRepository } from '../../protocols/domain/ports/protocol.repository.port';
import { ReceptionService } from '../../reception/application/services/reception.service';
import { canReadResolution } from '../../resolutions/application/services/resolutions.service';

/**
 * TSK-015-N22a (hallazgo C lectura, hallazgo I, hallazgo Evaluador / tarea B7).
 * Decide si un usuario puede leer el recurso al que pertenece una clave de storage.
 * Reutiliza las reglas existentes: canReadResolution (N17), ProtocolsService.findOneForReader
 * (RF-02.10). No duplica reglas.
 */

/** Usuario autenticado tal como lo deja JwtStrategy.validate en req.user. */
export interface StorageReader {
  id: number;
  permissions?: string[];
}

export type StorageKeyRule =
  | 'RESOLUCION'
  | 'REQUISITO'
  | 'PROTOCOLO_EVALUACION'
  | 'CV'
  | 'PLANTILLA'
  | 'ANEXO9';

export interface ParsedStorageKey {
  rule: StorageKeyRule | null;
  protocolId?: number;
  ownerId?: number;
}

const MAX_KEY_LENGTH = 1024;
const KEY_INVALIDA = 'Clave de archivo inválida.';
const ARCHIVO_NO_ENCONTRADO = 'Archivo no encontrado.';
const DOCUMENTO_NO_ENCONTRADO = 'Documento no encontrado.';

/** Prefijos que se deniegan hasta TSK-015-N22c (sin dueño identificable). */
const PREFIJOS_DENEGADOS: readonly string[] = ['draft'];

/**
 * Interpreta una clave de storage. Lanza 400 si la clave está mal formada o usa un prefijo
 * denegado. Devuelve rule = null si el prefijo no es conocido (la política responde 404).
 */
export function parseStorageKey(key: string): ParsedStorageKey {
  if (
    typeof key !== 'string' ||
    key.length === 0 ||
    key.length > MAX_KEY_LENGTH
  ) {
    throw new BadRequestException(KEY_INVALIDA);
  }
  // Traversal, rutas absolutas, separadores de Windows, caracteres de control y segmentos vacíos.
  if (
    key.includes('..') ||
    key.includes('\\') ||
    key.startsWith('/') ||
    [...key].some((c) => c.charCodeAt(0) < 0x20)
  ) {
    throw new BadRequestException(KEY_INVALIDA);
  }
  const segmentos = key.split('/');
  if (segmentos.some((s) => s.length === 0)) {
    throw new BadRequestException(KEY_INVALIDA);
  }
  const [raiz, segundo, tercero] = segmentos;

  if (PREFIJOS_DENEGADOS.includes(raiz)) {
    throw new BadRequestException(KEY_INVALIDA);
  }

  if (raiz === 'protocols') {
    if (segmentos.length < 3 || !/^\d+$/.test(segundo)) {
      throw new BadRequestException(KEY_INVALIDA);
    }
    const protocolId = Number(segundo);
    if (tercero === 'resolutions') return { rule: 'RESOLUCION', protocolId };
    if (tercero === 'requirements') return { rule: 'REQUISITO', protocolId };
    return { rule: 'PROTOCOLO_EVALUACION', protocolId };
  }

  if (raiz === 'investigators') {
    if (segmentos.length < 3 || tercero !== 'cv' || !/^\d+$/.test(segundo)) {
      throw new BadRequestException(KEY_INVALIDA);
    }
    return { rule: 'CV', ownerId: Number(segundo) };
  }

  if (raiz === 'templates') return { rule: 'PLANTILLA' };

  if (raiz === 'evaluations' && segundo === 'anexo9') return { rule: 'ANEXO9' };

  return { rule: null };
}

@Injectable()
export class StorageKeyAccessPolicy {
  constructor(
    private readonly protocolsService: ProtocolsService,
    private readonly protocolRepository: IProtocolRepository,
    private readonly receptionService: ReceptionService,
  ) {}

  /** Lanza 400 si la clave es inválida y 404 (sin revelar existencia) si no puede leerla. */
  async assertCanRead(key: string, reader: StorageReader): Promise<void> {
    const parsed = parseStorageKey(key);
    const noEncontrado = new NotFoundException(ARCHIVO_NO_ENCONTRADO);

    switch (parsed.rule) {
      case 'RESOLUCION': {
        const protocol = await this.protocolRepository.findById(
          parsed.protocolId as number,
        );
        if (
          !protocol ||
          !canReadResolution(protocol.principalInvestigatorId, reader)
        ) {
          throw noEncontrado;
        }
        return;
      }
      case 'REQUISITO':
        if (
          !(await this.puedeVerProtocolo(parsed.protocolId as number, reader))
        ) {
          throw noEncontrado;
        }
        return;
      case 'PROTOCOLO_EVALUACION':
        if (
          !(await this.puedeVerDocumentoDeEvaluacion(
            parsed.protocolId as number,
            reader,
          ))
        ) {
          throw noEncontrado;
        }
        return;
      case 'CV':
        if (String(parsed.ownerId) !== String(reader.id)) throw noEncontrado;
        return;
      case 'PLANTILLA':
        // Lectura de plantillas para cualquier usuario autenticado (decisión de la usuaria).
        return;
      case 'ANEXO9':
        // El Anexo 9 se descarga por GET /evaluations/:id/document (dueño de la evaluación).
        // Por clave solo lo ve quien gestiona informes.
        if (!this.tieneInformes(reader)) throw noEncontrado;
        return;
      default:
        throw noEncontrado;
    }
  }

  /** Documento de recepción por id: el dueño sale de la fila; se aplica la regla del protocolo. */
  async assertCanReadDocument(
    documentId: number,
    reader: StorageReader,
  ): Promise<void> {
    if (!Number.isInteger(documentId) || documentId <= 0) {
      throw new BadRequestException('ID de documento inválido');
    }
    const document = await this.receptionService.findDocumentById(documentId);
    if (
      !document ||
      !(await this.puedeVerProtocolo(document.protocolId, reader))
    ) {
      throw new NotFoundException(DOCUMENTO_NO_ENCONTRADO);
    }
  }

  private tieneInformes(reader: StorageReader): boolean {
    return (reader.permissions ?? []).includes(Permission.EVALUACION_INFORMES);
  }

  /** Misma regla que RF-02.10 (GET /protocols/:id). */
  private async puedeVerProtocolo(
    protocolId: number,
    reader: StorageReader,
  ): Promise<boolean> {
    try {
      await this.protocolsService.findOneForReader(protocolId, reader);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) return false;
      throw error;
    }
  }

  /**
   * Documentos de evaluación (docEvaluacion, informes): SECRETARIA y PRESIDENTE con
   * EVALUACION_INFORMES, o el evaluador asignado (estados 5/6/7 vía findOneForReader).
   * El investigador principal no los ve.
   */
  private async puedeVerDocumentoDeEvaluacion(
    protocolId: number,
    reader: StorageReader,
  ): Promise<boolean> {
    if (this.tieneInformes(reader)) {
      return (await this.protocolRepository.findById(protocolId)) !== null;
    }
    const protocol = await this.protocolRepository.findById(protocolId);
    if (!protocol || protocol.principalInvestigatorId === reader.id)
      return false;
    return this.puedeVerProtocolo(protocolId, reader);
  }
}
