import { DataSource } from 'typeorm';
import { MeetingTypeOrmRepository } from './meeting-typeorm.repository';
import {
  SessionType,
  ConvocatoriaStatus,
} from '../database/entities/convocatoria.orm-entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('MeetingTypeOrmRepository (T013 / Option E)', () => {
  let repository: MeetingTypeOrmRepository;
  let dataSourceMock: any;
  let queryRunnerMock: any;

  beforeEach(() => {
    queryRunnerMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
      manager: {
        save: jest.fn(),
        findOne: jest.fn().mockResolvedValue({ id: 137, protocolId: 165 }),
      },
    } as any;

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
      getRepository: jest.fn(),
    } as any;

    repository = new MeetingTypeOrmRepository(dataSourceMock);
  });

  it('should save meeting with atomic number starting at 001-2026 using Option E sequence table', async () => {
    queryRunnerMock.query.mockResolvedValueOnce([{ ultimo_secuencial: 1 }]);

    const createdMeeting = {
      id: 'meet-001',
      numeroConvocatoria: '001-2026',
      anioLectivo: 2026,
    };
    queryRunnerMock.manager.save.mockResolvedValueOnce(createdMeeting);

    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate: new Date('2026-10-15T09:00:00.000Z'),
      locationId: 'b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22',
      protocolVersionIds: [137],
    };

    const result = await repository.saveMeetingWithAtomicNumber(
      params,
      '2026',
      new Date('2026-10-08T23:59:59.000Z'),
    );

    expect(queryRunnerMock.startTransaction).toHaveBeenCalledWith(
      'READ COMMITTED',
    );
    expect(queryRunnerMock.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO evaluacion.secuencias_convocatoria'),
      [2026],
    );
    expect(queryRunnerMock.manager.save).toHaveBeenCalled();
    expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    expect(queryRunnerMock.release).toHaveBeenCalled();
    expect(result.numeroConvocatoria).toBe('001-2026');
  });

  it('should save meeting and persist both protocol version items (Section II) and follow-up report items (Section III)', async () => {
    queryRunnerMock.query.mockResolvedValueOnce([{ ultimo_secuencial: 3 }]);

    const createdMeeting = {
      id: 'meet-003',
      numeroConvocatoria: '003-2026',
      anioLectivo: 2026,
    };
    queryRunnerMock.manager.save.mockResolvedValue(createdMeeting);

    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate: new Date('2026-10-15T09:00:00.000Z'),
      protocolVersionIds: [137],
      followUpReportIds: [501, 502],
    };

    const result = await repository.saveMeetingWithAtomicNumber(
      params,
      '2026',
      new Date('2026-10-08T23:59:59.000Z'),
    );

    expect(result.numeroConvocatoria).toBe('003-2026');
    // 1 save for Convocatoria, 1 save for ProtocolVersion 137, 2 saves for follow-up reports 501 and 502 = 4 saves total
    expect(queryRunnerMock.manager.save).toHaveBeenCalledTimes(4);
  });

  it('should throw NotFoundException if a protocol version is not found', async () => {
    queryRunnerMock.query.mockResolvedValueOnce([{ ultimo_secuencial: 1 }]);
    queryRunnerMock.manager.save.mockResolvedValueOnce({ id: 'meet-001' });
    queryRunnerMock.manager.findOne.mockResolvedValueOnce(null);

    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate: new Date('2026-10-15T09:00:00.000Z'),
      protocolVersionIds: [9999],
    };

    await expect(
      repository.saveMeetingWithAtomicNumber(
        params,
        '2026',
        new Date('2026-10-08T23:59:59.000Z'),
      ),
    ).rejects.toThrow(NotFoundException);

    expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
  });

  it('should retry and succeed on concurrency error (code 23505 or 40001)', async () => {
    // First attempt fails with 23505
    queryRunnerMock.query.mockRejectedValueOnce({
      code: '23505',
      message: 'duplicate key',
    });
    // Second attempt succeeds
    queryRunnerMock.query.mockResolvedValueOnce([{ ultimo_secuencial: 5 }]);
    queryRunnerMock.manager.save.mockResolvedValueOnce({
      id: 'meet-005',
      numeroConvocatoria: '005-2026',
    });

    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate: new Date('2026-10-15T09:00:00.000Z'),
      protocolVersionIds: [],
    };

    const result = await repository.saveMeetingWithAtomicNumber(
      params,
      '2026',
      new Date('2026-10-08T23:59:59.000Z'),
    );

    expect(result.numeroConvocatoria).toBe('005-2026');
    expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunnerMock.commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictException if all retries are exhausted', async () => {
    queryRunnerMock.query.mockRejectedValue({
      code: '40001',
      message: 'serialization_failure',
    });

    const params = {
      sessionType: SessionType.ORDINARIA,
      meetingDate: new Date('2026-10-15T09:00:00.000Z'),
      protocolVersionIds: [],
    };

    await expect(
      repository.saveMeetingWithAtomicNumber(
        params,
        '2026',
        new Date('2026-10-08T23:59:59.000Z'),
      ),
    ).rejects.toThrow(ConflictException);

    expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalledTimes(3);
  });
});
