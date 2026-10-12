import { MeetingEntity } from '../entities/meeting.entity';

/** Datos mínimos de asignación activa por protocolo-versión para evaluar el plazo de revisión (TSK-002-N05). */
export interface AssignmentDeadlineSnapshot {
  protocolVersionId: number;
  protocolCode: string;
  oldestAssignmentDate: Date;
}

export interface CreateMeetingParams {
  sessionType: string;
  meetingDate: Date;
  evalSubmissionDeadline?: Date;
  locationId?: string;
  protocolVersionIds?: number[];
  followUpReportIds?: number[];
  /** Snapshot del parámetro entrega_evaluacion_dias_habiles_tras_reunion usado al crear (TSK-009-N04). */
  entregaDiasHabiles?: number;
  /** Snapshot de ENTREGA_EVALUACION_HORA_CORTE usado al crear (TSK-009-N04). */
  entregaHoraCorte?: string;
}

export interface FindMeetingsOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export interface MeetingPlaceItem {
  id: string;
  nombre: string;
  direccion?: string;
  esVirtual: boolean;
  enlaceReunion?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMeetingRepositoryPort {
  saveMeetingWithAtomicNumber(
    params: CreateMeetingParams,
    meetingNumber: string,
    evalSubmissionDeadline: Date,
  ): Promise<MeetingEntity>;

  /**
   * Devuelve la fecha de asignación más antigua por versión de protocolo para
   * las asignaciones en estado ASIGNADO. Usa solo versiones con asignaciones activas.
   */
  getOldestAssignedDates(
    protocolVersionIds: number[],
  ): Promise<AssignmentDeadlineSnapshot[]>;

  findById(id: string): Promise<MeetingEntity | null>;

  findAll(options?: FindMeetingsOptions): Promise<{
    items: MeetingEntity[];
    total: number;
    page: number;
    limit: number;
  }>;

  findPendingProtocols(): Promise<unknown[]>;

  findAllPlaces(): Promise<MeetingPlaceItem[]>;

  findPlaceById(id: string): Promise<MeetingPlaceItem | null>;

  createPlace(data: {
    nombre: string;
    direccion?: string;
    esVirtual?: boolean;
    enlaceReunion?: string;
    activo?: boolean;
  }): Promise<MeetingPlaceItem>;

  updatePlace(
    id: string,
    data: {
      nombre?: string;
      direccion?: string;
      esVirtual?: boolean;
      enlaceReunion?: string;
      activo?: boolean;
    },
  ): Promise<MeetingPlaceItem>;

  deletePlace(id: string): Promise<void>;
}
