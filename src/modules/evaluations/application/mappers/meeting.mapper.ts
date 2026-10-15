import { meetingPdfUrl } from '../../../../shared/utils/meeting-pdf-url.helper';
import {
  MeetingDetailModel,
  MeetingSummaryModel,
  PendingProtocolModel,
  AgendaProtocolModel,
} from '../../domain/entities/meeting.entity';
import {
  MeetingDetailDto,
  AgendaProtocolDto,
} from '../dtos/response/meeting-detail.dto';
import { MeetingSummaryDto } from '../dtos/response/meeting-summary.dto';
import { PendingProtocolDto } from '../dtos/response/pending-protocol.dto';

function toAgendaItem(item: AgendaProtocolModel): AgendaProtocolDto {
  return {
    order: item.order,
    protocolId: item.protocolId,
    versionId: item.versionId,
    versionNumber: item.versionNumber,
    ceishCode: item.ceishCode,
    title: item.title,
    studyType: item.studyType,
    investigatorName: item.investigatorName,
    normativeDeadline: item.normativeDeadline?.toISOString() ?? null,
  };
}

export function toSummary(model: MeetingSummaryModel): MeetingSummaryDto {
  return {
    id: model.id,
    meetingNumber: model.meetingNumber,
    academicYear: model.academicYear,
    sessionType: model.sessionType,
    meetingDate: model.meetingDate?.toISOString() ?? null,
    evalSubmissionDeadline: model.evalSubmissionDeadline?.toISOString() ?? null,
    status: model.status,
    place: model.place,
    agendaPdfUrl: meetingPdfUrl(model.id),
    protocolCount: model.protocolCount,
  };
}

export function toDetail(model: MeetingDetailModel): MeetingDetailDto {
  return {
    ...toSummary(model),
    protocols: model.protocols.map(toAgendaItem),
  };
}

export function toPendingProtocol(
  model: PendingProtocolModel,
): PendingProtocolDto {
  return {
    protocolId: model.protocolId,
    versionId: model.versionId,
    versionNumber: model.versionNumber,
    ceishCode: model.ceishCode,
    title: model.title,
    studyType: model.studyType,
    investigatorName: model.investigatorName,
    receptionDate: model.receptionDate?.toISOString() ?? null,
    deadline: model.deadline?.toISOString() ?? null,
  };
}

/** Extrae el deadline de un PendingProtocolModel (ya calculado en repositorio). */
export function pendingDeadline(p: PendingProtocolModel): Date | null {
  return p.deadline;
}
