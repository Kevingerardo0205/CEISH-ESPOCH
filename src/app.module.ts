import { Module, OnModuleInit, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { ProtocolsModule } from './modules/protocols/protocols.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReceptionModule } from './modules/reception/reception.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { ResolutionsModule } from './modules/resolutions/resolutions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { EncryptionService } from './shared/encryption/encryption.service';
import { setEncryptionService } from './shared/encryption/encryption.transformer';
import { DosDefenseMiddleware } from './shared/middleware/dos-defense.middleware';
import { ThrottleExceptionFilter } from './shared/filters/throttle-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        if (!config) {
          throw new Error('Database configuration not found');
        }
        return config;
      },
    }),
    // Doble capa de protección ThrottlerModule — ISO 8.14 (Redundancia)
    // Capa short : protección burst   — máx 5 req/segundo
    // Capa medium: protección media   — máx 100 req/minuto
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1_000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    AuthModule,
    AuditModule,
    ProtocolsModule,
    DocumentsModule,
    ReceptionModule,
    EvaluationsModule,
    ResolutionsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [
    EncryptionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Filtro global: añade headers RFC 6585 a respuestas 429 del ThrottlerGuard
    {
      provide: APP_FILTER,
      useClass: ThrottleExceptionFilter,
    },
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(private readonly encryptionService: EncryptionService) {}

  onModuleInit() {
    setEncryptionService(this.encryptionService);
  }

  /**
   * Registra DosDefenseMiddleware globalmente para TODAS las rutas.
   * Se ejecuta ANTES que cualquier guard o controlador (orden NestJS:
   * Middleware → Guards → Interceptors → Controllers).
   * Cumple NIST SC-5 (DoS Protection).
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DosDefenseMiddleware)
      .forRoutes('*');
  }
}
