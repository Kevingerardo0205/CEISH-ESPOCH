import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignEvaluatorsCommand,
  AssignEvaluatorsRepository,
  AssignEvaluatorsUseCase,
} from './assign-evaluators.use-case';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import {
  AssignmentPreconditionFailure,
  CreateAssignmentsForActiveVersionParams,
  EvaluatorCandidateRow,
} from '../../domain/ports/evaluation.repository.port';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { SP_PLAZO_REVISION_OFICIO } from '../../../sistema/application/services/system-params.service';

const P = EvaluatorProfile;

/** Catálogo de ceish_test_db: 6 Metodológico, 7 Bioético, 8 Jurídico, 9 Salud, 10 Sociedad Civil. */
const CATALOG: Record<
  EvaluatorProfile,
  { profileId: number; profileName: string }
> = {
  [P.METODOLOGICO]: { profileId: 6, profileName: 'Metodológico' },
  [P.BIOETICO]: { profileId: 7, profileName: 'Bioético' },
  [P.JURIDICO]: { profileId: 8, profileName: 'Jurídico' },
  [P.SALUD]: { profileId: 9, profileName: 'Salud' },
  [P.SOCIEDAD_CIVIL]: { profileId: 10, profileName: 'Sociedad Civil' },
};

const candidate = (
  userId: number,
  profiles: EvaluatorProfile[],
  overrides: Partial<EvaluatorCandidateRow> = {},
): EvaluatorCandidateRow => ({
  userId,
  isActive: true,
  hasEvaluatorRole: true,
  profiles: profiles.map((p) => CATALOG[p]),
  ...overrides,
});

describe('AssignEvaluatorsUseCase — asignación por la PRESIDENTE (TSK-002-N52)', () => {
  let repo: jest.Mocked<AssignEvaluatorsRepository>;
  let emitter: { emit: jest.Mock };
  let systemParams: { get: jest.Mock };
  let useCase: AssignEvaluatorsUseCase;
  let assignedAt: Date;
  let convocatoriaDeadline: Date | null;

  const expedited: AssignEvaluatorsCommand = {
    protocolId: 50,
    reviewType: ReviewType.EXPEDITA,
    assignedByUserId: 900,
    evaluators: [
      { evaluatorId: 11, profile: P.METODOLOGICO },
      { evaluatorId: 12, profile: P.SALUD },
      { evaluatorId: 13, profile: P.JURIDICO },
      { evaluatorId: 14, profile: P.BIOETICO },
      { evaluatorId: 15, profile: P.SOCIEDAD_CIVIL },
    ],
  };

  beforeEach(() => {
    assignedAt = new Date('2026-11-18T15:00:00.000Z');
    convocatoriaDeadline = null;
    repo = {
      findEvaluatorCandidates: jest
        .fn()
        .mockResolvedValue([
          candidate(11, [P.METODOLOGICO]),
          candidate(12, [P.SALUD, P.SOCIEDAD_CIVIL]),
          candidate(13, [P.JURIDICO]),
          candidate(14, [P.BIOETICO]),
          candidate(15, [P.SOCIEDAD_CIVIL]),
        ]),
      createAssignmentsForActiveVersion: jest
        .fn()
        .mockImplementation(
          (params: CreateAssignmentsForActiveVersionParams) => {
            const reviewDeadline = params.computeReviewDeadline(assignedAt);
            return Promise.resolve({
              ok: true,
              versionId: 77,
              assignedAt,
              reviewDeadline,
              convocatoriaDeadline,
              assignments: params.evaluators.map(
                (e, i) =>
                  ({
                    id: 1000 + i,
                    versionId: 77,
                    evaluatorId: e.evaluatorId,
                    profileId: e.profileId,
                    statusId: AssignmentStatus.ASSIGNED,
                    isAssignedForAnnex10: e.isAssignedForAnnex10,
                    deadline: null,
                    reviewDeadline,
                  }) as EvaluationAssignmentOrmEntity,
              ),
            });
          },
        ),
      findEnrichmentInfo: jest.fn().mockResolvedValue({
        evaluatorEmail: 'zz_test_evaluador@example.test',
        evaluatorFullName: 'ZZ_TEST_ Evaluador',
        ceishCode: 'ZZ_TEST_CODE',
        protocolTitle: 'ZZ_TEST_ Título',
      }),
    };
    emitter = { emit: jest.fn() };
    systemParams = { get: jest.fn().mockReturnValue(8) };
    useCase = new AssignEvaluatorsUseCase(repo, emitter, systemParams);
  });

  afterEach(() => jest.restoreAllMocks());

  const savedParams = (): CreateAssignmentsForActiveVersionParams =>
    repo.createAssignmentsForActiveVersion.mock.calls[0][0];

  it('N52-U-01: expedita válida → perfil_id del catálogo, Anexo 10 para todos menos Sociedad civil, asignado_por y tipo de revisión', async () => {
    const result = await useCase.execute(expedited);

    expect(result).toHaveLength(5);
    const params = savedParams();
    expect(params.protocolId).toBe(50);
    expect(params.reviewType).toBe(ReviewType.EXPEDITA);
    expect(params.assignedByUserId).toBe(900);
    expect(params.evaluators).toEqual([
      { evaluatorId: 11, profileId: 6, isAssignedForAnnex10: true },
      { evaluatorId: 12, profileId: 9, isAssignedForAnnex10: true },
      { evaluatorId: 13, profileId: 8, isAssignedForAnnex10: true },
      { evaluatorId: 14, profileId: 7, isAssignedForAnnex10: true },
      { evaluatorId: 15, profileId: 10, isAssignedForAnnex10: false },
    ]);
    expect(result.map((r) => r.isAssignedForAnnex10)).toEqual([
      true,
      true,
      true,
      true,
      false,
    ]);
  });

  it('N52-U-02: persona con Sociedad civil y otro perfil entra con el perfil elegido (§11 n.º 5)', async () => {
    await useCase.execute({
      ...expedited,
      reviewType: ReviewType.PLENO,
      evaluators: [
        { evaluatorId: 12, profile: P.SOCIEDAD_CIVIL },
        { evaluatorId: 11, profile: P.METODOLOGICO },
      ],
    });
    expect(savedParams().evaluators).toEqual([
      { evaluatorId: 12, profileId: 10, isAssignedForAnnex10: false },
      { evaluatorId: 11, profileId: 6, isAssignedForAnnex10: true },
    ]);
  });

  it('N52-U-03: composición inválida → BadRequestException (400), nunca Error genérico (500)', async () => {
    const err = await useCase
      .execute({
        ...expedited,
        evaluators: [
          { evaluatorId: 11, profile: P.SALUD },
          { evaluatorId: 12, profile: P.METODOLOGICO },
        ],
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect((err as BadRequestException).message).toBe(
      'La asignación debe incluir al menos un evaluador de Sociedad civil.',
    );
    expect(repo.createAssignmentsForActiveVersion).not.toHaveBeenCalled();
  });

  it.each([
    [
      'sin el perfil enviado',
      candidate(11, [P.SALUD]),
      'El evaluador con ID 11 no tiene activo el perfil METODOLOGICO.',
    ],
    [
      'sin rol EVALUADOR',
      candidate(11, [P.METODOLOGICO], { hasEvaluatorRole: false }),
      'El usuario con ID 11 no tiene el rol EVALUADOR activo.',
    ],
    [
      'inactivo',
      candidate(11, [P.METODOLOGICO], { isActive: false }),
      'El evaluador con ID 11 no está activo.',
    ],
  ])(
    'N52-U-04: evaluador %s → 400',
    async (_label, row: EvaluatorCandidateRow, message: string) => {
      repo.findEvaluatorCandidates.mockResolvedValue([
        row,
        candidate(15, [P.SOCIEDAD_CIVIL]),
      ]);
      await expect(
        useCase.execute({
          ...expedited,
          evaluators: [
            { evaluatorId: 11, profile: P.METODOLOGICO },
            { evaluatorId: 15, profile: P.SOCIEDAD_CIVIL },
          ],
        }),
      ).rejects.toThrow(new BadRequestException(message));
      expect(repo.createAssignmentsForActiveVersion).not.toHaveBeenCalled();
    },
  );

  it('N52-U-05: evaluador inexistente → 400', async () => {
    repo.findEvaluatorCandidates.mockResolvedValue([
      candidate(15, [P.SOCIEDAD_CIVIL]),
    ]);
    await expect(
      useCase.execute({
        ...expedited,
        evaluators: [
          { evaluatorId: 99, profile: P.SALUD },
          { evaluatorId: 15, profile: P.SOCIEDAD_CIVIL },
        ],
      }),
    ).rejects.toThrow(
      new BadRequestException('El evaluador con ID 99 no existe.'),
    );
  });

  it.each<[AssignmentPreconditionFailure, new (m: string) => Error, string]>([
    ['PROTOCOL_NOT_FOUND', NotFoundException, 'El protocolo no existe.'],
    [
      'RECEPTION_NOT_COMPLETE',
      ConflictException,
      'La recepción de la versión activa del protocolo no está completa.',
    ],
    [
      'TERMS_NOT_ACCEPTED',
      ConflictException,
      'El investigador aún no ha aceptado el sometimiento a los tiempos del CEISH.',
    ],
    [
      'ALREADY_ASSIGNED',
      ConflictException,
      'La versión activa del protocolo ya tiene evaluadores asignados.',
    ],
    [
      'NO_ACTIVE_VERSION',
      ConflictException,
      'El protocolo no tiene una versión activa para asignar.',
    ],
    [
      'VERSION_MISMATCH',
      BadRequestException,
      'La versión indicada no es la versión activa del protocolo.',
    ],
  ])(
    'N52-U-06: comprobación %s → %p',
    async (reason, ExceptionType, message) => {
      repo.createAssignmentsForActiveVersion.mockResolvedValue({
        ok: false,
        reason,
      });
      const err = await useCase.execute(expedited).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ExceptionType);
      expect((err as Error).message).toBe(message);
      expect(emitter.emit).not.toHaveBeenCalled();
    },
  );

  it('N52-U-07: emite el oficio para cada evaluador aunque no haya convocatoria, con el plazo y su fecha límite', async () => {
    await useCase.execute(expedited);

    expect(systemParams.get).toHaveBeenCalledWith(SP_PLAZO_REVISION_OFICIO);
    expect(emitter.emit).toHaveBeenCalledTimes(5);
    const payloads = emitter.emit.mock.calls.map(
      (c: [string, Record<string, unknown>]) => c,
    );
    for (const [event, payload] of payloads) {
      expect(event).toBe('evaluator.assigned');
      expect(payload.reviewBusinessDays).toBe(8);
      // Miércoles 18/11/2026 + 8 días laborables = lunes 30/11/2026
      expect(payload.reviewDeadlineDate).toBe('2026-11-30');
      expect(payload.deadlineDate).toBeNull();
      expect(payload.protocolCode).toBe('ZZ_TEST_CODE');
      expect(payload.protocolTitle).toBe('ZZ_TEST_ Título');
    }
    expect(payloads[4][1].isAssignedForAnnex10).toBe(false);
    expect(payloads[4][1].evaluatorProfile).toBe(P.SOCIEDAD_CIVIL);
  });

  it('N52-U-08: viernes → la fecha límite cruza el fin de semana y no cuenta el día de la asignación (RF-12.7 c.1)', async () => {
    assignedAt = new Date('2026-11-20T15:00:00.000Z'); // viernes 10:00 de Ecuador
    await useCase.execute(expedited);
    const deadline = savedParams().computeReviewDeadline(assignedAt);
    // 23, 24, 25, 26, 27, 30 nov, 1 y 2 dic → miércoles 02/12/2026 23:59:59.999 de Ecuador
    expect(deadline.toISOString()).toBe('2026-12-03T04:59:59.999Z');
  });

  it('N52-U-09: jueves 20:00 de Ecuador (01:00 UTC del viernes) → el plazo cuenta desde el jueves', async () => {
    assignedAt = new Date('2026-11-20T01:00:00.000Z');
    await useCase.execute(expedited);
    const deadline = savedParams().computeReviewDeadline(assignedAt);
    // 20, 23, 24, 25, 26, 27, 30 nov y 1 dic → martes 01/12/2026 23:59:59.999 de Ecuador
    expect(deadline.toISOString()).toBe('2026-12-02T04:59:59.999Z');
  });

  it('N52-U-10: con convocatoria vigente, el oficio lleva su fecha de entrega', async () => {
    convocatoriaDeadline = new Date('2026-12-10T17:00:00.000Z');
    repo.createAssignmentsForActiveVersion.mockImplementationOnce(
      (params: CreateAssignmentsForActiveVersionParams) =>
        Promise.resolve({
          ok: true,
          versionId: 77,
          assignedAt,
          reviewDeadline: params.computeReviewDeadline(assignedAt),
          convocatoriaDeadline,
          assignments: params.evaluators.map(
            (e, i) =>
              ({
                id: 2000 + i,
                versionId: 77,
                evaluatorId: e.evaluatorId,
                profileId: e.profileId,
                statusId: AssignmentStatus.ASSIGNED,
                isAssignedForAnnex10: e.isAssignedForAnnex10,
                deadline: '2026-12-10',
              }) as EvaluationAssignmentOrmEntity,
          ),
        }),
    );
    await useCase.execute(expedited);
    const payload = (emitter.emit.mock.calls as unknown[][])[0][1] as Record<
      string,
      unknown
    >;
    expect(payload.deadlineDate).toBe('2026-12-10');
  });

  it('N52-U-11: si falla el enriquecimiento, el oficio se emite igual y queda un aviso en el registro', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    repo.findEnrichmentInfo.mockRejectedValue(new Error('db caída'));
    await useCase.execute(expedited);
    expect(emitter.emit).toHaveBeenCalledTimes(5);
    expect(warn).toHaveBeenCalled();
    const payload = (emitter.emit.mock.calls as unknown[][])[0][1] as Record<
      string,
      unknown
    >;
    expect(payload.evaluatorEmail).toBeUndefined();
  });

  it('N52-U-12: un fallo al emitir el oficio no deshace la asignación y queda registrado', async () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    emitter.emit.mockImplementation(() => {
      throw new Error('smtp caído');
    });
    const result = await useCase.execute(expedited);
    expect(result).toHaveLength(5);
    expect(error).toHaveBeenCalledTimes(5);
  });

  it('N52-U-13: protocolId no numérico → 400', async () => {
    await expect(
      useCase.execute({ ...expedited, protocolId: 'abc' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.findEvaluatorCandidates).not.toHaveBeenCalled();
  });
});
