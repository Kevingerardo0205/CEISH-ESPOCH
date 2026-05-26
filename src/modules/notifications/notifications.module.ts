import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IEmailServicePort } from './domain/ports/email.service.port';
import { ResendEmailAdapter } from './infrastructure/adapters/resend-email.adapter';
import { PdfGeneratorService } from '../../shared/utils/pdf-generator.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: IEmailServicePort,
      useClass: ResendEmailAdapter,
    },
    PdfGeneratorService,
  ],
  exports: [IEmailServicePort, PdfGeneratorService],
})
export class NotificationsModule {}
