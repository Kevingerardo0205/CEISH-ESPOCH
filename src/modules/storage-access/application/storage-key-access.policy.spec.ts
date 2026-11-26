/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '../../../shared/enums/permission.enum';
import { ProtocolsService } from '../../protocols/application/services/protocols.service';
import { IProtocolRepository } from '../../protocols/domain/ports/protocol.repository.port';
import { ReceptionService } from '../../reception/application/services/reception.service';
import {
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
