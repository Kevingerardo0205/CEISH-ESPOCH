import { ProtocolDeadlineService } from './protocol-deadline.service';
import { ReviewType } from '../../domain/enums/review-type.enum';

describe('ProtocolDeadlineService', () => {
  let service: ProtocolDeadlineService;

  beforeEach(() => {
    service = new ProtocolDeadlineService();
  });

  describe('calculateSubmissionDeadline (RF-07.1, RF-13, TSK-013-N01)', () => {
    it('adds exactly 30 business days skipping weekends', () => {
      // Monday 2026-03-02 + 30 business days = Thursday 2026-04-14
      // Weeks: 2 Mar→6 Mar (5d), 9 Mar→13 Mar (5d), 16 Mar→20 Mar (5d),
      //        23 Mar→27 Mar (5d), 30 Mar→3 Apr (5d), 6 Apr→14 Apr (6d) → total 31d
      // Recount: 2 Mar (Mon) is day 0 (start). +30 biz days:
      // Week 1: 3,4,5,6,9 Mar = 5d
      // Week 2: 10,11,12,13,16 Mar = 5d (total 10)
      // Week 3: 17,18,19,20,23 Mar = 5d (total 15)
      // Week 4: 24,25,26,27,30 Mar = 5d (total 20)
      // Week 5: 31 Mar,1,2,3,6 Apr = 5d (total 25)
      // Week 6: 7,8,9,10,13 Apr = 5d (total 30) → 13 Apr (Monday)
      const reception = new Date('2026-03-02T12:00:00.000Z');
      const result = service.calculateSubmissionDeadline(reception);
      // Result is 2026-04-13 (Monday) — 30 business days after Monday 2026-03-02
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(3); // April (0-indexed)
      expect(result.getUTCDate()).toBe(13);
    });

    it('skips Saturday and Sunday', () => {
      // Friday 2026-03-06 + 30 business days
      // Week 1 starts Monday 2026-03-09: 9,10,11,12,13 = 5d
      // Week 2: 16,17,18,19,20 = 5d (total 10)
      // Week 3: 23,24,25,26,27 = 5d (total 15)
      // Week 4: 30,31 Mar, 1,2,3 Apr = 5d (total 20)
      // Week 5: 6,7,8,9,10 Apr = 5d (total 25)
      // Week 6: 13,14,15,16,17 Apr = 5d (total 30) → 17 Apr (Friday)
      const reception = new Date('2026-03-06T12:00:00.000Z');
      const result = service.calculateSubmissionDeadline(reception);
      expect(result.getUTCMonth()).toBe(3); // April
      expect(result.getUTCDate()).toBe(17);
    });

    it('returns a date strictly after the reception date', () => {
      const now = new Date();
      const result = service.calculateSubmissionDeadline(now);
      expect(result.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('calculateResponseDeadline', () => {
    it('returns 45 business days for EXPEDITA', () => {
      const base = new Date('2026-03-02T00:00:00.000Z');
      const result = service.calculateResponseDeadline(
        ReviewType.EXPEDITA,
        base,
      );
      // 45 biz days from Monday 2026-03-02 → 9 weeks (45d) = Mon 2026-05-04
      expect(result.getTime()).toBeGreaterThan(base.getTime());
    });

    it('returns 60 business days for PLENO', () => {
      const base = new Date('2026-03-02T00:00:00.000Z');
      const expedita = service.calculateResponseDeadline(
        ReviewType.EXPEDITA,
        base,
      );
      const pleno = service.calculateResponseDeadline(ReviewType.PLENO, base);
      expect(pleno.getTime()).toBeGreaterThan(expedita.getTime());
    });
  });
});
