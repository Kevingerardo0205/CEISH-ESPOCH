import { Module, Global } from '@nestjs/common';
import { IStorageService } from './domain/ports/storage.service.port';
import { S3StorageAdapter } from './infrastructure/adapters/s3-storage.adapter';
import { StorageController } from './infrastructure/controllers/storage.controller';

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: IStorageService,
      useClass: S3StorageAdapter,
    },
  ],
  exports: [IStorageService],
})
export class StorageModule {}
