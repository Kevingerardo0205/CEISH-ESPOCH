/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UnscheduledProtocolsAlertService } from './unscheduled-protocols-alert.service';
import {
  IMeetingRepositoryPort,
  UnscheduledVersionInfo,
} from '../../domain/ports/meeting-repository.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { IUserRepository } from '../../../auth/domain/ports/user.repository.port';
import { SystemParamsService } from '../../../sistema/application/services/system-params.service';
import { RoleCode } from '../../../auth/domain/enums/role.enum';

const makeDate = (isoStr: string): Date => new Date(isoStr);

const TODAY = makeDate('2026-10-13T12:00:00Z'); // martes

/** Fecha límite del plazo de evaluación como se guarda: 23:59:59.999 del día en Ecuador (N52). */
const deadlineEct = (day: string): Date =>
  new Date(`${day}T23:59:59.999-05:00`);

// Versión con el plazo de evaluación vencido hace 9 días hábiles → Cond1
const SNAP_COND1: UnscheduledVersionInfo = {
  versionId: 1,
  protocolCode: 'CEISH-001-2026',
  reviewDeadline: deadlineEct('2026-09-29'), // vencido hace 9 días hábiles
  reviewDeadlineExpired: true,
  reviewType: undefined,
  receptionDate: undefined,
};

// Versión cuyo plazo normativo vence en 3 días hábiles (EXPEDITA = 45 días desde recepción)
// Para que venza en ~3 días hábiles desde TODAY, receptionDate debe ser ~42 días hábiles antes
// 42 días hábiles ≈ 59 días calendario antes de TODAY (2026-10-13 - 59d ≈ 2026-08-15)
const SNAP_COND2: UnscheduledVersionInfo = {
  versionId: 2,
  protocolCode: 'CEISH-002-2026',
  reviewDeadline: deadlineEct('2026-10-12'), // venció ayer (0 días hábiles → Cond1 = false)
  reviewDeadlineExpired: true,
  reviewType: 'EXPEDITA',
  receptionDate: makeDate('2026-08-15T08:00:00Z'),
};

// Versión que cumple ambas condiciones
const SNAP_BOTH: UnscheduledVersionInfo = {
  versionId: 3,
  protocolCode: 'CEISH-003-2026',
  reviewDeadline: deadlineEct('2026-09-29'),
  reviewDeadlineExpired: true,
  reviewType: 'EXPEDITA',
  receptionDate: makeDate('2026-08-15T08:00:00Z'),
};

// Versión que no cumple ninguna
const SNAP_NONE: UnscheduledVersionInfo = {
  versionId: 4,
  protocolCode: 'CEISH-004-2026',
  reviewDeadline: deadlineEct('2026-10-12'), // venció ayer
  reviewDeadlineExpired: true,
  reviewType: 'PLENO',
  receptionDate: makeDate('2026-09-01T08:00:00Z'), // plazo PLENO = 60 días → aún lejos
};

// Versión sin reviewType ni receptionDate → Cond2 se omite, solo Cond1
const SNAP_NO_RECEPTION: UnscheduledVersionInfo = {
  versionId: 5,
  protocolCode: 'CEISH-005-2026',
  reviewDeadline: deadlineEct('2026-09-29'), // Cond1 = true
  reviewDeadlineExpired: true,
  reviewType: undefined,
  receptionDate: undefined,
};

const RECIPIENTS = [
  {
    id: 1,
    fullName: 'Secretaria Test',
    institutionalEmail: 'sec@espoch.edu.ec',
  },
  {
    id: 2,
    fullName: 'Presidente Test',
    institutionalEmail: 'pres@espoch.edu.ec',
  },
];

describe('UnscheduledProtocolsAlertService', () => {
  let service: UnscheduledProtocolsAlertService;
  let meetingRepo: jest.Mocked<IMeetingRepositoryPort>;
  let emailService: jest.Mocked<IEmailServicePort>;
  let userRepo: jest.Mocked<IUserRepository>;
  let systemParams: jest.Mocked<SystemParamsService>;

  beforeEach(async () => {
    meetingRepo = {
      findAssignedVersionsWithoutScheduledMeeting: jest.fn(),
    } as unknown as jest.Mocked<IMeetingRepositoryPort>;

    emailService = {
      sendUnscheduledProtocolsAlert: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IEmailServicePort>;

    userRepo = {
      findByRoleCodes: jest.fn().mockResolvedValue(RECIPIENTS),
    } as unknown as jest.Mocked<IUserRepository>;

    systemParams = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'dias_max_sin_convocatoria') return 8;
        if (key === 'dias_alerta_normativo_sin_convocatoria') return 5;
        return 0;
      }),
    } as unknown as jest.Mocked<SystemParamsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnscheduledProtocolsAlertService,
        { provide: 'IMeetingRepositoryPort', useValue: meetingRepo },
        { provide: IEmailServicePort, useValue: emailService },
        { provide: IUserRepository, useValue: userRepo },
        { provide: SystemParamsService, useValue: systemParams },
      ],
    }).compile();

    service = module.get<UnscheduledProtocolsAlertService>(
      UnscheduledProtocolsAlertService,
    );
  });

  describe('evaluateEligibility', () => {
    it('detecta condición 1: antigüedad >= dias_max', () => {
      const result = service.evaluateEligibility([SNAP_COND1], TODAY, 8, 5);
      expect(result).toHaveLength(1);
      expect(result[0].versionId).toBe(1);
      expect(result[0].reason).toContain(
        'desde el vencimiento del plazo de evaluación',
      );
    });

    it('detecta condición 2: plazo normativo inminente', () => {
      const result = service.evaluateEligibility([SNAP_COND2], TODAY, 8, 5);
      expect(result).toHaveLength(1);
      expect(result[0].versionId).toBe(2);
      expect(result[0].reason).toContain('plazo normativo');
    });

    it('detecta ambas condiciones y concatena razón', () => {
      const result = service.evaluateEligibility([SNAP_BOTH], TODAY, 8, 5);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toContain(
        'desde el vencimiento del plazo de evaluación',
      );
      expect(result[0].reason).toContain('plazo normativo');
    });

    it('excluye versión que no cumple ninguna condición', () => {
      const result = service.evaluateEligibility([SNAP_NONE], TODAY, 8, 5);
      expect(result).toHaveLength(0);
    });

    it('omite condición 2 cuando faltan reviewType y receptionDate', () => {
      const result = service.evaluateEligibility(
        [SNAP_NO_RECEPTION],
        TODAY,
        8,
        5,
      );
      expect(result).toHaveLength(1);
      expect(result[0].reason).toContain(
        'desde el vencimiento del plazo de evaluación',
      );
    });

    it(
      'condición 1 límite exacto — semántica intervalo abierto ECT: ' +
        'countBusinessDays(from,to) excluye ambos extremos; ' +
        'from=2026-09-30 ECT → 8 días hábiles = diasMax → alerta; ' +
        'from=2026-10-01 ECT → 7 días hábiles < diasMax → sin alerta',
      () => {
        // (2026-09-30, 2026-10-13): oct-01 jue, oct-02 vie, [sáb,dom], oct-05..09 lun-vie, oct-12 lun = 8 ✓
        const snapExacto: UnscheduledVersionInfo = {
          versionId: 99,
          protocolCode: 'COND1-EXACTO',
          reviewDeadline: deadlineEct('2026-09-30'),
          reviewDeadlineExpired: true,
          reviewType: undefined,
          receptionDate: undefined,
        };
        const resAlerta = service.evaluateEligibility(
          [snapExacto],
          TODAY,
          8,
          5,
        );
        expect(resAlerta).toHaveLength(1);
        expect(resAlerta[0].versionId).toBe(99);

        // (2026-10-01, 2026-10-13): oct-02 vie, [sáb,dom], oct-05..09 lun-vie, oct-12 lun = 7 < 8
        const snapMenos: UnscheduledVersionInfo = {
          versionId: 100,
          protocolCode: 'COND1-MENOS',
          reviewDeadline: deadlineEct('2026-10-01'),
          reviewDeadlineExpired: true,
          reviewType: undefined,
          receptionDate: undefined,
        };
        const resSinAlerta = service.evaluateEligibility(
          [snapMenos],
          TODAY,
          8,
          5,
        );
        expect(resSinAlerta).toHaveLength(0);
      },
    );

    it(
      'condición 2: plazo normativo vencido (< now) activa alerta — ' +
        'countBusinessDays(now, vencido) devuelve 0, y 0 <= diasAlerta',
      () => {
        // EXPEDITA 45 días hábiles desde 2026-06-01 ≈ 2026-08: vencido para 2026-10-13.
        // Plazo de evaluación sin vencer → Cond1 = false, para aislar Cond2.
        const snapVencido: UnscheduledVersionInfo = {
          versionId: 101,
          protocolCode: 'COND2-VENCIDO',
          reviewDeadline: deadlineEct('2026-10-20'),
          reviewDeadlineExpired: false,
          reviewType: 'EXPEDITA',
          receptionDate: makeDate('2026-06-01T12:00:00Z'),
        };
        const result = service.evaluateEligibility([snapVencido], TODAY, 8, 5);
        expect(result).toHaveLength(1);
        expect(result[0].versionId).toBe(101);
        expect(result[0].reason).toContain('plazo normativo');
      },
    );

    it(
      'condición 1: fin de semana no cuenta como días hábiles — ' +
        '4 días calendario vie→mar = 1 día hábil (solo lun en intervalo abierto)',
      () => {
        // (2026-10-09 vie, 2026-10-13 mar) abierto: oct-10 sáb, oct-11 dom, oct-12 lun → 1 día hábil
        const snapFinde: UnscheduledVersionInfo = {
          versionId: 102,
          protocolCode: 'COND1-FINDE',
          reviewDeadline: deadlineEct('2026-10-09'),
          reviewDeadlineExpired: true,
          reviewType: undefined,
          receptionDate: undefined,
        };
        // diasMax=2: 1 < 2 → sin alerta
        const resSinAlerta = service.evaluateEligibility(
          [snapFinde],
          TODAY,
          2,
          5,
        );
        expect(resSinAlerta).toHaveLength(0);
        // diasMax=1: 1 >= 1 → alerta
        const resAlerta = service.evaluateEligibility([snapFinde], TODAY, 1, 5);
        expect(resAlerta).toHaveLength(1);
      },
    );

    it('TSK-002-N58: asignado hace 10 días hábiles con el plazo de evaluación vencido hace 2 → sin alerta por antigüedad', () => {
      // Asignación 2026-09-28 (lun): 10 días hábiles abiertos hasta 2026-10-13. Plazo vencido el
      // 2026-10-08 (jue): días hábiles abiertos (10-08, 10-13) = 10-09 vie y 10-12 lun = 2 < 8.
      const snap: UnscheduledVersionInfo = {
        versionId: 110,
        protocolCode: 'N58-VENCIDO-HACE-2',
        reviewDeadline: deadlineEct('2026-10-08'),
        reviewDeadlineExpired: true,
        reviewType: undefined,
        receptionDate: undefined,
      };
      expect(service.evaluateEligibility([snap], TODAY, 8, 5)).toHaveLength(0);
    });

    it('TSK-002-N58: plazo de evaluación vencido hace dias_max días hábiles → alerta por antigüedad', () => {
      // Plazo vencido el 2026-09-30 (mié): (09-30, 10-13) = 8 días hábiles = diasMax.
      const snap: UnscheduledVersionInfo = {
        versionId: 111,
        protocolCode: 'N58-VENCIDO-HACE-8',
        reviewDeadline: deadlineEct('2026-09-30'),
        reviewDeadlineExpired: true,
        reviewType: undefined,
        receptionDate: undefined,
      };
      const result = service.evaluateEligibility([snap], TODAY, 8, 5);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe(
        '≥ 8 días hábiles desde el vencimiento del plazo de evaluación sin convocatoria',
      );
    });

    it('TSK-002-N58: plazo de evaluación sin vencer y plazo normativo cerca → solo alerta normativa', () => {
      const snap: UnscheduledVersionInfo = {
        versionId: 112,
        protocolCode: 'N58-SIN-VENCER-NORMATIVO',
        reviewDeadline: deadlineEct('2026-10-20'),
        reviewDeadlineExpired: false,
        reviewType: 'EXPEDITA',
        receptionDate: makeDate('2026-08-15T08:00:00Z'),
      };
      const result = service.evaluateEligibility([snap], TODAY, 8, 5);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe(
        'plazo normativo vence en ≤ 5 días hábiles',
      );
    });

    it('TSK-002-N58: plazo de evaluación sin vencer con dias_max 0 → sin alerta por antigüedad', () => {
      const snap: UnscheduledVersionInfo = {
        versionId: 113,
        protocolCode: 'N58-SIN-VENCER-DIAS-0',
        reviewDeadline: deadlineEct('2026-10-20'),
        reviewDeadlineExpired: false,
        reviewType: undefined,
        receptionDate: undefined,
      };
      expect(service.evaluateEligibility([snap], TODAY, 0, 5)).toHaveLength(0);
    });
  });

  describe('checkAndNotify', () => {
    it('no envía correo si la lista está vacía', async () => {
      meetingRepo.findAssignedVersionsWithoutScheduledMeeting.mockResolvedValue(
        [],
      );
      await service.checkAndNotify(TODAY);
      expect(emailService.sendUnscheduledProtocolsAlert).not.toHaveBeenCalled();
    });

    it('no envía correo si ningún protocolo supera los umbrales', async () => {
      meetingRepo.findAssignedVersionsWithoutScheduledMeeting.mockResolvedValue(
        [SNAP_NONE],
      );
      await service.checkAndNotify(TODAY);
      expect(emailService.sendUnscheduledProtocolsAlert).not.toHaveBeenCalled();
    });

    it('envía correo a todos los destinatarios cuando hay protocolos elegibles', async () => {
      meetingRepo.findAssignedVersionsWithoutScheduledMeeting.mockResolvedValue(
        [SNAP_COND1],
      );
      await service.checkAndNotify(TODAY);
      expect(emailService.sendUnscheduledProtocolsAlert).toHaveBeenCalledTimes(
        RECIPIENTS.length,
      );
      expect(emailService.sendUnscheduledProtocolsAlert).toHaveBeenCalledWith(
        RECIPIENTS[0].institutionalEmail,
        RECIPIENTS[0].fullName,
        expect.arrayContaining([
          expect.objectContaining({ code: 'CEISH-001-2026' }),
        ]),
      );
    });

    it('un fallo al enviar a un destinatario no aborta los demás', async () => {
      meetingRepo.findAssignedVersionsWithoutScheduledMeeting.mockResolvedValue(
        [SNAP_COND1],
      );
      emailService.sendUnscheduledProtocolsAlert
        .mockRejectedValueOnce(new Error('SMTP error'))
        .mockResolvedValueOnce(undefined);
      await expect(service.checkAndNotify(TODAY)).resolves.not.toThrow();
      expect(emailService.sendUnscheduledProtocolsAlert).toHaveBeenCalledTimes(
        2,
      );
    });

    it('no envía correo si no hay destinatarios con rol SECRETARIA/PRESIDENTE', async () => {
      meetingRepo.findAssignedVersionsWithoutScheduledMeeting.mockResolvedValue(
        [SNAP_COND1],
      );
      userRepo.findByRoleCodes.mockResolvedValue([]);
      await service.checkAndNotify(TODAY);
      expect(emailService.sendUnscheduledProtocolsAlert).not.toHaveBeenCalled();
    });

    it('lee parámetros de SystemParamsService', async () => {
      meetingRepo.findAssignedVersionsWithoutScheduledMeeting.mockResolvedValue(
        [SNAP_NONE],
      );
      await service.checkAndNotify(TODAY);
      expect(systemParams.get).toHaveBeenCalledWith(
        'dias_max_sin_convocatoria',
      );
      expect(systemParams.get).toHaveBeenCalledWith(
        'dias_alerta_normativo_sin_convocatoria',
      );
    });

    it('pide destinatarios con roles SECRETARIA y PRESIDENTE', async () => {
      meetingRepo.findAssignedVersionsWithoutScheduledMeeting.mockResolvedValue(
        [SNAP_COND1],
      );
      await service.checkAndNotify(TODAY);
      expect(userRepo.findByRoleCodes).toHaveBeenCalledWith([
        RoleCode.SECRETARIA,
        RoleCode.PRESIDENTE,
      ]);
    });
  });
});
