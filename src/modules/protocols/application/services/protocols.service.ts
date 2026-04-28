import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';

@Injectable()
export class ProtocolsService {
  constructor(
    @InjectRepository(ProtocolOrmEntity)
    private readonly protocolsRepository: Repository<ProtocolOrmEntity>,
  ) {}

  async findAll() {
    return this.protocolsRepository.find({
      relations: ['principalInvestigator'],
    });
  }

  async findOne(id: number) {
    return this.protocolsRepository.findOne({
      where: { id },
      relations: ['principalInvestigator'],
    });
  }

  async create(data: any) {
    const protocol = this.protocolsRepository.create(data);
    return this.protocolsRepository.save(protocol);
  }
}
