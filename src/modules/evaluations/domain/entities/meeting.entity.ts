/** Entidad ligera devuelta por saveMeetingWithAtomicNumber. */
export interface MeetingEntity {
  id: string;
  numeroConvocatoria: string;
  anioLectivo?: number | null;
  tipoSession: string;
  fechaReunion: Date;
  fechaEntregaEvaluacion: Date;
  lugarId?: string | null;
  estado: string;
  ordenDiaPdfPath?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Detalle del lugar de una convocatoria (modelo de dominio, sin PII). */
export interface MeetingPlaceModel {
  id: string;
  name: string;
  address: string | null;
  isVirtual: boolean;
  meetingLink: string | null;
}

/**
 * Ítem del Orden del Día en el detalle de convocatoria.
 * protocolId y versionId son null mientras PR-F1 no esté mergeado
 * (los ítems de seguimiento no tienen protocolo/versión).
 */
export interface AgendaProtocolModel {
  order: number;
  protocolId: number | null;
  versionId: number | null;
  versionNumber: number | null;
  ceishCode: string | null;
  title: string | null;
  studyType: string | null;
  investigatorName: string | null;
  normativeDeadline: Date | null;
}

/**
 * Modelo de lectura completo para GET /meetings/:id.
 * El repositorio devuelve Date; el mapper genera ISO strings y agendaPdfUrl.
 */
export interface MeetingDetailModel {
  id: string;
  meetingNumber: string;
  academicYear: number | null;
  sessionType: string;
  meetingDate: Date | null;
  evalSubmissionDeadline: Date | null;
  status: string;
  place: MeetingPlaceModel | null;
  protocolCount: number;
  protocols: AgendaProtocolModel[];
}

/**
 * Modelo de lectura para GET /meetings (lista).
 * El repositorio devuelve Date; el mapper genera ISO strings y agendaPdfUrl.
 */
export interface MeetingSummaryModel {
  id: string;
  meetingNumber: string;
  academicYear: number | null;
  sessionType: string;
  meetingDate: Date | null;
  evalSubmissionDeadline: Date | null;
  status: string;
  place: MeetingPlaceModel | null;
  protocolCount: number;
}

/**
 * Modelo de lectura para GET /meetings/pending-protocols.
 * El repositorio devuelve Date; el mapper genera ISO strings.
 */
export interface PendingProtocolModel {
  protocolId: number;
  versionId: number;
  versionNumber: number | null;
  ceishCode: string | null;
  title: string | null;
  studyType: string | null;
  investigatorName: string | null;
  receptionDate: Date | null;
  deadline: Date | null;
}

/** Aliases para compatibilidad con la convención "Entity" del port. */
export type MeetingDetailEntity = MeetingDetailModel;
export type MeetingSummaryEntity = MeetingSummaryModel;
export type PendingProtocolEntity = PendingProtocolModel;
