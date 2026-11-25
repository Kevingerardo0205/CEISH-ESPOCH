import {
  MeetingEntity,
  MeetingDetailEntity,
  MeetingSummaryEntity,
  PendingProtocolEntity,
  MeetingPlaceFullModel,
  NextMeetingEntity,
} from '../entities/meeting.entity';

/** Contexto de un punto de la convocatoria para registrar el resultado del pleno (TSK-015-N08, RF-17.1). */
export interface ResultadoPlenoContext {
  convocatoriaProtocoloId: string;
  convocatoriaEstado: string;
  fechaReunion: Date | null;
  /** Valor vigente de dictamen_resultado; null si aún no hay resultado. */
  dictamenResultado: string | null;
}

/** Datos ya validados que escribe el registro del resultado (TSK-015-N08). */
export interface RegistrarResultadoPlenoParams {
  convocatoriaProtocoloId: string;
  /** Valor que la aplicación leyó antes; la escritura solo ocurre si sigue siendo el vigente. */
  resultadoAnterior: string | null;
  resultado: string;
  motivo: string | null;
  observaciones: string | null;
  motivoCorreccion: string | null;
  registradoPor: number;
}

/**
 * Versión enviada a una convocatoria cuyo plazo de evaluación aún no vence (RF-12.7 c.2, TSK-002-N57).
 * `reviewDeadline` = MAX(fecha_limite_revision) de sus asignaciones en estados 5, 6, 7, 26 y 27;
 * `hasActiveAssignments` = tiene al menos una asignación en 5, 6 o 7.
 */
export interface ReviewDeadlinePendingVersion {
  protocolVersionId: number;
  protocolCode: string;
  hasActiveAssignments: boolean;
  reviewDeadline: Date | null;
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
 * Versión con al menos una asignación activa (SUGERIDO, ASIGNADO o COMPLETADO) y sin convocatoria
 * "agendada" (cualquier estado salvo CANCELADA). Usada por UnscheduledProtocolsAlertService
 * (TSK-002-N03; antigüedad desde el vencimiento del plazo de evaluación, RF-12.7 d, TSK-002-N58).
 */
export interface UnscheduledVersionInfo {
  versionId: number;
  protocolCode: string;
  /** Fecha límite del plazo de evaluación de la versión (RF-12.7 c.2, mismo criterio que N57). */
  reviewDeadline: Date | null;
  /** Plazo de evaluación vencido según `NOW()` de la base (mismo predicado que N57). */
  reviewDeadlineExpired: boolean;
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
   * De las versiones dadas, devuelve las que NO son candidatas para una convocatoria porque su
   * plazo de evaluación no venció o no tienen asignaciones activas (RF-12.7 c.2, TSK-002-N57).
   * Mismo predicado que `findPendingProtocols`. Las versiones inexistentes no se devuelven.
   */
  findVersionsWithReviewDeadlinePending(
    protocolVersionIds: number[],
  ): Promise<ReviewDeadlinePendingVersion[]>;

  /** Devuelve datos crudos para calcular plazos normativos en application (TSK-009-N06). */
  findNormativeDeadlineInputs(
    protocolVersionIds: number[],
  ): Promise<NormativeDeadlineInput[]>;

  /**
   * Devuelve versiones con al menos una asignación activa (5, 6 o 7) que NO están en ninguna
   * convocatoria "agendada" (agendada = estado <> CANCELADA; cubre PROGRAMADA, EN_CURSO y CONCLUIDA).
   * Incluye la fecha límite del plazo de evaluación y si venció, reviewType y receptionDate para
   * evaluar las dos condiciones de alerta (TSK-002-N03, TSK-002-N58).
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

  /** Protocolos listos para tratar: solo versiones con el plazo de evaluación vencido (RF-12.7 c.2). */
  findPendingProtocols(): Promise<PendingProtocolEntity[]>;

  /**
   * Próxima reunión (RF-ALR.f.7, TSK-015-N07): convocatoria PROGRAMADA o EN_CURSO con
   * fecha_reunion desde el inicio de hoy en America/Guayaquil (NOW() de la base), la más
   * cercana y luego por numero_convocatoria. null si no hay ninguna.
   */
  findNextMeeting(): Promise<NextMeetingEntity | null>;

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

  /**
   * Punto de la convocatoria (no eliminado) con su estado, fecha de reunión y resultado vigente.
   * Devuelve null si el punto no pertenece a esa convocatoria (TSK-015-N08, RF-17.1).
   */
  findResultadoPlenoContext(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
  ): Promise<ResultadoPlenoContext | null>;

  /**
   * Escribe el valor vigente y añade una fila al historial en UNA transacción.
   * Si el valor vigente cambió desde `resultadoAnterior`, lanza un conflicto de concurrencia (TSK-015-N08).
   */
  registrarResultadoPleno(params: RegistrarResultadoPlenoParams): Promise<void>;
}
