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
      deadlineDate: new Date('2026-10-15T23:59:59.999Z'),
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
      'https://ceish.espoch.edu.ec/evaluations/asg-101/panel',
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
      deadlineDate: new Date('2026-10-15T23:59:59.999Z'),
    };

    await adapter.handleEvaluatorAssignedEvent(payload);

    expect(mailerServiceMock.sendMail).toHaveBeenCalledTimes(1);
    const mailOptions = (
      mailerServiceMock.sendMail.mock.calls as Array<
        [{ to: string; subject: string; html: string }]
      >
    )[0][0];

    expect(mailOptions.html).toContain(
      'https://ceish.espoch.edu.ec/evaluations/asg-102/panel',
    );
    expect(mailOptions.html).not.toContain(
      'RESPONSABILIDAD ADICIONAL: Ha sido seleccionado para diligenciar el Anexo 10',
    );
  });
});
