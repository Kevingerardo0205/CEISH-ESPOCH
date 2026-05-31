import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IEmailServicePort } from '../../domain/ports/email.service.port';
import * as templates from '../templates/email-templates';

@Injectable()
export class ResendEmailAdapter implements IEmailServicePort {
  private resend: Resend;
  private readonly fromEmail: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>(
      'EMAIL_FROM',
      'onboarding@resend.dev',
    );
    this.baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
  }

  async sendPasswordReset(
    email: string,
    code: string,
    name: string,
  ): Promise<void> {
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Código de recuperación - CEISH-ESPOCH',
        html: templates.getPasswordResetTemplate(name, code),
      });
      console.log('Código de recuperación enviado:', data);
    } catch (error) {
      console.error('Error enviando código de recuperación:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Bienvenido a CEISH-ESPOCH',
        html: templates.getWelcomeTemplate(name),
      });
      console.log('Email de bienvenida enviado:', data);
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      throw error;
    }
  }

  async sendEmailConfirmation(
    email: string,
    code: string,
    name: string,
  ): Promise<void> {
    try {
      // 🚀 LOG PARA PRUEBAS: Copia el código de aquí si no lo ves en el correo
      console.log('-----------------------------------------');
      console.log(`[AUTH] Código de verificación para ${email}: ${code}`);
      console.log('-----------------------------------------');

      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Código de confirmación - CEISH-ESPOCH',
        html: templates.getEmailConfirmationTemplate(name, code),
      });
      console.log('Código de confirmación enviado:', data);
    } catch (error) {
      console.error('Error enviando código de confirmación:', error);
      throw error;
    }
  }

  async sendAccountInvitation(
    email: string,
    otp: string,
    name: string,
  ): Promise<void> {
    try {
      console.log('-----------------------------------------');
      console.log(`[INVITATION] Código de invitación para ${email}: ${otp}`);
      console.log('-----------------------------------------');

      const setupUrl = `${this.baseUrl}/auth/setup-account?email=${email}`;
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Invitación a CEISH-ESPOCH - Configuración de Cuenta',
        html: templates.getAccountInvitationTemplate(name, otp, setupUrl),
      });
      console.log('Invitación enviada:', data);
    } catch (error) {
      console.error('Error enviando invitación:', error);
      throw error;
    }
  }

  async sendReceptionIncomplete(
    email: string,
    name: string,
    protocolTitle: string,
    missingItems: string,
    deadline: Date,
  ): Promise<void> {
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Notificación de Documentación Incompleta - CEISH',
        html: templates.getReceptionIncompleteTemplate(
          name,
          protocolTitle,
          missingItems,
          deadline.toLocaleDateString(),
        ),
      });
      console.log('Notificación de documentación incompleta enviada:', data);
    } catch (error) {
      console.error('Error enviando notificación incompleta:', error);
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
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Constancia de Recepción - ${ceishCode}`,
        html: templates.getReceptionCompleteTemplate(
          name,
          protocolTitle,
          ceishCode,
        ),
        attachments: [
          {
            filename: `Constancia_Recepcion_${ceishCode}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      console.log('Constancia de recepción completa enviada:', data);
    } catch (error) {
      console.error('Error enviando constancia completa:', error);
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
  ): Promise<void> {
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Resolución de Comité: ${ceishCode} - ${decision}`,
        html: templates.getResolutionEmailTemplate(
          name,
          protocolTitle,
          ceishCode,
          decision,
        ),
        attachments: [
          {
            filename: `Resolucion_${ceishCode}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
      console.log('Email de resolución enviado:', data);
    } catch (error) {
      console.error('Error enviando email de resolución:', error);
      throw error;
    }
  }

  async notifyPresidentNewProtocol(
    presidentEmail: string,
    protocolTitle: string,
    ceishCode: string,
  ): Promise<void> {
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: presidentEmail,
        subject: 'Nuevo Protocolo para Asignación - CEISH',
        html: templates.getPresidentNotificationTemplate(
          protocolTitle,
          ceishCode,
        ),
      });
      console.log('Notificación al presidente enviada:', data);
    } catch (error) {
      console.error('Error enviando notificación al presidente:', error);
      throw error;
    }
  }

  async sendEvaluationAssignment(
    email: string,
    name: string,
    protocolCode: string,
    deadline: Date,
  ): Promise<void> {
    try {
      const formattedDate = deadline.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Nueva Asignación CEISH: ${protocolCode}`,
        html: templates.getEvaluationAssignmentTemplate(
          name,
          protocolCode,
          formattedDate,
        ),
      });
      console.log('Email de asignación enviado:', data);
    } catch (error) {
      console.error('Error enviando email de asignación:', error);
      throw error;
    }
  }

  async sendEvaluationSubmitted(
    email: string,
    evaluatorName: string,
    protocolCode: string,
  ): Promise<void> {
    try {
      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Evaluación Recibida: ${protocolCode}`,
        html: templates.getEvaluationSubmittedTemplate(
          evaluatorName,
          protocolCode,
        ),
      });
      console.log('Email de evaluación finalizada enviado:', data);
    } catch (error) {
      console.error('Error enviando email de evaluación finalizada:', error);
      throw error;
    }
  }
}
