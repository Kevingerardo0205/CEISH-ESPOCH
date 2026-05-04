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
    token: string,
    name: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/auth/reset-password?token=${token}`;
    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Restablecer contraseña - CEISH-ESPOCH',
      html: getPasswordResetTemplate(name, url),
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Bienvenido a CEISH-ESPOCH',
      html: getWelcomeTemplate(name),
    });
  }

  async sendEmailConfirmation(
    email: string,
    token: string,
    name: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/auth/confirm-email?token=${token}`;
    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Confirma tu correo electrónico - CEISH-ESPOCH',
      html: getEmailConfirmationTemplate(name, url),
    });
  }
}
