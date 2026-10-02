import { BadRequestException } from '@nestjs/common';
import { MeetingDatesValueObject } from './meeting-dates.vo';

describe('MeetingDatesValueObject (T005)', () => {
  const validMeetingDate = new Date('2026-10-15T09:00:00.000Z');
  const validEvalDate = new Date('2026-10-08T23:59:59.000Z');

  it('should create successfully when evalSubmissionDeadline < meetingDate', () => {
    const vo = new MeetingDatesValueObject(validMeetingDate, validEvalDate);
    expect(vo.meetingDate).toEqual(validMeetingDate);
    expect(vo.evalSubmissionDeadline).toEqual(validEvalDate);
  });

  it('should throw BadRequestException when evalSubmissionDeadline is EQUAL to meetingDate', () => {
    const sameDate = new Date('2026-10-15T09:00:00.000Z');
    expect(
      () => new MeetingDatesValueObject(validMeetingDate, sameDate),
    ).toThrow(BadRequestException);
  });

  it('should throw BadRequestException when evalSubmissionDeadline is GREATER than meetingDate', () => {
    const laterEvalDate = new Date('2026-10-16T09:00:00.000Z');
    expect(
      () => new MeetingDatesValueObject(validMeetingDate, laterEvalDate),
    ).toThrow(BadRequestException);
  });
});
