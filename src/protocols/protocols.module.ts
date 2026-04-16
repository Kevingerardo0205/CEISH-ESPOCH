import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtocolsController } from './protocols.controller';
import { ProtocolsService } from './protocols.service';
import { Protocolo, TipoEstudio, NivelRiesgo, Usuario } from '../models';

@Module({
  imports: [TypeOrmModule.forFeature([Protocolo, TipoEstudio, NivelRiesgo, Usuario])],
  controllers: [ProtocolsController],
  providers: [ProtocolsService],
  exports: [ProtocolsService],
})
export class ProtocolsModule {}
