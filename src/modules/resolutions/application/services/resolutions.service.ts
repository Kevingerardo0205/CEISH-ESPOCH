import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResolutionOrmEntity } from '../../infrastructure/database/resolution.entity.orm';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { IEvaluationRepository } from '../../../evaluations/domain/ports/evaluation.repository.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { AssignmentStatus } from '../../../evaluations/domain/enums/assignment-status.enum';
import { ReceptionOrmEntity } from '../../../reception/infrastructure/database/reception.entity.orm';
import { ProtocolRequirementOrmEntity } from '../../../protocols/infrastructure/database/protocol-requirement.entity.orm';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { RequirementStatus } from '../../../protocols/domain/enums/requirement-status.enum';

@Injectable()
export class ResolutionsService {
  constructor(
    @InjectRepository(ResolutionOrmEntity)
    private readonly resolutionRepo: Repository<ResolutionOrmEntity>,
    private readonly protocolRepository: IProtocolRepository,
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly emailService: IEmailServicePort,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    @InjectRepository(ReceptionOrmEntity)
    private readonly receptionRepo: Repository<ReceptionOrmEntity>,
    @InjectRepository(ProtocolRequirementOrmEntity)
    private readonly requirementRepo: Repository<ProtocolRequirementOrmEntity>,
    private readonly deadlineService: ProtocolDeadlineService,
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
      letterFilePath:
        dto.pdfLetterPath || dto.letterFilePath || dto.archivoCartaPdf,
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

    // Si requiere subsanación (correcciones: tipo 2 o 4), creamos la siguiente versión y reiniciamos recepción
    if (dto.resolutionTypeId === 2 || dto.resolutionTypeId === 4) {
      const nextVersionNumber = version.versionNumber + 1;
      const deadlineDate = this.deadlineService.calculateSubsanacionDeadline(
        new Date(),
      );

      // 1. Crear nueva versión
      const newVersion = await this.evaluationRepository.saveVersion({
        protocolId: dto.protocolId,
        versionNumber: nextVersionNumber,
        submissionDate: new Date(),
        statusId: 1, // Inicial
        correctionDeadlineDays: 30,
        correctionDeadlineDate: deadlineDate,
      });

      // 2. Asociar el protocolo a la nueva versión
      await this.protocolRepository.update(dto.protocolId, {
        versionActualId: newVersion.id,
      });

      // 3. Crear una nueva recepción para esta versión para recibir los archivos corregidos
      const newReception = this.receptionRepo.create({
        protocolId: dto.protocolId,
        versionId: newVersion.id,
        statusId: 9, // INICIADO
        createdByUserId: userId,
        hasMissingItems: false,
      } as any);
      await this.receptionRepo.save(newReception);

      // 4. Resetear los checklist items del protocolo que no estén aprobados
      const checklistItems = await this.requirementRepo.find({
        where: { protocolId: dto.protocolId },
      });
      for (const item of checklistItems) {
        if (
          item.status !== RequirementStatus.APROBADO &&
          item.status !== RequirementStatus.NO_APLICA
        ) {
          await this.requirementRepo.update(item.id, {
            status: RequirementStatus.NO_PRESENTADO,
          });
        }
      }
    }

    // Descargar informes de los evaluadores para adjuntarlos
    const assignments =
      await this.evaluationRepository.findAssignmentsByVersionId(version.id);
    const completedAssignments = assignments.filter(
      (a) => a.statusId === +AssignmentStatus.COMPLETED,
    );

    const additionalAttachments: Array<{ filename: string; content: Buffer }> =
      [];
    for (const assignment of completedAssignments) {
      const evaluation =
        await this.evaluationRepository.findEvaluationByAssignmentId(
          assignment.id,
        );
      if (evaluation) {
        const fileKey = evaluation.reportPath || evaluation.rutaPdf;
        if (fileKey) {
          try {
            const url = await this.storageService.getDownloadUrl(fileKey);
            const response = await fetch(url);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              const profileName = assignment.profile?.name || 'Evaluador';
              const extension = fileKey.endsWith('.docx') ? 'docx' : 'pdf';
              const filename =
                `Informe_${profileName}_Evaluador.${extension}`.replace(
                  /\s+/g,
                  '_',
                );

              additionalAttachments.push({
                filename,
                content: buffer,
              });
            }
          } catch (e) {
            console.error(`Error downloading evaluator file ${fileKey}:`, e);
          }
        }
      }
    }

    // Resolver el pdfBuffer si se subió a través del path de almacenamiento
    let resolutionPdfBuffer = pdfBuffer;
    const consolidatedPath =
      dto.pdfLetterPath || dto.letterFilePath || dto.archivoCartaPdf;
    if (!resolutionPdfBuffer && consolidatedPath) {
      try {
        const url = await this.storageService.getDownloadUrl(consolidatedPath);
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          resolutionPdfBuffer = Buffer.from(arrayBuffer);
        }
      } catch (e) {
        console.error(`Error downloading consolidated resolution file:`, e);
      }
    }

    // Notificar Automáticamente (Sprint 5)
    if (resolutionPdfBuffer && protocol.principalInvestigator) {
      await this.emailService
        .sendResolutionEmail(
          protocol.principalInvestigator.institutionalEmail,
          protocol.principalInvestigator.fullName,
          protocol.title || 'Sin Título',
          protocol.ceishCode || 'S/C',
          dto.resolutionLabel || 'Dictamen Emitido',
          resolutionPdfBuffer,
          additionalAttachments,
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
