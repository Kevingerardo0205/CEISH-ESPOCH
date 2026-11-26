import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CartasFirmadasService } from './cartas-firmadas.service';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';

/** TSK-015-N09 — pruebas unitarias de CartasFirmadasService (RF-17.2, RF-17.4, RF-17.7 v1.6.6). */

const CP = '6f1c2a4e-1b2c-4d5e-8f90-123456789abc';
const CLAVE_V1 = `protocols/5/resolutions/${CP}/v1/a.pdf`;
const CLAVE_V2 = `protocols/5/resolutions/${CP}/v2/b.pdf`;
const PDF = Buffer.from('%PDF-1.4 contenido', 'latin1');

type Sql = string;
type Handler = (sql: Sql, params: unknown[]) => unknown[];

/** DataSource falso: responde a cada consulta según un fragmento del SQL. */
function fakeDataSource(handler: Handler) {
  const query = jest.fn((sql: Sql, params: unknown[] = []) =>
    Promise.resolve(handler(sql, params)),
  );
  const qr = {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    query,
  };
  return {
    ds: { query, createQueryRunner: () => qr } as unknown as DataSource,
    query,
    qr,
  };
}

function contexto(tipo: string | null, resultado: string | null): Handler {
  return (sql) => {
    if (sql.includes('FROM evaluacion.convocatoria_protocolos cp')) {
      return [
        {
          id: CP,
          protocolo_id: 5,
          version_id: 9,
          dictamen_resultado: resultado,
          investigador_principal_id: 1,
          tipo_codigo: tipo,
        },
      ];
    }
    if (sql.includes('FOR UPDATE') && sql.includes('dictamen_resultado')) {
      return [{ id: CP, dictamen_resultado: resultado }];
    }
    return [];
  };
}

function conCartas(maximo: number, vigente: boolean, base: Handler): Handler {
  return (sql, params) => {
    if (sql.includes('COALESCE(MAX(numero_version)')) return [{ maximo }];
    if (sql.includes('AND vigente FOR UPDATE')) {
      return vigente ? [{ id: 'vigente-1' }] : [];
    }
    if (sql.includes('SELECT * FROM resolucion.cartas_firmadas')) {
      return vigente
        ? [
            {
              id: 'vigente-1',
              convocatoria_protocolo_id: CP,
              protocolo_id: 5,
              version_id: 9,
              numero_version: maximo,
              resultado: 'APROBADO_DEFINITIVO',
              anexo_codigo: 'ANEXO_13',
              clave_archivo: CLAVE_V1,
              vigente: true,
              motivo_reemplazo: null,
              subido_por: 7,
              subido_en: new Date('2026-11-26T10:00:00Z'),
            },
          ]
        : [];
    }
    return base(sql, params);
  };
}

function almacenamiento(opts: {
  contentType?: string;
  contentLength?: number;
  cabecera?: string;
}) {
  return {
    generateUploadUrl: jest.fn().mockResolvedValue('https://upload.test/x'),
    getMetadata: jest.fn().mockResolvedValue({
      contentType: opts.contentType ?? 'application/pdf',
      contentLength: opts.contentLength ?? PDF.length,
    }),
    readRange: jest
      .fn()
      .mockResolvedValue(Buffer.from(opts.cabecera ?? '%PDF-', 'latin1')),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    getDownloadUrl: jest.fn().mockResolvedValue('https://download.test/x'),
  };
}

function servicio(handler: Handler, storage = almacenamiento({})) {
  const { ds, query, qr } = fakeDataSource(handler);
  const email = { sendResolutionEmail: jest.fn().mockResolvedValue(undefined) };
  const svc = new CartasFirmadasService(
    ds,
    storage as unknown as IStorageService,
    email as unknown as IEmailServicePort,
  );
  return { svc, storage, email, query, qr };
}

describe('CartasFirmadasService (TSK-015-N09)', () => {
  describe('upload-url: anexo derivado del resultado y del tipo de estudio (RF-17.2)', () => {
    it('IO con APROBADO_DEFINITIVO acepta ANEXO_13 y emite clave v1 con prefijo', async () => {
      const { svc, storage } = servicio(
        conCartas(0, false, contexto('IO', 'APROBADO_DEFINITIVO')),
      );
      const r = await svc.solicitarSubida('conv', CP, {
        anexoCodigo: 'ANEXO_13',
      });
      expect(r.numeroVersion).toBe(1);
      expect(r.claveArchivo).toMatch(
        new RegExp(`^protocols/5/resolutions/${CP}/v1/[0-9a-f-]+\\.pdf$`),
      );
      expect(storage.generateUploadUrl).toHaveBeenCalledWith(
        r.claveArchivo,
        'application/pdf',
        900,
      );
    });

    it('IO con APROBADO_DEFINITIVO rechaza ANEXO_14 (ensayo clínico) con 400', async () => {
      const { svc } = servicio(
        conCartas(0, false, contexto('IO', 'APROBADO_DEFINITIVO')),
      );
      await expect(
        svc.solicitarSubida('conv', CP, { anexoCodigo: 'ANEXO_14' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('EC con APROBADO_DEFINITIVO exige ANEXO_14', async () => {
      const { svc } = servicio(
        conCartas(0, false, contexto('EC', 'APROBADO_DEFINITIVO')),
      );
      await expect(
        svc.solicitarSubida('conv', CP, { anexoCodigo: 'ANEXO_14' }),
      ).resolves.toMatchObject({ anexoCodigo: 'ANEXO_14' });
    });

    it('EX responde 409 aunque el anexo sea correcto', async () => {
      const { svc } = servicio(
        conCartas(0, false, contexto('EX', 'APROBADO_DEFINITIVO')),
      );
      await expect(
        svc.solicitarSubida('conv', CP, { anexoCodigo: 'ANEXO_13' }),
      ).rejects.toThrow(ConflictException);
    });

    it('sin resultado del pleno responde 409', async () => {
      const { svc } = servicio(conCartas(0, false, contexto('IO', null)));
      await expect(
        svc.solicitarSubida('conv', CP, { anexoCodigo: 'ANEXO_13' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('registro: versión, motivo y verificación del archivo (RF-17.4)', () => {
    it('clave de una versión distinta de la esperada responde 409', async () => {
      // Máximo 0 → se espera v1, pero la clave es v2.
      const { svc, storage } = servicio(
        conCartas(0, false, contexto('IO', 'APROBADO_DEFINITIVO')),
      );
      await expect(
        svc.registrar(
          'conv',
          CP,
          { claveArchivo: CLAVE_V2, anexoCodigo: 'ANEXO_13' },
          7,
        ),
      ).rejects.toThrow(ConflictException);
      expect(storage.getMetadata).not.toHaveBeenCalled();
    });

    it('segunda versión sin motivo de reemplazo responde 400', async () => {
      const { svc } = servicio(
        conCartas(1, true, contexto('IO', 'APROBADO_DEFINITIVO')),
      );
      await expect(
        svc.registrar(
          'conv',
          CP,
          { claveArchivo: CLAVE_V2, anexoCodigo: 'ANEXO_13' },
          7,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('un objeto que no es application/pdf responde 400 y se borra', async () => {
      const storage = almacenamiento({ contentType: 'text/html' });
      const { svc } = servicio(
        conCartas(0, false, contexto('IO', 'APROBADO_DEFINITIVO')),
        storage,
      );
      await expect(
        svc.registrar(
          'conv',
          CP,
          { claveArchivo: CLAVE_V1, anexoCodigo: 'ANEXO_13' },
          7,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(storage.deleteFile).toHaveBeenCalledWith(CLAVE_V1);
    });

    it('un PDF de más de 10 MB responde 400 y se borra', async () => {
      const storage = almacenamiento({ contentLength: 10 * 1024 * 1024 + 1 });
      const { svc } = servicio(
        conCartas(0, false, contexto('IO', 'APROBADO_DEFINITIVO')),
        storage,
      );
      await expect(
        svc.registrar(
          'conv',
          CP,
          { claveArchivo: CLAVE_V1, anexoCodigo: 'ANEXO_13' },
          7,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(storage.deleteFile).toHaveBeenCalledWith(CLAVE_V1);
    });

    it('sin cabecera %PDF- responde 400 y se borra', async () => {
      const storage = almacenamiento({ cabecera: '<htm' });
      const { svc } = servicio(
        conCartas(0, false, contexto('IO', 'APROBADO_DEFINITIVO')),
        storage,
      );
      await expect(
        svc.registrar(
          'conv',
          CP,
          { claveArchivo: CLAVE_V1, anexoCodigo: 'ANEXO_13' },
          7,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(storage.deleteFile).toHaveBeenCalledWith(CLAVE_V1);
    });
  });

  describe('lectura: vista según permisos (RF-17.7)', () => {
    it('el investigador principal ve la vigente sin subidoPor ni motivoReemplazo', async () => {
      const { svc } = servicio(
        conCartas(1, true, contexto('IO', 'APROBADO_DEFINITIVO')),
      );
      const vista = await svc.vigente('conv', CP, {
        id: 1,
        permissions: [],
      });
      expect(vista).not.toHaveProperty('subidoPor');
      expect(vista).not.toHaveProperty('motivoReemplazo');
      expect(vista.vigente).toBe(true);
    });

    it('el investigador recibe 404 en el historial', async () => {
      const { svc } = servicio(
        conCartas(1, true, contexto('IO', 'APROBADO_DEFINITIVO')),
      );
      await expect(
        svc.historial('conv', CP, { id: 1, permissions: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('un lector sin relación con el protocolo recibe 404 en la vigente', async () => {
      const { svc } = servicio(
        conCartas(1, true, contexto('IO', 'APROBADO_DEFINITIVO')),
      );
      await expect(
        svc.vigente('conv', CP, { id: 99, permissions: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
