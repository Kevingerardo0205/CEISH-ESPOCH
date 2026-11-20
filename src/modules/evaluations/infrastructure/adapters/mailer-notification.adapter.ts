import { Injectable, Logger } from '@nestjs/common';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { toDayMonthYear } from '../../../../shared/services/deadline-calculator.service';

export interface EvaluatorAssignedEventPayload {
  assignmentId: string;
  protocolId: string;
  evaluatorId: string;
  evaluatorEmail?: string;
  evaluatorFullName?: string;
  protocolCode?: string;
  evaluatorProfile: EvaluatorProfile;
  isAssignedForAnnex10: boolean;
  deadlineDate?: string | null;
  isReassignment?: boolean;
  /** Oficio al asignar (RF-12.6, TSK-002-N52): días laborables del plazo de evaluación. */
  reviewBusinessDays?: number;
  /** Fecha límite del plazo de evaluación (YYYY-MM-DD, America/Guayaquil). */
  reviewDeadlineDate?: string | null;
  protocolTitle?: string | null;
}

export interface IMailerService {
  sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}

@Injectable()
export class MailerNotificationAdapter {
  private readonly logger = new Logger(MailerNotificationAdapter.name);

  constructor(
    private readonly mailerService: IMailerService,
    private readonly baseUrl: string = 'http://localhost:3000',
  ) {}

  /**
   * Manejador de eventos de asignación/reasignación con formato Deep-Linking [RF-12.6]
   */
  public async handleEvaluatorAssignedEvent(
    payload: EvaluatorAssignedEventPayload,
  ): Promise<void> {
    if (!payload.evaluatorEmail) {
      this.logger.warn(
        `[N17] evaluatorEmail ausente para assignmentId=${payload.assignmentId}, protocolId=${payload.protocolId}. Correo no enviado.`,
      );
      return;
    }
    const recipientEmail = payload.evaluatorEmail;
    const evaluatorName =
      payload.evaluatorFullName ?? 'Estimado(a) Evaluador(a)';
    const protocolCode = payload.protocolCode ?? payload.protocolId;
    const deepLinkUrl = payload.assignmentId
      ? `${this.baseUrl}/dashboard/evaluations/evaluate/${payload.assignmentId}`
      : `${this.baseUrl}/dashboard/evaluations/list`;
    const rawDeadline = payload.deadlineDate || null;
    const deadlineDateObj = rawDeadline ? new Date(rawDeadline) : null;
    const hasConvocatoriaDeadline =
      deadlineDateObj !== null && !isNaN(deadlineDateObj.getTime());
    const isAssignmentOficio = payload.reviewBusinessDays !== undefined;
    let deadlineSection: string;
    if (isAssignmentOficio) {
      // RF-12.6: plazo de evaluación con su fecha límite y fecha de entrega del informe
      const reviewDeadline = toDayMonthYear(payload.reviewDeadlineDate);
      const deliveryDate = hasConvocatoriaDeadline
        ? toDayMonthYear(rawDeadline)
        : null;
      deadlineSection = `
        <p><strong>Plazo de evaluación:</strong> ${payload.reviewBusinessDays} días laborables desde el día de la asignación${reviewDeadline ? `; fecha límite: <strong>${reviewDeadline}</strong>` : ''}.</p>
        ${
          deliveryDate
            ? `<p><strong>Fecha de entrega del informe (convocatoria):</strong> ${deliveryDate}</p>`
            : `<p>La fecha de entrega del informe será la fecha de entrega de la convocatoria en que se agende el protocolo.</p>`
        }
      `;
    } else {
      deadlineSection = hasConvocatoriaDeadline
        ? `<p><strong>Fecha límite normativo de entrega:</strong> ${deadlineDateObj.toLocaleDateString('es-EC', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</p>`
        : `<p>La fecha límite de entrega será comunicada por la Secretaría.</p>`;
    }

    const subject = payload.isReassignment
      ? `[REASIGNACIÓN] Evaluación Ética - Protocolo ${protocolCode}`
      : `Asignación de Evaluación Ética - ${protocolCode}`;

    let annex10Notice = '';
    if (payload.isAssignedForAnnex10) {
      annex10Notice = `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 16px 0;">
          <strong>RESPONSABILIDAD ADICIONAL:</strong> Ha sido seleccionado para diligenciar el <strong>Anexo 10 (Estratificación de Riesgo)</strong>, además del Anexo 9 e Informe Narrativo habitual.
        </div>
      `;
    } else if (isAssignmentOficio) {
      annex10Notice = `<p>No debe diligenciar el <strong>Anexo 10 (Estratificación de Riesgo)</strong>.</p>`;
    }

    const titleSection = payload.protocolTitle
      ? `<p><strong>Título del protocolo:</strong> ${payload.protocolTitle}</p>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Comité de Ética en Investigación en Seres Humanos (CEISH-ESPOCH)</h2>
        <p>Estimado(a) <strong>${evaluatorName}</strong>,</p>
        <p>Se le ha asignado la revisión del expediente correspondiente al protocolo de investigación con código oficial <strong>${protocolCode}</strong> bajo el perfil de <strong>${payload.evaluatorProfile}</strong>.</p>
        ${titleSection}
        
        ${annex10Notice}

        ${deadlineSection}
        
        <p style="margin-top: 24px;">
          <a href="${deepLinkUrl}" style="background-color: #0056b3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Acceder al Panel de Evaluación del Protocolo
          </a>
        </p>
        <p style="font-size: 12px; color: #666; margin-top: 16px;">Si el botón no funciona, copie y pegue el siguiente enlace en su navegador: ${deepLinkUrl}</p>
      </div>
    `;

    await this.mailerService.sendMail({
      to: recipientEmail,
      subject,
      html,
    });
  }
}
