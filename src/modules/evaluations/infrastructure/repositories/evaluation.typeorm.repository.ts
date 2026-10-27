import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  ActiveVersionRow,
  EvaluatorEnrichmentInfo,
  IEvaluationRepository,
  ReassignmentHistoryRawRow,
} from '../../domain/ports/evaluation.repository.port';
import { EvaluationAssignmentOrmEntity } from '../database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../database/evaluator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from '../database/evaluator-profile-user.entity.orm';
import { ProtocolVersionOrmEntity } from '../database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../database/evaluation.entity.orm';
import { EvaluationResponseDetailOrmEntity } from '../database/evaluation-response-detail.entity.orm';
import { AssignmentHistoryOrmEntity } from '../database/entities/assignment-history.orm-entity';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { RoleCode } from '../../../auth/domain/enums/role.enum';
import { ConvocatoriaStatus } from '../database/entities/convocatoria.orm-entity';

@Injectable()
export class EvaluationTypeOrmRepository implements IEvaluationRepository {
  constructor(
    @InjectRepository(EvaluationAssignmentOrmEntity)
    private readonly assignmentRepo: Repository<EvaluationAssignmentOrmEntity>,
    @InjectRepository(EvaluatorProfileOrmEntity)
    private readonly profileRepo: Repository<EvaluatorProfileOrmEntity>,
    @InjectRepository(ProtocolVersionOrmEntity)
    private readonly versionRepo: Repository<ProtocolVersionOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
    @InjectRepository(EvaluationOrmEntity)
    private readonly evaluationRepo: Repository<EvaluationOrmEntity>,
    @InjectRepository(EvaluationResponseDetailOrmEntity)
    private readonly detailRepo: Repository<EvaluationResponseDetailOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAssignmentById(
    id: number,
  ): Promise<EvaluationAssignmentOrmEntity | null> {
    return this.assignmentRepo.findOne({
      where: { id },
      relations: ['evaluator', 'profile', 'version', 'version.protocol'],
    });
  }

  async saveAssignment(
    entity: Partial<EvaluationAssignmentOrmEntity>,
  ): Promise<EvaluationAssignmentOrmEntity> {
    return this.assignmentRepo.save(entity as EvaluationAssignmentOrmEntity);
  }

  async findAssignmentsByVersionId(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]> {
    return this.assignmentRepo.find({
      where: { versionId },
      relations: ['evaluator', 'profile'],
    });
  }

  async findActiveAssignmentsByVersionId(
    versionId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]> {
    return this.assignmentRepo.find({
      where: {
        versionId,
        statusId: In([
          AssignmentStatus.SUGGESTED,
          AssignmentStatus.ASSIGNED,
          AssignmentStatus.COMPLETED,
        ]),
      },
      relations: ['evaluator', 'profile', 'version', 'version.protocol'],
    });
  }

  async filterVersionIdsInActiveConvocatoria(
    versionIds: number[],
  ): Promise<number[]> {
    if (versionIds.length === 0) return [];
    const rows: Array<{ version_id: number }> = await this.dataSource.query(
      `SELECT DISTINCT cp.version_id
       FROM evaluacion.convocatoria_protocolos cp
       JOIN evaluacion.convocatorias c ON c.id = cp.convocatoria_id
       WHERE cp.version_id = ANY($1::int[])
         AND c.estado IN ($2, $3)`,
      [versionIds, ConvocatoriaStatus.PROGRAMADA, ConvocatoriaStatus.EN_CURSO],
    );
    return rows.map((r) => Number(r.version_id));
  }

  async findActiveConvocatoriaDeadline(
    versionId: number,
  ): Promise<Date | null> {
    // Solo convocatorias vigentes: PROGRAMADA o EN_CURSO excluye CANCELADA y CONCLUIDA
    const rows: Array<{ fecha_entrega_evaluacion: Date | null }> =
      await this.dataSource.query(
        `SELECT c.fecha_entrega_evaluacion
         FROM evaluacion.convocatorias c
         JOIN evaluacion.convocatoria_protocolos cp ON cp.convocatoria_id = c.id
         WHERE cp.version_id = $1
           AND c.fecha_entrega_evaluacion IS NOT NULL
           AND c.estado IN ($2, $3)
         ORDER BY c.fecha_reunion DESC
         LIMIT 1`,
        [versionId, ConvocatoriaStatus.PROGRAMADA, ConvocatoriaStatus.EN_CURSO],
      );
    if (!rows.length || !rows[0].fecha_entrega_evaluacion) return null;
    return new Date(rows[0].fecha_entrega_evaluacion);
  }

  async saveAssignmentsTransaction(
    assignments: Partial<EvaluationAssignmentOrmEntity>[],
  ): Promise<EvaluationAssignmentOrmEntity[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entities = assignments.map((a) =>
        queryRunner.manager.create(EvaluationAssignmentOrmEntity, a),
      );
      const saved = await queryRunner.manager.save(
        EvaluationAssignmentOrmEntity,
        entities,
      );
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async executeReassignmentTransaction(params: {
    outgoingAssignmentId: number;
    outgoingStatusId: number;
    newAssignment: Partial<EvaluationAssignmentOrmEntity>;
    auditHistory: Partial<AssignmentHistoryOrmEntity>;
  }): Promise<{
    outgoingAssignment: EvaluationAssignmentOrmEntity;
    newAssignment: EvaluationAssignmentOrmEntity;
    auditHistory: AssignmentHistoryOrmEntity;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener y actualizar asignación saliente
      const outgoing = await queryRunner.manager.findOne(
        EvaluationAssignmentOrmEntity,
        {
          where: { id: params.outgoingAssignmentId },
        },
      );

      if (!outgoing) {
        throw new NotFoundException(
          `Asignación previa con ID ${params.outgoingAssignmentId} no encontrada.`,
        );
      }

      outgoing.statusId = params.outgoingStatusId;
      const savedOutgoing = await queryRunner.manager.save(
        EvaluationAssignmentOrmEntity,
        outgoing,
      );

      // 2. Crear y guardar la nueva asignación
      const resolvedProfileId =
        outgoing.profileId ?? params.newAssignment.profileId;

      const newAssignmentEntity = queryRunner.manager.create(
        EvaluationAssignmentOrmEntity,
        {
          ...params.newAssignment,
          profileId: resolvedProfileId,
        },
      );
      const savedNewAssignment = await queryRunner.manager.save(
        EvaluationAssignmentOrmEntity,
        newAssignmentEntity,
      );

      // 3. Crear y guardar el historial de auditoría inmutable
      const auditEntity = queryRunner.manager.create(
        AssignmentHistoryOrmEntity,
        {
          ...params.auditHistory,
          profileId: resolvedProfileId,
          previousAssignmentId: savedOutgoing.id,
          newAssignmentId: savedNewAssignment.id,
        },
      );
      const savedAuditHistory = await queryRunner.manager.save(
        AssignmentHistoryOrmEntity,
        auditEntity,
      );

      await queryRunner.commitTransaction();

      return {
        outgoingAssignment: savedOutgoing,
        newAssignment: savedNewAssignment,
        auditHistory: savedAuditHistory,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAssignmentsByEvaluatorId(
    evaluatorId: number,
  ): Promise<EvaluationAssignmentOrmEntity[]> {
    return this.assignmentRepo.find({
      where: { evaluatorId },
      relations: ['version', 'version.protocol', 'profile'],
    });
  }

  async findPendingSuggestions(): Promise<EvaluationAssignmentOrmEntity[]> {
    return this.assignmentRepo.find({
      where: { statusId: AssignmentStatus.SUGGESTED },
      relations: ['evaluator', 'profile', 'version', 'version.protocol'],
    });
  }

  async deleteAssignment(id: number): Promise<void> {
    await this.assignmentRepo.delete(id);
  }

  async findEvaluatorsWithWorkload(
    profileId?: number,
  ): Promise<Record<string, unknown>[]> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const qb = this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r', 'r.codigo = :roleCode', {
        roleCode: RoleCode.EVALUADOR,
      })
      .leftJoin(
        EvaluatorProfileUserOrmEntity,
        'ep',
        'ep.userId = u.id AND ep.isActive = true',
      )
      .leftJoin(EvaluatorProfileOrmEntity, 'p', 'ep.profileId = p.id')
      .leftJoin(
        EvaluationAssignmentOrmEntity,
        'a_active',
        'a_active.evaluatorId = u.id AND a_active.actualSubmissionDate IS NULL AND a_active.statusId = :assignedStatus',
        { assignedStatus: AssignmentStatus.ASSIGNED },
      )
      .leftJoin(
        EvaluationAssignmentOrmEntity,
        'a_done',
        'a_done.evaluatorId = u.id AND a_done.actualSubmissionDate >= :monthStart',
        { monthStart: firstDayOfMonth },
      )
      .select([
        'u.id',
        'u.fullName',
        'u.institutionalEmail',
        'p.id',
        'p.name',
        'a_active.id',
        'a_done.id',
      ]);

    if (profileId) {
      qb.andWhere('p.id = :profileId', { profileId });
    }

    interface RawEvaluatorRow {
      u_id: number;
      u_nombres_completos: string;
      u_email_institucional: string;
      p_id?: number;
      p_nombre?: string;
      a_active_id?: number;
      a_done_id?: number;
    }
    const rawData = await qb.getRawMany<RawEvaluatorRow>();

    interface EvaluatorData {
      profiles: Map<number, string>;
      activeAssignments: Set<number>;
      completedThisMonth: Set<number>;
      [key: string]: unknown;
    }
    const evaluatorsMap = new Map<number, EvaluatorData>();
    rawData.forEach((row) => {
      let evaluator = evaluatorsMap.get(row.u_id);
      if (!evaluator) {
        evaluator = {
          id: row.u_id,
          fullName: row.u_nombres_completos,
          email: row.u_email_institucional,
          profiles: new Map<number, string>(),
          activeAssignments: new Set<number>(),
          completedThisMonth: new Set<number>(),
        };
        evaluatorsMap.set(row.u_id, evaluator);
      }
      if (row.p_id && row.p_nombre)
        evaluator.profiles.set(row.p_id, row.p_nombre);
      if (row.a_active_id) evaluator.activeAssignments.add(row.a_active_id);
      if (row.a_done_id) evaluator.completedThisMonth.add(row.a_done_id);
    });

    return Array.from(evaluatorsMap.values()).map((e) => ({
      id: e.id,
      fullName: e.fullName,
      email: e.email,
      profiles: Array.from(e.profiles.entries()).map(([id, name]) => ({
        id,
        name,
      })),
      currentLoad: e.activeAssignments.size,
      completedThisMonth: e.completedThisMonth.size,
    }));
  }

  async hasActiveProfile(
    userId: number | string,
    profileId: number,
  ): Promise<boolean> {
    const numUserId =
      typeof userId === 'number' ? userId : parseInt(`${userId}`, 10) || 0;
    const record = await this.dataSource
      .getRepository(EvaluatorProfileUserOrmEntity)
      .findOne({
        where: { userId: numUserId, profileId, isActive: true },
      });
    return !!record;
  }

  async findProfiles(): Promise<EvaluatorProfileOrmEntity[]> {
    return this.profileRepo.find({ where: { isActive: true } });
  }

  async findProfileById(id: number): Promise<EvaluatorProfileOrmEntity | null> {
    return this.profileRepo.findOne({ where: { id } });
  }

  async saveProfile(
    entity: Partial<EvaluatorProfileOrmEntity>,
  ): Promise<EvaluatorProfileOrmEntity> {
    return this.profileRepo.save(entity as EvaluatorProfileOrmEntity);
  }

  async updateProfile(
    id: number,
    entity: Partial<EvaluatorProfileOrmEntity>,
  ): Promise<void> {
    await this.profileRepo.update(
      id,
      entity as QueryDeepPartialEntity<EvaluatorProfileOrmEntity>,
    );
  }

  async deleteProfile(id: number): Promise<void> {
    await this.profileRepo.update(id, { isActive: false }); // Soft delete
  }

  async saveVersion(
    entity: Partial<ProtocolVersionOrmEntity>,
  ): Promise<ProtocolVersionOrmEntity> {
    return this.versionRepo.save(entity as ProtocolVersionOrmEntity);
  }

  async findVersionById(id: number): Promise<ProtocolVersionOrmEntity | null> {
    return this.versionRepo.findOne({ where: { id } });
  }

  async findVersionByProtocolId(
    protocolId: number,
    versionNumber: number = 1,
  ): Promise<ProtocolVersionOrmEntity | null> {
    return this.versionRepo.findOne({
      where: { protocolId, versionNumber },
    });
  }

  async saveEvaluation(
    entity: Partial<EvaluationOrmEntity>,
  ): Promise<EvaluationOrmEntity> {
    return this.evaluationRepo.save(entity as EvaluationOrmEntity);
  }

  async findEvaluationById(id: number): Promise<EvaluationOrmEntity | null> {
    return this.evaluationRepo.findOne({ where: { id } });
  }

  async findEvaluationByAssignmentId(
    assignmentId: number,
  ): Promise<EvaluationOrmEntity | null> {
    return this.evaluationRepo.findOne({
      where: { assignmentId },
      relations: ['assignment'],
    });
  }

  async saveEvaluationCriteria(
    evaluationId: number,
    criteriaId: number,
    valor: boolean,
  ): Promise<void> {
    await this.evaluationRepo.query(
      `INSERT INTO evaluacion.evaluacion_criterio (evaluacion_id, criterio_id, valor)
       VALUES ($1, $2, $3)
       ON CONFLICT (evaluacion_id, criterio_id) DO UPDATE SET valor = $3`,
      [evaluationId, criteriaId, valor],
    );
  }

  async saveEvaluationResponseDetails(
    details: EvaluationResponseDetailOrmEntity[],
  ): Promise<EvaluationResponseDetailOrmEntity[]> {
    return this.detailRepo.save(details);
  }

  async findEvaluationDetailsByEvaluationId(
    evaluationId: number,
  ): Promise<EvaluationResponseDetailOrmEntity[]> {
    return this.detailRepo.find({
      where: { evaluacionId: evaluationId },
      order: { id: 'ASC' },
    });
  }

  async deleteEvaluationResponseDetails(evaluationId: number): Promise<void> {
    await this.detailRepo.delete({ evaluacionId: evaluationId });
  }

  async findReassignmentHistoryByProtocolId(
    protocolId: number,
  ): Promise<ReassignmentHistoryRawRow[]> {
    const rows: ReassignmentHistoryRawRow[] = await this.dataSource.query(
      `SELECT
         h.id                       AS id,
         h.asignacion_anterior_id   AS "assignmentId",
         h.evaluador_anterior_id    AS "previousEvaluatorId",
         u_prev.nombres_completos   AS "previousEvaluatorName",
         h.evaluador_nuevo_id       AS "newEvaluatorId",
         u_new.nombres_completos    AS "newEvaluatorName",
         p.nombre                   AS "profileName",
         h.motivo                   AS "reassignmentReason",
         h.justificacion            AS "reasonDescription",
         h.ejecutado_por            AS "executedByUserId",
         u_exec.nombres_completos   AS "executedByUserName",
         h.creado_en                AS "executedAt"
       FROM evaluacion.asignacion_historial h
       JOIN evaluacion.asignaciones_evaluacion ae
         ON h.asignacion_anterior_id = ae.id
       JOIN public.versiones_protocolo vp
         ON ae.version_id = vp.id
       JOIN catalogos.usuarios u_prev
         ON h.evaluador_anterior_id = u_prev.id
       JOIN catalogos.usuarios u_new
         ON h.evaluador_nuevo_id = u_new.id
       JOIN catalogos.usuarios u_exec
         ON h.ejecutado_por = u_exec.id
       LEFT JOIN catalogos.perfiles_evaluador p
         ON h.perfil_id = p.id
       WHERE vp.protocolo_id = $1
       ORDER BY h.creado_en DESC, h.id DESC`,
      [protocolId],
    );
    return rows;
  }

  async protocolExists(protocolId: number): Promise<boolean> {
    const rows: Array<{ exists: boolean }> = await this.dataSource.query(
      `SELECT EXISTS(SELECT 1 FROM public.protocolos WHERE id = $1) AS exists`,
      [protocolId],
    );
    return rows[0]?.exists === true;
  }

  async findProtocolWithVersion1(
    protocolId: number,
  ): Promise<ActiveVersionRow | null> {
    const rows = await this.dataSource.query<
      Array<{
        ceish_code: string | null;
        version_id: number | null;
        version_number: number | null;
      }>
    >(
      `SELECT p.codigo_ceish          AS ceish_code,
              vp.id                   AS version_id,
              vp.numero_version       AS version_number
         FROM public.protocolos p
         LEFT JOIN public.versiones_protocolo vp
               ON vp.protocolo_id = p.id AND vp.numero_version = 1
        WHERE p.id = $1`,
      [protocolId],
    );
    if (!rows.length) return null;
    return {
      ceishCode: rows[0].ceish_code ?? null,
      versionId: rows[0].version_id ?? null,
      versionNumber: rows[0].version_number ?? null,
    };
  }

  async findEnrichmentInfo(
    evaluatorId: number,
    protocolId: number,
  ): Promise<EvaluatorEnrichmentInfo | null> {
    const rows = await this.dataSource.query<
      Array<{
        evaluator_full_name: string;
        evaluator_email: string;
        ceish_code: string | null;
      }>
    >(
      `SELECT u.nombres_completos AS evaluator_full_name,
              u.email_institucional AS evaluator_email,
              p.codigo_ceish       AS ceish_code
         FROM catalogos.usuarios u CROSS JOIN public.protocolos p
        WHERE u.id = $1 AND p.id = $2`,
      [evaluatorId, protocolId],
    );
    if (!rows.length) return null;
    return {
      evaluatorEmail: rows[0].evaluator_email,
      evaluatorFullName: rows[0].evaluator_full_name,
      ceishCode: rows[0].ceish_code ?? null,
    };
  }
}
