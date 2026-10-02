import { Injectable } from '@nestjs/common';
import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';

export interface EvaluatorAssignedEventPayload {
  assignmentId: string;
  protocolId: string;
  evaluatorId: string;
  evaluatorEmail?: string;
  evaluatorFullName?: string;
  protocolCode?: string;
  evaluatorProfile: EvaluatorProfile;
  isAssignedForAnnex10: boolean;
  deadlineDate: Date;
  isReassignment?: boolean;
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
    const recipientEmail = payload.evaluatorEmail ?? 'evaluador@espoch.edu.ec';
    const evaluatorName =
      payload.evaluatorFullName ?? 'Estimado(a) Evaluador(a)';
    const protocolCode = payload.protocolCode ?? payload.protocolId;
    const deepLinkUrl = `${this.baseUrl}/evaluations/${payload.assignmentId}/panel`;
    const formattedDeadline = new Date(payload.deadlineDate).toLocaleDateString(
      'es-EC',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

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
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Comité de Ética en Investigación en Seres Humanos (CEISH-ESPOCH)</h2>
        <p>Estimado(a) <strong>${evaluatorName}</strong>,</p>
        <p>Se le ha asignado la revisión del expediente correspondiente al protocolo de investigación con código oficial <strong>${protocolCode}</strong> bajo el perfil de <strong>${payload.evaluatorProfile}</strong>.</p>
        
        ${annex10Notice}

        <p><strong>Fecha límite normativo de entrega:</strong> ${formattedDeadline}</p>
        
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
