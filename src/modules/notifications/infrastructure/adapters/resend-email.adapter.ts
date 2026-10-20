import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IEmailServicePort } from '../../domain/ports/email.service.port';
import * as templates from '../templates/email-templates';

@Injectable()
export class ResendEmailAdapter implements IEmailServicePort {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  private resend: Resend;
  private readonly fromEmail: string;
  private readonly baseUrl: string;
  private readonly emailEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>(
      'EMAIL_FROM',
      'onboarding@resend.dev',
    );
    this.baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://localhost:4200',
    );
    this.emailEnabled =
      this.configService.get<boolean>('app.emailEnabled') ?? true;
  }

  private dryRun(email: string, subject: string): boolean {
    if (!this.emailEnabled) {
      this.logger.log(
        `[dry-run] Correo no enviado (EMAIL_ENABLED=false) — destinatario: ${email}, asunto: ${subject}`,
      );
      return true;
    }
    return false;
  }

  async sendPasswordReset(
    email: string,
    code: string,
    name: string,
  ): Promise<void> {
    const subject = 'Código de recuperación - CEISH-ESPOCH';
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getPasswordResetTemplate(name, code),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendPasswordReset: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(`sendPasswordReset exitoso, id: ${result.data?.id}`);
    } catch (error) {
      this.logger.error('Error enviando código de recuperación:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Bienvenido a CEISH-ESPOCH';
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getWelcomeTemplate(name),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendWelcomeEmail: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(`sendWelcomeEmail exitoso, id: ${result.data?.id}`);
    } catch (error) {
      this.logger.error('Error enviando email de bienvenida:', error);
      throw error;
    }
  }

  async sendEmailConfirmation(
    email: string,
    code: string,
    name: string,
  ): Promise<void> {
    const subject = 'Código de confirmación - CEISH-ESPOCH';
    if (this.dryRun(email, subject)) return;
    try {
      // OTP intencionalmente no incluido en logs.
      const confirmUrl = `${this.baseUrl}/auth/confirm-email?email=${encodeURIComponent(email)}`;
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getEmailConfirmationTemplate(name, code, confirmUrl),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendEmailConfirmation: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(`sendEmailConfirmation exitoso, id: ${result.data?.id}`);
    } catch (error) {
      this.logger.error('Error enviando código de confirmación:', error);
      throw error;
    }
  }

  async sendAccountInvitation(
    email: string,
    otp: string,
    name: string,
  ): Promise<void> {
    const subject = 'Invitación a CEISH-ESPOCH - Configuración de Cuenta';
    if (this.dryRun(email, subject)) return;
    try {
      // OTP intencionalmente no incluido en logs.
      const setupUrl = `${this.baseUrl}/auth/setup-account?email=${email}`;
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getAccountInvitationTemplate(name, otp, setupUrl),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendAccountInvitation: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(`sendAccountInvitation exitoso, id: ${result.data?.id}`);
    } catch (error) {
      this.logger.error('Error enviando invitación:', error);
      throw error;
    }
  }

  async sendReceptionIncomplete(
    email: string,
    name: string,
    protocolTitle: string,
    missingItems: string,
    deadline: Date,
    plazo: number,
  ): Promise<void> {
    const subject = 'Notificación de Documentación Incompleta - CEISH';
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getReceptionIncompleteTemplate(
          name,
          protocolTitle,
          missingItems,
          deadline.toLocaleDateString(),
          plazo,
        ),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendReceptionIncomplete: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(
        `sendReceptionIncomplete exitoso, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error('Error enviando notificación incompleta:', error);
      throw error;
    }
  }

  async sendReceptionComplete(
    email: string,
    name: string,
    protocolTitle: string,
    ceishCode: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    const subject = `Constancia de Recepción - ${ceishCode}`;
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getReceptionCompleteTemplate(
          name,
          protocolTitle,
          ceishCode,
        ),
        attachments: [
          {
            filename: `Constancia_Recepcion_${ceishCode}.pdf`,
            content: pdfBuffer.toString('base64'),
          },
        ],
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendReceptionComplete: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(`sendReceptionComplete exitoso, id: ${result.data?.id}`);
    } catch (error) {
      this.logger.error('Error enviando constancia completa:', error);
      throw error;
    }
  }

  async sendResolutionEmail(
    email: string,
    name: string,
    protocolTitle: string,
    ceishCode: string,
    decision: string,
    pdfBuffer: Buffer,
    additionalAttachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<void> {
    const subject = `Resolución de Comité: ${ceishCode} - ${decision}`;
    if (this.dryRun(email, subject)) return;
    try {
      const attachments = [
        {
          filename: `Resolucion_${ceishCode}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ];

      if (additionalAttachments && additionalAttachments.length > 0) {
        attachments.push(
          ...additionalAttachments.map((att) => ({
            filename: att.filename,
            content: att.content.toString('base64'),
          })),
        );
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getResolutionEmailTemplate(
          name,
          protocolTitle,
          ceishCode,
          decision,
        ),
        attachments,
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendResolutionEmail: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(`sendResolutionEmail exitoso, id: ${result.data?.id}`);
    } catch (error) {
      this.logger.error('Error enviando email de resolución:', error);
      throw error;
    }
  }

  async notifyPresidentNewProtocol(
    presidentEmail: string,
    protocolTitle: string,
    ceishCode: string,
  ): Promise<void> {
    const subject = 'Nuevo Protocolo para Asignación - CEISH';
    if (this.dryRun(presidentEmail, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: presidentEmail,
        subject,
        html: templates.getPresidentNotificationTemplate(
          protocolTitle,
          ceishCode,
        ),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en notifyPresidentNewProtocol: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(
        `notifyPresidentNewProtocol exitoso, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error('Error enviando notificación al presidente:', error);
      throw error;
    }
  }

  async sendEvaluationAssignment(
    email: string,
    name: string,
    protocolCode: string,
    deadline: Date | null,
  ): Promise<void> {
    const subject = `Nueva Asignación CEISH: ${protocolCode}`;
    if (this.dryRun(email, subject)) return;
    try {
      const formattedDate = deadline
        ? deadline.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Se informará al agendar la convocatoria';

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getEvaluationAssignmentTemplate(
          name,
          protocolCode,
          formattedDate,
        ),
      });
      // N18: lanzar excepción en la ruta de asignación (absorbida por .catch() en evaluations.module.ts)
      if (result.error) {
        throw new Error(
          `[Resend] Error en sendEvaluationAssignment: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
      }
      this.logger.log(
        `sendEvaluationAssignment exitoso, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error('Error enviando email de asignación:', error);
      throw error;
    }
  }

  async sendEvaluationSubmitted(
    email: string,
    evaluatorName: string,
    protocolCode: string,
  ): Promise<void> {
    const subject = `Evaluación Recibida: ${protocolCode}`;
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getEvaluationSubmittedTemplate(
          evaluatorName,
          protocolCode,
        ),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendEvaluationSubmitted: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(
        `sendEvaluationSubmitted exitoso, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error(
        'Error enviando email de evaluación finalizada:',
        error,
      );
      throw error;
    }
  }

  async sendUnscheduledProtocolsAlert(
    email: string,
    name: string,
    protocols: Array<{ code: string; reason: string }>,
  ): Promise<void> {
    const subject = `Alerta CEISH: ${protocols.length} protocolo(s) sin convocatoria programada`;
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getUnscheduledProtocolsAlertTemplate(name, protocols),
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendUnscheduledProtocolsAlert: ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(
        `sendUnscheduledProtocolsAlert exitoso, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error(
        'Error enviando alerta de protocolos sin convocatoria:',
        error,
      );
      throw error;
    }
  }

  async sendRiskLevelDesignated(
    email: string,
    name: string,
    protocolCode: string,
    reviewType: string,
  ): Promise<void> {
    const subject = `CEISH: Nivel de riesgo designado — Protocolo ${protocolCode}`;
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: `<p>Estimado/a ${name},</p><p>El nivel de riesgo del protocolo <strong>${protocolCode}</strong> ha sido designado. La modalidad de revisión asignada es <strong>${reviewType}</strong>. Su dictamen de evaluación ha sido habilitado.</p>`,
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendRiskLevelDesignated (${email}): ${result.error.message}`,
        );
        return;
      }
      this.logger.log(
        `sendRiskLevelDesignated exitoso a ${email}, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando notificación de designación de riesgo a ${email}:`,
        error,
      );
      throw error;
    }
  }

  async sendRiskDiscrepancyAlert(
    email: string,
    protocolCode: string,
    codesProposed: string[],
  ): Promise<void> {
    const subject = `CEISH: Discrepancia de riesgo — Protocolo ${protocolCode}`;
    if (this.dryRun(email, subject)) return;
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: `<p>El protocolo <strong>${protocolCode}</strong> ha entrado en estado de discrepancia de riesgo. Niveles propuestos: ${codesProposed.join(' / ')}. Se requiere su intervención en pleno para designar el nivel definitivo.</p>`,
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendRiskDiscrepancyAlert (${email}): ${result.error.message}`,
        );
        return;
      }
      this.logger.log(
        `sendRiskDiscrepancyAlert exitoso a ${email}, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando alerta de discrepancia de riesgo:`,
        error,
      );
      throw error;
    }
  }

  async sendCallNotification(
    email: string,
    name: string,
    callCode: string,
    meetingDate: Date,
    meetingTime: string,
    placeName: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    const subject = `Convocatoria a Sesión de Comité Nro. ${callCode}`;
    if (this.dryRun(email, subject)) return;
    try {
      const formattedDate = meetingDate.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html: templates.getCallNotificationTemplate(
          name,
          callCode,
          formattedDate,
          meetingTime,
          placeName,
        ),
        attachments: [
          {
            filename: `Convocatoria_${callCode}.pdf`,
            content: pdfBuffer.toString('base64'),
          },
        ],
      });
      if (result.error) {
        this.logger.error(
          `[Resend] Error en sendCallNotification (${email}): ${result.error.message} (${(result.error as { statusCode?: number }).statusCode ?? 'N/A'})`,
        );
        return;
      }
      this.logger.log(
        `sendCallNotification exitoso a ${email}, id: ${result.data?.id}`,
      );
    } catch (error) {
      this.logger.error(`Error enviando convocatoria a ${email}:`, error);
      throw error;
    }
  }
}
