import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IEmailServicePort } from '../../domain/ports/email.service.port';
import {
  getEmailConfirmationTemplate,
  getPasswordResetTemplate,
  getWelcomeTemplate,
} from '../templates/email-templates';

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
        html: getPasswordResetTemplate(name, code),
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
        html: getWelcomeTemplate(name),
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
        html: getEmailConfirmationTemplate(name, code),
      });
      console.log('Código de confirmación enviado:', data);
    } catch (error) {
      console.error('Error enviando código de confirmación:', error);
      throw error;
    }
  }
}
