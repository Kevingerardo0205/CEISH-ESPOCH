import { Module } from '@nestjs/common';
import { SecretariaController } from './infrastructure/controllers/secretaria.controller';
import { PendingItemsService } from './application/services/pending-items.service';
import { IPendingItemsRepository } from './domain/ports/pending-items.repository.port';
import { PendingItemsTypeormRepository } from './infrastructure/repositories/pending-items.typeorm.repository';

/** spec-003 RF-ALR.f: vistas de trabajo de la Secretaría. */
@Module({
  controllers: [SecretariaController],
  providers: [
    PendingItemsService,
    {
      provide: IPendingItemsRepository,
      useClass: PendingItemsTypeormRepository,
    },
  ],
})
export class SecretariaModule {}
