import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  IMeetingRepositoryPort,
  CreateMeetingParams,
  FindMeetingsOptions,
  AssignmentDeadlineSnapshot,
  NormativeDeadlineInput,
  UnscheduledVersionInfo,
} from '../../domain/ports/meeting-repository.port';
import {
  MeetingEntity,
  MeetingDetailEntity,
  MeetingSummaryEntity,
  PendingProtocolEntity,
  MeetingPlaceModel,
  AgendaProtocolModel,
} from '../../domain/entities/meeting.entity';
import {
  ConvocatoriaOrmEntity,
  SessionType,
  ConvocatoriaStatus,
} from '../database/entities/convocatoria.orm-entity';
import { ConvocatoriaProtocoloOrmEntity } from '../database/entities/convocatoria-protocolo.orm-entity';
import { LugarOrmEntity } from '../database/entities/lugar.orm-entity';
import { ProtocolVersionOrmEntity } from '../database/protocol-version.entity.orm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolStatus } from '../../../protocols/domain/enums/protocol-status.enum';
import { MeetingNumberValueObject } from '../../domain/value-objects/meeting-number.vo';
import { AgendaItemType } from '../../../../shared/enums/agenda-section.enum';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { toCalendarDateString } from '../../../../shared/services/deadline-calculator.service';
import {
  ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION,
  ENTREGA_EVALUACION_HORA_CORTE,
} from '../../../../shared/deadlines/deadline-rules';
import { toSafeDate } from '../../../../shared/utils/to-safe-date.util';

@Injectable()
export class MeetingTypeOrmRepository implements IMeetingRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

  /** Fuente única para mapear LugarOrmEntity→MeetingPlaceModel. */
  private mapPlace(lugar: LugarOrmEntity): MeetingPlaceModel {
    return {
      id: lugar.id,
      name: lugar.nombre,
      address: lugar.direccion ?? null,
      isVirtual: lugar.esVirtual,
      meetingLink: lugar.enlaceReunion ?? null,
    };
  }

  /** Fuente única para mapear ConvocatoriaProtocoloOrmEntity→AgendaProtocolModel. */
  private mapAgendaItem(
    cp: ConvocatoriaProtocoloOrmEntity,
  ): AgendaProtocolModel {
    return {
      order: cp.orden,
      protocolId: cp.protocoloId ?? null,
      versionId: cp.versionId ?? null,
      versionNumber: cp.version?.versionNumber ?? null,
      ceishCode: cp.protocolo?.ceishCode ?? null,
      title: cp.protocolo?.title ?? null,
      studyType: cp.protocolo?.studyType?.name ?? null,
      investigatorName: cp.protocolo?.principalInvestigator?.fullName ?? null,
      normativeDeadline: toSafeDate(cp.fechaPlazoNormativo),
    };
  }

  async saveMeetingWithAtomicNumber(
    params: CreateMeetingParams,
    academicYearStr: string,
    evalSubmissionDeadline: Date,
  ): Promise<MeetingEntity> {
    const academicYear = parseInt(academicYearStr, 10);
    const maxRetries = 3;
    const retryDelays = [50, 150, 300];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction('READ COMMITTED');

      try {
        // 1. Obtener secuencial atómico de evaluacion.secuencias_convocatoria
        const sequenceResult = (await queryRunner.query(
          `INSERT INTO evaluacion.secuencias_convocatoria (anio_lectivo, ultimo_secuencial)
           VALUES ($1, 1)
           ON CONFLICT (anio_lectivo)
           DO UPDATE SET ultimo_secuencial = evaluacion.secuencias_convocatoria.ultimo_secuencial + 1,
                         updated_at = CURRENT_TIMESTAMP
           RETURNING ultimo_secuencial;`,
          [academicYear],
        )) as Array<{ ultimo_secuencial?: number; ultimoSecuencial?: number }>;

        const nextSequence =
          sequenceResult[0]?.ultimo_secuencial ??
          sequenceResult[0]?.ultimoSecuencial ??
          1;

        const meetingVo = MeetingNumberValueObject.fromSequence(
          nextSequence,
          academicYear,
        );

        // 2. Crear entidad de Convocatoria
        const meetingEntity = new ConvocatoriaOrmEntity();
        meetingEntity.numeroConvocatoria = meetingVo.value;
        meetingEntity.anioLectivo = academicYear;
        meetingEntity.tipoSession = params.sessionType as SessionType;
        meetingEntity.fechaReunion = params.meetingDate;
        meetingEntity.fechaEntregaEvaluacion = evalSubmissionDeadline;
        meetingEntity.lugarId = params.locationId;
        meetingEntity.estado = ConvocatoriaStatus.PROGRAMADA;
        meetingEntity.entregaEvaluacionDiasHabiles =
          params.entregaDiasHabiles ??
          ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION;
        meetingEntity.entregaEvaluacionHoraCorte =
          params.entregaHoraCorte ?? ENTREGA_EVALUACION_HORA_CORTE;

        const savedMeeting = await queryRunner.manager.save(
          ConvocatoriaOrmEntity,
          meetingEntity,
        );

        let order = 1;

        // 3. Crear registros de protocolos agendados (Sección II)
        if (params.protocolVersionIds && params.protocolVersionIds.length > 0) {
          for (const versionId of params.protocolVersionIds) {
            const version = await queryRunner.manager.findOne(
              ProtocolVersionOrmEntity,
              {
                where: { id: versionId },
              },
            );

            if (!version) {
              throw new NotFoundException(
                `Versión de protocolo con ID ${versionId} no encontrada.`,
              );
            }

            const cp = new ConvocatoriaProtocoloOrmEntity();
            cp.convocatoriaId = savedMeeting.id;
            cp.tipoPuntoAgenda = AgendaItemType.EVALUACION_INICIAL;
            cp.protocoloId = version.protocolId;
            cp.versionId = version.id;
            cp.orden = order++;
            cp.fechaPlazoNormativo = new Date();
            await queryRunner.manager.save(ConvocatoriaProtocoloOrmEntity, cp);
          }
        }

        // 4. Crear registros de seguimiento agendados (Sección III)
        if (params.followUpReportIds && params.followUpReportIds.length > 0) {
          for (const reportId of params.followUpReportIds) {
            const cp = new ConvocatoriaProtocoloOrmEntity();
            cp.convocatoriaId = savedMeeting.id;
            cp.tipoPuntoAgenda = AgendaItemType.INFORME_AVANCE;
            cp.informeSeguimientoId = reportId;
            cp.orden = order++;
            await queryRunner.manager.save(ConvocatoriaProtocoloOrmEntity, cp);
          }
        }

        // 5. Propagar fecha_limite a las asignaciones ASSIGNED de los protocolos agendados
        if (params.protocolVersionIds && params.protocolVersionIds.length > 0) {
          const fechaLimite = toCalendarDateString(evalSubmissionDeadline);
          await queryRunner.query(
            `UPDATE evaluacion.asignaciones_evaluacion
             SET fecha_limite = $1
             WHERE version_id = ANY($2)
               AND estado_id = $3`,
            [fechaLimite, params.protocolVersionIds, AssignmentStatus.ASSIGNED],
          );
        }

        await queryRunner.commitTransaction();
        return savedMeeting;
      } catch (error: unknown) {
        await queryRunner.rollbackTransaction();

        const err = error as { code?: string; message?: string };
        const isConcurrencyError =
          err.code === '40001' ||
          err.code === '23505' ||
          (typeof err.message === 'string' &&
            (err.message.includes('23505') ||
              err.message.includes('duplicate key') ||
              err.message.includes('serialization')));

        if (isConcurrencyError && attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelays[attempt]),
          );
          continue;
        }

        if (isConcurrencyError) {
          throw new ConflictException(
            'CONFLICTO_CONCURRENCIA: La secuencia de convocatoria fue modificada concurrentemente. Por favor reintente.',
          );
        }

        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    throw new ConflictException(
      'CONFLICTO_CONCURRENCIA: Se excedió el número máximo de reintentos para asignar el correlativo de convocatoria.',
    );
  }

  async getOldestAssignedDates(
    protocolVersionIds: number[],
  ): Promise<AssignmentDeadlineSnapshot[]> {
    if (!protocolVersionIds.length) return [];
    const rows: Array<{
      protocolVersionId: string | number;
      protocolCode: string;
      oldestAssignmentDate: string | Date;
    }> = await this.dataSource.query(
      `SELECT
         ae.version_id        AS "protocolVersionId",
         COALESCE(p.codigo_ceish, p.id::text) AS "protocolCode",
         MIN(ae.fecha_asignacion) AS "oldestAssignmentDate"
       FROM evaluacion.asignaciones_evaluacion ae
       JOIN public.versiones_protocolo vp ON vp.id = ae.version_id
       JOIN public.protocolos p          ON p.id  = vp.protocolo_id
       WHERE ae.version_id = ANY($1)
         AND ae.estado_id  = $2
       GROUP BY ae.version_id, p.codigo_ceish, p.id`,
      [protocolVersionIds, AssignmentStatus.ASSIGNED],
    );
    return rows.map((row) => ({
      protocolVersionId: Number(row.protocolVersionId),
      protocolCode: String(row.protocolCode),
      oldestAssignmentDate: new Date(row.oldestAssignmentDate),
    }));
  }

  async findNormativeDeadlineInputs(
    protocolVersionIds: number[],
  ): Promise<NormativeDeadlineInput[]> {
    if (!protocolVersionIds.length) return [];
    const versions = await this.dataSource
      .getRepository(ProtocolVersionOrmEntity)
      .createQueryBuilder('pv')
      .innerJoinAndSelect('pv.protocol', 'p')
      .leftJoinAndSelect('pv.reception', 'r')
      .where('pv.id = ANY(:ids)', { ids: protocolVersionIds })
      .getMany();
    return versions.map((pv) => ({
      protocolVersionId: pv.id,
      protocolCode: pv.protocol?.ceishCode ?? String(pv.protocolId),
      reviewType: pv.protocol?.reviewType,
      receptionDate: pv.reception?.receptionDate,
    }));
  }

  async findAssignedVersionsWithoutScheduledMeeting(): Promise<
    UnscheduledVersionInfo[]
  > {
    // Effective states that contribute to the oldest-assignment date:
    // ASSIGNED(6) = active; REASIGNED_VENCIMIENTO(26)/REASIGNED_COI(27) = replaced but still count
    // (reassignment must NOT reset the elapsed-days clock per spec)
    const effectiveStates = [
      AssignmentStatus.ASSIGNED,
      AssignmentStatus.REASIGNED_VENCIMIENTO,
      AssignmentStatus.REASIGNED_COI,
    ];
    const rows: Array<{
      versionId: string | number;
      protocolCode: string;
      oldestAssignmentDate: string | Date;
      reviewType: string | null;
      receptionDate: string | Date | null;
    }> = await this.dataSource.query(
      `SELECT
         ae.version_id                            AS "versionId",
         COALESCE(p.codigo_ceish, p.id::text)     AS "protocolCode",
         MIN(ae.fecha_asignacion)                 AS "oldestAssignmentDate",
         p.tipo_revision::text                    AS "reviewType",
         r.fecha_recepcion                        AS "receptionDate"
       FROM evaluacion.asignaciones_evaluacion ae
       JOIN public.versiones_protocolo pv ON pv.id = ae.version_id
       JOIN public.protocolos p           ON p.id  = pv.protocolo_id
       LEFT JOIN recepcion.recepciones r  ON r.version_id = pv.id
       WHERE ae.estado_id = ANY($1)
         AND EXISTS (
           SELECT 1
           FROM evaluacion.asignaciones_evaluacion ae2
           WHERE ae2.version_id = ae.version_id
             AND ae2.estado_id  = $2
         )
         AND NOT EXISTS (
           SELECT 1
           FROM evaluacion.convocatoria_protocolos cp
           JOIN evaluacion.convocatorias c ON c.id = cp.convocatoria_id
           -- "agendado" = estado <> CANCELADA (cubre PROGRAMADA, EN_CURSO y CONCLUIDA)
           WHERE c.estado <> $3
             AND cp.version_id = ae.version_id
         )
       GROUP BY ae.version_id, p.codigo_ceish, p.id, p.tipo_revision, r.fecha_recepcion`,
      [
        effectiveStates,
        AssignmentStatus.ASSIGNED,
        ConvocatoriaStatus.CANCELADA,
      ],
    );
    return rows.map((row) => ({
      versionId: Number(row.versionId),
      protocolCode: String(row.protocolCode),
      oldestAssignmentDate: new Date(row.oldestAssignmentDate),
      reviewType: row.reviewType ?? undefined,
      receptionDate: row.receptionDate
        ? new Date(row.receptionDate)
        : undefined,
    }));
  }

  async findById(id: string): Promise<MeetingDetailEntity | null> {
    const repo = this.dataSource.getRepository(ConvocatoriaOrmEntity);
    const orm = await repo.findOne({
      where: { id },
      relations: [
        'lugar',
        'convocatoriaProtocolos',
        'convocatoriaProtocolos.protocolo',
        'convocatoriaProtocolos.protocolo.studyType',
        'convocatoriaProtocolos.protocolo.principalInvestigator',
        'convocatoriaProtocolos.version',
      ],
      order: {
        convocatoriaProtocolos: {
          orden: 'ASC',
        },
      },
    });
    if (!orm) return null;
    return {
      id: orm.id,
      meetingNumber: orm.numeroConvocatoria,
      academicYear: orm.anioLectivo ?? null,
      sessionType: orm.tipoSession,
      meetingDate: toSafeDate(orm.fechaReunion),
      evalSubmissionDeadline: toSafeDate(orm.fechaEntregaEvaluacion),
      status: orm.estado,
      place: orm.lugar ? this.mapPlace(orm.lugar) : null,
      protocolCount: orm.convocatoriaProtocolos?.length ?? 0,
      protocols: (orm.convocatoriaProtocolos ?? []).map((cp) =>
        this.mapAgendaItem(cp),
      ),
    };
  }

  async findAll(options?: FindMeetingsOptions): Promise<{
    items: MeetingSummaryEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const repo = this.dataSource.getRepository(ConvocatoriaOrmEntity);
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, Math.min(100, options?.limit || 10));
    const skip = (page - 1) * limit;

    const qb = repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.lugar', 'l')
      .leftJoinAndSelect('c.convocatoriaProtocolos', 'cp')
      .orderBy('c.fechaReunion', 'DESC')
      .skip(skip)
      .take(limit);

    if (options?.status) {
      qb.andWhere('c.estado = :status', { status: options.status });
    }

    const [orms, total] = await qb.getManyAndCount();
    const items: MeetingSummaryEntity[] = orms.map((orm) => ({
      id: orm.id,
      meetingNumber: orm.numeroConvocatoria,
      academicYear: orm.anioLectivo ?? null,
      sessionType: orm.tipoSession,
      meetingDate: toSafeDate(orm.fechaReunion),
      evalSubmissionDeadline: toSafeDate(orm.fechaEntregaEvaluacion),
      status: orm.estado,
      place: orm.lugar ? this.mapPlace(orm.lugar) : null,
      protocolCount: orm.convocatoriaProtocolos?.length ?? 0,
    }));
    return { items, total, page, limit };
  }

  async findPendingProtocols(): Promise<PendingProtocolEntity[]> {
    const protocolRepo = this.dataSource.getRepository(ProtocolOrmEntity);
    const protocols = await protocolRepo
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

    type ProtocolWithVersion = ProtocolOrmEntity & {
      activeVersion: ProtocolVersionOrmEntity;
    };
    const mapped = protocols
      .filter((p): p is ProtocolWithVersion => p.activeVersion != null)
      .map((p) => {
        const deadline = toSafeDate(
          p.responseDeadline || p.receptionDate || p.createdAt,
        );
        return {
          protocolId: p.id,
          versionId: p.activeVersion.id,
          versionNumber: p.activeVersion.versionNumber ?? null,
          ceishCode: p.ceishCode ?? null,
          title: p.title ?? null,
          studyType: p.studyType?.name ?? null,
          investigatorName: p.principalInvestigator?.fullName ?? null,
          receptionDate: toSafeDate(p.receptionDate),
          deadline,
        };
      });

    mapped.sort((a, b) => {
      const ta = a.deadline?.getTime() ?? 0;
      const tb = b.deadline?.getTime() ?? 0;
      return ta - tb;
    });

    return mapped;
  }

  async findAllPlaces(): Promise<LugarOrmEntity[]> {
    const repo = this.dataSource.getRepository(LugarOrmEntity);
    return repo.find({
      order: { nombre: 'ASC' },
    });
  }

  async findPlaceById(id: string): Promise<LugarOrmEntity | null> {
    const repo = this.dataSource.getRepository(LugarOrmEntity);
    return repo.findOne({ where: { id } });
  }

  async createPlace(data: {
    nombre: string;
    direccion?: string;
    esVirtual?: boolean;
    enlaceReunion?: string;
    activo?: boolean;
  }): Promise<LugarOrmEntity> {
    const repo = this.dataSource.getRepository(LugarOrmEntity);
    const existing = await repo.findOne({ where: { nombre: data.nombre } });
    if (existing) {
      throw new ConflictException(
        `Lugar con el nombre '${data.nombre}' ya existe.`,
      );
    }
    const place = repo.create({
      nombre: data.nombre,
      direccion: data.direccion,
      esVirtual: data.esVirtual ?? false,
      enlaceReunion: data.enlaceReunion,
      activo: data.activo ?? true,
    });
    return repo.save(place);
  }

  async updatePlace(
    id: string,
    data: {
      nombre?: string;
      direccion?: string;
      esVirtual?: boolean;
      enlaceReunion?: string;
      activo?: boolean;
    },
  ): Promise<LugarOrmEntity> {
    const repo = this.dataSource.getRepository(LugarOrmEntity);
    const place = await repo.findOne({ where: { id } });
    if (!place) {
      throw new NotFoundException(`Lugar con ID ${id} no encontrado.`);
    }
    if (data.nombre && data.nombre !== place.nombre) {
      const existing = await repo.findOne({ where: { nombre: data.nombre } });
      if (existing) {
        throw new ConflictException(
          `Lugar con el nombre '${data.nombre}' ya existe.`,
        );
      }
      place.nombre = data.nombre;
    }
    if (data.direccion !== undefined) place.direccion = data.direccion;
    if (data.esVirtual !== undefined) place.esVirtual = data.esVirtual;
    if (data.enlaceReunion !== undefined)
      place.enlaceReunion = data.enlaceReunion;
    if (data.activo !== undefined) place.activo = data.activo;
    return repo.save(place);
  }

  async deletePlace(id: string): Promise<void> {
    const repo = this.dataSource.getRepository(LugarOrmEntity);
    const place = await repo.findOne({ where: { id } });
    if (!place) {
      throw new NotFoundException(`Lugar con ID ${id} no encontrado.`);
    }
    place.activo = false;
    await repo.save(place);
  }
}
