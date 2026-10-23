import {
  MeetingEntity,
  MeetingDetailEntity,
  MeetingSummaryEntity,
  PendingProtocolEntity,
  MeetingPlaceFullModel,
} from '../entities/meeting.entity';

/** Datos mínimos de asignación activa por protocolo-versión para evaluar el plazo de revisión (TSK-002-N05). */
export interface AssignmentDeadlineSnapshot {
  protocolVersionId: number;
  protocolCode: string;
  oldestAssignmentDate: Date;
}

/** Datos crudos por versión para calcular el plazo normativo de respuesta (TSK-009-N06). */
export interface NormativeDeadlineInput {
  protocolVersionId: number;
  protocolCode: string;
  reviewType: string | undefined;
  receptionDate: Date | undefined;
}

/** Datos de evaluador ASSIGNED enriquecidos para emitir notificación al agendar (TSK-002-N41). */
export interface AssignedEvaluatorInfo {
  assignmentId: number;
  evaluatorId: number;
  protocolId: number;
  evaluatorEmail: string | null;
  evaluatorFullName: string | null;
  protocolCode: string | null;
  evaluatorProfile: string;
  isAssignedForAnnex10: boolean;
}

/**
 * Versión con asignación ASSIGNED activa y sin convocatoria "agendada"
 * (cualquier estado salvo CANCELADA). Usada por UnscheduledProtocolsAlertService (TSK-002-N03).
 */
export interface UnscheduledVersionInfo {
  versionId: number;
  protocolCode: string;
  oldestAssignmentDate: Date;
  reviewType: string | undefined;
  receptionDate: Date | undefined;
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

export interface FindPlacesOptions {
  includeInactive?: boolean;
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

  /** Devuelve datos crudos para calcular plazos normativos en application (TSK-009-N06). */
  findNormativeDeadlineInputs(
    protocolVersionIds: number[],
  ): Promise<NormativeDeadlineInput[]>;

  /**
   * Devuelve versiones con al menos una asignación ASSIGNED que NO están en ninguna
   * convocatoria "agendada" (agendada = estado <> CANCELADA; cubre PROGRAMADA, EN_CURSO y CONCLUIDA).
   * Incluye fecha de asignación más antigua, reviewType y
   * receptionDate para evaluar las dos condiciones de alerta (TSK-002-N03).
   */
  findAssignedVersionsWithoutScheduledMeeting(): Promise<
    UnscheduledVersionInfo[]
  >;

  findById(id: string): Promise<MeetingDetailEntity | null>;

  findAll(options?: FindMeetingsOptions): Promise<{
    items: MeetingSummaryEntity[];
    total: number;
    page: number;
    limit: number;
  }>;

  findPendingProtocols(): Promise<PendingProtocolEntity[]>;

  findAllPlaces(options?: FindPlacesOptions): Promise<MeetingPlaceFullModel[]>;

  findPlaceById(id: string): Promise<MeetingPlaceFullModel | null>;

  createPlace(data: {
    nombre: string;
    direccion?: string;
    esVirtual?: boolean;
    enlaceReunion?: string;
    activo?: boolean;
  }): Promise<MeetingPlaceFullModel>;

  updatePlace(
    id: string,
    data: {
      nombre?: string;
      direccion?: string;
      esVirtual?: boolean;
      enlaceReunion?: string;
      activo?: boolean;
    },
  ): Promise<MeetingPlaceFullModel>;

  deletePlace(id: string): Promise<void>;

  /** Devuelve asignaciones ASSIGNED activas con datos de contacto para emitir notificación al agendar (TSK-002-N41). */
  findAssignedEvaluatorsForVersions(
    versionIds: number[],
  ): Promise<AssignedEvaluatorInfo[]>;
}
