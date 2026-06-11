import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailServicePort } from '../../domain/ports/email.service.port';
import * as templates from '../templates/email-templates';

@Injectable()
export class NodemailerEmailAdapter implements IEmailServicePort {
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true para 465, false para otros
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
    this.fromEmail = this.configService.get(
      'EMAIL_FROM',
      'noreply@espoch.edu.ec',
    );
  }

  async sendPasswordReset(
    email: string,
    code: string,
    name: string,
  ): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: 'Recuperación de Contraseña - CEISH-ESPOCH',
      html: templates.getPasswordResetTemplate(name, code),
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: 'Bienvenido a CEISH-ESPOCH',
      html: templates.getWelcomeTemplate(name),
    });
  }

  async sendEmailConfirmation(
    email: string,
    code: string,
    name: string,
  ): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: 'Confirmación de Correo - CEISH-ESPOCH',
      html: templates.getEmailConfirmationTemplate(name, code),
    });
  }

  async sendAccountInvitation(
    email: string,
    otp: string,
    name: string,
  ): Promise<void> {
    const setupUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:4200')}/auth/setup-account?email=${email}`;
    await this.sendMailWithRetry({
      to: email,
      subject: 'Invitación al Sistema - CEISH-ESPOCH',
      html: templates.getAccountInvitationTemplate(name, otp, setupUrl),
    });
  }

  async sendReceptionIncomplete(
    email: string,
    name: string,
    protocolTitle: string,
    missingItems: string,
    deadline: Date,
  ): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: 'Notificación de Documentación Incompleta - CEISH',
      html: templates.getReceptionIncompleteTemplate(
        name,
        protocolTitle,
        missingItems,
        deadline.toLocaleDateString(),
      ),
    });
  }

  async sendReceptionComplete(
    email: string,
    name: string,
    protocolTitle: string,
    ceishCode: string,
    pdfBuffer: Buffer,
  ): Promise<void> {
    await this.sendMailWithRetry({
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
    const attachments = [
      {
        filename: `Resolucion_${ceishCode}.pdf`,
        content: pdfBuffer,
      },
    ];

    if (additionalAttachments && additionalAttachments.length > 0) {
      attachments.push(...additionalAttachments);
    }

    await this.sendMailWithRetry({
      to: email,
      subject: `Resolución de Comité: ${ceishCode} - ${decision}`,
      html: templates.getResolutionEmailTemplate(
        name,
        protocolTitle,
        ceishCode,
        decision,
      ),
      attachments,
    });
  }

  async notifyPresidentNewProtocol(
    presidentEmail: string,
    protocolTitle: string,
    ceishCode: string,
  ): Promise<void> {
    await this.sendMailWithRetry({
      to: presidentEmail,
      subject: 'Nuevo Protocolo para Asignación - CEISH',
      html: templates.getPresidentNotificationTemplate(
        protocolTitle,
        ceishCode,
      ),
    });
  }

  async sendEvaluationAssignment(
    email: string,
    name: string,
    protocolCode: string,
    deadline: Date,
  ): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: `Nueva Asignación de Evaluación: ${protocolCode}`,
      html: templates.getEvaluationAssignmentTemplate(
        name,
        protocolCode,
        deadline.toLocaleDateString(),
      ),
    });
  }

  async sendEvaluationSubmitted(
    email: string,
    evaluatorName: string,
    protocolCode: string,
  ): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: `Evaluación Recibida: ${protocolCode}`,
      html: templates.getEvaluationSubmittedTemplate(
        evaluatorName,
        protocolCode,
      ),
    });
  }

  private async sendMailWithRetry(
    mailOptions: any,
    retries = 3,
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.transporter.sendMail({
          from: this.fromEmail,
          ...mailOptions,
        });
        console.log(`Email enviado exitosamente a ${mailOptions.to}`);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        console.warn(
          `Fallo envío de email, reintentando (${i + 1}/${retries})...`,
        );
        await new Promise((res) => setTimeout((resolve) => res(true), 1000));
      }
    }
  }
}
