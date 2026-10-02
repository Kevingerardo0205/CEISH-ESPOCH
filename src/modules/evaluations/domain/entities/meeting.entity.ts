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
