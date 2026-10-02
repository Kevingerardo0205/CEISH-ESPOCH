import { BadRequestException } from '@nestjs/common';
import { MeetingNumberValueObject } from './meeting-number.vo';

describe('MeetingNumberValueObject (T007)', () => {
  it('should create a formatted meeting number from sequence number and year', () => {
    const vo = MeetingNumberValueObject.fromSequence(1, 2026);
    expect(vo.value).toBe('001-2026');
    expect(vo.sequenceNumber).toBe(1);
    expect(vo.academicYear).toBe(2026);
  });

  it('should format sequence numbers with padding up to 3 digits', () => {
    expect(MeetingNumberValueObject.fromSequence(2, 2026).value).toBe(
      '002-2026',
    );
    expect(MeetingNumberValueObject.fromSequence(15, 2026).value).toBe(
      '015-2026',
    );
    expect(MeetingNumberValueObject.fromSequence(105, 2026).value).toBe(
      '105-2026',
    );
  });

  it('should validate and create from an existing valid string value', () => {
    const vo = MeetingNumberValueObject.fromString('003-2026');
    expect(vo.value).toBe('003-2026');
    expect(vo.sequenceNumber).toBe(3);
    expect(vo.academicYear).toBe(2026);
  });

  it('should throw BadRequestException when sequence number is <= 0', () => {
    expect(() => MeetingNumberValueObject.fromSequence(0, 2026)).toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException when format is invalid', () => {
    expect(() => MeetingNumberValueObject.fromString('invalid-format')).toThrow(
      BadRequestException,
    );
    expect(() => MeetingNumberValueObject.fromString('1-2026')).toThrow(
      BadRequestException,
    );
  });
});
