import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IEmailServicePort } from '../../domain/ports/email.service.port';

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
      html: `<h3>Hola ${name}</h3><p>Tu código de recuperación es: <b>${code}</b></p>`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: 'Bienvenido a CEISH-ESPOCH',
      html: `<h3>Bienvenido ${name}</h3><p>Tu cuenta ha sido creada exitosamente.</p>`,
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
      html: `<h3>Hola ${name}</h3><p>Tu código de confirmación es: <b>${code}</b></p>`,
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
      html: `
        <h3>Bienvenido(a) ${name}</h3>
        <p>Se ha creado una cuenta institucional para usted en el sistema CEISH-ESPOCH.</p>
        <p>Para configurar su contraseña y activar su acceso, utilice el siguiente código de seguridad:</p>
        <h2 style="letter-spacing: 5px; color: #1a73e8;">${otp}</h2>
        <p>Puede completar la configuración haciendo clic en el siguiente enlace:</p>
        <p><a href="${setupUrl}" target="_blank" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Configurar mi Cuenta</a></p>
        <p>Si el botón no funciona, copie y pegue la siguiente dirección en su navegador:</p>
        <p>${setupUrl}</p>
        <p>Saludos cordiales,<br>Administración CEISH-ESPOCH</p>
      `,
    });
  }

  async sendReceptionIncomplete(
    email: string,
    name: string,
    protocolTitle: string,
    missingItems: string,
    deadline: Date,
  ): Promise<void> {
    const formattedDate = deadline.toLocaleDateString();
    await this.sendMailWithRetry({
      to: email,
      subject: 'Notificación de Documentación Incompleta - CEISH',
      html: `
        <h3>Estimado(a) ${name}</h3>
        <p>Se ha revisado su protocolo: <b>${protocolTitle}</b></p>
        <p>Se han encontrado las siguientes observaciones o documentos faltantes:</p>
        <pre>${missingItems}</pre>
        <p>Tiene un plazo de <b>15 días laborables</b> (hasta el ${formattedDate}) para subsanar estas observaciones en la plataforma.</p>
      `,
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
      html: `
        <h3>Estimado(a) ${name}</h3>
        <p>Nos complace informarle que la recepción documental de su protocolo <b>${protocolTitle}</b> ha sido completada exitosamente.</p>
        <p>Su código de trámite oficial es: <b>${ceishCode}</b></p>
        <p>Adjunto encontrará la constancia de recepción oficial.</p>
      `,
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
  ): Promise<void> {
    await this.sendMailWithRetry({
      to: email,
      subject: `Resolución de Comité: ${ceishCode} - ${decision}`,
      html: `
        <h3>Estimado(a) ${name}</h3>
        <p>El Comité de Ética de Investigación en Seres Humanos (CEISH-ESPOCH) ha emitido el dictamen final para su protocolo:</p>
        <ul>
          <li><b>Título:</b> ${protocolTitle}</li>
          <li><b>Código:</b> ${ceishCode}</li>
          <li><b>Resultado:</b> <b style="color: #2e7d32;">${decision}</b></li>
        </ul>
        <p>Adjunto a este correo encontrará la carta de resolución oficial en formato PDF.</p>
        <p>Saludos cordiales,<br>Secretaría CEISH-ESPOCH</p>
      `,
      attachments: [
        {
          filename: `Resolucion_${ceishCode}.pdf`,
          content: pdfBuffer,
        },
      ],
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
      html: `
        <h3>Notificación para Presidencia</h3>
        <p>Un nuevo protocolo ha completado la fase de recepción:</p>
        <ul>
          <li><b>Título:</b> ${protocolTitle}</li>
          <li><b>Código:</b> ${ceishCode}</li>
        </ul>
        <p>Por favor, proceda con la asignación de evaluadores.</p>
      `,
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
      html: `<h3>Hola ${name}</h3><p>Se le ha asignado el protocolo ${protocolCode} para su evaluación.</p><p>Fecha límite: ${deadline.toLocaleDateString()}</p>`,
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
      html: `<p>El evaluador ${evaluatorName} ha enviado su informe para el protocolo ${protocolCode}.</p>`,
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
