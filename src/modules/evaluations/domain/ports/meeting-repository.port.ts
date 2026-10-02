import { MeetingEntity } from '../entities/meeting.entity';

export interface CreateMeetingParams {
  sessionType: string;
  meetingDate: Date;
  evalSubmissionDeadline?: Date;
  locationId?: string;
  protocolVersionIds?: number[];
  followUpReportIds?: number[];
}

export interface IMeetingRepositoryPort {
  saveMeetingWithAtomicNumber(
    params: CreateMeetingParams,
    meetingNumber: string,
    evalSubmissionDeadline: Date,
  ): Promise<MeetingEntity>;

  findById(id: string): Promise<MeetingEntity | null>;
}
