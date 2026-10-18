/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import {
  GetActiveAssignmentsUseCase,
  IActiveAssignmentsQueryRepository,
} from './get-active-assignments.use-case';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { ActiveVersionRow } from '../../domain/ports/evaluation.repository.port';

const makeAssignment = (
  overrides: Partial<EvaluationAssignmentOrmEntity>,
): EvaluationAssignmentOrmEntity =>
  ({
    id: 1,
    evaluatorId: 10,
    statusId: 6,
    isAssignedForAnnex10: false,
    deadline: null,
    actualSubmissionDate: undefined,
    assignedAt: new Date('2026-06-01T10:00:00.000Z'),
    evaluator: { fullName: 'Evaluador Test' } as any,
    profile: { name: 'Jurídico' } as any,
    ...overrides,
  }) as EvaluationAssignmentOrmEntity;

describe('GetActiveAssignmentsUseCase', () => {
  let useCase: GetActiveAssignmentsUseCase;
  let repo: jest.Mocked<IActiveAssignmentsQueryRepository>;

  beforeEach(() => {
    repo = {
      findProtocolWithVersion1: jest.fn(),
      findActiveAssignmentsByVersionId: jest.fn(),
    };
    useCase = new GetActiveAssignmentsUseCase(repo);
  });

  it('lanza NotFoundException cuando el protocolo no existe', async () => {
    repo.findProtocolWithVersion1.mockResolvedValue(null);
    await expect(useCase.execute(99)).rejects.toThrow(NotFoundException);
    await expect(useCase.execute(99)).rejects.toThrow(/99/);
  });

  it('devuelve assignments vacío cuando el protocolo no tiene versión 1', async () => {
    const row: ActiveVersionRow = {
      ceishCode: 'CEISH-2026-001',
      versionId: null,
      versionNumber: null,
    };
    repo.findProtocolWithVersion1.mockResolvedValue(row);

    const result = await useCase.execute(5);
    expect(result.protocolId).toBe(5);
    expect(result.ceishCode).toBe('CEISH-2026-001');
    expect(result.versionId).toBeNull();
    expect(result.versionNumber).toBeNull();
    expect(result.assignments).toEqual([]);
    expect(repo.findActiveAssignmentsByVersionId).not.toHaveBeenCalled();
  });

  it('devuelve assignments vacío cuando no hay asignaciones activas', async () => {
    repo.findProtocolWithVersion1.mockResolvedValue({
      ceishCode: null,
      versionId: 100,
      versionNumber: 1,
    });
    repo.findActiveAssignmentsByVersionId.mockResolvedValue([]);

    const result = await useCase.execute(5);
    expect(result.assignments).toEqual([]);
  });

  it('mapea correctamente los campos del DTO', async () => {
    repo.findProtocolWithVersion1.mockResolvedValue({
      ceishCode: 'CEISH-2026-002',
      versionId: 200,
      versionNumber: 1,
    });
    repo.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment({
        id: 1,
        evaluatorId: 10,
        statusId: 6,
        isAssignedForAnnex10: true,
        deadline: '2026-12-31',
        actualSubmissionDate: undefined,
        assignedAt: new Date('2026-06-01T10:00:00.000Z'),
        evaluator: { fullName: 'Ana Evaluadora' } as any,
        profile: { name: 'Salud' } as any,
      }),
    ]);

    const result = await useCase.execute(5);
    const a = result.assignments[0];
    expect(a.assignmentId).toBe(1);
    expect(a.evaluatorId).toBe(10);
    expect(a.evaluatorFullName).toBe('Ana Evaluadora');
    expect(a.evaluatorProfile).toBe('SALUD');
    expect(a.status).toBe('ASSIGNED');
    expect(a.isAssignedForAnnex10).toBe(true);
    expect(a.deadlineDate).toBe('2026-12-31');
    expect(a.submittedAt).toBeNull();
    expect(a.assignedAt).toBe('2026-06-01T10:00:00.000Z');
  });

  it('status SUGGESTED (5) → "SUGGESTED"', async () => {
    repo.findProtocolWithVersion1.mockResolvedValue({
      ceishCode: null,
      versionId: 200,
      versionNumber: 1,
    });
    repo.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment({ statusId: 5 }),
    ]);
    const result = await useCase.execute(5);
    expect(result.assignments[0].status).toBe('SUGGESTED');
  });

  it('status COMPLETED (7) incluye submittedAt como ISO', async () => {
    const submittedDate = new Date('2026-08-15T14:30:00.000Z');
    repo.findProtocolWithVersion1.mockResolvedValue({
      ceishCode: null,
      versionId: 200,
      versionNumber: 1,
    });
    repo.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment({ statusId: 7, actualSubmissionDate: submittedDate }),
    ]);
    const result = await useCase.execute(5);
    expect(result.assignments[0].status).toBe('COMPLETED');
    expect(result.assignments[0].submittedAt).toBe(submittedDate.toISOString());
  });

  it('evalatorProfile null cuando el perfil no es reconocido', async () => {
    repo.findProtocolWithVersion1.mockResolvedValue({
      ceishCode: null,
      versionId: 200,
      versionNumber: 1,
    });
    repo.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment({ profile: { name: 'Desconocido' } as any }),
    ]);
    const result = await useCase.execute(5);
    expect(result.assignments[0].evaluatorProfile).toBeNull();
  });

  it('ordena por assignedAt ASC, desempate por assignmentId', async () => {
    repo.findProtocolWithVersion1.mockResolvedValue({
      ceishCode: null,
      versionId: 200,
      versionNumber: 1,
    });
    const t1 = new Date('2026-06-01T08:00:00.000Z');
    const t2 = new Date('2026-06-01T10:00:00.000Z');
    const t3 = new Date('2026-06-01T10:00:00.000Z'); // mismo tiempo que t2
    repo.findActiveAssignmentsByVersionId.mockResolvedValue([
      makeAssignment({ id: 30, assignedAt: t2 }),
      makeAssignment({ id: 10, assignedAt: t1 }),
      makeAssignment({ id: 20, assignedAt: t3 }),
    ]);
    const result = await useCase.execute(5);
    const ids = result.assignments.map((a) => a.assignmentId);
    expect(ids).toEqual([10, 20, 30]);
  });

  it('incluye ceishCode y versionId en la respuesta', async () => {
    repo.findProtocolWithVersion1.mockResolvedValue({
      ceishCode: 'CEISH-2026-ABC',
      versionId: 777,
      versionNumber: 1,
    });
    repo.findActiveAssignmentsByVersionId.mockResolvedValue([]);

    const result = await useCase.execute(42);
    expect(result.protocolId).toBe(42);
    expect(result.ceishCode).toBe('CEISH-2026-ABC');
    expect(result.versionId).toBe(777);
    expect(result.versionNumber).toBe(1);
  });
});
