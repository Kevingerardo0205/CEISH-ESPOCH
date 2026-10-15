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

export interface MeetingPlaceDetail {
  id: string;
  name: string;
  address?: string | null;
  isVirtual: boolean;
  meetingLink?: string | null;
}

export interface AgendaProtocolItem {
  order: number;
  protocolId: number;
  versionId: number;
  versionNumber?: number | null;
  ceishCode?: string | null;
  title?: string | null;
  studyType?: string | null;
  investigatorName?: string | null;
  normativeDeadline?: string | null;
}

export interface MeetingDetailEntity {
  id: string;
  meetingNumber: string;
  academicYear?: number | null;
  sessionType: string;
  meetingDate: string;
  evalSubmissionDeadline: string;
  status: string;
  place?: MeetingPlaceDetail | null;
  agendaPdfUrl: string;
  protocolCount: number;
  protocols: AgendaProtocolItem[];
}

export interface MeetingSummaryEntity {
  id: string;
  meetingNumber: string;
  academicYear?: number | null;
  sessionType: string;
  meetingDate: string;
  evalSubmissionDeadline: string;
  status: string;
  place?: MeetingPlaceDetail | null;
  agendaPdfUrl: string;
  protocolCount: number;
}

export interface PendingProtocolEntity {
  protocolId: number;
  versionId: number;
  versionNumber?: number | null;
  ceishCode?: string | null;
  title?: string | null;
  studyType?: string | null;
  investigatorName?: string | null;
  receptionDate?: string | null;
  deadline?: string | null;
}
