import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CartasFirmadasService } from './cartas-firmadas.service';
import { VersionSubsanacionService } from './version-subsanacion.service';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { Permission } from '../../../../shared/enums/permission.enum';

/** TSK-015-N09 — pruebas unitarias de CartasFirmadasService (RF-17.2, RF-17.4, RF-17.7 v1.6.6). */

const CP = '6f1c2a4e-1b2c-4d5e-8f90-123456789abc';
const CLAVE_V1 = `protocols/5/resolutions/${CP}/v1/a.pdf`;
const CLAVE_V2 = `protocols/5/resolutions/${CP}/v2/b.pdf`;
const PDF = Buffer.from('%PDF-1.4 contenido', 'latin1');

type Sql = string;
type Fila = Record<string, unknown>;
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
    manager: {
      findOneByOrFail: jest.fn().mockResolvedValue({ version: 1 }),
    },
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
    { aplicar: jest.fn() },
    { crearSiguiente: jest.fn() } as unknown as VersionSubsanacionService,
  );
  return { svc, storage, email, query, qr };
}

interface Escenario {
  tipo: string | null;
  /** Asignaciones de la versión (estado y resultado_id). Por defecto: 3 completadas con dictamen 1. */
  asignaciones?: Array<{ estado: number; resultado: number | null }>;
  /** Resultado de la carta vigente; undefined = sin carta vigente. */
  vigente?: string;
  /** Fila en resolucion.resoluciones para la versión (flujo legacy). */
  legacy?: boolean;
  maximo?: number;
}

const COMPLETADA = 7;
const POR_DEFECTO = [
  { estado: COMPLETADA, resultado: 1 },
  { estado: COMPLETADA, resultado: 1 },
  { estado: COMPLETADA, resultado: 1 },
];

/** Enruta el SQL de la subida según el escenario (TSK-015-N27-6). */
function escenario(e: Escenario): Handler {
  const asignaciones = e.asignaciones ?? POR_DEFECTO;
  return (sql, params) => {
    if (sql.includes('FROM evaluacion.convocatoria_protocolos cp')) {
      return [
        {
          id: CP,
          protocolo_id: 5,
          version_id: 9,
          investigador_principal_id: 1,
          tipo_codigo: e.tipo,
        },
      ];
    }
    if (sql.includes('COALESCE(MAX(numero_version)')) {
      return [{ maximo: e.maximo ?? 0 }];
    }
    if (sql.includes('SELECT EXISTS (SELECT 1 FROM resolucion.resoluciones')) {
      return [{ legacy: e.legacy === true }];
    }
    if (sql.includes('SELECT resultado FROM resolucion.cartas_firmadas')) {
      return e.vigente === undefined ? [] : [{ resultado: e.vigente }];
    }
    if (sql.includes('AND vigente FOR UPDATE')) {
      return e.vigente === undefined ? [] : [{ id: 'vigente-1' }];
    }
    if (sql.includes('SELECT numero_version FROM public.versiones_protocolo')) {
      return [{ numero_version: 1 }];
    }
    if (sql.includes('SET vigente = false')) return [];
    if (sql.includes('INSERT INTO resolucion.cartas_firmadas')) {
      return [
        {
          id: 'nueva-1',
          convocatoria_protocolo_id: params[0],
          protocolo_id: params[1],
          version_id: params[2],
          numero_version: params[3],
          resultado: params[4],
          anexo_codigo: params[5],
          clave_archivo: params[6],
          vigente: true,
          motivo_reemplazo: params[7],
          subido_por: params[8],
          subido_en: new Date('2026-11-27T10:00:00Z'),
        },
      ];
    }
    if (sql.includes('FROM evaluacion.asignaciones_evaluacion a')) {
      return asignaciones.map((a) => ({
        estado_id: a.estado,
        resultado_id: a.resultado,
      }));
    }
    if (
      sql.includes('FOR UPDATE') &&
      sql.includes('evaluacion.convocatoria_protocolos')
    ) {
      return [{ id: CP }];
    }
    if (sql.includes('FOR UPDATE') && sql.includes('public.protocolos')) {
      return [{ id: 5 }];
    }
    return [];
  };
}

const CARTA_V1 = { claveArchivo: CLAVE_V1 };

describe('CartasFirmadasService (TSK-015-N09, TSK-015-N27-6)', () => {
  describe('upload-url: anexo derivado del resultado calculado o congelado (RF-17.1 v1.6.8, RF-17.2)', () => {
    it('IO, todos dictamen 1 → APROBADO_DEFINITIVO → ANEXO_13 y clave v1', async () => {
      const { svc, storage } = servicio(escenario({ tipo: 'IO' }));
      const r = await svc.solicitarSubida('conv', CP, {});
      expect(r.anexoCodigo).toBe('ANEXO_13');
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

    it('EC, todos dictamen 1 → ANEXO_14 (ensayo clínico)', async () => {
      const { svc } = servicio(escenario({ tipo: 'EC' }));
      await expect(svc.solicitarSubida('conv', CP, {})).resolves.toMatchObject({
        anexoCodigo: 'ANEXO_14',
      });
    });

    it('mezcla 3×1 + 1×3 → APROBADO_CON_CONDICION → ANEXO_15', async () => {
      const { svc } = servicio(
        escenario({
          tipo: 'IO',
          asignaciones: [
            { estado: COMPLETADA, resultado: 1 },
            { estado: COMPLETADA, resultado: 1 },
            { estado: COMPLETADA, resultado: 1 },
            { estado: COMPLETADA, resultado: 3 },
          ],
        }),
      );
      await expect(svc.solicitarSubida('conv', CP, {})).resolves.toMatchObject({
        anexoCodigo: 'ANEXO_15',
      });
    });

    it('todos dictamen 3 → NO_APROBADO → ANEXO_16', async () => {
      const { svc } = servicio(
        escenario({
          tipo: 'IO',
          asignaciones: [
            { estado: COMPLETADA, resultado: 3 },
            { estado: COMPLETADA, resultado: 3 },
          ],
        }),
      );
      await expect(svc.solicitarSubida('conv', CP, {})).resolves.toMatchObject({
        anexoCodigo: 'ANEXO_16',
      });
    });

    it('con carta vigente usa el resultado congelado (NO_APROBADO) aunque el cálculo dé APROBADO_DEFINITIVO', async () => {
      const { svc } = servicio(
        escenario({ tipo: 'IO', vigente: 'NO_APROBADO', maximo: 1 }),
      );
      await expect(svc.solicitarSubida('conv', CP, {})).resolves.toMatchObject({
        anexoCodigo: 'ANEXO_16',
        numeroVersion: 2,
      });
    });

    it('EX responde 409 (no pasa por el pleno)', async () => {
      const { svc } = servicio(escenario({ tipo: 'EX' }));
      await expect(svc.solicitarSubida('conv', CP, {})).rejects.toThrow(
        ConflictException,
      );
    });

    it('pendiente (una asignación activa sin completar) responde 409', async () => {
      const { svc } = servicio(
        escenario({
          tipo: 'IO',
          asignaciones: [
            { estado: COMPLETADA, resultado: 1 },
            { estado: 6, resultado: null },
          ],
        }),
      );
      await expect(svc.solicitarSubida('conv', CP, {})).rejects.toThrow(
        'pendientes de dictamen',
      );
    });

    it('protocolo resuelto con el flujo legacy (fila en resoluciones, sin carta) responde 409', async () => {
      const { svc } = servicio(escenario({ tipo: 'IO', legacy: true }));
      await expect(svc.solicitarSubida('conv', CP, {})).rejects.toThrow(
        'flujo anterior',
      );
    });

    it('sin asignaciones activas → pendiente (409)', async () => {
      const { svc } = servicio(escenario({ tipo: 'IO', asignaciones: [] }));
      await expect(svc.solicitarSubida('conv', CP, {})).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('registro: primera carta congela, reemplazo no recalcula, bloqueo legacy (RF-17.1 v1.6.8, RF-17.4)', () => {
    it('primera carta: calcula bajo bloqueo, deriva el anexo, no escribe dictamen_* ni la convocatoria-protocolo', async () => {
      const { svc, qr } = servicio(
        escenario({
          tipo: 'IO',
          asignaciones: [
            { estado: COMPLETADA, resultado: 1 },
            { estado: COMPLETADA, resultado: 2 },
            { estado: COMPLETADA, resultado: 1 },
          ],
        }),
      );
      const vista = await svc.registrar('conv', CP, CARTA_V1, 7);
      expect(vista.resultado).toBe('APROBADO_CON_CONDICION');
      expect(vista.anexoCodigo).toBe('ANEXO_15');
      const sqls = qr.query.mock.calls.map(([sql]) => String(sql));
      expect(
        sqls.some((s) =>
          /UPDATE\s+evaluacion\.convocatoria_protocolos/.test(s),
        ),
      ).toBe(false);
      expect(
        sqls.some(
          (s) =>
            s.includes('FROM evaluacion.asignaciones_evaluacion a') &&
            s.includes('FOR UPDATE OF a'),
        ),
      ).toBe(true);
    });

    it('reemplazo con motivo: usa el resultado congelado (NO_APROBADO) y no recalcula', async () => {
      const { svc, qr } = servicio(
        escenario({
          tipo: 'IO',
          vigente: 'NO_APROBADO',
          maximo: 1,
          asignaciones: [
            { estado: COMPLETADA, resultado: 1 },
            { estado: COMPLETADA, resultado: 1 },
          ],
        }),
      );
      const vista = await svc.registrar(
        'conv',
        CP,
        {
          claveArchivo: `protocols/5/resolutions/${CP}/v2/b.pdf`,
          motivoReemplazo: 'Corrección de la firma',
        },
        7,
      );
      expect(vista.resultado).toBe('NO_APROBADO');
      expect(vista.anexoCodigo).toBe('ANEXO_16');
      const sqls = qr.query.mock.calls.map(([sql]) => String(sql));
      expect(sqls.some((s) => s.includes('SET vigente = false'))).toBe(true);
      expect(
        sqls.some((s) => s.includes('FROM evaluacion.asignaciones_evaluacion')),
      ).toBe(false);
    });

    it('primera carta con flujo legacy responde 409 y no inserta', async () => {
      const { svc, qr } = servicio(escenario({ tipo: 'IO', legacy: true }));
      await expect(svc.registrar('conv', CP, CARTA_V1, 7)).rejects.toThrow(
        ConflictException,
      );
      const sqls = qr.query.mock.calls.map(([sql]) => String(sql));
      expect(
        sqls.some((s) => s.includes('INSERT INTO resolucion.cartas_firmadas')),
      ).toBe(false);
    });

    it('clave de una versión distinta de la esperada responde 409', async () => {
      // Máximo 0 → se espera v1, pero la clave es v2.
      const { svc, storage } = servicio(escenario({ tipo: 'IO' }));
      await expect(
        svc.registrar('conv', CP, { claveArchivo: CLAVE_V2 }, 7),
      ).rejects.toThrow(ConflictException);
      expect(storage.getMetadata).not.toHaveBeenCalled();
    });

    it('segunda versión sin motivo de reemplazo responde 400', async () => {
      const { svc } = servicio(
        escenario({ tipo: 'IO', vigente: 'APROBADO_DEFINITIVO', maximo: 1 }),
      );
      await expect(
        svc.registrar('conv', CP, { claveArchivo: CLAVE_V2 }, 7),
      ).rejects.toThrow(BadRequestException);
    });

    it('un objeto que no es application/pdf responde 400 y se borra', async () => {
      const storage = almacenamiento({ contentType: 'text/html' });
      const { svc } = servicio(escenario({ tipo: 'IO' }), storage);
      await expect(svc.registrar('conv', CP, CARTA_V1, 7)).rejects.toThrow(
        BadRequestException,
      );
      expect(storage.deleteFile).toHaveBeenCalledWith(CLAVE_V1);
    });

    it('un PDF de más de 10 MB responde 400 y se borra', async () => {
      const storage = almacenamiento({ contentLength: 10 * 1024 * 1024 + 1 });
      const { svc } = servicio(escenario({ tipo: 'IO' }), storage);
      await expect(svc.registrar('conv', CP, CARTA_V1, 7)).rejects.toThrow(
        BadRequestException,
      );
      expect(storage.deleteFile).toHaveBeenCalledWith(CLAVE_V1);
    });

    it('sin cabecera %PDF- responde 400 y se borra', async () => {
      const storage = almacenamiento({ cabecera: '<htm' });
      const { svc } = servicio(escenario({ tipo: 'IO' }), storage);
      await expect(svc.registrar('conv', CP, CARTA_V1, 7)).rejects.toThrow(
        BadRequestException,
      );
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

/** TSK-015-N25 — contextoProtocolo: acceso, visibilidad y permisos de botón (RF-17.1, RF-17.4, RF-17.6). */
describe('CartasFirmadasService.contextoProtocolo (TSK-015-N25)', () => {
  const AHORA = new Date('2026-11-26T22:00:00Z');
  const PASADA = new Date('2026-11-20T15:00:00Z');
  const CONV = '1d2e3f40-1111-4222-8333-444455556666';
  const INVESTIGADOR_PRINCIPAL = 1;
  const SECRETARIA = {
    id: 99,
    permissions: [
      Permission.PLENO_RESULTADO_REGISTRAR,
      Permission.RESOLUCION_CREAR,
      Permission.RESOLUCION_HISTORIAL,
    ],
  };
  const PRINCIPAL = { id: INVESTIGADOR_PRINCIPAL, permissions: [] as string[] };
  const AJENO = { id: 42, permissions: [] as string[] };

  function fila(over: Fila = {}): Fila {
    return {
      convocatoria_protocolo_id: CP,
      convocatoria_id: CONV,
      numero_convocatoria: 'CONV-2026-01',
      fecha_reunion: PASADA,
      convocatoria_estado: 'PROGRAMADA',
      dictamen_resultado: 'APROBADO_DEFINITIVO',
      dictamen_motivo: 'Motivo interno',
      dictamen_observaciones: 'Observación interna',
      numero_version: 1,
      tipo_codigo: 'IO',
      ...over,
    };
  }

  function carta(over: Fila = {}): Fila {
    return {
      convocatoria_protocolo_id: CP,
      numero_version: 1,
      anexo_codigo: 'ANEXO_13',
      subido_en: new Date('2026-11-25T10:00:00Z'),
      clave_archivo: CLAVE_V1,
      ...over,
    };
  }

  function ctx(opts: {
    principal?: number | null;
    filas?: Fila[];
    cartas?: Fila[];
  }): Handler {
    return (sql) => {
      if (
        sql.includes('SELECT investigador_principal_id FROM public.protocolos')
      ) {
        return opts.principal === undefined
          ? []
          : [{ investigador_principal_id: opts.principal }];
      }
      if (sql.includes('LEFT JOIN catalogos.tipos_estudio')) {
        return opts.filas ?? [];
      }
      if (sql.includes('FROM resolucion.cartas_firmadas')) {
        return opts.cartas ?? [];
      }
      return [];
    };
  }

  function contextoDe(
    opts: Parameters<typeof ctx>[0],
    lector: { id: number; permissions?: string[] },
  ) {
    const { svc } = servicio(ctx(opts));
    return svc.contextoProtocolo(5, lector, AHORA);
  }

  it('404 «Protocolo no encontrado.» para un ajeno sin RESOLUCION_HISTORIAL', async () => {
    await expect(
      contextoDe({ principal: INVESTIGADOR_PRINCIPAL, filas: [fila()] }, AJENO),
    ).rejects.toThrow(new NotFoundException('Protocolo no encontrado.'));
  });

  it('404 para un protocolo inexistente', async () => {
    await expect(
      contextoDe({ principal: undefined, filas: [] }, SECRETARIA),
    ).rejects.toThrow(NotFoundException);
  });

  it('principal sin carta vigente: sin resultado, sin anexo, sin motivo ni observaciones', async () => {
    const [item] = await contextoDe(
      { principal: INVESTIGADOR_PRINCIPAL, filas: [fila()], cartas: [] },
      PRINCIPAL,
    );
    expect(item.resultado).toBeNull();
    expect(item.anexoEsperado).toBeNull();
    expect(item.cartaVigente).toBeNull();
    expect(item).not.toHaveProperty('motivo');
    expect(item).not.toHaveProperty('observaciones');
    expect(item.versionEvaluada).toBe(1);
  });

  it('principal con carta vigente: ve resultado, anexo y cartaVigente sin subidoPor ni motivoReemplazo', async () => {
    const [item] = await contextoDe(
      { principal: INVESTIGADOR_PRINCIPAL, filas: [fila()], cartas: [carta()] },
      PRINCIPAL,
    );
    expect(item.resultado).toBe('APROBADO_DEFINITIVO');
    expect(item.anexoEsperado).toBe('ANEXO_13');
    expect(item.cartaVigente).toEqual({
      numeroVersion: 1,
      anexoCodigo: 'ANEXO_13',
      subidoEn: new Date('2026-11-25T10:00:00Z'),
      claveArchivo: CLAVE_V1,
    });
    expect(item).not.toHaveProperty('motivo');
    expect(item).not.toHaveProperty('observaciones');
    const json = JSON.stringify(item);
    expect(json).not.toContain('subidoPor');
    expect(json).not.toContain('motivoReemplazo');
  });

  it('RESOLUCION_HISTORIAL ve motivo, observaciones y resultado aunque no haya carta', async () => {
    const [item] = await contextoDe(
      { principal: INVESTIGADOR_PRINCIPAL, filas: [fila()], cartas: [] },
      SECRETARIA,
    );
    expect(item.resultado).toBe('APROBADO_DEFINITIVO');
    expect(item.anexoEsperado).toBe('ANEXO_13');
    expect(item.motivo).toBe('Motivo interno');
    expect(item.observaciones).toBe('Observación interna');
    expect(item.cartaVigente).toBeNull();
  });

  it('claveArchivo solo aparece dentro de cartaVigente', async () => {
    const [item] = await contextoDe(
      { principal: INVESTIGADOR_PRINCIPAL, filas: [fila()], cartas: [carta()] },
      SECRETARIA,
    );
    expect(item).not.toHaveProperty('claveArchivo');
    expect(item.cartaVigente?.claveArchivo).toBe(CLAVE_V1);
  });

  it('EX: anexoEsperado null, puedeSubirCarta y puedeRegistrarResultado false', async () => {
    const [item] = await contextoDe(
      {
        principal: INVESTIGADOR_PRINCIPAL,
        filas: [fila({ tipo_codigo: 'EX', dictamen_resultado: null })],
        cartas: [],
      },
      SECRETARIA,
    );
    expect(item.anexoEsperado).toBeNull();
    expect(item.puedeSubirCarta).toBe(false);
    expect(item.puedeRegistrarResultado).toBe(false);
  });

  it('puedeRegistrarResultado true con permiso, ventana abierta y no EX', async () => {
    const [item] = await contextoDe(
      {
        principal: INVESTIGADOR_PRINCIPAL,
        filas: [fila({ dictamen_resultado: null })],
        cartas: [],
      },
      SECRETARIA,
    );
    expect(item.puedeRegistrarResultado).toBe(true);
  });

  it('puedeRegistrarResultado false si la convocatoria está cancelada', async () => {
    const [item] = await contextoDe(
      {
        principal: INVESTIGADOR_PRINCIPAL,
        filas: [fila({ convocatoria_estado: 'CANCELADA' })],
        cartas: [],
      },
      SECRETARIA,
    );
    expect(item.puedeRegistrarResultado).toBe(false);
  });

  it('puedeRegistrarResultado false si la reunión es futura o no tiene fecha', async () => {
    const [futura, sinFecha] = await contextoDe(
      {
        principal: INVESTIGADOR_PRINCIPAL,
        filas: [
          fila({ fecha_reunion: new Date('2026-11-30T15:00:00Z') }),
          fila({ fecha_reunion: null }),
        ],
        cartas: [],
      },
      SECRETARIA,
    );
    expect(futura.puedeRegistrarResultado).toBe(false);
    expect(sinFecha.puedeRegistrarResultado).toBe(false);
  });

  it('puedeRegistrarResultado false sin PLENO_RESULTADO_REGISTRAR', async () => {
    const [item] = await contextoDe(
      { principal: INVESTIGADOR_PRINCIPAL, filas: [fila()], cartas: [] },
      {
        id: 99,
        permissions: [
          Permission.RESOLUCION_HISTORIAL,
          Permission.RESOLUCION_CREAR,
        ],
      },
    );
    expect(item.puedeRegistrarResultado).toBe(false);
  });

  it('puedeSubirCarta exige RESOLUCION_CREAR, resultado y anexo; no mira la ventana', async () => {
    const [conVentanaFutura] = await contextoDe(
      {
        principal: INVESTIGADOR_PRINCIPAL,
        filas: [fila({ fecha_reunion: new Date('2026-12-30T15:00:00Z') })],
        cartas: [],
      },
      SECRETARIA,
    );
    expect(conVentanaFutura.puedeSubirCarta).toBe(true);
    const [sinCrear] = await contextoDe(
      { principal: INVESTIGADOR_PRINCIPAL, filas: [fila()], cartas: [] },
      { id: 99, permissions: [Permission.RESOLUCION_HISTORIAL] },
    );
    expect(sinCrear.puedeSubirCarta).toBe(false);
  });

  it('puedeSubirCarta false sin resultado registrado', async () => {
    const [item] = await contextoDe(
      {
        principal: INVESTIGADOR_PRINCIPAL,
        filas: [fila({ dictamen_resultado: null })],
        cartas: [],
      },
      SECRETARIA,
    );
    expect(item.puedeSubirCarta).toBe(false);
  });

  it('el principal sin permisos no recibe puedeRegistrarResultado ni puedeSubirCarta', async () => {
    const [item] = await contextoDe(
      {
        principal: INVESTIGADOR_PRINCIPAL,
        filas: [fila({ dictamen_resultado: null })],
        cartas: [],
      },
      PRINCIPAL,
    );
    expect(item.puedeRegistrarResultado).toBe(false);
    expect(item.puedeSubirCarta).toBe(false);
  });
});
