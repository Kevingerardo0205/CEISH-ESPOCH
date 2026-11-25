import { Module, Global } from '@nestjs/common';
import { IStorageService } from './domain/ports/storage.service.port';
import { S3StorageAdapter } from './infrastructure/adapters/s3-storage.adapter';

@Global()
@Module({
  providers: [
    {
      provide: IStorageService,
      useClass: S3StorageAdapter,
    },
  ],
  exports: [IStorageService],
})
export class StorageModule {}
