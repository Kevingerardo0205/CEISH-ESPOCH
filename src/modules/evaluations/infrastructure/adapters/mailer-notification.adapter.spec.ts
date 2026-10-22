import { Logger } from '@nestjs/common';
import { MailerNotificationAdapter } from './mailer-notification.adapter';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';

describe('MailerNotificationAdapter (TSK-002-16)', () => {
  let mailerServiceMock: { sendMail: jest.Mock };
  let adapter: MailerNotificationAdapter;

  beforeEach(() => {
    mailerServiceMock = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };
    adapter = new MailerNotificationAdapter(
      mailerServiceMock,
      'https://ceish.espoch.edu.ec',
    );
  });

  it('should format email with Deep-Linking URL and Annex 10 warning when isAssignedForAnnex10 = true', async () => {
    const payload = {
      assignmentId: 'asg-101',
      protocolId: 'prot-202',
      evaluatorId: 'eval-303',
      evaluatorEmail: 'evaluador@espoch.edu.ec',
      evaluatorFullName: 'Dr. Fernando Morales',
      protocolCode: 'CEISH-ESPOCH-EI-004-2026',
      evaluatorProfile: EvaluatorProfile.JURIDICO,
      isAssignedForAnnex10: true,
      deadlineDate: '2026-10-15',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.to).toBe('evaluador@espoch.edu.ec');
    expect(mailOptions.subject).toContain(
      'Asignación de Evaluación Ética - CEISH-ESPOCH-EI-004-2026',
    );
    expect(mailOptions.html).toContain(
      'https://ceish.espoch.edu.ec/dashboard/evaluations/evaluate/asg-101',
    );
    expect(mailOptions.html).toContain(
      'RESPONSABILIDAD ADICIONAL:</strong> Ha sido seleccionado para diligenciar el <strong>Anexo 10 (Estratificación de Riesgo)',
    );
  });

  it('should format email without Annex 10 warning when isAssignedForAnnex10 = false', async () => {
    const payload = {
      assignmentId: 'asg-102',
      protocolId: 'prot-202',
      evaluatorId: 'eval-304',
      evaluatorEmail: 'sociedad@espoch.edu.ec',
      evaluatorFullName: 'Msc. Lucía Paredes',
      protocolCode: 'CEISH-ESPOCH-EI-004-2026',
      evaluatorProfile: EvaluatorProfile.SOCIEDAD_CIVIL,
      isAssignedForAnnex10: false,
      deadlineDate: '2026-10-15',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).toContain(
      'https://ceish.espoch.edu.ec/dashboard/evaluations/evaluate/asg-102',
    );
  });

  it('should skip sending and log warning when evaluatorEmail is absent (TSK-002-N17)', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const payload = {
      assignmentId: 'asg-200',
      protocolId: 'prot-200',
      evaluatorId: 'eval-200',
      evaluatorProfile: EvaluatorProfile.JURIDICO,
      isAssignedForAnnex10: false,
      deadlineDate: '2026-10-15',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    expect(mailerServiceMock.sendMail).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('asg-200'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('prot-200'));

    warnSpy.mockRestore();
  });

  it('N09-U-01: debe incluir el nombre real del evaluador en el HTML del correo (TSK-002-N09)', async () => {
    const payload = {
      assignmentId: 'asg-500',
      protocolId: 'prot-500',
      evaluatorId: 'eval-500',
      evaluatorEmail: 'real@espoch.edu.ec',
      evaluatorFullName: 'Dra. Carmen Salazar',
      protocolCode: 'CEISH-ESPOCH-EI-009-2026',
      evaluatorProfile: EvaluatorProfile.SALUD,
      isAssignedForAnnex10: false,
      deadlineDate: '2026-11-01',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).toContain('Dra. Carmen Salazar');
    expect(mailOptions.html).not.toContain('Evaluador(a)');
    expect(mailOptions.html).toContain('CEISH-ESPOCH-EI-009-2026');
  });

  it('N19-U-01: el enlace del correo apunta a /dashboard/evaluations/evaluate/:id (TSK-002-N19)', async () => {
    const payload = {
      assignmentId: 'asg-600',
      protocolId: 'prot-600',
      evaluatorId: 'eval-600',
      evaluatorEmail: 'n19@espoch.edu.ec',
      evaluatorFullName: 'Dr. Luis Ríos',
      protocolCode: 'CEISH-ESPOCH-EI-010-2026',
      evaluatorProfile: EvaluatorProfile.METODOLOGICO,
      isAssignedForAnnex10: false,
      deadlineDate: '2026-11-15',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).toContain(
      'https://ceish.espoch.edu.ec/dashboard/evaluations/evaluate/asg-600',
    );
    expect(mailOptions.html).not.toContain('/evaluations/asg-600/panel');
  });

  it('N19-U-02: sin assignmentId usa el enlace de lista como fallback (TSK-002-N19)', async () => {
    const payload = {
      assignmentId: '',
      protocolId: 'prot-700',
      evaluatorId: 'eval-700',
      evaluatorEmail: 'fallback@espoch.edu.ec',
      evaluatorFullName: 'Mg. Ana Torres',
      protocolCode: 'CEISH-ESPOCH-EI-011-2026',
      evaluatorProfile: EvaluatorProfile.JURIDICO,
      isAssignedForAnnex10: false,
      deadlineDate: '2026-11-20',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).toContain(
      'https://ceish.espoch.edu.ec/dashboard/evaluations/list',
    );
  });

  it('N09-U-02: deadlineDate null → texto alternativo, sin "1970" ni "Invalid Date"', async () => {
    const payload = {
      assignmentId: 'asg-701',
      protocolId: 'prot-701',
      evaluatorId: 'eval-701',
      evaluatorEmail: 'nulldate@espoch.edu.ec',
      evaluatorFullName: 'Dr. Prueba Nula',
      protocolCode: 'CEISH-ESPOCH-EI-012-2026',
      evaluatorProfile: EvaluatorProfile.SALUD,
      isAssignedForAnnex10: false,
      deadlineDate: null,
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).not.toContain('1970');
    expect(mailOptions.html).not.toContain('Invalid Date');
    expect(mailOptions.html).toContain(
      'La fecha límite de entrega será comunicada por la Secretaría.',
    );
  });

  it('N09-U-03: deadlineDate undefined → texto alternativo, sin "1970" ni "Invalid Date"', async () => {
    const payload = {
      assignmentId: 'asg-702',
      protocolId: 'prot-702',
      evaluatorId: 'eval-702',
      evaluatorEmail: 'undefdate@espoch.edu.ec',
      evaluatorFullName: 'Dr. Prueba Undef',
      protocolCode: 'CEISH-ESPOCH-EI-013-2026',
      evaluatorProfile: EvaluatorProfile.METODOLOGICO,
      isAssignedForAnnex10: false,
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).not.toContain('1970');
    expect(mailOptions.html).not.toContain('Invalid Date');
    expect(mailOptions.html).toContain(
      'La fecha límite de entrega será comunicada por la Secretaría.',
    );
  });

  it('N09-U-04: deadlineDate cadena vacía → texto alternativo, sin "1970" ni "Invalid Date"', async () => {
    const payload = {
      assignmentId: 'asg-703',
      protocolId: 'prot-703',
      evaluatorId: 'eval-703',
      evaluatorEmail: 'emptydate@espoch.edu.ec',
      evaluatorFullName: 'Dr. Prueba Vacía',
      protocolCode: 'CEISH-ESPOCH-EI-014-2026',
      evaluatorProfile: EvaluatorProfile.JURIDICO,
      isAssignedForAnnex10: false,
      deadlineDate: '',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).not.toContain('1970');
    expect(mailOptions.html).not.toContain('Invalid Date');
    expect(mailOptions.html).toContain(
      'La fecha límite de entrega será comunicada por la Secretaría.',
    );
  });

  it('should format date string 2026-03-12 correctly as 12 de marzo de 2026 even under America/Guayaquil timezone', async () => {
    const payload = {
      assignmentId: 'asg-103',
      protocolId: 'prot-202',
      evaluatorId: 'eval-305',
      evaluatorEmail: 'medico@espoch.edu.ec',
      evaluatorFullName: 'Dr. Roberto Gomez',
      protocolCode: 'CEISH-ESPOCH-EI-005-2026',
      evaluatorProfile: EvaluatorProfile.SALUD,
      isAssignedForAnnex10: false,
      deadlineDate: '2026-03-12',
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).toContain('12 de marzo de 2026');
  });
});
