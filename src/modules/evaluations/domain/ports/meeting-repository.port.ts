import { MeetingEntity } from '../entities/meeting.entity';

export interface CreateMeetingParams {
  sessionType: string;
  meetingDate: Date;
  evalSubmissionDeadline?: Date;
  locationId?: string;
  protocolVersionIds?: number[];
  followUpReportIds?: number[];
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
