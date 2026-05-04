import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IEmailServicePort } from './domain/ports/email.service.port';
import { ResendEmailAdapter } from './infrastructure/adapters/resend-email.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: IEmailServicePort,
      useClass: ResendEmailAdapter,
    },
  ],
  exports: [IEmailServicePort],
})
export class NotificationsModule {}
