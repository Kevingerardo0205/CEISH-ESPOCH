import { validate } from 'class-validator';
import { CreateMeetingDto } from './create-meeting.dto';
import { SessionType } from '../../infrastructure/database/entities/convocatoria.orm-entity';

describe('CreateMeetingDto (T015)', () => {
  it('should pass validation with valid properties', async () => {
    const dto = new CreateMeetingDto();
    dto.sessionType = SessionType.ORDINARIA;
    dto.meetingDate = '2026-10-15T09:00:00.000Z';
    dto.evalSubmissionDeadline = '2026-10-08T23:59:59.000Z';
    dto.locationId = 'b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22';
    dto.protocolVersionIds = [137];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when sessionType is invalid', async () => {
    const dto = new CreateMeetingDto();
    dto.sessionType = 'INVALID_SESSION_TYPE' as any;
    dto.meetingDate = '2026-10-15T09:00:00.000Z';
    dto.protocolVersionIds = [];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('sessionType');
  });

  it('should fail validation when meetingDate is not an ISO date string', async () => {
    const dto = new CreateMeetingDto();
    dto.sessionType = SessionType.ORDINARIA;
    dto.meetingDate = 'invalid-date';
    dto.protocolVersionIds = [];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('meetingDate');
  });

  it('should pass validation when followUpReportIds is provided with valid integers', async () => {
    const dto = new CreateMeetingDto();
    dto.sessionType = SessionType.ORDINARIA;
    dto.meetingDate = '2026-10-15T09:00:00.000Z';
    dto.protocolVersionIds = [137];
    dto.followUpReportIds = [10, 11, 12];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when followUpReportIds contains non-integer elements', async () => {
    const dto = new CreateMeetingDto();
    dto.sessionType = SessionType.ORDINARIA;
    dto.meetingDate = '2026-10-15T09:00:00.000Z';
    dto.followUpReportIds = ['invalid' as any];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('followUpReportIds');
  });
});
