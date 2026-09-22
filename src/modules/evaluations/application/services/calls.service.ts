import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, In, Not } from 'typeorm';
import { CallOrmEntity } from '../../infrastructure/database/call.entity.orm';
import { CallProtocolOrmEntity } from '../../infrastructure/database/call-protocol.entity.orm';
import { PlaceOrmEntity } from '../../infrastructure/database/place.entity.orm';
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
import { AddProtocolToCallDto } from '../dtos/add-protocol-to-call.dto';
import { CreatePlaceDto, UpdatePlaceDto } from '../dtos/create-place.dto';
import { ProtocolDeadlineService } from '../../../protocols/application/services/protocol-deadline.service';
import { ReceptionOrmEntity } from '../../../reception/infrastructure/database/reception.entity.orm';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    @InjectRepository(CallOrmEntity)
    private readonly callRepository: Repository<CallOrmEntity>,
    @InjectRepository(CallProtocolOrmEntity)
    private readonly callProtocolRepository: Repository<CallProtocolOrmEntity>,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
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

  async createPlace(dto: CreatePlaceDto): Promise<PlaceOrmEntity> {
    const existing = await this.placeRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Lugar con el nombre '${dto.name}' ya existe.`,
      );
    }
    const place = this.placeRepository.create({
      name: dto.name,
      location: dto.location,
      isActive: dto.isActive ?? true,
    });
    return this.placeRepository.save(place);
  }

  async findAllPlaces(): Promise<PlaceOrmEntity[]> {
    return this.placeRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findPlaceById(id: number): Promise<PlaceOrmEntity> {
    const place = await this.placeRepository.findOne({ where: { id } });
    if (!place) {
      throw new NotFoundException(`Lugar con ID ${id} no encontrado.`);
    }
    return place;
  }

  async updatePlace(id: number, dto: UpdatePlaceDto): Promise<PlaceOrmEntity> {
    const place = await this.findPlaceById(id);
    if (dto.name && dto.name !== place.name) {
      const existing = await this.placeRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Lugar con el nombre '${dto.name}' ya existe.`,
        );
      }
    }
    Object.assign(place, dto);
    return this.placeRepository.save(place);
  }

  async deletePlace(id: number): Promise<void> {
    const place = await this.findPlaceById(id);
    // Realizamos Soft Delete desactivando el lugar
    place.isActive = false;
    await this.placeRepository.save(place);
  }

  // ==========================================
  // CONVOCATORIAS (CALLS) BUSINESS LOGIC
  // ==========================================

  /**
   * Priorización de Protocolos Pendientes
   * Busca protocolos cuya recepción esté COMPLETA (10) y no estén resueltos (APROBADO/RECHAZADO).
   * Ordena de forma ascendente por el plazo normativo (los plazos más cercanos al vencimiento aparecen primero).
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

    // Ordenar en memoria por plazo normativo (responseDeadline) de forma ascendente
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
    // Restamos al menos un día para asegurar que no cae en la misma fecha de la reunión
    deadline.setDate(deadline.getDate() - 1);
    // Retrocedemos hasta encontrar el día Jueves (4 en JS: 0=Domingo, 1=Lunes, ..., 4=Jueves)
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
  async createCall(dto: CreateCallDto, userId: number): Promise<CallOrmEntity> {
    const rawDate = dto.date || dto.meetingDate || new Date().toISOString();
    const callDate = new Date(rawDate);
    const year = isNaN(callDate.getFullYear())
      ? new Date().getFullYear()
      : callDate.getFullYear();
    const callTime = dto.time || '09:00';
    const agendaSummary = dto.agendaSummary || dto.agenda;

    // 1. Cálculo de Código Correlativo Anual:
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    const count = await this.callRepository.count({
      where: {
        date: Between(startOfYear, endOfYear),
      },
    });
    const code = dto.callNumber || `${count + 1}-${year}`;

    // 2. Resolver lugar
    let placeName = 'Lugar no especificado';
    if (dto.placeId) {
      const place = await this.placeRepository.findOne({
        where: { id: dto.placeId },
      });
      if (place) {
        placeName = place.location
          ? `${place.name} (${place.location})`
          : place.name;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Crear y guardar la convocatoria
      const call = queryRunner.manager.create(CallOrmEntity, {
        code,
        date: callDate,
        time: callTime,
        placeId: dto.placeId,
        sessionType: dto.sessionType,
        statusId: 22, // 22 = CREADA (Estado inicial de Convocatoria)
        agendaSummary: agendaSummary,
        createdByUserId: userId,
      });

      const savedCall = await queryRunner.manager.save(CallOrmEntity, call);

      const protocolDataForPdf: Array<{
        ceishCode: string;
        title: string;
        investigatorName: string;
      }> = [];

      // 4. Calcular plazo y asociar protocolos
      if (dto.protocolIds && dto.protocolIds.length > 0) {
        const evaluationDeadline = this.calculateEvaluationDeadline(callDate);

        for (let i = 0; i < dto.protocolIds.length; i++) {
          const protocolId = dto.protocolIds[i];
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
          const callProtocol = queryRunner.manager.create(
            CallProtocolOrmEntity,
            {
              callId: savedCall.id,
              protocolVersionId: version.id,
              order: i + 1,
              meetingDate: callDate,
              evaluationDeadline,
            },
          );
          await queryRunner.manager.save(CallProtocolOrmEntity, callProtocol);

          // Actualizar plazos en las asignaciones de evaluación de esa versión
          const assignments = await queryRunner.manager.find(
            EvaluationAssignmentOrmEntity,
            {
              where: { versionId: version.id },
            },
          );

          for (const assignment of assignments) {
            assignment.deadline = evaluationDeadline;
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
          code: savedCall.code,
          date: savedCall.date,
          time: savedCall.time,
          placeName,
          sessionType: savedCall.sessionType,
          agendaSummary: savedCall.agendaSummary,
          protocols: protocolDataForPdf,
        })
        .catch((e) => {
          this.logger.error('Error generando PDF de convocatoria', e);
          return null;
        });

      // 6. Notificación automática por correo a los miembros activos del comité
      if (pdfBuffer) {
        // Consultar evaluadores y presidentes activos
        const activeMembers = await this.userRepository
          .createQueryBuilder('u')
          .innerJoin('u.roles', 'r')
          .where('r.codigo IN (:...roleCodes)', {
            roleCodes: [RoleCode.EVALUADOR, RoleCode.PRESIDENTE],
          })
          .andWhere('u.isActive = :isActive', { isActive: true })
          .getMany();

        // Enviar correos de forma asíncrona pero resiliente (allSettled)
        const emailPromises = activeMembers.map((member) =>
          this.emailService
            .sendCallNotification(
              member.institutionalEmail,
              member.fullName,
              savedCall.code,
              savedCall.date,
              savedCall.time,
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
        Promise.allSettled(emailPromises).then(() => {
          this.logger.log(
            'Envío masivo de notificaciones de convocatoria finalizado.',
          );
        });
      }

      // Actualizar estado de convocatoria a ENVIADA (23) una vez notificada
      savedCall.statusId = 23; // ENVIADA
      await this.callRepository.save(savedCall);

      return savedCall;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllCalls(): Promise<CallOrmEntity[]> {
    return this.callRepository.find({
      relations: ['place'],
      order: { date: 'DESC', time: 'DESC' },
    });
  }

  async findCallById(id: number): Promise<CallOrmEntity> {
    const call = await this.callRepository.findOne({
      where: { id },
      relations: ['place'],
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
    callId: number,
  ): Promise<CallProtocolOrmEntity[]> {
    return this.callProtocolRepository.find({
      where: { callId },
      relations: [
        'protocolVersion',
        'protocolVersion.protocol',
        'protocolVersion.protocol.principalInvestigator',
      ],
      order: { order: 'ASC' },
    });
  }

  // ==========================================
  // FINALIZACIÓN Y FIRMA DE ACTA (MINUTES)
  // ==========================================

  /**
   * Registra y firma el acta de la sesión.
   * Al completarse la firma de Presidente y Secretario, recorre los protocolos.
   * Si el resultado consolidado es APROBADO_CON_CONDICION (25), inicia automáticamente la carga de V2.0+
   */
  async signMinutes(
    minutesId: number,
    userId: number,
    role: RoleCode,
  ): Promise<MinutesOrmEntity> {
    const minutes = await this.minutesRepository.findOne({
      where: { id: minutesId },
      relations: ['session', 'session.call'],
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

    // Si ambas firmas están completas, procedemos a finalizar la sesión y disparar flujos de versión
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

    // Finalizar sesión en la DB
    session.statusId = 24; // FINALIZADA
    await this.sessionRepository.save(session);

    if (!session.callId) return;

    // Cambiar estado de la convocatoria a FINALIZADA (24)
    await this.callRepository.update(session.callId, { statusId: 24 });

    // Obtener los protocolos agendados
    const callProtocols = await this.callProtocolRepository.find({
      where: { callId: session.callId },
      relations: ['protocolVersion', 'protocolVersion.protocol'],
    });

    for (const cp of callProtocols) {
      // Si el resultado consolidado en la sesión es APROBADO_CON_CONDICION (ID 25)
      if (cp.resultId === 25) {
        await this.triggerCorrectionFlow(cp.protocolVersion.protocolId, userId);
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
      // 1. Modificar estado de la versión actual a REQUIERE_SUBSANACION_VERSION (19)
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

      // 2. Crear nueva versión (V + 1)
      const newVersion = queryRunner.manager.create(ProtocolVersionOrmEntity, {
        protocolId,
        versionNumber: nextVersionNumber,
        submissionDate: new Date(),
        statusId: ProtocolStatus.EN_CONTROL_DOCUMENTAL, // Inicia en EN_CONTROL_DOCUMENTAL (21)
        correctionDeadlineDays: 30,
        correctionDeadlineDate: deadlineDate,
      } as any);
      const savedVersion = await queryRunner.manager.save(
        ProtocolVersionOrmEntity,
        newVersion,
      );

      // 3. Actualizar expediente principal a EN_CONTROL_DOCUMENTAL (21) y apuntar a la nueva versión
      await queryRunner.manager.update(ProtocolOrmEntity, protocolId, {
        versionActualId: savedVersion.id,
        statusId: ProtocolStatus.EN_CONTROL_DOCUMENTAL,
      });

      // 4. Crear una nueva recepción para esta versión (inicia en INICIADO 9)
      const newReception = queryRunner.manager.create(ReceptionOrmEntity, {
        protocolId,
        versionId: savedVersion.id,
        statusId: ProtocolStatus.INICIADO,
        createdByUserId: userId,
        hasMissingItems: false,
      } as any);
      await queryRunner.manager.save(ReceptionOrmEntity, newReception);

      // 5. Inmutabilidad y Habilitación de requisitos en el checklist
      const checklistItems = await queryRunner.manager.find(
        ProtocolRequirementOrmEntity,
        {
          where: { protocolId },
        },
      );

      for (const item of checklistItems) {
        // APROBADO y NO_APLICA quedan bloqueados e inmutables (se conservan como están)
        // El resto (RECHAZADO, PRESENTADO, NO_PRESENTADO, PENDIENTE) se resetea a NO_PRESENTADO
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
