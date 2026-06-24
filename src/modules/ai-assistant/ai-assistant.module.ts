import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAssistantController } from './infrastructure/controllers/ai-assistant.controller';
import { AiAssistantAdminController } from './infrastructure/controllers/ai-assistant-admin.controller';
import { GeminiService } from './application/services/gemini.service';
import { RagService } from './application/services/rag.service';
import { ContextService } from './application/services/context.service';
import { ProtocolsModule } from '../protocols/protocols.module';
import { AiAssistantConfigOrmEntity } from './infrastructure/database/ai-assistant-config.entity.orm';

@Module({
  imports: [
    ConfigModule,
    ProtocolsModule,
    TypeOrmModule.forFeature([AiAssistantConfigOrmEntity]),
  ],
  controllers: [
    AiAssistantController,
    AiAssistantAdminController,
  ],
  providers: [
    GeminiService,
    RagService,
    ContextService,
  ],
  exports: [
    GeminiService,
    RagService,
    ContextService,
    TypeOrmModule,
  ],
})
export class AiAssistantModule {}
