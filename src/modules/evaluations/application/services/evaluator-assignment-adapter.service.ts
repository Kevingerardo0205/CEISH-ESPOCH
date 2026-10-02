import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluatorProfileUserOrmEntity } from '../../infrastructure/database/evaluator-profile-user.entity.orm';
import { EvaluatorProfileOrmEntity } from '../../infrastructure/database/evaluator-profile.entity.orm';
import { AssignEvaluatorsUseCase } from '../use-cases/assign-evaluators.use-case';
import { AssignEvaluatorsDto } from '../dtos/evaluator-dtos';
import { AssignPeerEvaluatorsDto } from '../dtos/assign-peer-evaluators.dto';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';

import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';

@Injectable()
export class EvaluatorAssignmentAdapterService {
  constructor(
    @InjectRepository(EvaluatorProfileUserOrmEntity)
    private readonly evaluatorProfileUserRepo: Repository<EvaluatorProfileUserOrmEntity>,
    @InjectRepository(EvaluatorProfileOrmEntity)
    private readonly profileRepo: Repository<EvaluatorProfileOrmEntity>,
    @InjectRepository(ProtocolOrmEntity)
    private readonly protocolOrmRepo: Repository<ProtocolOrmEntity>,
    private readonly assignEvaluatorsUseCase: AssignEvaluatorsUseCase,
  ) {}

  /**
   * Adapta y unifica la asignación de evaluadores (payload legacy o canónico)
   * delegando siempre en el caso de uso canónico AssignEvaluatorsUseCase.
   */
  async adaptAndAssign(
    protocolId: number,
    dto: AssignEvaluatorsDto | AssignPeerEvaluatorsDto,
  ): Promise<EvaluationAssignmentEntity[]> {
    // Consultar el reviewType del protocolo si no viene especificado en el DTO
    const protocol = await this.protocolOrmRepo.findOne({
      where: { id: protocolId },
      select: { id: true, reviewType: true },
    });

    // 1. Si ya viene con el formato canónico (array de evaluators con perfiles)
    if ('evaluators' in dto && Array.isArray(dto.evaluators)) {
      return this.assignEvaluatorsUseCase.execute({
        protocolId,
        reviewType: dto.reviewType ?? protocol?.reviewType,
        evaluators: dto.evaluators,
      });
    }

    // 2. Si viene con el formato legacy ({ evaluatorIds: number[] })
    const legacyDto = dto as AssignPeerEvaluatorsDto;
    const evaluatorIds = legacyDto.evaluatorIds;

    if (
      !evaluatorIds ||
      !Array.isArray(evaluatorIds) ||
      evaluatorIds.length !== 4
    ) {
      throw new BadRequestException(
        'La cuota de evaluación debe estar integrada por exactamente 4 evaluadores pares.',
      );
    }

    const uniqueIds = new Set(evaluatorIds);
    if (uniqueIds.size !== 4) {
      throw new BadRequestException(
        'No se permiten evaluadores duplicados en la asignación.',
      );
    }

    // Consultar los perfiles activos de cada evaluador en catalogos.evaluadores_perfil
    const userProfilesMap = new Map<number, EvaluatorProfile[]>();

    for (const userId of evaluatorIds) {
      const activeAssignments = await this.evaluatorProfileUserRepo.find({
        where: { userId, isActive: true },
        relations: ['profile'],
      });

      if (!activeAssignments || activeAssignments.length === 0) {
        throw new BadRequestException(
          `El evaluador con ID ${userId} no cuenta con un perfil activo asignado (Jurídico, Salud, Metodológico o Sociedad Civil).`,
        );
      }

      const profiles: EvaluatorProfile[] = [];
      for (const asg of activeAssignments) {
        const canonicalProfile = this.mapProfileNameToEnum(asg.profile?.name);
        if (canonicalProfile && !profiles.includes(canonicalProfile)) {
          profiles.push(canonicalProfile);
        }
      }

      if (profiles.length === 0) {
        throw new BadRequestException(
          `El perfil asignado al evaluador con ID ${userId} no es reconocido como un perfil canónico válido.`,
        );
      }

      userProfilesMap.set(userId, profiles);
    }

    // Resolver asignación biyectiva única de los 4 perfiles requeridos
    const requiredProfiles: EvaluatorProfile[] = [
      EvaluatorProfile.JURIDICO,
      EvaluatorProfile.SOCIEDAD_CIVIL,
      EvaluatorProfile.METODOLOGICO,
      EvaluatorProfile.SALUD,
    ];

    const resolvedMatching = this.resolveDistinctProfilesMatching(
      evaluatorIds,
      userProfilesMap,
      requiredProfiles,
    );

    if (!resolvedMatching) {
      throw new BadRequestException(
        'La cuota exige exactamente 1 evaluador por cada uno de los 4 perfiles obligatorios: JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO y SALUD.',
      );
    }

    // Invocar el caso de uso canónico
    return this.assignEvaluatorsUseCase.execute({
      protocolId,
      reviewType: protocol?.reviewType,
      evaluators: resolvedMatching,
    });
  }

  /**
   * Mapea el nombre del perfil de la BD al enum canónico EvaluatorProfile
   */
  private mapProfileNameToEnum(name?: string): EvaluatorProfile | null {
    if (!name) return null;
    const normalized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    if (normalized.includes('JURIDIC') || normalized.includes('LEGAL')) {
      return EvaluatorProfile.JURIDICO;
    }
    if (
      normalized.includes('SOCIEDAD') ||
      normalized.includes('CIVIL') ||
      normalized.includes('COMUNIDAD')
    ) {
      return EvaluatorProfile.SOCIEDAD_CIVIL;
    }
    if (
      normalized.includes('METODOLOG') ||
      normalized.includes('INVESTIGACION')
    ) {
      return EvaluatorProfile.METODOLOGICO;
    }
    if (
      normalized.includes('SALUD') ||
      normalized.includes('MEDIC') ||
      normalized.includes('CLINIC')
    ) {
      return EvaluatorProfile.SALUD;
    }
    return null;
  }

  /**
   * Encuentra una correspondencia válida 1:1 entre evaluadores y perfiles requeridos
   */
  private resolveDistinctProfilesMatching(
    evaluatorIds: number[],
    userProfilesMap: Map<number, EvaluatorProfile[]>,
    requiredProfiles: EvaluatorProfile[],
  ): Array<{ evaluatorId: number; profile: EvaluatorProfile }> | null {
    const result: Array<{ evaluatorId: number; profile: EvaluatorProfile }> =
      [];
    const usedProfiles = new Set<EvaluatorProfile>();

    const backtrack = (index: number): boolean => {
      if (index === evaluatorIds.length) {
        return result.length === 4;
      }

      const userId = evaluatorIds[index];
      const availableProfiles = userProfilesMap.get(userId) || [];

      for (const profile of availableProfiles) {
        if (requiredProfiles.includes(profile) && !usedProfiles.has(profile)) {
          usedProfiles.add(profile);
          result.push({ evaluatorId: userId, profile });

          if (backtrack(index + 1)) {
            return true;
          }

          usedProfiles.delete(profile);
          result.pop();
        }
      }

      return false;
    };

    if (backtrack(0)) {
      return result;
    }

    return null;
  }
}
