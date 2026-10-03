import 'reflect-metadata';
import { getMetadataArgsStorage, ValueTransformer } from 'typeorm';
import { EvaluationAssignmentOrmEntity } from '../evaluation-assignment.entity.orm';
import { AssignmentHistoryOrmEntity } from './assignment-history.orm-entity';
import { AssignmentStatus } from '../../../domain/enums/assignment-status.enum';

describe('Evaluation ORM Entities (TSK-002-06)', () => {
  it('should instantiate EvaluationAssignmentOrmEntity with columns including isAssignedForAnnex10 and extended AssignmentStatus', () => {
    const entity = new EvaluationAssignmentOrmEntity();
    entity.id = 101;
    entity.versionId = 202;
    entity.evaluatorId = 303;
    entity.isAssignedForAnnex10 = true;
    entity.statusId = AssignmentStatus.REASIGNED_COI;
    entity.deadline = new Date();

    expect(entity.id).toBe(101);
    expect(entity.versionId).toBe(202);
    expect(entity.evaluatorId).toBe(303);
    expect(entity.isAssignedForAnnex10).toBe(true);
    expect(entity.statusId).toBe(AssignmentStatus.REASIGNED_COI);
    expect(entity.statusId).toBe(27);
  });

  it('should instantiate AssignmentHistoryOrmEntity with columns and relational properties', () => {
    const entity = new AssignmentHistoryOrmEntity();
    entity.id = 1;
    entity.previousAssignmentId = 101;
    entity.previousEvaluatorId = 303;
    entity.profileId = 1;
    entity.reason = 'CONFLICTO_INTERES';
    entity.justification = 'Declaración voluntaria de conflicto de interés.';
    entity.newEvaluatorId = 404;
    entity.newAssignmentId = 102;
    entity.executedBy = 15;
    entity.executedAt = new Date();

    expect(entity.id).toBe(1);
    expect(entity.previousAssignmentId).toBe(101);
    expect(entity.reason).toBe('CONFLICTO_INTERES');
    expect(entity.newEvaluatorId).toBe(404);
    expect(entity.executedBy).toBe(15);
  });

  it('should invoke the REAL deadline transformer from EvaluationAssignmentOrmEntity metadata', () => {
    const columnMetadata = getMetadataArgsStorage().columns.find(
      (c) =>
        c.target === EvaluationAssignmentOrmEntity &&
        c.propertyName === 'deadline',
    );
    expect(columnMetadata).toBeDefined();

    const transformer = columnMetadata!.options.transformer as ValueTransformer;
    expect(transformer).toBeDefined();
    expect(typeof transformer.to).toBe('function');

    // Caso 1: Cadena 'YYYY-MM-DD' intacta
    expect(transformer.to('2026-03-12')).toBe('2026-03-12');
    expect(transformer.to(null)).toBeNull();
    expect(transformer.to(undefined)).toBeUndefined();

    // Caso 2: Instancia de Date lanza excepción estricta
    expect(() => transformer.to(new Date())).toThrow(
      'fecha_limite no acepta Date, use formato YYYY-MM-DD',
    );
    expect(() => transformer.to(new Date('2026-03-12'))).toThrow(
      'fecha_limite no acepta Date, use formato YYYY-MM-DD',
    );
  });
});
