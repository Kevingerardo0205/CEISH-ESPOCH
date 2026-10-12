import { Test, TestingModule } from '@nestjs/testing';
import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';
import type { AssignmentDeadlineSnapshot } from '../../domain/ports/meeting-repository.port';
import { PLAZO_REVISION_OFICIO_DIAS } from '../../../../shared/deadlines/deadline-rules';
import {
  SystemParamsService,
  SystemParamKey,
  SYSTEM_PARAM_FALLBACKS,
} from '../../../sistema/application/services/system-params.service';

const mockSystemParams = {
  get: (clave: SystemParamKey) => SYSTEM_PARAM_FALLBACKS[clave],
} as unknown as SystemParamsService;

describe('CalculateMeetingDatesService', () => {
  let service: CalculateMeetingDatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateMeetingDatesService,
        { provide: SystemParamsService, useValue: mockSystemParams },
      ],
    }).compile();
    service = module.get<CalculateMeetingDatesService>(
      CalculateMeetingDatesService,
    );
  });

  describe('calculateSuggestedEvalDeadline (RF-09.1)', () => {
    it('should return meetingDate + 2 business days at 12:00 ECT when meeting is on Thursday', () => {
      // Jueves 15 de Octubre de 2026 a las 20:00 ECT (UTC-5) -> 2026-10-16T01:00:00.000Z
      const thursdayMeetingDate = new Date('2026-10-16T01:00:00.000Z');

      const deadline =
        service.calculateSuggestedEvalDeadline(thursdayMeetingDate);

      // +1: Viernes 2026-10-16, +2: Lunes 2026-10-19 (salta fin de semana)
      // Lunes 2026-10-19 a las 12:00 ECT = 17:00 UTC
      expect(deadline.toISOString()).toBe('2026-10-19T17:00:00.000Z');
    });

    it('should return meetingDate + 2 business days at 12:00 ECT when meeting is on Saturday', () => {
      // Sábado 17 de Octubre de 2026 a las 10:00 ECT -> 2026-10-17T15:00:00.000Z
      const saturdayMeetingDate = new Date('2026-10-17T15:00:00.000Z');

      const deadline =
        service.calculateSuggestedEvalDeadline(saturdayMeetingDate);

      // +1: Lunes 2026-10-19 (salta domingo), +2: Martes 2026-10-20
      // Martes 2026-10-20 a las 12:00 ECT = 17:00 UTC
      expect(deadline.toISOString()).toBe('2026-10-20T17:00:00.000Z');
    });

    it('should return meetingDate + 2 business days at 12:00 ECT when meeting is on Monday', () => {
      // Lunes 19 de Octubre de 2026 a las 09:00 ECT -> 2026-10-19T14:00:00.000Z
      const mondayMeetingDate = new Date('2026-10-19T14:00:00.000Z');

      const deadline =
        service.calculateSuggestedEvalDeadline(mondayMeetingDate);

      // +1: Martes 2026-10-20, +2: Miércoles 2026-10-21
      // Miércoles 2026-10-21 a las 12:00 ECT = 17:00 UTC
      expect(deadline.toISOString()).toBe('2026-10-21T17:00:00.000Z');
    });

    it('should produce a deadline strictly AFTER the meeting date', () => {
      const meetingDate = new Date('2026-04-22T10:00:00.000Z');
      const deadline = service.calculateSuggestedEvalDeadline(meetingDate);
      expect(deadline.getTime()).toBeGreaterThan(meetingDate.getTime());
    });

    it('should be timezone-safe: same calendar date under UTC and America/Guayaquil (TSK-009-N01)', () => {
      const originalTz = process.env.TZ;
      const deadlines: string[] = [];
      try {
        for (const tz of ['UTC', 'America/Guayaquil']) {
          process.env.TZ = tz;
          const meetingDate = new Date('2026-10-15T14:00:00.000Z'); // Jueves 09:00 ECT
          const deadline = service.calculateSuggestedEvalDeadline(meetingDate);
          const dateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Guayaquil',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(deadline);
          deadlines.push(dateStr);
        }
      } finally {
        process.env.TZ = originalTz;
      }
      expect(deadlines[0]).toBe(deadlines[1]);
    });
  });

  describe('evaluateSoftWarnings', () => {
    it('should return empty array when meeting is within normative deadline and no assignment snapshots', () => {
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      const protocols = [
        {
          protocolCode: 'PROT-001',
          normativeDeadline: new Date('2026-11-01T09:00:00.000Z'),
        },
      ];

      const warnings = service.evaluateSoftWarnings(meetingDate, protocols);
      expect(warnings).toEqual([]);
    });

    it('should warn when meeting date exceeds normative deadline', () => {
      const meetingDate = new Date('2026-11-15T09:00:00.000Z');
      const protocols = [
        {
          protocolCode: 'PROT-002',
          normativeDeadline: new Date('2026-11-01T09:00:00.000Z'),
        },
      ];

      const warnings = service.evaluateSoftWarnings(meetingDate, protocols);
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('ADVERTENCIA');
      expect(warnings[0]).toContain('PROT-002');
    });

    it('should warn when assignment review time is less than PLAZO_REVISION_OFICIO_DIAS (TSK-002-N05)', () => {
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      // 3 días hábiles de revisión disponibles (12, 13, 14 oct — se excluye el día de reunión 15)
      const recentAssignment = new Date('2026-10-10T14:00:00.000Z');
      const assignments: AssignmentDeadlineSnapshot[] = [
        {
          protocolVersionId: 137,
          protocolCode: 'PROT-003',
          oldestAssignmentDate: recentAssignment,
        },
      ];

      const warnings = service.evaluateSoftWarnings(
        meetingDate,
        [],
        assignments,
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('ADVERTENCIA_PLAZO_REVISION');
      expect(warnings[0]).toContain(String(PLAZO_REVISION_OFICIO_DIAS));
    });

    it('should not warn when assignment review time meets PLAZO_REVISION_OFICIO_DIAS', () => {
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      // Asignada 10 días hábiles antes (suficiente — PLAZO_REVISION_OFICIO_DIAS = 8)
      const earlyAssignment = new Date('2026-10-01T14:00:00.000Z');
      const assignments: AssignmentDeadlineSnapshot[] = [
        {
          protocolVersionId: 140,
          protocolCode: 'PROT-004',
          oldestAssignmentDate: earlyAssignment,
        },
      ];

      const warnings = service.evaluateSoftWarnings(
        meetingDate,
        [],
        assignments,
      );
      expect(warnings).toEqual([]);
    });
  });

  describe('wiring: non-default SystemParam values (TSK-015-N05)', () => {
    it('ENTREGA=3: calculateSuggestedEvalDeadline adds 3 business days at 12:00 ECT', async () => {
      const mockWith3 = {
        get: (clave: SystemParamKey) =>
          clave === 'entrega_evaluacion_dias_habiles_tras_reunion'
            ? 3
            : SYSTEM_PARAM_FALLBACKS[clave],
      } as unknown as SystemParamsService;
      const module = await Test.createTestingModule({
        providers: [
          CalculateMeetingDatesService,
          { provide: SystemParamsService, useValue: mockWith3 },
        ],
      }).compile();
      const svc = module.get(CalculateMeetingDatesService);

      // Thursday 2026-10-15 → +3 biz: Fri +1, Mon +2, Tue +3 = 2026-10-20 17:00 UTC
      const thursdayMeeting = new Date('2026-10-16T01:00:00.000Z');
      const deadline = svc.calculateSuggestedEvalDeadline(thursdayMeeting);
      expect(deadline.toISOString()).toBe('2026-10-20T17:00:00.000Z');
    });

    it('PLAZO_REVISION=10: warning text mentions 10 and fires when < 10 biz days', async () => {
      const mockWith10 = {
        get: (clave: SystemParamKey) =>
          clave === 'plazo_revision_oficio_dias'
            ? 10
            : SYSTEM_PARAM_FALLBACKS[clave],
      } as unknown as SystemParamsService;
      const module = await Test.createTestingModule({
        providers: [
          CalculateMeetingDatesService,
          { provide: SystemParamsService, useValue: mockWith10 },
        ],
      }).compile();
      const svc = module.get(CalculateMeetingDatesService);

      // 3 biz days available — would NOT warn with default 8, DOES warn with 10
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      const recentAssignment = new Date('2026-10-10T14:00:00.000Z');
      const assignments: AssignmentDeadlineSnapshot[] = [
        {
          protocolVersionId: 200,
          protocolCode: 'PROT-X',
          oldestAssignmentDate: recentAssignment,
        },
      ];
      const warnings = svc.evaluateSoftWarnings(meetingDate, [], assignments);
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('10');
    });
  });
});
