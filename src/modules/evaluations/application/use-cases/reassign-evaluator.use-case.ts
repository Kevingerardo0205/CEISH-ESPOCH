import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReassignEvaluatorDto } from '../dtos/evaluator-dtos';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';
import { AssignmentHistoryEntity } from '../../domain/entities/assignment-history.entity';
import {
  EvaluatorReassignmentService,
  ReassignmentResult,
} from '../../domain/services/evaluator-reassignment.service';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { AssignmentHistoryOrmEntity } from '../../infrastructure/database/entities/assignment-history.orm-entity';

export interface IReassignmentRepository {
  findAssignmentById(
    id: number | string,
  ): Promise<EvaluationAssignmentEntity | EvaluationAssignmentOrmEntity | null>;
  findActiveAssignmentsByVersionId?(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]>;
  hasActiveProfile?(
    evaluatorId: number | string,
    profileId: number,
  ): Promise<boolean>;
  executeReassignmentTransaction?(params: {
    outgoingAssignmentId: number;
    outgoingStatusId: number;
    newAssignment: Partial<EvaluationAssignmentOrmEntity>;
    auditHistory: Partial<AssignmentHistoryOrmEntity>;
  }): Promise<{
    outgoingAssignment: EvaluationAssignmentOrmEntity;
    newAssignment: EvaluationAssignmentOrmEntity;
    auditHistory: AssignmentHistoryOrmEntity;
  }>;
}

export interface IEventEmitter {
  emit(event: string, payload: Record<string, unknown>): void;
}

export class ReassignEvaluatorUseCase {
  constructor(
    private readonly reassignmentRepository: IReassignmentRepository,
    private readonly eventEmitter: IEventEmitter,
  ) {}

  /**
   * Caso de uso para la sustitución inmutable de evaluadores [RF-12.3, RF-12.6]
   */
  public async execute(
    dto: ReassignEvaluatorDto,
    adminUserId: number | string,
    standardFullDays: number = 15,
    holidays: string[] = [],
  ): Promise<ReassignmentResult> {
    // 1. Buscar la asignación saliente
    const numAssignmentId =
      typeof dto.currentAssignmentId === 'number'
        ? dto.currentAssignmentId
        : parseInt(dto.currentAssignmentId, 10);

    const currentAssignmentRaw =
      await this.reassignmentRepository.findAssignmentById(
        !isNaN(numAssignmentId) ? numAssignmentId : dto.currentAssignmentId,
      );

    if (!currentAssignmentRaw) {
      throw new NotFoundException(
        'La asignación de evaluación especificada no existe.',
      );
    }

    // Adaptar entidad cruda/ORM a entidad de dominio si es necesario
    let currentAssignment: EvaluationAssignmentEntity;
    if (currentAssignmentRaw instanceof EvaluationAssignmentEntity) {
      currentAssignment = currentAssignmentRaw;
    } else {
      const orm = currentAssignmentRaw;
      const profileIdToEnumMap: Record<number, EvaluatorProfile> = {
        1: EvaluatorProfile.JURIDICO,
        2: EvaluatorProfile.SOCIEDAD_CIVIL,
        3: EvaluatorProfile.METODOLOGICO,
        4: EvaluatorProfile.SALUD,
        6: EvaluatorProfile.METODOLOGICO,
        7: EvaluatorProfile.SALUD,
        8: EvaluatorProfile.JURIDICO,
        9: EvaluatorProfile.SALUD,
        10: EvaluatorProfile.SOCIEDAD_CIVIL,
      };

      const parseProfileEnum = (
        name?: string,
      ): EvaluatorProfile | undefined => {
        if (!name) return undefined;
        const norm = name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .replace(/\s+/g, '_');
        if (norm.includes('JURIDIC')) return EvaluatorProfile.JURIDICO;
        if (norm.includes('SOCIEDAD')) return EvaluatorProfile.SOCIEDAD_CIVIL;
        if (norm.includes('METODOL')) return EvaluatorProfile.METODOLOGICO;
        if (norm.includes('SALUD')) return EvaluatorProfile.SALUD;
        return undefined;
      };

      const profile =
        parseProfileEnum(orm.profile?.name) ??
        (orm.profileId ? profileIdToEnumMap[orm.profileId] : undefined) ??
        EvaluatorProfile.SALUD;

      currentAssignment = new EvaluationAssignmentEntity({
        id: orm.id,
        protocolId: orm.version?.protocolId ?? orm.versionId ?? 1,
        evaluatorId: orm.evaluatorId,
        evaluatorProfile: profile,
        isAssignedForAnnex10: orm.isAssignedForAnnex10 ?? false,
        deadlineDate: orm.deadline ?? '',
        status: orm.statusId,
      });
    }

    const profileEnumToIdMap: Record<string, number> = {
      [EvaluatorProfile.METODOLOGICO]: 6,
      [EvaluatorProfile.JURIDICO]: 8,
      [EvaluatorProfile.SALUD]: 9,
      [EvaluatorProfile.SOCIEDAD_CIVIL]: 10,
    };

    const numReplacementId =
      typeof dto.replacementEvaluatorId === 'number'
        ? dto.replacementEvaluatorId
        : parseInt(`${dto.replacementEvaluatorId}`, 10) || 0;

    const rawVersionId =
      (currentAssignmentRaw as EvaluationAssignmentOrmEntity).versionId ??
      (typeof currentAssignment.protocolId === 'number'
        ? currentAssignment.protocolId
        : 1);

    const resolvedProfileId =
      (currentAssignmentRaw as EvaluationAssignmentOrmEntity).profileId ??
      (currentAssignmentRaw as EvaluationAssignmentOrmEntity).profile?.id ??
      profileEnumToIdMap[dto.replacementEvaluatorProfile] ??
      9;

    // Validación 1: El evaluador de reemplazo no debe estar ya asignado activamente a esta versión
    if (this.reassignmentRepository.findActiveAssignmentsByVersionId) {
      const activeAssignments =
        await this.reassignmentRepository.findActiveAssignmentsByVersionId(
          rawVersionId,
        );
      const currentAsgNumId =
        typeof currentAssignment.id === 'number'
          ? currentAssignment.id
          : parseInt(`${currentAssignment.id}`, 10) || 0;
      const isAlreadyAssigned = activeAssignments.some(
        (a) => a.evaluatorId === numReplacementId && a.id !== currentAsgNumId,
      );
      if (isAlreadyAssigned) {
        throw new BadRequestException(
          'El evaluador de reemplazo ya se encuentra asignado a este protocolo.',
        );
      }
    }

    // Validación 2: El evaluador de reemplazo debe tener el perfil requerido activo
    if (this.reassignmentRepository.hasActiveProfile) {
      const hasProfile = await this.reassignmentRepository.hasActiveProfile(
        numReplacementId,
        resolvedProfileId,
      );
      if (!hasProfile) {
        throw new BadRequestException(
          'El evaluador de reemplazo no posee el perfil requerido activo.',
        );
      }
    }

    // 2. Invocar al servicio de dominio para realizar la sustitución inmutable y reinicio de plazo
    const newAssignmentId =
      typeof dto.currentAssignmentId === 'number'
        ? undefined
        : `asg-reassign-${Date.now()}`;
    const historyId =
      typeof dto.currentAssignmentId === 'number'
        ? undefined
        : `hist-reassign-${Date.now()}`;

    let reassignmentResult: ReassignmentResult;
    try {
      reassignmentResult = EvaluatorReassignmentService.executeReassignment({
        currentAssignment,
        replacementEvaluatorId: dto.replacementEvaluatorId,
        replacementEvaluatorProfile: dto.replacementEvaluatorProfile,
        reason: dto.reason,
        adminUserId,
        standardFullDays,
        holidays,
        newAssignmentId,
        historyId,
        justification: dto.reasonDescription,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error en la reasignación de evaluador.';
      throw new BadRequestException(message);
    }

    // 3. Persistir en transacción
    let persistedResult: ReassignmentResult;

    if (this.reassignmentRepository.executeReassignmentTransaction) {
      const res =
        await this.reassignmentRepository.executeReassignmentTransaction({
          outgoingAssignmentId:
            typeof currentAssignment.id === 'number'
              ? currentAssignment.id
              : parseInt(`${currentAssignment.id}`, 10) || 0,
          outgoingStatusId: reassignmentResult.outgoingAssignment.status,
          newAssignment: {
            versionId: rawVersionId,
            evaluatorId:
              typeof dto.replacementEvaluatorId === 'number'
                ? dto.replacementEvaluatorId
                : parseInt(`${dto.replacementEvaluatorId}`, 10) || 0,
            profileId: resolvedProfileId,
            statusId: AssignmentStatus.ASSIGNED,
            isAssignedForAnnex10:
              reassignmentResult.newAssignment.isAssignedForAnnex10,
            deadline: reassignmentResult.newAssignment.deadlineDate,
          },
          auditHistory: {
            previousAssignmentId:
              typeof currentAssignment.id === 'number'
                ? currentAssignment.id
                : parseInt(`${currentAssignment.id}`, 10) || 0,
            previousEvaluatorId:
              typeof currentAssignment.evaluatorId === 'number'
                ? currentAssignment.evaluatorId
                : parseInt(`${currentAssignment.evaluatorId}`, 10) || 0,
            profileId: resolvedProfileId,
            reason: dto.reason,
            justification: dto.reasonDescription,
            newEvaluatorId:
              typeof dto.replacementEvaluatorId === 'number'
                ? dto.replacementEvaluatorId
                : parseInt(`${dto.replacementEvaluatorId}`, 10) || 0,
            executedBy:
              typeof adminUserId === 'number'
                ? adminUserId
                : parseInt(`${adminUserId}`, 10) || 1,
          },
        });

      if (res && res.outgoingAssignment && res.newAssignment) {
        persistedResult = {
          outgoingAssignment: new EvaluationAssignmentEntity({
            id: res.outgoingAssignment.id,
            protocolId: currentAssignment.protocolId,
            evaluatorId: res.outgoingAssignment.evaluatorId,
            evaluatorProfile: currentAssignment.evaluatorProfile,
            isAssignedForAnnex10:
              res.outgoingAssignment.isAssignedForAnnex10 ??
              currentAssignment.isAssignedForAnnex10,
            deadlineDate:
              res.outgoingAssignment.deadline ?? currentAssignment.deadlineDate,
            status: res.outgoingAssignment.statusId,
          }),
          newAssignment: new EvaluationAssignmentEntity({
            id: res.newAssignment.id,
            protocolId: currentAssignment.protocolId,
            evaluatorId: res.newAssignment.evaluatorId,
            evaluatorProfile: dto.replacementEvaluatorProfile,
            isAssignedForAnnex10:
              res.newAssignment.isAssignedForAnnex10 ??
              currentAssignment.isAssignedForAnnex10,
            deadlineDate:
              res.newAssignment.deadline ??
              reassignmentResult.newAssignment.deadlineDate,
            status: res.newAssignment.statusId,
          }),
          auditHistory: new AssignmentHistoryEntity({
            id: res.auditHistory.id,
            previousAssignmentId: res.auditHistory.previousAssignmentId,
            previousEvaluatorId: res.auditHistory.previousEvaluatorId,
            evaluatorProfile: dto.replacementEvaluatorProfile,
            reassignmentReason: dto.reason,
            newEvaluatorId: res.auditHistory.newEvaluatorId,
            newAssignmentId: res.auditHistory.newAssignmentId,
            executedBy: res.auditHistory.executedBy,
            executedAt: res.auditHistory.executedAt ?? new Date(),
            justification: res.auditHistory.justification,
          }),
        };
      } else {
        persistedResult = reassignmentResult;
      }
    } else {
      persistedResult = reassignmentResult;
    }

    // 4. Notificar asincrónicamente al nuevo evaluador mediante evento con Deep-Linking
    this.eventEmitter.emit('evaluator.assigned', {
      assignmentId: persistedResult.newAssignment.id,
      protocolId: persistedResult.newAssignment.protocolId,
      evaluatorId: persistedResult.newAssignment.evaluatorId,
      evaluatorProfile: persistedResult.newAssignment.evaluatorProfile,
      isAssignedForAnnex10: persistedResult.newAssignment.isAssignedForAnnex10,
      deadlineDate: persistedResult.newAssignment.deadlineDate,
      isReassignment: true,
      reassignmentReason: dto.reason,
    });

    return persistedResult;
  }
}
