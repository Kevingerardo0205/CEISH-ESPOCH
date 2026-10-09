import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ConvocatoriaOrmEntity,
  SessionType,
  ConvocatoriaStatus,
} from '../../infrastructure/database/entities/convocatoria.orm-entity';
import { ConvocatoriaProtocoloOrmEntity } from '../../infrastructure/database/entities/convocatoria-protocolo.orm-entity';
import { LugarOrmEntity } from '../../infrastructure/database/entities/lugar.orm-entity';
import { SessionOrmEntity } from '../../infrastructure/database/session.entity.orm';
import { MinutesOrmEntity } from '../../infrastructure/database/minutes.entity.orm';
import { EvaluationAssignmentOrmEntity } from '../../infrastructure/database/evaluation-assignment.entity.orm';
import { ProtocolVersionOrmEntity } from '../../infrastructure/database/protocol-version.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolRequirementOrmEntity } from '../../../protocols/infrastructure/database/protocol-requirement.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { RoleCode } from '../../../auth/domain/enums/role.enum';
import { ProtocolStatus } from '../../../protocols/domain/enums/protocol-status.enum';
import { RequirementStatus } from '../../../protocols/domain/enums/requirement-status.enum';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { PdfGeneratorService } from '../../../../shared/utils/pdf-generator.service';
import { CreateCallDto } from '../dtos/create-call.dto';
import { CreatePlaceDto, UpdatePlaceDto } from '../dtos/create-place.dto';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { ReceptionOrmEntity } from '../../../reception/infrastructure/database/reception.entity.orm';
import { toCalendarDateString } from '../../../../shared/services/deadline-calculator.service';

/**
 * @deprecated CallsService queda deprecado según RF-09 / TSK-009-000.
 * El agendamiento y persistencia canónica de Convocatorias se gestiona mediante
 * CreateMeetingUseCase y MeetingTypeOrmRepository.
 */
@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    @InjectRepository(ConvocatoriaOrmEntity)
    private readonly convocatoriaRepository: Repository<ConvocatoriaOrmEntity>,
    @InjectRepository(ConvocatoriaProtocoloOrmEntity)
    private readonly convocatoriaProtocoloRepository: Repository<ConvocatoriaProtocoloOrmEntity>,
    @InjectRepository(LugarOrmEntity)
    private readonly lugarRepository: Repository<LugarOrmEntity>,
    @InjectRepository(SessionOrmEntity)
    private readonly sessionRepository: Repository<SessionOrmEntity>,
    @InjectRepository(MinutesOrmEntity)
    private readonly minutesRepository: Repository<MinutesOrmEntity>,
    @InjectRepository(EvaluationAssignmentOrmEntity)
    private readonly assignmentRepository: Repository<EvaluationAssignmentOrmEntity>,
    @InjectRepository(ProtocolVersionOrmEntity)
    private readonly versionRepository: Repository<ProtocolVersionOrmEntity>,
    @InjectRepository(ProtocolOrmEntity)
    private readonly protocolRepository: Repository<ProtocolOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    private readonly emailService: IEmailServicePort,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly deadlineService: ProtocolDeadlineService,
    private readonly dataSource: DataSource,
  ) {}

  // ==========================================
  // LUGAR (PLACES) CRUD
  // ==========================================

  async createPlace(dto: CreatePlaceDto): Promise<LugarOrmEntity> {
    const placeName = dto.name || dto.nombre;
    const existing = await this.lugarRepository.findOne({
      where: { nombre: placeName },
    });
    if (existing) {
      throw new ConflictException(
        `Lugar con el nombre '${placeName}' ya existe.`,
      );
    }
    const place = this.lugarRepository.create({
      nombre: placeName,
      direccion: dto.location || dto.direccion,
      activo: dto.isActive ?? dto.activo ?? true,
      esVirtual: dto.esVirtual ?? false,
      enlaceReunion: dto.enlaceReunion,
    });
    return this.lugarRepository.save(place);
  }

  async findAllPlaces(): Promise<LugarOrmEntity[]> {
    return this.lugarRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findPlaceById(id: string): Promise<LugarOrmEntity> {
    const place = await this.lugarRepository.findOne({ where: { id } });
    if (!place) {
      throw new NotFoundException(`Lugar con ID ${id} no encontrado.`);
    }
    return place;
  }

  async updatePlace(id: string, dto: UpdatePlaceDto): Promise<LugarOrmEntity> {
    const place = await this.findPlaceById(id);
    const newName = dto.name || dto.nombre;
    if (newName && newName !== place.nombre) {
      const existing = await this.lugarRepository.findOne({
        where: { nombre: newName },
      });
      if (existing) {
        throw new ConflictException(
          `Lugar con el nombre '${newName}' ya existe.`,
        );
      }
      place.nombre = newName;
    }
    if (dto.location !== undefined || dto.direccion !== undefined) {
      place.direccion = dto.location || dto.direccion;
    }
    if (dto.isActive !== undefined || dto.activo !== undefined) {
      place.activo = dto.isActive ?? dto.activo ?? true;
    }
    if (dto.esVirtual !== undefined) {
      place.esVirtual = dto.esVirtual;
    }
    if (dto.enlaceReunion !== undefined) {
      place.enlaceReunion = dto.enlaceReunion;
    }
    return this.lugarRepository.save(place);
  }

  async deletePlace(id: string): Promise<void> {
    const place = await this.findPlaceById(id);
    place.activo = false;
    await this.lugarRepository.save(place);
  }

  // ==========================================
  // CONVOCATORIAS (CALLS) BUSINESS LOGIC
  // ==========================================

  /**
   * Priorización de Protocolos Pendientes
   * Busca protocolos cuya recepción esté COMPLETA (10) y no estén resueltos (APROBADO/RECHAZADO).
   * Ordena de forma ascendente por el plazo normativo.
   */
  async getPendingProtocolsForCall(): Promise<ProtocolOrmEntity[]> {
    const protocols = await this.protocolRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.activeVersion', 'av')
      .innerJoinAndSelect('av.reception', 'r')
      .leftJoinAndSelect('p.studyType', 'st')
      .leftJoinAndSelect('p.principalInvestigator', 'pi')
      .where('r.statusId = :receptionStatus', { receptionStatus: 10 })
      .andWhere(
        '(p.statusId NOT IN (:...resolvedStatuses) OR p.statusId IS NULL)',
        {
          resolvedStatuses: [ProtocolStatus.APROBADO, ProtocolStatus.RECHAZADO],
        },
      )
      .getMany();

    protocols.sort((a, b) => {
      const deadlineA = a.responseDeadline || a.receptionDate || a.createdAt;
      const deadlineB = b.responseDeadline || b.receptionDate || b.createdAt;
      return new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
    });

    return protocols;
  }

  /**
   * Calcula la fecha límite de entrega de evaluaciones para los pares.
   * Regla general: Si la reunión es el lunes, la fecha límite es el jueves anterior a medianoche.
   */
  private calculateEvaluationDeadline(callDate: Date): Date {
    const deadline = new Date(callDate);
    deadline.setDate(deadline.getDate() - 1);
    while (deadline.getDay() !== 4) {
      deadline.setDate(deadline.getDate() - 1);
    }
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }

  /**
   * Crea una Convocatoria y asocia los protocolos con sus plazos y orden.
   * Envía la notificación en PDF a los miembros activos del comité.
   */
  async createCall(dto: CreateCallDto): Promise<ConvocatoriaOrmEntity> {
    const rawDate = dto.date || dto.meetingDate || new Date().toISOString();
    const callDate = new Date(rawDate);
    const year = isNaN(callDate.getFullYear())
      ? new Date().getFullYear()
      : callDate.getFullYear();
    const callTime = dto.time || '09:00';
    const agendaSummary = dto.agendaSummary || dto.agenda;

    // 1. Cálculo de Código Correlativo Anual
    const count = await this.convocatoriaRepository.count({
      where: { anioLectivo: year },
    });
    const code =
      dto.callNumber || `${String(count + 1).padStart(3, '0')}-${year}`;

    // 2. Resolver lugar
    let placeName = 'Lugar no especificado';
    if (dto.placeId) {
      const place = await this.lugarRepository.findOne({
        where: { id: dto.placeId },
      });
      if (place) {
        placeName = place.direccion
          ? `${place.nombre} (${place.direccion})`
          : place.nombre;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const evaluationDeadline = this.calculateEvaluationDeadline(callDate);

      // 3. Crear y guardar la convocatoria oficial
      const convocatoria = queryRunner.manager.create(ConvocatoriaOrmEntity, {
        numeroConvocatoria: code,
        anioLectivo: year,
        tipoSession: (dto.sessionType as SessionType) || SessionType.ORDINARIA,
        fechaReunion: callDate,
        fechaEntregaEvaluacion: evaluationDeadline,
        lugarId: dto.placeId,
        estado: ConvocatoriaStatus.PROGRAMADA,
      });

      const savedConvocatoria = await queryRunner.manager.save(
        ConvocatoriaOrmEntity,
        convocatoria,
      );

      const protocolDataForPdf: Array<{
        ceishCode: string;
        title: string;
        investigatorName: string;
      }> = [];

      // 4. Calcular plazo y asociar protocolos
      const protocolIds = dto.protocolIds || [];
      if (protocolIds.length > 0) {
        for (let i = 0; i < protocolIds.length; i++) {
          const protocolId = protocolIds[i];
          const protocol = await queryRunner.manager.findOne(
            ProtocolOrmEntity,
            {
              where: { id: protocolId },
              relations: ['activeVersion', 'principalInvestigator'],
            },
          );

          if (!protocol) {
            throw new NotFoundException(
              `Protocolo con ID ${protocolId} no encontrado.`,
            );
          }

          const version = protocol.activeVersion;
          if (!version) {
            throw new BadRequestException(
              `El protocolo ${protocol.ceishCode || protocol.id} no cuenta con una versión activa.`,
            );
          }

          // Crear relación en convocatoria_protocolos
          const cp = queryRunner.manager.create(
            ConvocatoriaProtocoloOrmEntity,
            {
              convocatoriaId: savedConvocatoria.id,
              protocoloId: protocol.id,
              versionId: version.id,
              orden: i + 1,
              fechaPlazoNormativo:
                protocol.responseDeadline ||
                protocol.receptionDate ||
                new Date(),
            },
          );
          await queryRunner.manager.save(ConvocatoriaProtocoloOrmEntity, cp);

          // Actualizar plazos en las asignaciones de evaluación de esa versión
          const assignments = await queryRunner.manager.find(
            EvaluationAssignmentOrmEntity,
            {
              where: { versionId: version.id },
            },
          );

          for (const assignment of assignments) {
            assignment.deadline = toCalendarDateString(evaluationDeadline);
            await queryRunner.manager.save(
              EvaluationAssignmentOrmEntity,
              assignment,
            );
          }

          protocolDataForPdf.push({
            ceishCode: protocol.ceishCode || 'S/C',
            title: protocol.title || 'Sin Título',
            investigatorName:
              protocol.principalInvestigator?.fullName || 'No asignado',
          });
        }
      }

      await queryRunner.commitTransaction();

      // 5. Generar PDF de la convocatoria
      const pdfBuffer = await this.pdfGeneratorService
        .generateCallPdf({
          code: savedConvocatoria.numeroConvocatoria,
          date: savedConvocatoria.fechaReunion,
          time: callTime,
          placeName,
          sessionType: savedConvocatoria.tipoSession,
          agendaSummary,
          protocols: protocolDataForPdf,
        })
        .catch((e) => {
          this.logger.error('Error generando PDF de convocatoria', e);
          return null;
        });

      // 6. Notificación automática por correo a los miembros activos del comité
      if (pdfBuffer) {
        const activeMembers = await this.userRepository
          .createQueryBuilder('u')
          .innerJoin('u.roles', 'r')
          .where('r.codigo IN (:...roleCodes)', {
            roleCodes: [RoleCode.EVALUADOR, RoleCode.PRESIDENTE],
          })
          .andWhere('u.isActive = :isActive', { isActive: true })
          .getMany();

        const emailPromises = activeMembers.map((member) =>
          this.emailService
            .sendCallNotification(
              member.institutionalEmail,
              member.fullName,
              savedConvocatoria.numeroConvocatoria,
              savedConvocatoria.fechaReunion,
              callTime,
              placeName,
              pdfBuffer,
            )
            .catch((e) =>
              this.logger.error(
                `Error enviando correo de convocatoria a ${member.institutionalEmail}`,
                e,
              ),
            ),
        );
        void Promise.allSettled(emailPromises).then(() => {
          this.logger.log(
            'Envío masivo de notificaciones de convocatoria finalizado.',
          );
        });
      }

      return savedConvocatoria;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllCalls(): Promise<ConvocatoriaOrmEntity[]> {
    return this.convocatoriaRepository.find({
      relations: ['lugar'],
      order: { fechaReunion: 'DESC' },
    });
  }

  async findCallById(id: string): Promise<ConvocatoriaOrmEntity> {
    const call = await this.convocatoriaRepository.findOne({
      where: { id },
      relations: ['lugar'],
    });
    if (!call) {
      throw new NotFoundException(`Convocatoria con ID ${id} no encontrada.`);
    }
    return call;
  }

  /**
   * Obtiene los protocolos agendados en una convocatoria.
   */
  async findProtocolsByCallId(
    convocatoriaId: string,
  ): Promise<ConvocatoriaProtocoloOrmEntity[]> {
    return this.convocatoriaProtocoloRepository.find({
      where: { convocatoriaId },
      relations: ['version', 'protocolo', 'protocolo.principalInvestigator'],
      order: { orden: 'ASC' },
    });
  }

  // ==========================================
  // FINALIZACIÓN Y FIRMA DE ACTA (MINUTES)
  // ==========================================

  /**
   * Registra y firma el acta de la sesión.
   * Al completarse la firma de Presidente y Secretario, recorre los protocolos.
   * Si el resultado consolidado es APROBADO_CON_CONDICION, inicia automáticamente la carga de V2.0+
   */
  async signMinutes(
    minutesId: number,
    userId: number,
    role: RoleCode,
  ): Promise<MinutesOrmEntity> {
    const minutes = await this.minutesRepository.findOne({
      where: { id: minutesId },
      relations: ['session', 'session.convocatoria'],
    });
    if (!minutes) {
      throw new NotFoundException(`Acta con ID ${minutesId} no encontrada.`);
    }

    if (role === RoleCode.PRESIDENTE) {
      minutes.signedByPresident = true;
    } else if (role === RoleCode.SECRETARIA) {
      minutes.signedBySecretary = true;
    } else {
      throw new BadRequestException(
        'Solo Presidente o Secretaría pueden firmar actas.',
      );
    }

    const savedMinutes = await this.minutesRepository.save(minutes);

    if (savedMinutes.signedByPresident && savedMinutes.signedBySecretary) {
      await this.finalizeSessionAndProtocols(savedMinutes.sessionId, userId);
    }

    return savedMinutes;
  }

  private async finalizeSessionAndProtocols(
    sessionId: number,
    userId: number,
  ): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) return;

    session.statusId = 24; // FINALIZADA
    await this.sessionRepository.save(session);

    if (!session.convocatoriaId) return;

    await this.convocatoriaRepository.update(session.convocatoriaId, {
      estado: ConvocatoriaStatus.CONCLUIDA,
    });

    const callProtocols = await this.convocatoriaProtocoloRepository.find({
      where: { convocatoriaId: session.convocatoriaId },
      relations: ['version', 'protocolo'],
    });

    for (const cp of callProtocols) {
      if (
        cp.protocoloId &&
        (cp.dictamenResultado === 'APROBADO_CON_CONDICIONES' ||
          cp.dictamenResultado === '25')
      ) {
        await this.triggerCorrectionFlow(cp.protocoloId, userId);
      }
    }
  }

  /**
   * Activa automáticamente la carga de una nueva versión del protocolo (V2.0+)
   */
  private async triggerCorrectionFlow(
    protocolId: number,
    userId: number,
  ): Promise<void> {
    const protocol = await this.protocolRepository.findOne({
      where: { id: protocolId },
      relations: ['activeVersion'],
    });
    if (!protocol || !protocol.activeVersion) return;

    const currentVersion = protocol.activeVersion;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        ProtocolVersionOrmEntity,
        currentVersion.id,
        {
          statusId: ProtocolStatus.REQUIERE_SUBSANACION_VERSION,
          resolutionDate: new Date(),
        },
      );

      const nextVersionNumber = (currentVersion.versionNumber || 1) + 1;
      const deadlineDate = this.deadlineService.calculateSubsanacionDeadline(
        new Date(),
      );

      const newVersion = queryRunner.manager.create(ProtocolVersionOrmEntity, {
        protocolId,
        versionNumber: nextVersionNumber,
        submissionDate: new Date(),
        statusId: ProtocolStatus.EN_CONTROL_DOCUMENTAL,
        correctionDeadlineDays: 30,
        correctionDeadlineDate: deadlineDate,
      });
      const savedVersion = await queryRunner.manager.save(
        ProtocolVersionOrmEntity,
        newVersion,
      );

      await queryRunner.manager.update(ProtocolOrmEntity, protocolId, {
        versionActualId: savedVersion.id,
        statusId: ProtocolStatus.EN_CONTROL_DOCUMENTAL,
      });

      const newReception = queryRunner.manager.create(ReceptionOrmEntity, {
        versionId: savedVersion.id,
        statusId: ProtocolStatus.INICIADO,
        createdByUserId: userId,
        hasMissingItems: false,
      });
      await queryRunner.manager.save(ReceptionOrmEntity, newReception);

      const checklistItems = await queryRunner.manager.find(
        ProtocolRequirementOrmEntity,
        {
          where: { protocolId },
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

      await queryRunner.commitTransaction();
      this.logger.log(
        `Flujo de subsanación iniciado exitosamente para protocolo ID ${protocolId}. Creada versión ${nextVersionNumber}.0`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error al iniciar flujo de subsanación para protocolo ID ${protocolId}`,
        error,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
