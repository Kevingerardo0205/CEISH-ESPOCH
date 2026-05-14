import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResolutionOrmEntity } from '../../infrastructure/database/resolution.entity.orm';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { IEvaluationRepository } from '../../../evaluations/domain/ports/evaluation.repository.port';

import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';

@Injectable()
export class ResolutionsService {
  constructor(
    @InjectRepository(ResolutionOrmEntity)
    private readonly resolutionRepo: Repository<ResolutionOrmEntity>,
    private readonly protocolRepository: IProtocolRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly emailService: IEmailServicePort,
  ) {}

  async createResolution(dto: any, userId: number, pdfBuffer?: Buffer) {
    const protocol = await this.protocolRepository.findById(dto.protocolId, {
      relations: ['principalInvestigator', 'studyType'],
    } as any);
    if (!protocol)
      throw new NotFoundException(`Protocol ${dto.protocolId} not found`);

    const version = await this.evaluationRepository.findVersionByProtocolId(
      dto.protocolId,
      protocol.currentVersion,
    );
    if (!version)
      throw new BadRequestException(
        'El protocolo no tiene una versión activa para resolución.',
      );

    const resolution = this.resolutionRepo.create({
      protocolId: dto.protocolId,
      versionId: version.id,
      resolutionTypeId: dto.resolutionTypeId,
      validityYears: dto.validityYears || 1,
      followUpPeriodDays: dto.followUpPeriodDays,
      majorObservations: dto.majorObservations,
      minorObservations: dto.minorObservations,
      correctionProcedure: dto.correctionProcedure,
      pdfLetterPath: dto.pdfLetterPath,
      signedByPresident: true,
      signedBySecretary: true,
      createdByUserId: userId,
    } as any);

    const saved = await this.resolutionRepo.save(resolution);

    // Actualizar estado del protocolo y versión
    await this.protocolRepository.update(dto.protocolId, {
      statusId: 4, // FINALIZADO/EVALUADO
      approvalDate: dto.resolutionTypeId === 1 ? new Date() : undefined,
    });

    // Notificar Automáticamente (Sprint 5)
    if (pdfBuffer && protocol.principalInvestigator) {
      await this.emailService
        .sendResolutionEmail(
          protocol.principalInvestigator.institutionalEmail,
          protocol.principalInvestigator.fullName,
          protocol.title || 'Sin Título',
          protocol.ceishCode || 'S/C',
          dto.resolutionLabel || 'Dictamen Emitido',
          pdfBuffer,
        )
        .catch((e) => console.error('Error enviando email de resolución:', e));
    }

    return saved;
  }

  async findByProtocolId(protocolId: number) {
    return this.resolutionRepo.find({
      where: { protocolId },
      relations: ['protocol', 'version'],
    });
  }
}
