import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResolutionOrmEntity } from './infrastructure/database/resolution.entity.orm';
import { ResolutionTypeOrmEntity } from './infrastructure/database/resolution-type.entity.orm';
import { ResolutionsService } from './application/services/resolutions.service';
import { ResolutionsController } from './infrastructure/controllers/resolutions.controller';
import { CartaFirmadaOrmEntity } from './infrastructure/database/carta-firmada.entity.orm';
import { VersionSubsanacionService } from './application/services/version-subsanacion.service';
import { ResultadoResolucionService } from './application/services/resultado-resolucion.service';
import { CartasFirmadasService } from './application/services/cartas-firmadas.service';
import { CartasFirmadasController } from './infrastructure/controllers/cartas-firmadas.controller';
import { ProtocolsModule } from '../protocols/protocols.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { ReceptionOrmEntity } from '../reception/infrastructure/database/reception.entity.orm';
import { ProtocolRequirementOrmEntity } from '../protocols/infrastructure/database/protocol-requirement.entity.orm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResolutionOrmEntity,
      ResolutionTypeOrmEntity,
      ReceptionOrmEntity,
      ProtocolRequirementOrmEntity,
      CartaFirmadaOrmEntity,
    ]),
    ProtocolsModule,
    EvaluationsModule,
  ],
  controllers: [ResolutionsController, CartasFirmadasController],
  providers: [
    ResolutionsService,
    CartasFirmadasService,
    VersionSubsanacionService,
    ResultadoResolucionService,
  ],
  exports: [ResolutionsService],
})
export class ResolutionsModule {}
