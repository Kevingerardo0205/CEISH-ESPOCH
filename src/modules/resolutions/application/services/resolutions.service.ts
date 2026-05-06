import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResolutionOrmEntity } from '../../infrastructure/database/resolution.entity.orm';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { IEvaluationRepository } from '../../../evaluations/domain/ports/evaluation.repository.port';

@Injectable()
export class ResolutionsService {
  constructor(
    @InjectRepository(ResolutionOrmEntity)
    private readonly resolutionRepo: Repository<ResolutionOrmEntity>,
    private readonly protocolRepository: IProtocolRepository,
    private readonly evaluationRepository: IEvaluationRepository,
  ) {}

  async createResolution(dto: any, userId: number) {
    const protocol = await this.protocolRepository.findById(dto.protocolId);
    if (!protocol) throw new NotFoundException(`Protocol ${dto.protocolId} not found`);

    const version = await this.evaluationRepository.findVersionByProtocolId(dto.protocolId, 1);
    if (!version) throw new BadRequestException('El protocolo no tiene una versión activa para resolución.');

    // Consolidar evaluaciones
    const assignments = await this.evaluationRepository.findAssignmentsByVersionId(version.id);
    const completedEvaluations = assignments.filter(a => a.statusId === 2); // EVALUADO

    if (completedEvaluations.length === 0) {
      throw new BadRequestException('No existen evaluaciones completadas para este protocolo.');
    }

    const resolution = this.resolutionRepo.create({
      protocolId: dto.protocolId,
      versionId: version.id,
      resolutionTypeId: dto.resolutionTypeId,
      validityYears: dto.validityYears || 1,
      followUpPeriodDays: dto.followUpPeriodDays,
      majorObservations: dto.majorObservations,
      minorObservations: dto.minorObservations,
      correctionProcedure: dto.correctionProcedure,
      createdByUserId: userId,
    });

    const saved = await this.resolutionRepo.save(resolution);

    // Actualizar estado del protocolo y versión
    await this.protocolRepository.update(dto.protocolId, {
      statusId: 3, // RESOLUCION_EMITIDA
      approvalDate: dto.resolutionTypeId === 1 ? new Date() : undefined, // Ejemplo: 1 = APROBADO
    });

    await this.evaluationRepository.saveVersion({
      ...version,
      statusId: 3, // FINALIZADO
      resolutionDate: new Date(),
      resolutionType: dto.resolutionType,
    });

    return saved;
  }

  async findByProtocolId(protocolId: number) {
    return this.resolutionRepo.find({
      where: { protocolId },
      relations: ['protocol', 'version'],
    });
  }
}
