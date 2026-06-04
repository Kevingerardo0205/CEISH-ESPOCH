import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestigatorOrmEntity } from '../../../protocols/infrastructure/database/investigator.entity.orm';
import { InvestigatorProfileOrmEntity } from '../../../auth/infrastructure/database/investigator-profile.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';

@Injectable()
export class ConflictOfInterestService {
  constructor(
    @InjectRepository(InvestigatorOrmEntity)
    private readonly investigatorRepo: Repository<InvestigatorOrmEntity>,
    @InjectRepository(InvestigatorProfileOrmEntity)
    private readonly profileRepo: Repository<InvestigatorProfileOrmEntity>,
    @InjectRepository(ProtocolOrmEntity)
    private readonly protocolRepo: Repository<ProtocolOrmEntity>,
  ) {}

  /**
   * Valida si un evaluador tiene conflicto de interés con un protocolo.
   * Lanza una excepción si el conflicto es crítico (equipo de investigación).
   * Retorna un objeto con advertencias para conflictos institucionales.
   */
  async checkConflict(
    protocolId: number,
    evaluatorUserId: number,
    preloadedIpProfile?: InvestigatorProfileOrmEntity,
  ): Promise<{ hasConflict: boolean; reason?: string; critical: boolean }> {
    // 1. Conflicto Crítico: ¿Es parte del equipo de investigación?
    const isTeamMember = await this.investigatorRepo.findOne({
      where: { protocolId, userId: evaluatorUserId },
    });

    if (isTeamMember) {
      return {
        hasConflict: true,
        critical: true,
        reason:
          'El evaluador es parte del equipo de investigación de este protocolo.',
      };
    }

    // 2. Conflicto de Vínculo: ¿Pertenece a la misma Institución/Facultad que el IP?
    let ipProfile: InvestigatorProfileOrmEntity | null | undefined =
      preloadedIpProfile;

    if (!ipProfile) {
      const protocol = await this.protocolRepo.findOne({
        where: { id: protocolId },
        relations: ['principalInvestigator'],
      });

      if (protocol && protocol.principalInvestigatorId) {
        ipProfile = await this.profileRepo.findOne({
          where: { userId: protocol.principalInvestigatorId },
        });
      }
    }
    if (ipProfile) {
      const evaluatorProfile = await this.profileRepo.findOne({
        where: { userId: evaluatorUserId },
      });

      if (
        ipProfile &&
        evaluatorProfile &&
        ipProfile.institution === evaluatorProfile.institution
      ) {
        return {
          hasConflict: true,
          critical: false,
          reason: `Conflicto Institucional: El evaluador pertenece a la misma institución (${evaluatorProfile.institution}) que el Investigador Principal.`,
        };
      }
    }

    return { hasConflict: false, critical: false };
  }

  /**
   * Versión estricta que lanza error si hay cualquier conflicto crítico.
   */
  async validateOrThrow(
    protocolId: number,
    evaluatorUserId: number,
  ): Promise<void> {
    const check = await this.checkConflict(protocolId, evaluatorUserId);
    if (check.hasConflict && check.critical) {
      throw new ConflictException(check.reason);
    }
  }
}
