import { Test, TestingModule } from '@nestjs/testing';
import { CalculateMeetingDatesService } from './calculate-meeting-dates.service';
import type { AssignmentDeadlineSnapshot } from '../../domain/ports/meeting-repository.port';
import {
  PLAZO_REVISION_OFICIO_DIAS,
  PLAZO_NORMATIVO_EXPEDITA_DIAS,
  PLAZO_NORMATIVO_PLENO_DIAS,
} from '../../../../shared/deadlines/deadline-rules';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';
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
    it('con evalDeadline: no advertencia cuando evalDeadline < normativeDeadline (TSK-009-N06)', () => {
      // La comparacion correcta usa evalDeadline, no meetingDate
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      // evalDeadline = 2 dias habiles despues = 2026-10-19
      const evalDeadline = new Date('2026-10-19T17:00:00.000Z');
      const protocols = [
        {
          protocolCode: 'PROT-001',
          normativeDeadline: new Date('2026-11-01T09:00:00.000Z'),
        },
      ];

      const warnings = service.evaluateSoftWarnings(
        meetingDate,
        protocols,
        undefined,
        evalDeadline,
      );
      expect(warnings).toEqual([]);
    });

    it('con evalDeadline: advertencia ADVERTENCIA_PLAZO_NORMATIVO cuando evalDeadline > normativeDeadline (TSK-009-N06)', () => {
      // Cambia la comparacion: antes era meetingDate > normativeDeadline,
      // ahora es evalDeadline > normativeDeadline (mas preciso segun spec RF-09.1)
      const meetingDate = new Date('2026-10-29T09:00:00.000Z');
      // evalDeadline = 2 dias habiles despues = 2026-11-04
      const evalDeadline = new Date('2026-11-04T17:00:00.000Z');
      const protocols = [
        {
          protocolCode: 'PROT-002',
          normativeDeadline: new Date('2026-11-01T09:00:00.000Z'),
        },
      ];

      const warnings = service.evaluateSoftWarnings(
        meetingDate,
        protocols,
        undefined,
        evalDeadline,
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('ADVERTENCIA_PLAZO_NORMATIVO');
      expect(warnings[0]).toContain('PROT-002');
    });

    it('varios protocolos: solo el que supera genera advertencia', () => {
      const meetingDate = new Date('2026-10-20T09:00:00.000Z');
      const evalDeadline = new Date('2026-10-22T17:00:00.000Z');
      const protocols = [
        {
          protocolCode: 'PROT-VENCIDO',
          normativeDeadline: new Date('2026-10-01T09:00:00.000Z'),
        },
        {
          protocolCode: 'PROT-VIGENTE',
          normativeDeadline: new Date('2027-01-01T09:00:00.000Z'),
        },
      ];

      const warnings = service.evaluateSoftWarnings(
        meetingDate,
        protocols,
        undefined,
        evalDeadline,
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('PROT-VENCIDO');
      expect(warnings[0]).not.toContain('PROT-VIGENTE');
    });

    it('should warn when assignment review time is less than PLAZO_REVISION_OFICIO_DIAS (TSK-002-N05)', () => {
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      // evalDeadline = +2 días hábiles (no afecta warnings de asignación; protocolos vacíos)
      const evalDeadline = new Date('2026-10-19T17:00:00.000Z');
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
        evalDeadline,
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('ADVERTENCIA_PLAZO_REVISION');
      expect(warnings[0]).toContain(String(PLAZO_REVISION_OFICIO_DIAS));
    });

    it('should not warn when assignment review time meets PLAZO_REVISION_OFICIO_DIAS', () => {
      const meetingDate = new Date('2026-10-15T09:00:00.000Z');
      const evalDeadline = new Date('2026-10-19T17:00:00.000Z');
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
        evalDeadline,
      );
      expect(warnings).toEqual([]);
    });
  });

  describe('getEntregaDias (TSK-009-N04)', () => {
    it('getEntregaDias() devuelve el valor de SP_ENTREGA_EVALUACION_DIAS del mock', () => {
      // mockSystemParams retorna SYSTEM_PARAM_FALLBACKS[SP_ENTREGA_EVALUACION_DIAS] = 2
      expect(service.getEntregaDias()).toBe(2);
    });

    it('getEntregaDias() devuelve 3 cuando SystemParam retorna 3', async () => {
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
      expect(svc.getEntregaDias()).toBe(3);
    });

    it('calculateSuggestedEvalDeadline usa el mismo valor que getEntregaDias()', async () => {
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
      // Lunes 2026-11-03 + 3 días hábiles = Jueves 2026-11-06 a las 12:00 ECT (17:00 UTC)
      const monday = new Date('2026-11-03T14:00:00.000Z');
      const deadline = svc.calculateSuggestedEvalDeadline(monday);
      expect(svc.getEntregaDias()).toBe(3);
      expect(deadline.toISOString()).toBe('2026-11-06T17:00:00.000Z');
    });
  });

  describe('computeNormativeDeadline (TSK-009-N06)', () => {
    it('retorna undefined cuando reviewType es undefined', () => {
      const result = CalculateMeetingDatesService.computeNormativeDeadline(
        undefined,
        new Date('2025-01-01T05:00:00.000Z'),
      );
      expect(result).toBeUndefined();
    });

    it('retorna undefined cuando receptionDate es undefined', () => {
      const result = CalculateMeetingDatesService.computeNormativeDeadline(
        ReviewType.EXPEDITA,
        undefined,
      );
      expect(result).toBeUndefined();
    });

    it('EXPEDITA: retorna Date posterior a receptionDate (45 dias habiles)', () => {
      const receptionDate = new Date('2025-01-01T05:00:00.000Z');
      const result = CalculateMeetingDatesService.computeNormativeDeadline(
        ReviewType.EXPEDITA,
        receptionDate,
      );
      expect(result).toBeInstanceOf(Date);
      expect(result!.getTime()).toBeGreaterThan(receptionDate.getTime());
      // endOfDayGuayaquil: fin de dia ECT (UTC-5) = 04:59:59 UTC al dia siguiente
      expect(result!.getUTCHours()).toBe(4);
      expect(result!.getUTCMinutes()).toBe(59);
    });

    it('PLENO: plazo mayor que EXPEDITA para la misma receptionDate (60 > 45 dias)', () => {
      const receptionDate = new Date('2025-01-01T05:00:00.000Z');
      const expeditaDeadline =
        CalculateMeetingDatesService.computeNormativeDeadline(
          ReviewType.EXPEDITA,
          receptionDate,
        );
      const plenoDeadline =
        CalculateMeetingDatesService.computeNormativeDeadline(
          ReviewType.PLENO,
          receptionDate,
        );
      expect(plenoDeadline!.getTime()).toBeGreaterThan(
        expeditaDeadline!.getTime(),
      );
    });

    it('ENSAYO_CLINICO: mismo plazo que PLENO (ambos 60 dias habiles)', () => {
      const receptionDate = new Date('2025-01-01T05:00:00.000Z');
      const plenoDeadline =
        CalculateMeetingDatesService.computeNormativeDeadline(
          ReviewType.PLENO,
          receptionDate,
        );
      const ensayoDeadline =
        CalculateMeetingDatesService.computeNormativeDeadline(
          ReviewType.ENSAYO_CLINICO,
          receptionDate,
        );
      expect(ensayoDeadline!.getTime()).toBe(plenoDeadline!.getTime());
    });

    it('EXPEDITA con PLAZO_NORMATIVO_EXPEDITA_DIAS dias habiles respecto a constante', () => {
      expect(PLAZO_NORMATIVO_EXPEDITA_DIAS).toBe(45);
      expect(PLAZO_NORMATIVO_PLENO_DIAS).toBe(60);
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
      const evalDeadline = new Date('2026-10-19T17:00:00.000Z');
      const recentAssignment = new Date('2026-10-10T14:00:00.000Z');
      const assignments: AssignmentDeadlineSnapshot[] = [
        {
          protocolVersionId: 200,
          protocolCode: 'PROT-X',
          oldestAssignmentDate: recentAssignment,
        },
      ];
      const warnings = svc.evaluateSoftWarnings(
        meetingDate,
        [],
        assignments,
        evalDeadline,
      );
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('10');
    });
  });
});
