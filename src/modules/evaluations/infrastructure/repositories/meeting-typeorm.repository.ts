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
} from '../../domain/ports/meeting-repository.port';
import { MeetingEntity } from '../../domain/entities/meeting.entity';
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

@Injectable()
export class MeetingTypeOrmRepository implements IMeetingRepositoryPort {
  constructor(private readonly dataSource: DataSource) {}

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

  async findById(id: string): Promise<MeetingEntity | null> {
    const repo = this.dataSource.getRepository(ConvocatoriaOrmEntity);
    return repo.findOne({
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
  }

  async findAll(options?: FindMeetingsOptions): Promise<{
    items: MeetingEntity[];
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
      .leftJoinAndSelect('cp.protocolo', 'p')
      .leftJoinAndSelect('p.studyType', 'st')
      .leftJoinAndSelect('p.principalInvestigator', 'pi')
      .orderBy('c.fechaReunion', 'DESC')
      .skip(skip)
      .take(limit);

    if (options?.status) {
      qb.andWhere('c.estado = :status', { status: options.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findPendingProtocols(): Promise<ProtocolOrmEntity[]> {
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

    protocols.sort((a, b) => {
      const deadlineA = a.responseDeadline || a.receptionDate || a.createdAt;
      const deadlineB = b.responseDeadline || b.receptionDate || b.createdAt;
      return new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
    });

    return protocols;
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
