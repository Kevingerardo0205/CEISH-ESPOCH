import { Module, forwardRef } from '@nestjs/common';
import { ProtocolsModule } from '../protocols/protocols.module';
import { ReceptionModule } from '../reception/reception.module';
import { StorageKeyAccessPolicy } from './application/storage-key-access.policy';
import { StorageController } from './infrastructure/controllers/storage.controller';

/**
 * TSK-015-N22a: rutas /storage/download-url y política de acceso por clave y por documento.
 * IStorageService (puerto y adaptador) sigue en shared/storage y es global.
 */
@Module({
  imports: [
    forwardRef(() => ProtocolsModule),
    forwardRef(() => ReceptionModule),
  ],
  controllers: [StorageController],
  providers: [StorageKeyAccessPolicy],
  exports: [StorageKeyAccessPolicy],
})
export class StorageAccessModule {}
