/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { ProtocolStatus } from '../../../protocols/domain/enums/protocol-status.enum';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';

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
    private readonly dataSource: DataSource,
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let saved: any;

    try {
      const resolution = queryRunner.manager.create(ResolutionOrmEntity, {
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

      saved = await queryRunner.manager.save(ResolutionOrmEntity, resolution);

      // Actualizar estado del protocolo y versión
      if (dto.resolutionTypeId === 1) {
        // APROBADO:
        // - Versión actual -> 17 (ProtocolStatus.APROBADO)
        await queryRunner.manager.update(ProtocolVersionOrmEntity, version.id, {
          statusId: ProtocolStatus.APROBADO,
          resolutionDate: new Date(),
          resolutionTypeId: dto.resolutionTypeId,
        });

        // - Protocolo -> 17 (ProtocolStatus.APROBADO)
        await queryRunner.manager.update(ProtocolOrmEntity, dto.protocolId, {
          statusId: ProtocolStatus.APROBADO,
          approvalDate: new Date(),
        });
      } else if (dto.resolutionTypeId === 3) {
        // RECHAZADO:
        // - Versión actual -> 18 (ProtocolStatus.RECHAZADO)
        await queryRunner.manager.update(ProtocolVersionOrmEntity, version.id, {
          statusId: ProtocolStatus.RECHAZADO,
          resolutionDate: new Date(),
          resolutionTypeId: dto.resolutionTypeId,
        });

        // - Protocolo -> 18 (ProtocolStatus.RECHAZADO)
        await queryRunner.manager.update(ProtocolOrmEntity, dto.protocolId, {
          statusId: ProtocolStatus.RECHAZADO,
        });
      } else if (dto.resolutionTypeId === 2 || dto.resolutionTypeId === 4) {
        // APROBADO CON OBSERVACIONES:
        // - Versión actual (V1) -> 19 (ProtocolStatus.REQUIERE_SUBSANACION_VERSION)
        await queryRunner.manager.update(ProtocolVersionOrmEntity, version.id, {
          statusId: ProtocolStatus.REQUIERE_SUBSANACION_VERSION,
          resolutionDate: new Date(),
          resolutionTypeId: 2, // Map to 2
        });

        const nextVersionNumber = version.versionNumber + 1;
        const deadlineDate = this.deadlineService.calculateSubsanacionDeadline(
          new Date(),
        );

        // 1. Crear nueva versión V2
        const newVersion = queryRunner.manager.create(
          ProtocolVersionOrmEntity,
          {
            protocolId: dto.protocolId,
            versionNumber: nextVersionNumber,
            submissionDate: new Date(),
            statusId: ProtocolStatus.EN_CONTROL_DOCUMENTAL, // Nueva versión inicia en 21 (EN_CONTROL_DOCUMENTAL)
            correctionDeadlineDays: 30,
            correctionDeadlineDate: deadlineDate,
          } as any,
        );

        const savedVersion = await queryRunner.manager.save(
          ProtocolVersionOrmEntity,
          newVersion,
        );

        // 2. Asociar el protocolo a la nueva versión y sincronizar su estado a 21 (EN_CONTROL_DOCUMENTAL)
        await queryRunner.manager.update(ProtocolOrmEntity, dto.protocolId, {
          versionActualId: savedVersion.id,
          statusId: ProtocolStatus.EN_CONTROL_DOCUMENTAL,
        });

        // 3. Crear una nueva recepción para esta versión para recibir los archivos corregidos (inicia en INICIADO 9)
        const newReception = queryRunner.manager.create(ReceptionOrmEntity, {
          protocolId: dto.protocolId,
          versionId: savedVersion.id,
          statusId: ProtocolStatus.INICIADO,
          createdByUserId: userId,
          hasMissingItems: false,
        } as any);
        await queryRunner.manager.save(ReceptionOrmEntity, newReception);

        // 4. Resetear los checklist items del protocolo que no estén aprobados
        const checklistItems = await queryRunner.manager.find(
          ProtocolRequirementOrmEntity,
          {
            where: { protocolId: dto.protocolId },
          },
        );
        for (const item of checklistItems) {
          if (
            item.status !== RequirementStatus.APROBADO &&
            item.status !== RequirementStatus.NO_APLICA
          ) {
            await queryRunner.manager.update(
              ProtocolRequirementOrmEntity,
              item.id,
              {
                status: RequirementStatus.NO_PRESENTADO,
              },
            );
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      if (err.code === '23505') {
        throw new ConflictException(
          'La versión de este protocolo ya ha sido creada o modificada por otra transacción concurrente.',
        );
      }
      throw err;
    } finally {
      await queryRunner.release();
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
