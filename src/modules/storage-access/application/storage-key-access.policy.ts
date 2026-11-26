import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '../../../shared/enums/permission.enum';
import { AssignmentStatus } from '../../evaluations/domain/enums/assignment-status.enum';
import { ProtocolsService } from '../../protocols/application/services/protocols.service';
import { ProtocolStatus } from '../../protocols/domain/enums/protocol-status.enum';
import { ReceptionStatus } from '../../protocols/domain/enums/reception-status.enum';
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
  /** Solo en requisitos de subsanación de versión: `protocols/{id}/v{n}/requirements/…`. */
  version?: number;
}

const MAX_KEY_LENGTH = 1024;
const KEY_INVALIDA = 'Clave de archivo inválida.';
const ARCHIVO_NO_ENCONTRADO = 'Archivo no encontrado.';
const DOCUMENTO_NO_ENCONTRADO = 'Documento no encontrado.';

/** Prefijos que se deniegan hasta TSK-015-N22c (sin dueño identificable). */
const PREFIJOS_DENEGADOS: readonly string[] = ['draft'];

/** TSK-015-N22b: tipos MIME que se firman para escritura, por origen de la clave. */
export const CONTENT_TYPE_PDF = 'application/pdf';
export const CONTENT_TYPE_DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const CONTENT_TYPE_INVALIDO = 'Tipo de contenido no permitido para esta clave.';
const SIN_PERMISO_RESOLUCION = 'No tienes permiso para subir resoluciones.';
const SIN_PERMISO_PLANTILLA = 'No tienes permiso para subir plantillas.';
const ESTADO_NO_ADMITE_SUBIDA =
  'El protocolo no admite subir documentos en su estado actual.';

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
    // TSK-015-N22b: subsanación de versión, `protocols/{id}/v{n}/requirements/{req}/{file}`.
    if (tercero !== undefined && /^v\d+$/.test(tercero)) {
      const version = Number(tercero.slice(1));
      if (
        version < 1 ||
        segmentos[3] !== 'requirements' ||
        segmentos.length < 6
      ) {
        throw new BadRequestException(KEY_INVALIDA);
      }
      return { rule: 'REQUISITO', protocolId, version };
    }
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

  /**
   * TSK-015-N22b: decide si el usuario puede pedir una URL PUT para la clave.
   * 404 sin revelar existencia (no es dueño o no tiene asignación); 403 si falta un permiso
   * de rol (resoluciones, plantillas); 409 si es el investigador principal pero el estado del
   * protocolo no admite subir; 400 si el tipo de contenido no corresponde a la clave.
   */
  async assertCanWrite(
    key: string,
    contentType: string,
    writer: StorageReader,
  ): Promise<void> {
    const parsed = parseStorageKey(key);
    const noEncontrado = new NotFoundException(ARCHIVO_NO_ENCONTRADO);
    if (parsed.rule === null || parsed.rule === 'ANEXO9') throw noEncontrado;

    this.assertContentType(parsed.rule, contentType);

    switch (parsed.rule) {
      case 'RESOLUCION': {
        if (!this.tienePermiso(writer, Permission.RESOLUCION_CREAR)) {
          throw new ForbiddenException(SIN_PERMISO_RESOLUCION);
        }
        if (
          !(await this.protocolRepository.findById(parsed.protocolId as number))
        ) {
          throw noEncontrado;
        }
        return;
      }
      case 'REQUISITO': {
        const protocol = await this.protocolRepository.findById(
          parsed.protocolId as number,
        );
        if (!protocol || protocol.principalInvestigatorId !== writer.id) {
          throw noEncontrado;
        }
        if (!this.requisitoAdmiteSubida(protocol, parsed.version)) {
          throw new ConflictException(ESTADO_NO_ADMITE_SUBIDA);
        }
        return;
      }
      case 'PROTOCOLO_EVALUACION': {
        // Solo docEvaluacion: el resto de subrutas de protocols/{id}/ no se escribe por clave.
        if (key.split('/')[2] !== 'docEvaluacion') throw noEncontrado;
        const asignado = await this.protocolRepository.hasEvaluatorAssignment(
          parsed.protocolId as number,
          writer.id,
          [AssignmentStatus.ASSIGNED],
        );
        if (!asignado) throw noEncontrado;
        return;
      }
      case 'CV':
        if (String(parsed.ownerId) !== String(writer.id)) throw noEncontrado;
        return;
      case 'PLANTILLA':
        if (!this.tienePermiso(writer, Permission.CONFIG_PLANTILLAS)) {
          throw new ForbiddenException(SIN_PERMISO_PLANTILLA);
        }
        return;
      default:
        throw noEncontrado;
    }
  }

  private assertContentType(rule: StorageKeyRule, contentType: string): void {
    const esperado =
      rule === 'PLANTILLA' ? CONTENT_TYPE_DOCX : CONTENT_TYPE_PDF;
    if (contentType.trim().toLowerCase() !== esperado) {
      throw new BadRequestException(CONTENT_TYPE_INVALIDO);
    }
  }

  /**
   * Subida de requisitos del investigador principal:
   * - sin versión (`protocols/{id}/requirements/`): BORRADOR (recepción 9 en versión 1) o
   *   subsanación documental (recepción en REQUIERE_SUBSANACION_DOC, 20);
   * - con versión (`protocols/{id}/v{n}/requirements/`): protocolo en REQUIERE_SUBSANACION_VERSION
   *   (19) y n igual a la versión activa.
   * Nota: PENDIENTE_SUBSANACION del getter `receptionStatus` es un valor por defecto, no un
   * estado concreto, así que no se usa como regla de escritura.
   */
  private requisitoAdmiteSubida(
    protocol: {
      statusId?: number;
      receptionStatus: ReceptionStatus;
      activeVersion?: {
        versionNumber?: number;
        reception?: { statusId?: number };
      };
    },
    version?: number,
  ): boolean {
    if (version === undefined) {
      return (
        protocol.receptionStatus === ReceptionStatus.BORRADOR ||
        protocol.activeVersion?.reception?.statusId ===
          ProtocolStatus.REQUIERE_SUBSANACION_DOC
      );
    }
    return (
      protocol.statusId === ProtocolStatus.REQUIERE_SUBSANACION_VERSION &&
      protocol.activeVersion?.versionNumber === version
    );
  }

  private tienePermiso(reader: StorageReader, permiso: Permission): boolean {
    return (reader.permissions ?? []).includes(permiso);
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
