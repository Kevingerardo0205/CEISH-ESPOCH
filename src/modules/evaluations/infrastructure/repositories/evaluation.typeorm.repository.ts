import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { EvaluationAssignmentOrmEntity } from '../database/evaluation-assignment.entity.orm';
import { EvaluatorProfileOrmEntity } from '../database/evaluator-profile.entity.orm';
import { ProtocolVersionOrmEntity } from '../database/protocol-version.entity.orm';
import { EvaluationOrmEntity } from '../database/evaluation.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

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
  ) {}

  async findAssignmentById(id: number): Promise<EvaluationAssignmentOrmEntity | null> {
    return this.assignmentRepo.findOne({
      where: { id },
      relations: ['evaluator', 'profile', 'version'],
    });
  }

  async saveAssignment(entity: Partial<EvaluationAssignmentOrmEntity>): Promise<EvaluationAssignmentOrmEntity> {
    return this.assignmentRepo.save(entity as EvaluationAssignmentOrmEntity);
  }

  async findAssignmentsByVersionId(versionId: number): Promise<EvaluationAssignmentOrmEntity[]> {
    return this.assignmentRepo.find({
      where: { versionId },
      relations: ['evaluator', 'profile'],
    });
  }

  async findAssignmentsByEvaluatorId(evaluatorId: number): Promise<EvaluationAssignmentOrmEntity[]> {
    return this.assignmentRepo.find({
      where: { evaluatorId },
      relations: ['version', 'version.protocol', 'profile'],
    });
  }

  async findEvaluatorsWithWorkload(profileId?: number): Promise<any[]> {
    const qb = this.userRepo.createQueryBuilder('u')
      .innerJoin('u.roles', 'r', 'r.nombre = :roleName', { roleName: 'evaluador' })
      .leftJoin('catalogos.evaluadores_perfil', 'ep', 'ep.usuario_id = u.id')
      .leftJoinAndMapMany('u.evaluatorProfiles', EvaluatorProfileOrmEntity, 'p', 'ep.perfil_id = p.id')
      .leftJoinAndMapMany('u.activeAssignments', EvaluationAssignmentOrmEntity, 'a', 'a.evaluador_id = u.id AND a.fecha_entrega_real IS NULL')
      .select([
        'u.id',
        'u.fullName',
        'u.institutionalEmail',
      ]);

    if (profileId) {
      qb.andWhere('p.id = :profileId', { profileId });
    }

    const evaluators = await qb.getMany();

    return evaluators.map(e => ({
      id: (e as any).id,
      fullName: (e as any).fullName,
      email: (e as any).institutionalEmail,
      profiles: (e as any).evaluatorProfiles,
      currentLoad: (e as any).activeAssignments?.length || 0,
    }));
  }

  async findProfiles(): Promise<EvaluatorProfileOrmEntity[]> {
    return this.profileRepo.find({ where: { isActive: true } });
  }

  async saveVersion(entity: Partial<ProtocolVersionOrmEntity>): Promise<ProtocolVersionOrmEntity> {
    return this.versionRepo.save(entity as ProtocolVersionOrmEntity);
  }

  async findVersionByProtocolId(protocolId: number, versionNumber: number = 1): Promise<ProtocolVersionOrmEntity | null> {
    return this.versionRepo.findOne({
      where: { protocolId, versionNumber },
    });
  }

  async saveEvaluation(entity: Partial<EvaluationOrmEntity>): Promise<EvaluationOrmEntity> {
    return this.evaluationRepo.save(entity as EvaluationOrmEntity);
  }

  async findEvaluationByAssignmentId(assignmentId: number): Promise<EvaluationOrmEntity | null> {
    return this.evaluationRepo.findOne({
      where: { assignmentId },
      relations: ['assignment'],
    });
  }
}
