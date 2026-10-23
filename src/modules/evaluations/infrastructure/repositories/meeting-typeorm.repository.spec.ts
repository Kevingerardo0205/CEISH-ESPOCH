/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { DataSource } from 'typeorm';
import { MeetingTypeOrmRepository } from './meeting-typeorm.repository';
import type { MeetingPlaceFullModel } from '../../domain/entities/meeting.entity';
import type { FindPlacesOptions } from '../../domain/ports/meeting-repository.port';

/** Crea un mock de QueryBuilder encadenable para createQueryBuilder(). */
function makeQbMock(getResult: unknown) {
  const qb: any = {};
  const chain = () => qb;
  qb.leftJoinAndSelect = chain;
  qb.innerJoinAndSelect = chain;
  qb.orderBy = chain;
  qb.skip = chain;
  qb.take = chain;
  qb.andWhere = chain;
  qb.where = chain;
  qb.getManyAndCount = jest.fn().mockResolvedValue(getResult);
  qb.getMany = jest.fn().mockResolvedValue(getResult);
  return qb;
}

/** Helper para crear un mock de DataSource que retorna findOne y createQueryBuilder. */
function makeDataSourceMock(findOneResult: unknown, qbResult?: unknown) {
  return {
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(findOneResult),
      createQueryBuilder: jest
        .fn()
        .mockReturnValue(makeQbMock(qbResult ?? [[], 0])),
    }),
  } as unknown as DataSource;
}

describe('MeetingTypeOrmRepository — tolerancia a fechas string del ORM', () => {
  describe('findById', () => {
    it('tolera fechaReunion como string YYYY-MM-DD sin lanzar toISOString sobre string', async () => {
      const ds = makeDataSourceMock({
        id: 'aabbccdd-0000-0000-0000-000000000001',
        numeroConvocatoria: '001-2026',
        anioLectivo: 2026,
        tipoSession: 'ORDINARIA',
        // pg puede entregar string en vez de Date para timestamptz
        fechaReunion: '2026-10-15',
        fechaEntregaEvaluacion: '2026-10-08',
        estado: 'PROGRAMADA',
        lugar: null,
        convocatoriaProtocolos: [],
      });
      const repo = new MeetingTypeOrmRepository(ds);
      const result = await repo.findById(
        'aabbccdd-0000-0000-0000-000000000001',
      );

      expect(result).not.toBeNull();
      // El modelo de dominio debe tener Date, nunca string
      expect(result!.meetingDate).toBeInstanceOf(Date);
      expect(result!.evalSubmissionDeadline).toBeInstanceOf(Date);
      // No lanza al serializar
      expect(() => result!.meetingDate!.toISOString()).not.toThrow();
    });

    it('tolera fechaReunion null sin lanzar', async () => {
      const ds = makeDataSourceMock({
        id: 'aabbccdd-0000-0000-0000-000000000002',
        numeroConvocatoria: '002-2026',
        anioLectivo: 2026,
        tipoSession: 'ORDINARIA',
        fechaReunion: null,
        fechaEntregaEvaluacion: null,
        estado: 'PROGRAMADA',
        lugar: null,
        convocatoriaProtocolos: [],
      });
      const repo = new MeetingTypeOrmRepository(ds);
      const result = await repo.findById(
        'aabbccdd-0000-0000-0000-000000000002',
      );

      expect(result).not.toBeNull();
      expect(result!.meetingDate).toBeNull();
      expect(result!.evalSubmissionDeadline).toBeNull();
    });

    it('acepta fechaReunion como Date nativo', async () => {
      const d = new Date('2026-10-15T09:00:00.000Z');
      const ds = makeDataSourceMock({
        id: 'aabbccdd-0000-0000-0000-000000000003',
        numeroConvocatoria: '003-2026',
        anioLectivo: 2026,
        tipoSession: 'ORDINARIA',
        fechaReunion: d,
        fechaEntregaEvaluacion: new Date('2026-10-08T23:59:59.000Z'),
        estado: 'PROGRAMADA',
        lugar: null,
        convocatoriaProtocolos: [],
      });
      const repo = new MeetingTypeOrmRepository(ds);
      const result = await repo.findById(
        'aabbccdd-0000-0000-0000-000000000003',
      );

      expect(result!.meetingDate).toBe(d);
    });
  });

  describe('findAll', () => {
    it('tolera fechaReunion como string en items de lista', async () => {
      const ds = makeDataSourceMock(undefined, [
        [
          {
            id: 'aabbccdd-0000-0000-0000-000000000004',
            numeroConvocatoria: '004-2026',
            anioLectivo: 2026,
            tipoSession: 'ORDINARIA',
            fechaReunion: '2026-10-15',
            fechaEntregaEvaluacion: '2026-10-08',
            estado: 'PROGRAMADA',
            lugar: null,
            convocatoriaProtocolos: [],
          },
        ],
        1,
      ]);
      const repo = new MeetingTypeOrmRepository(ds);
      const result = await repo.findAll();

      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.meetingDate).toBeInstanceOf(Date);
      expect(() => item.meetingDate!.toISOString()).not.toThrow();
    });

    it('tolera fechaReunion null en items de lista', async () => {
      const ds = makeDataSourceMock(undefined, [
        [
          {
            id: 'aabbccdd-0000-0000-0000-000000000005',
            numeroConvocatoria: '005-2026',
            anioLectivo: 2026,
            tipoSession: 'ORDINARIA',
            fechaReunion: null,
            fechaEntregaEvaluacion: null,
            estado: 'PROGRAMADA',
            lugar: null,
            convocatoriaProtocolos: [],
          },
        ],
        1,
      ]);
      const repo = new MeetingTypeOrmRepository(ds);
      const result = await repo.findAll();

      expect(result.items[0].meetingDate).toBeNull();
    });

    it('orderBy se invoca con (c.fechaReunion, DESC, NULLS LAST)', async () => {
      const qb: any = {};
      const chain = () => qb;
      qb.leftJoinAndSelect = chain;
      qb.orderBy = jest.fn().mockImplementation(chain);
      qb.skip = chain;
      qb.take = chain;
      qb.andWhere = chain;
      qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);

      const ds = {
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn().mockReturnValue(qb),
        }),
      } as unknown as DataSource;

      const repo = new MeetingTypeOrmRepository(ds);
      await repo.findAll();

      expect(qb.orderBy).toHaveBeenCalledWith(
        'c.fechaReunion',
        'DESC',
        'NULLS LAST',
      );
    });
  });

  describe('findAllPlaces', () => {
    /** Crea un DataSource mock con find() para LugarOrmEntity. */
    function makePlacesDataSource(
      findResult: object[],
      findSpy: jest.Mock,
    ): DataSource {
      return {
        getRepository: jest.fn().mockReturnValue({
          find: findSpy.mockResolvedValue(findResult),
        }),
      } as unknown as DataSource;
    }

    const lugarActivo = {
      id: 'uuid-001',
      nombre: 'Sala A',
      direccion: 'Piso 3',
      esVirtual: false,
      enlaceReunion: undefined,
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const lugarSinDireccion = {
      id: 'uuid-002',
      nombre: 'Virtual B',
      direccion: undefined,
      esVirtual: true,
      enlaceReunion: 'https://meet.example.com',
      activo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('sin opciones llama repo.find con where:{activo:true} y order:{nombre:ASC}', async () => {
      const spy = jest.fn();
      const ds = makePlacesDataSource([lugarActivo], spy);
      const repo = new MeetingTypeOrmRepository(ds);

      await repo.findAllPlaces();

      expect(spy).toHaveBeenCalledWith({
        where: { activo: true },
        order: { nombre: 'ASC' },
      });
    });

    it('includeInactive:false llama repo.find con where:{activo:true}', async () => {
      const spy = jest.fn();
      const ds = makePlacesDataSource([lugarActivo], spy);
      const repo = new MeetingTypeOrmRepository(ds);
      const opts: FindPlacesOptions = { includeInactive: false };

      await repo.findAllPlaces(opts);

      expect(spy).toHaveBeenCalledWith({
        where: { activo: true },
        order: { nombre: 'ASC' },
      });
    });

    it('includeInactive:true llama repo.find con where:{} (sin filtro activo)', async () => {
      const spy = jest.fn();
      const ds = makePlacesDataSource([lugarActivo, lugarSinDireccion], spy);
      const repo = new MeetingTypeOrmRepository(ds);
      const opts: FindPlacesOptions = { includeInactive: true };

      await repo.findAllPlaces(opts);

      expect(spy).toHaveBeenCalledWith({
        where: {},
        order: { nombre: 'ASC' },
      });
    });

    it('mapea a MeetingPlaceFullModel con claves exactas en inglés camelCase', async () => {
      const spy = jest.fn();
      const ds = makePlacesDataSource([lugarActivo], spy);
      const repo = new MeetingTypeOrmRepository(ds);

      const result = await repo.findAllPlaces();

      expect(result).toHaveLength(1);
      const item: MeetingPlaceFullModel = result[0];
      expect(item.id).toBe('uuid-001');
      expect(item.name).toBe('Sala A');
      expect(item.address).toBe('Piso 3');
      expect(item.isVirtual).toBe(false);
      expect(item.meetingLink).toBeNull();
      expect(item.isActive).toBe(true);
    });

    it('address y meetingLink son null cuando la ORM entidad devuelve undefined', async () => {
      const spy = jest.fn();
      const ds = makePlacesDataSource([lugarSinDireccion], spy);
      const repo = new MeetingTypeOrmRepository(ds);

      const result = await repo.findAllPlaces({ includeInactive: true });

      const item: MeetingPlaceFullModel = result[0];
      expect(item.address).toBeNull();
      expect(item.meetingLink).toBe('https://meet.example.com');
      expect(item.isVirtual).toBe(true);
      expect(item.isActive).toBe(false);
    });

    it('no expone campos ORM (nombre, esVirtual, activo, direccion, enlaceReunion)', async () => {
      const spy = jest.fn();
      const ds = makePlacesDataSource([lugarActivo], spy);
      const repo = new MeetingTypeOrmRepository(ds);

      const result = await repo.findAllPlaces();
      const item = result[0] as unknown as Record<string, unknown>;

      expect(item).not.toHaveProperty('nombre');
      expect(item).not.toHaveProperty('esVirtual');
      expect(item).not.toHaveProperty('activo');
      expect(item).not.toHaveProperty('direccion');
      expect(item).not.toHaveProperty('enlaceReunion');
    });
  });

  describe('saveMeetingWithAtomicNumber — propagación de fecha_limite_ts (TSK-002-N44)', () => {
    /** Construye un DataSource mock con queryRunner que captura las llamadas a query(). */
    function makeQrDataSource(sequenceValue: number = 1): {
      ds: DataSource;
      queryCalls: Array<[string, unknown[]]>;
    } {
      const queryCalls: Array<[string, unknown[]]> = [];
      const qr: any = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        query: jest
          .fn()
          .mockImplementation((sql: string, params: unknown[]) => {
            queryCalls.push([sql, params ?? []]);
            // Simular las distintas respuestas del queryRunner
            if (sql.includes('secuencias_convocatoria')) {
              return Promise.resolve([{ ultimo_secuencial: sequenceValue }]);
            }
            return Promise.resolve([]);
          }),
        manager: {
          save: jest
            .fn()
            .mockImplementation((_Entity: any, entity: any) =>
              Promise.resolve({ ...entity, id: 'uuid-test-01' }),
            ),
          findOne: jest.fn().mockResolvedValue({
            id: 991,
            protocolId: 100,
          }),
        },
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };
      const ds = {
        getRepository: jest.fn().mockReturnValue({}),
        createQueryRunner: jest.fn().mockReturnValue(qr),
      } as unknown as DataSource;
      return { ds, queryCalls };
    }

    it('N44-U-01: escribe fecha_limite (date) Y fecha_limite_ts (timestamp) en el UPDATE cuando hay versiones agendadas', async () => {
      const { ds, queryCalls } = makeQrDataSource();
      const repo = new MeetingTypeOrmRepository(ds);

      const evalDeadline = new Date('2026-10-14T17:00:00.000Z');
      await repo.saveMeetingWithAtomicNumber(
        {
          sessionType: 'ORDINARIA',
          meetingDate: new Date('2026-10-08T09:00:00.000Z'),
          protocolVersionIds: [991],
        },
        '2026',
        evalDeadline,
      );

      const updateCall = queryCalls.find(
        ([sql]) => sql.includes('fecha_limite') && sql.includes('UPDATE'),
      );
      expect(updateCall).toBeDefined();
      const [, params] = updateCall!;
      // $1 = fecha_limite (string date), $2 = fecha_limite_ts (Date), $3 = version ids, $4 = estado ASSIGNED
      expect(typeof params[0]).toBe('string'); // fecha_limite como YYYY-MM-DD
      expect(params[1]).toBe(evalDeadline); // fecha_limite_ts = instante exacto
      expect(params[2]).toEqual([991]);
    });

    it('N44-U-02: el UPDATE incluye fecha_limite_ts = $2 en el SQL (no solo fecha_limite)', async () => {
      const { ds, queryCalls } = makeQrDataSource();
      const repo = new MeetingTypeOrmRepository(ds);

      await repo.saveMeetingWithAtomicNumber(
        {
          sessionType: 'ORDINARIA',
          meetingDate: new Date('2026-10-08T09:00:00.000Z'),
          protocolVersionIds: [991],
        },
        '2026',
        new Date('2026-10-14T17:00:00.000Z'),
      );

      const updateCall = queryCalls.find(
        ([sql]) => sql.includes('fecha_limite') && sql.includes('UPDATE'),
      );
      expect(updateCall).toBeDefined();
      const [sql] = updateCall!;
      expect(sql).toContain('fecha_limite_ts');
      expect(sql).toContain('$2');
    });

    it('N44-U-03: sin protocolVersionIds vacío, no se ejecuta el UPDATE', async () => {
      const { ds, queryCalls } = makeQrDataSource();
      const repo = new MeetingTypeOrmRepository(ds);

      await repo.saveMeetingWithAtomicNumber(
        {
          sessionType: 'ORDINARIA',
          meetingDate: new Date('2026-10-08T09:00:00.000Z'),
          protocolVersionIds: [],
        },
        '2026',
        new Date('2026-10-14T17:00:00.000Z'),
      );

      const updateCall = queryCalls.find(
        ([sql]) => sql.includes('fecha_limite') && sql.includes('UPDATE'),
      );
      expect(updateCall).toBeUndefined();
    });
  });

  describe('findPendingProtocols', () => {
    it('tolera receptionDate como string y filtra protocolos sin activeVersion', async () => {
      const protocols = [
        {
          id: 42,
          activeVersion: { id: 991, versionNumber: 2 },
          responseDeadline: null,
          receptionDate: '2026-09-15',
          createdAt: new Date('2026-01-01'),
          ceishCode: 'CEISH-042',
          title: 'Test protocol',
          studyType: null,
          principalInvestigator: null,
        },
        {
          id: 99,
          activeVersion: null, // debe filtrarse
          responseDeadline: null,
          receptionDate: '2026-09-01',
          createdAt: new Date('2026-01-01'),
          ceishCode: null,
          title: null,
          studyType: null,
          principalInvestigator: null,
        },
      ];
      const ds = makeDataSourceMock(undefined, protocols);
      const repo = new MeetingTypeOrmRepository(ds);
      const result = await repo.findPendingProtocols();

      // Solo el protocolo con activeVersion debe aparecer
      expect(result).toHaveLength(1);
      expect(result[0].protocolId).toBe(42);
      expect(result[0].versionId).toBe(991);
      // receptionDate debe ser Date, no string
      expect(result[0].receptionDate).toBeInstanceOf(Date);
      expect(() => result[0].receptionDate!.toISOString()).not.toThrow();
    });
  });
});
