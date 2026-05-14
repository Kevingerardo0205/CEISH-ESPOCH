import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IEmailServicePort } from './domain/ports/email.service.port';
import { NodemailerEmailAdapter } from './infrastructure/adapters/nodemailer-email.adapter';
import { PdfGeneratorService } from '../../shared/utils/pdf-generator.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: IEmailServicePort,
      useClass: NodemailerEmailAdapter,
    },
    PdfGeneratorService,
  ],
  exports: [IEmailServicePort, PdfGeneratorService],
})
export class NotificationsModule {}
