import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceptionOrmEntity } from './infrastructure/database/reception.entity.orm';
import { DocumentOrmEntity } from '../documents/infrastructure/database/document.entity.orm';
import { DocumentValidationOrmEntity } from './infrastructure/database/document-validation.entity.orm';
import { ProtocolRequirementOrmEntity } from '../protocols/infrastructure/database/protocol-requirement.entity.orm';
import { ProtocolVersionOrmEntity } from '../evaluations/infrastructure/database/protocol-version.entity.orm';
import { ReceptionService } from './application/services/reception.service';
import { ReceptionController } from './infrastructure/controllers/reception.controller';
import { IReceptionRepository } from './domain/ports/reception.repository.port';
import { ReceptionTypeOrmRepository } from './infrastructure/repositories/reception.typeorm.repository';
import { ProtocolsModule } from '../protocols/protocols.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReceptionOrmEntity,
      DocumentOrmEntity,
      DocumentValidationOrmEntity,
      ProtocolRequirementOrmEntity,
      ProtocolVersionOrmEntity,
    ]),
    forwardRef(() => ProtocolsModule),
  ],

  controllers: [ReceptionController],
  providers: [
    ReceptionService,
    {
      provide: IReceptionRepository,
      useClass: ReceptionTypeOrmRepository,
    },
  ],
  exports: [ReceptionService],
})
export class ReceptionModule {}
