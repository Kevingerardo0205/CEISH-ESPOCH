import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  SystemParamsService,
  SP_PLAZO_SUBSANACION_DOCUMENTAL,
  SP_PLAZO_REVISION_OFICIO,
  SYSTEM_PARAM_FALLBACKS,
} from './system-params.service';
import { SystemParamOrmEntity } from '../../infrastructure/database/system-param.entity.orm';

const FALLBACK_SUBSANACION =
  SYSTEM_PARAM_FALLBACKS[SP_PLAZO_SUBSANACION_DOCUMENTAL];
const FALLBACK_REVISION = SYSTEM_PARAM_FALLBACKS[SP_PLAZO_REVISION_OFICIO];

describe('SystemParamsService (TSK-015-N03)', () => {
  let service: SystemParamsService;
  let mockRepo: { find: jest.Mock };

  beforeEach(async () => {
    mockRepo = { find: jest.fn().mockResolvedValue([]) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemParamsService,
        {
          provide: getRepositoryToken(SystemParamOrmEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();
    service = module.get<SystemParamsService>(SystemParamsService);
  });

  it('(1) get() returns DB value after refresh()', async () => {
    mockRepo.find.mockResolvedValue([
      {
        clave: SP_PLAZO_SUBSANACION_DOCUMENTAL,
        valor: '25',
        tipoDato: 'INTEGER',
      },
    ]);
    await service.refresh();
    expect(service.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(25);
  });

  it('(2) get() returns HARDCODED_FALLBACK when key absent from cache', () => {
    expect(service.get(SP_PLAZO_REVISION_OFICIO)).toBe(FALLBACK_REVISION);
  });

  it('(3) refresh() ignores rows with valor = 0 (inválido)', async () => {
    mockRepo.find.mockResolvedValue([
      {
        clave: SP_PLAZO_SUBSANACION_DOCUMENTAL,
        valor: '30',
        tipoDato: 'INTEGER',
      },
      { clave: SP_PLAZO_REVISION_OFICIO, valor: '0', tipoDato: 'INTEGER' },
    ]);
    await service.refresh();
    expect(service.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(30);
    expect(service.get(SP_PLAZO_REVISION_OFICIO)).toBe(FALLBACK_REVISION);
  });

  it('(4) refresh() limpia valores obsoletos de caché en la segunda carga', async () => {
    mockRepo.find.mockResolvedValueOnce([
      {
        clave: SP_PLAZO_SUBSANACION_DOCUMENTAL,
        valor: '50',
        tipoDato: 'INTEGER',
      },
    ]);
    await service.refresh();
    mockRepo.find.mockResolvedValueOnce([]);
    await service.refresh();
    expect(service.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(
      FALLBACK_SUBSANACION,
    );
  });

  it('(5) onModuleInit() resuelve cuando refresh() tiene éxito', async () => {
    mockRepo.find.mockResolvedValue([
      {
        clave: SP_PLAZO_SUBSANACION_DOCUMENTAL,
        valor: '30',
        tipoDato: 'INTEGER',
      },
    ]);
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(service.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(30);
  });

  it('(6) onModuleInit() captura error de BD y resuelve (modo degradado — sin rethrow)', async () => {
    mockRepo.find.mockRejectedValue(new Error('connection refused'));
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(service.get(SP_PLAZO_REVISION_OFICIO)).toBe(FALLBACK_REVISION);
  });

  it('(7) refresh() advierte por cada fila inválida (valor <= 0 o clave desconocida)', async () => {
    const warnSpy = jest.spyOn(service['logger'], 'warn');
    mockRepo.find.mockResolvedValue([
      {
        clave: SP_PLAZO_SUBSANACION_DOCUMENTAL,
        valor: '0',
        tipoDato: 'INTEGER',
      },
      { clave: SP_PLAZO_REVISION_OFICIO, valor: '-5', tipoDato: 'INTEGER' },
      { clave: 'CLAVE_DESCONOCIDA', valor: '10', tipoDato: 'INTEGER' },
    ]);
    await service.refresh();
    expect(warnSpy).toHaveBeenCalledTimes(3);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(SP_PLAZO_SUBSANACION_DOCUMENTAL),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(SP_PLAZO_REVISION_OFICIO),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('CLAVE_DESCONOCIDA'),
    );
  });

  it('(8) get() advierte solo una vez por clave faltante, no en llamadas siguientes', () => {
    const warnSpy = jest.spyOn(service['logger'], 'warn');
    service.get(SP_PLAZO_REVISION_OFICIO);
    service.get(SP_PLAZO_REVISION_OFICIO);
    service.get(SP_PLAZO_REVISION_OFICIO);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(SP_PLAZO_REVISION_OFICIO),
    );
  });

  it('(9) degraded se resetea a false y warnedKeys se vacía tras refresh() exitoso', async () => {
    mockRepo.find.mockRejectedValueOnce(new Error('db down'));
    await service.onModuleInit();

    const warnSpy = jest.spyOn(service['logger'], 'warn');
    // En modo degradado, get() NO advierte por clave faltante
    service.get(SP_PLAZO_REVISION_OFICIO);
    expect(warnSpy).not.toHaveBeenCalled();

    // Refresh exitoso resetea degraded y vacía warnedKeys
    mockRepo.find.mockResolvedValueOnce([]);
    await service.refresh();

    // Ahora get() debe advertir de nuevo (degraded=false, warnedKeys vacío)
    service.get(SP_PLAZO_REVISION_OFICIO);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(SP_PLAZO_REVISION_OFICIO),
    );
  });
});

describe('SystemParamsService — parseo estricto de valor (TSK-015-N05)', () => {
  let service: SystemParamsService;
  let mockRepo: { find: jest.Mock };

  beforeEach(async () => {
    mockRepo = { find: jest.fn().mockResolvedValue([]) };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemParamsService,
        {
          provide: getRepositoryToken(SystemParamOrmEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();
    service = module.get<SystemParamsService>(SystemParamsService);
  });

  it.each([['5abc'], ['30.7'], [' 7'], [''], [null]])(
    'valor=%p con tipo_dato INTEGER → warn y fallback',
    async (valor) => {
      const tipoDato = 'INTEGER';
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      mockRepo.find.mockResolvedValue([
        { clave: SP_PLAZO_SUBSANACION_DOCUMENTAL, valor, tipoDato },
      ]);
      await service.refresh();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(service.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(
        SYSTEM_PARAM_FALLBACKS[SP_PLAZO_SUBSANACION_DOCUMENTAL],
      );
    },
  );

  it.each([[null], ['TEXT'], ['BOOLEAN']])(
    'tipo_dato=%p con valor numérico válido → warn y fallback',
    async (tipoDato) => {
      const warnSpy = jest.spyOn(service['logger'], 'warn');
      mockRepo.find.mockResolvedValue([
        { clave: SP_PLAZO_SUBSANACION_DOCUMENTAL, valor: '25', tipoDato },
      ]);
      await service.refresh();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(service.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(
        SYSTEM_PARAM_FALLBACKS[SP_PLAZO_SUBSANACION_DOCUMENTAL],
      );
    },
  );

  it('valor="25" y tipo_dato="INTEGER" → acepta y cachea 25', async () => {
    mockRepo.find.mockResolvedValue([
      {
        clave: SP_PLAZO_SUBSANACION_DOCUMENTAL,
        valor: '25',
        tipoDato: 'INTEGER',
      },
    ]);
    await service.refresh();
    expect(service.get(SP_PLAZO_SUBSANACION_DOCUMENTAL)).toBe(25);
  });
});
