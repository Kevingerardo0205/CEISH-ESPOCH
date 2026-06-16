import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './infrastructure/controllers/documents.controller';
import { DocumentsService } from './application/services/documents.service';
import { DocumentOrmEntity } from './infrastructure/database/document.entity.orm';
import { ProtocolOrmEntity } from '../protocols/infrastructure/database/protocol.entity.orm';
import { DocumentTemplateOrmEntity } from './infrastructure/database/document-template.entity.orm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentOrmEntity,
      ProtocolOrmEntity,
      DocumentTemplateOrmEntity,
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
