import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { EvaluationAssignmentOrmEntity } from '../database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../database/evaluator-profile.entity.orm';
import { EvaluatorProfileUserOrmEntity } from '../database/evaluator-profile-user.entity.orm';
import { ProtocolVersionOrmEntity } from '../database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../database/evaluation.entity.orm';
import { EvaluationResponseDetailOrmEntity } from '../database/evaluation-response-detail.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { RoleCode } from '../../../auth/domain/enums/role.enum';

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

  async findEvaluatorsWithWorkload(profileId?: number): Promise<any[]> {
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

    const rawData = await qb.getRawMany();

    const evaluatorsMap = new Map<number, any>();
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
      if (row.p_id) evaluator.profiles.set(row.p_id, row.p_nombre);
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
    await this.profileRepo.update(id, entity);
  }

  async deleteProfile(id: number): Promise<void> {
    await this.profileRepo.update(id, { isActive: false }); // Soft delete
  }

  async saveVersion(
    entity: Partial<ProtocolVersionOrmEntity>,
  ): Promise<ProtocolVersionOrmEntity> {
    return this.versionRepo.save(entity as ProtocolVersionOrmEntity);
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
}
