import { MeetingPlaceFullModel } from '../../domain/entities/meeting.entity';
import { MeetingPlaceDto } from '../dtos/response/meeting-place.dto';

export function toPlaceDto(model: MeetingPlaceFullModel): MeetingPlaceDto {
  const dto = new MeetingPlaceDto();
  dto.id = model.id;
  dto.name = model.name;
  dto.address = model.address;
  dto.isVirtual = model.isVirtual;
  dto.meetingLink = model.meetingLink;
  dto.isActive = model.isActive;
  return dto;
}
