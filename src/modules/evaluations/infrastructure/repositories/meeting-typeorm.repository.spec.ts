/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { DataSource } from 'typeorm';
import { MeetingTypeOrmRepository } from './meeting-typeorm.repository';

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
