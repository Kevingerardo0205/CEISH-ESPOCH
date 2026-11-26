/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '../../../shared/enums/permission.enum';
import { AssignmentStatus } from '../../evaluations/domain/enums/assignment-status.enum';
import { ProtocolsService } from '../../protocols/application/services/protocols.service';
import { ProtocolStatus } from '../../protocols/domain/enums/protocol-status.enum';
import { ReceptionStatus } from '../../protocols/domain/enums/reception-status.enum';
import { IProtocolRepository } from '../../protocols/domain/ports/protocol.repository.port';
import { ReceptionService } from '../../reception/application/services/reception.service';
import {
  CONTENT_TYPE_DOCX,
  CONTENT_TYPE_PDF,
  StorageKeyAccessPolicy,
  parseStorageKey,
} from './storage-key-access.policy';

/** TSK-015-N22a: pruebas unitarias de la política de acceso por clave y por documento. */

const ARCHIVO = 'Archivo no encontrado.';
const DOCUMENTO = 'Documento no encontrado.';
const INVALIDA = 'Clave de archivo inválida.';

describe('parseStorageKey (TSK-015-N22a)', () => {
  it.each([
    ['', 'vacía'],
    ['../secreto.pdf', 'traversal al inicio'],
    ['protocols/1/../2/x.pdf', 'traversal en medio'],
    ['protocols\\1\\x.pdf', 'separador de Windows'],
    ['/uploads/archivo.pdf', 'ruta absoluta'],
    ['protocols//x.pdf', 'segmento vacío'],
    ['protocols/1/resolutions/a\u0001b.pdf', 'carácter de control'],
    ['draft/x.pdf', 'prefijo denegado hasta N22c'],
    ['protocols/abc/resolutions/x.pdf', 'id de protocolo no numérico'],
    ['protocols/1', 'protocolo sin subruta'],
    ['investigators/x/cv/y.pdf', 'id de investigador no numérico'],
    ['investigators/7/otra/y.pdf', 'investigador sin subruta cv'],
  ])('400 para %s (%s)', (clave) => {
    expect(() => parseStorageKey(clave)).toThrow(BadRequestException);
  });

  it('400 si la clave excede 1024 caracteres', () => {
    expect(() => parseStorageKey('a/'.repeat(600))).toThrow(
      BadRequestException,
    );
  });

  it('clasifica cada prefijo conocido', () => {
    expect(parseStorageKey('protocols/5/resolutions/c.pdf')).toEqual({
      rule: 'RESOLUCION',
      protocolId: 5,
    });
    expect(parseStorageKey('protocols/5/requirements/r/f.pdf')).toEqual({
      rule: 'REQUISITO',
      protocolId: 5,
    });
    expect(parseStorageKey('protocols/5/docEvaluacion/f.pdf')).toEqual({
      rule: 'PROTOCOLO_EVALUACION',
      protocolId: 5,
    });
    expect(parseStorageKey('investigators/7/cv/x.pdf')).toEqual({
      rule: 'CV',
      ownerId: 7,
    });
    expect(parseStorageKey('templates/formato.docx')).toEqual({
      rule: 'PLANTILLA',
    });
    expect(parseStorageKey('evaluations/anexo9/1-2.pdf')).toEqual({
      rule: 'ANEXO9',
    });
  });

  it('prefijo desconocido → rule null (la política responde 404)', () => {
    expect(parseStorageKey('archivo-sin-prefijo.pdf')).toEqual({ rule: null });
  });
});

describe('StorageKeyAccessPolicy (TSK-015-N22a)', () => {
  let protocolsService: { findOneForReader: jest.Mock };
  let protocolRepository: { findById: jest.Mock };
  let receptionService: { findDocumentById: jest.Mock };
  let policy: StorageKeyAccessPolicy;

  const investigadorPrincipal = { id: 1, permissions: [] as string[] };
  const otroInvestigador = { id: 2, permissions: [] as string[] };
  const secretaria = {
    id: 3,
    permissions: [
      Permission.EVALUACION_INFORMES,
      Permission.RESOLUCION_HISTORIAL,
    ],
  };
  const evaluador = { id: 4, permissions: [] as string[] };

  beforeEach(() => {
    protocolsService = { findOneForReader: jest.fn() };
    protocolRepository = { findById: jest.fn() };
    receptionService = { findDocumentById: jest.fn() };
    policy = new StorageKeyAccessPolicy(
      protocolsService as unknown as ProtocolsService,
      protocolRepository as unknown as IProtocolRepository,
      receptionService as unknown as ReceptionService,
    );
    protocolRepository.findById.mockResolvedValue({
      id: 5,
      principalInvestigatorId: 1,
    });
  });

  describe('resolución (protocols/{id}/resolutions/)', () => {
    const clave = 'protocols/5/resolutions/carta.pdf';

    it('investigador principal → permitido', async () => {
      await expect(
        policy.assertCanRead(clave, investigadorPrincipal),
      ).resolves.toBeUndefined();
    });

    it('SECRETARIA (RESOLUCION_HISTORIAL) → permitido', async () => {
      await expect(
        policy.assertCanRead(clave, secretaria),
      ).resolves.toBeUndefined();
    });

    it('otro investigador sin permiso → 404 sin revelar', async () => {
      await expect(
        policy.assertCanRead(clave, otroInvestigador),
      ).rejects.toThrow(new NotFoundException(ARCHIVO));
    });

    it('protocolo inexistente → 404', async () => {
      protocolRepository.findById.mockResolvedValue(null);
      await expect(
        policy.assertCanRead(clave, investigadorPrincipal),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('requisitos (protocols/{id}/requirements/)', () => {
    const clave = 'protocols/5/requirements/r1/f.pdf';

    it('permitido cuando findOneForReader resuelve', async () => {
      protocolsService.findOneForReader.mockResolvedValue({ id: 5 });
      await expect(
        policy.assertCanRead(clave, investigadorPrincipal),
      ).resolves.toBeUndefined();
      expect(protocolsService.findOneForReader).toHaveBeenCalledWith(
        5,
        investigadorPrincipal,
      );
    });

    it('404 cuando findOneForReader lanza NotFound', async () => {
      protocolsService.findOneForReader.mockRejectedValue(
        new NotFoundException('Protocolo no encontrado.'),
      );
      await expect(
        policy.assertCanRead(clave, otroInvestigador),
      ).rejects.toThrow(new NotFoundException(ARCHIVO));
    });

    it('propaga errores que no son NotFound', async () => {
      protocolsService.findOneForReader.mockRejectedValue(
        new InternalServerErrorException('fallo'),
      );
      await expect(
        policy.assertCanRead(clave, otroInvestigador),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('documentos de evaluación (protocols/{id}/docEvaluacion/)', () => {
    const clave = 'protocols/5/docEvaluacion/informe.pdf';

    it('SECRETARIA con EVALUACION_INFORMES → permitido sin consultar asignación', async () => {
      await expect(
        policy.assertCanRead(clave, secretaria),
      ).resolves.toBeUndefined();
      expect(protocolsService.findOneForReader).not.toHaveBeenCalled();
    });

    it('investigador principal NO lo ve aunque findOneForReader lo permitiría', async () => {
      protocolsService.findOneForReader.mockResolvedValue({ id: 5 });
      await expect(
        policy.assertCanRead(clave, investigadorPrincipal),
      ).rejects.toThrow(new NotFoundException(ARCHIVO));
    });

    it('evaluador asignado (findOneForReader resuelve) → permitido', async () => {
      protocolsService.findOneForReader.mockResolvedValue({ id: 5 });
      await expect(
        policy.assertCanRead(clave, evaluador),
      ).resolves.toBeUndefined();
    });

    it('evaluador no asignado → 404', async () => {
      protocolsService.findOneForReader.mockRejectedValue(
        new NotFoundException('Protocolo no encontrado.'),
      );
      await expect(policy.assertCanRead(clave, evaluador)).rejects.toThrow(
        new NotFoundException(ARCHIVO),
      );
    });
  });

  describe('CV (investigators/{id}/cv/)', () => {
    it('solo el propio investigador', async () => {
      await expect(
        policy.assertCanRead('investigators/1/cv/x.pdf', investigadorPrincipal),
      ).resolves.toBeUndefined();
    });

    it('otro usuario → 404, incluso SECRETARIA', async () => {
      await expect(
        policy.assertCanRead('investigators/1/cv/x.pdf', secretaria),
      ).rejects.toThrow(new NotFoundException(ARCHIVO));
    });
  });

  it('plantillas (templates/) → cualquier autenticado', async () => {
    await expect(
      policy.assertCanRead('templates/formato.docx', evaluador),
    ).resolves.toBeUndefined();
  });

  describe('Anexo 9 por clave (evaluations/anexo9/)', () => {
    it('solo con EVALUACION_INFORMES', async () => {
      await expect(
        policy.assertCanRead('evaluations/anexo9/1-2.pdf', secretaria),
      ).resolves.toBeUndefined();
      await expect(
        policy.assertCanRead('evaluations/anexo9/1-2.pdf', evaluador),
      ).rejects.toThrow(new NotFoundException(ARCHIVO));
    });
  });

  it('prefijo desconocido → 404 sin consultar servicios', async () => {
    await expect(
      policy.assertCanRead('archivo-sin-prefijo.pdf', secretaria),
    ).rejects.toThrow(new NotFoundException(ARCHIVO));
    expect(protocolsService.findOneForReader).not.toHaveBeenCalled();
    expect(protocolRepository.findById).not.toHaveBeenCalled();
  });

  it('clave mal formada → 400 sin consultar servicios', async () => {
    await expect(
      policy.assertCanRead('../etc/passwd', secretaria),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(protocolRepository.findById).not.toHaveBeenCalled();
  });

  describe('documento de recepción por id (hallazgo I)', () => {
    it('id no entero o no positivo → 400', async () => {
      await expect(
        policy.assertCanReadDocument(NaN, secretaria),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        policy.assertCanReadDocument(0, secretaria),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('documento inexistente → 404 «Documento no encontrado.»', async () => {
      receptionService.findDocumentById.mockResolvedValue(null);
      await expect(policy.assertCanReadDocument(9, secretaria)).rejects.toThrow(
        new NotFoundException(DOCUMENTO),
      );
    });

    it('usa el protocolo de la fila y la regla de RF-02.10', async () => {
      receptionService.findDocumentById.mockResolvedValue({ protocolId: 5 });
      protocolsService.findOneForReader.mockResolvedValue({ id: 5 });
      await expect(
        policy.assertCanReadDocument(9, investigadorPrincipal),
      ).resolves.toBeUndefined();
      expect(protocolsService.findOneForReader).toHaveBeenCalledWith(
        5,
        investigadorPrincipal,
      );
    });

    it('sin permiso sobre el protocolo → 404 «Documento no encontrado.»', async () => {
      receptionService.findDocumentById.mockResolvedValue({ protocolId: 5 });
      protocolsService.findOneForReader.mockRejectedValue(
        new NotFoundException('Protocolo no encontrado.'),
      );
      await expect(
        policy.assertCanReadDocument(9, otroInvestigador),
      ).rejects.toThrow(new NotFoundException(DOCUMENTO));
    });
  });

  it('el mensaje de clave inválida es el de la política', () => {
    expect(() => parseStorageKey('..')).toThrow(INVALIDA);
  });
});

/** TSK-015-N22b: escritura por clave (assertCanWrite). */
describe('StorageKeyAccessPolicy.assertCanWrite (TSK-015-N22b)', () => {
  const principal = { id: 1, permissions: [] as string[] };
  const otroInvestigador = { id: 2, permissions: [] as string[] };
  const secretaria = {
    id: 3,
    permissions: [Permission.EVALUACION_INFORMES],
  };
  const secretariaConResoluciones = {
    id: 3,
    permissions: [Permission.RESOLUCION_CREAR],
  };
  const evaluador = { id: 4, permissions: [] as string[] };
  const config = { id: 6, permissions: [Permission.CONFIG_PLANTILLAS] };

  const NO_ENCONTRADO = new NotFoundException('Archivo no encontrado.');
  const PDF = CONTENT_TYPE_PDF;
  const DOCX = CONTENT_TYPE_DOCX;

  /** Protocolo del principal. Por defecto: en revisión de secretaría (15), sin BORRADOR. */
  const protocolo = (over: Record<string, unknown> = {}) => ({
    id: 5,
    principalInvestigatorId: 1,
    statusId: 13,
    receptionStatus: ReceptionStatus.PENDIENTE_SUBSANACION,
    activeVersion: { versionNumber: 1, reception: { statusId: 15 } },
    ...over,
  });

  let protocolsService: { findOneForReader: jest.Mock };
  let protocolRepository: {
    findById: jest.Mock;
    hasEvaluatorAssignment: jest.Mock;
  };
  let receptionService: { findDocumentById: jest.Mock };
  let policy: StorageKeyAccessPolicy;

  beforeEach(() => {
    protocolsService = { findOneForReader: jest.fn() };
    protocolRepository = {
      findById: jest.fn().mockResolvedValue(protocolo()),
      hasEvaluatorAssignment: jest.fn().mockResolvedValue(false),
    };
    receptionService = { findDocumentById: jest.fn() };
    policy = new StorageKeyAccessPolicy(
      protocolsService as unknown as ProtocolsService,
      protocolRepository as unknown as IProtocolRepository,
      receptionService as unknown as ReceptionService,
    );
  });

  describe('resoluciones (protocols/{id}/resolutions/)', () => {
    const clave = 'protocols/5/resolutions/carta.pdf';

    it('RESOLUCION_CREAR + PDF → permitido', async () => {
      await expect(
        policy.assertCanWrite(clave, PDF, secretariaConResoluciones),
      ).resolves.toBeUndefined();
    });

    it('sin RESOLUCION_CREAR → 403', async () => {
      await expect(
        policy.assertCanWrite(clave, PDF, secretaria),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('protocolo inexistente → 404', async () => {
      protocolRepository.findById.mockResolvedValue(null);
      await expect(
        policy.assertCanWrite(clave, PDF, secretariaConResoluciones),
      ).rejects.toThrow(NO_ENCONTRADO);
    });
  });

  describe('requisitos sin versión (protocols/{id}/requirements/)', () => {
    const clave = 'protocols/5/requirements/r1/f.pdf';

    it('principal en BORRADOR (recepción 9, versión 1) → permitido', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          receptionStatus: ReceptionStatus.BORRADOR,
          activeVersion: { versionNumber: 1, reception: { statusId: 9 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).resolves.toBeUndefined();
    });

    it('principal en subsanación documental (recepción 20) → permitido', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          activeVersion: { versionNumber: 1, reception: { statusId: 20 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).resolves.toBeUndefined();
    });

    it('principal con recepción en 15 (en revisión) → 409', async () => {
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).rejects.toThrow(
        new ConflictException(
          'El protocolo no admite subir documentos en su estado actual.',
        ),
      );
    });

    it('principal con recepción 11 (incompleto) → 409 (no es un estado de subida)', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          activeVersion: { versionNumber: 1, reception: { statusId: 11 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('principal en BORRADOR con versión 2 de recepción 9 → 409 (no es borrador)', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          receptionStatus: ReceptionStatus.EVALUACION_SUBSANACIONES,
          activeVersion: { versionNumber: 2, reception: { statusId: 9 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('SECRETARIA (no principal) → 404, aunque el estado admita subir', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          activeVersion: { versionNumber: 1, reception: { statusId: 20 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, secretaria),
      ).rejects.toThrow(NO_ENCONTRADO);
    });

    it('otro investigador → 404', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          activeVersion: { versionNumber: 1, reception: { statusId: 20 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, otroInvestigador),
      ).rejects.toThrow(NO_ENCONTRADO);
    });

    it('protocolo inexistente → 404', async () => {
      protocolRepository.findById.mockResolvedValue(null);
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).rejects.toThrow(NO_ENCONTRADO);
    });
  });

  describe('requisitos de subsanación de versión (protocols/{id}/v{n}/requirements/)', () => {
    const clave = 'protocols/5/v2/requirements/r1/f.pdf';

    it('principal, protocolo en REQUIERE_SUBSANACION_VERSION (19) y versión activa 2 → permitido', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          statusId: ProtocolStatus.REQUIERE_SUBSANACION_VERSION,
          activeVersion: { versionNumber: 2, reception: { statusId: 9 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).resolves.toBeUndefined();
    });

    it('principal, protocolo en 19 pero la clave indica v2 y la activa es v1 → 409', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          statusId: ProtocolStatus.REQUIERE_SUBSANACION_VERSION,
          activeVersion: { versionNumber: 1, reception: { statusId: 9 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('principal, protocolo fuera de 19 (en 13) → 409', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          statusId: 13,
          activeVersion: { versionNumber: 2, reception: { statusId: 9 } },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('otro usuario → 404', async () => {
      protocolRepository.findById.mockResolvedValue(
        protocolo({
          statusId: ProtocolStatus.REQUIERE_SUBSANACION_VERSION,
          activeVersion: { versionNumber: 2 },
        }),
      );
      await expect(
        policy.assertCanWrite(clave, PDF, otroInvestigador),
      ).rejects.toThrow(NO_ENCONTRADO);
    });
  });

  describe('documentos de evaluación (protocols/{id}/docEvaluacion/)', () => {
    const clave = 'protocols/5/docEvaluacion/informe.pdf';

    /** Simula la consulta real: solo cuenta la asignación si su estado está en statusIds. */
    const asignacionEn = (estado: number) =>
      protocolRepository.hasEvaluatorAssignment.mockImplementation(
        (_p: number, _u: number, ids: readonly number[]) =>
          Promise.resolve(ids.includes(estado)),
      );

    it('evaluador con asignación ASIGNADA (6) → permitido', async () => {
      asignacionEn(AssignmentStatus.ASSIGNED);
      await expect(
        policy.assertCanWrite(clave, PDF, evaluador),
      ).resolves.toBeUndefined();
      expect(protocolRepository.hasEvaluatorAssignment).toHaveBeenCalledWith(
        5,
        4,
        [AssignmentStatus.ASSIGNED],
      );
    });

    it('evaluador con asignación SUGERIDA (5) → 404', async () => {
      asignacionEn(AssignmentStatus.SUGGESTED);
      await expect(
        policy.assertCanWrite(clave, PDF, evaluador),
      ).rejects.toThrow(NO_ENCONTRADO);
    });

    it('evaluador con asignación COMPLETADA (7) → 404', async () => {
      asignacionEn(AssignmentStatus.COMPLETED);
      await expect(
        policy.assertCanWrite(clave, PDF, evaluador),
      ).rejects.toThrow(NO_ENCONTRADO);
    });

    it('principal y SECRETARIA con EVALUACION_INFORMES → 404 (no escriben docEvaluacion)', async () => {
      await expect(
        policy.assertCanWrite(clave, PDF, principal),
      ).rejects.toThrow(NO_ENCONTRADO);
      await expect(
        policy.assertCanWrite(clave, PDF, secretaria),
      ).rejects.toThrow(NO_ENCONTRADO);
    });

    it('otra subruta de protocols/{id}/ (no docEvaluacion) → 404', async () => {
      asignacionEn(AssignmentStatus.ASSIGNED);
      await expect(
        policy.assertCanWrite('protocols/5/informes/x.pdf', PDF, evaluador),
      ).rejects.toThrow(NO_ENCONTRADO);
    });
  });

  describe('CV (investigators/{id}/cv/)', () => {
    it('el propio investigador con PDF → permitido', async () => {
      await expect(
        policy.assertCanWrite('investigators/1/cv/x.pdf', PDF, principal),
      ).resolves.toBeUndefined();
    });

    it('otro usuario, incluso SECRETARIA → 404', async () => {
      await expect(
        policy.assertCanWrite('investigators/1/cv/x.pdf', PDF, secretaria),
      ).rejects.toThrow(NO_ENCONTRADO);
    });
  });

  describe('plantillas (templates/)', () => {
    const clave = 'templates/formato.docx';

    it('con CONFIG_PLANTILLAS y DOCX → permitido', async () => {
      await expect(
        policy.assertCanWrite(clave, DOCX, config),
      ).resolves.toBeUndefined();
    });

    it('sin CONFIG_PLANTILLAS → 403', async () => {
      await expect(
        policy.assertCanWrite(clave, DOCX, evaluador),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('con permiso pero PDF → 400 (las plantillas son DOCX)', async () => {
      await expect(
        policy.assertCanWrite(clave, PDF, config),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('tipo de contenido (contentType)', () => {
    it('protocols/* con DOCX → 400 en español', async () => {
      await expect(
        policy.assertCanWrite(
          'protocols/5/resolutions/c.pdf',
          DOCX,
          secretariaConResoluciones,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Tipo de contenido no permitido para esta clave.',
        ),
      );
    });

    it('CV con DOCX → 400', async () => {
      await expect(
        policy.assertCanWrite('investigators/1/cv/x.docx', DOCX, principal),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('comparación sin distinguir mayúsculas ni espacios', async () => {
      await expect(
        policy.assertCanWrite(
          'investigators/1/cv/x.pdf',
          '  Application/PDF ',
          principal,
        ),
      ).resolves.toBeUndefined();
    });
  });

  it('clave con traversal → 400 sin consultar el repositorio', async () => {
    await expect(
      policy.assertCanWrite('protocols/5/../6/x.pdf', PDF, principal),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(protocolRepository.findById).not.toHaveBeenCalled();
  });

  it('Anexo 9 y prefijo desconocido → 404 (no escribibles por clave)', async () => {
    await expect(
      policy.assertCanWrite('evaluations/anexo9/1-2.pdf', PDF, secretaria),
    ).rejects.toThrow(NO_ENCONTRADO);
    await expect(
      policy.assertCanWrite('archivo-sin-prefijo.pdf', PDF, secretaria),
    ).rejects.toThrow(NO_ENCONTRADO);
  });
});

describe('parseStorageKey: subsanación de versión (TSK-015-N22b)', () => {
  it('protocols/{id}/v{n}/requirements/… → REQUISITO con versión', () => {
    expect(parseStorageKey('protocols/5/v2/requirements/r/f.pdf')).toEqual({
      rule: 'REQUISITO',
      protocolId: 5,
      version: 2,
    });
  });

  it.each([
    ['protocols/5/v0/requirements/r/f.pdf', 'versión 0'],
    ['protocols/5/v2/requirements/r', 'sin nombre de archivo'],
    ['protocols/5/v2/docEvaluacion/f.pdf', 'versión fuera de requirements'],
  ])('400 para %s (%s)', (clave) => {
    expect(() => parseStorageKey(clave)).toThrow(BadRequestException);
  });
});
