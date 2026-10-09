import { validate } from 'class-validator';
import { CalculateEvalDateDto } from './calculate-eval-date.dto';

describe('CalculateEvalDateDto (T016)', () => {
  it('should pass validation with a valid ISO date string', async () => {
    const dto = new CalculateEvalDateDto();
    dto.meetingDate = '2026-10-15T09:00:00.000Z';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when meetingDate is missing or invalid', async () => {
    const dto = new CalculateEvalDateDto();
    dto.meetingDate = 'invalid-date';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('meetingDate');
  });
});
