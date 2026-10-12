import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemParamOrmEntity } from './infrastructure/database/system-param.entity.orm';
import { SystemParamsService } from './application/services/system-params.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemParamOrmEntity])],
  providers: [SystemParamsService],
  exports: [SystemParamsService],
})
export class SistemaModule {}
