import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { ProtocolsModule } from './modules/protocols/protocols.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EncryptionService } from './shared/encryption/encryption.service';
import { setEncryptionService } from './shared/encryption/encryption.transformer';

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
    AuthModule,
    ProtocolsModule,
    DocumentsModule,
  ],
  controllers: [],
  providers: [EncryptionService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly encryptionService: EncryptionService) {}

  onModuleInit() {
    setEncryptionService(this.encryptionService);
  }
}
