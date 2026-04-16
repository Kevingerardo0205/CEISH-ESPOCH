import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Protocolo } from '../models/protocolos';

@Injectable()
export class ProtocolsService {
  constructor(
    @InjectRepository(Protocolo)
    private readonly protocolsRepository: Repository<Protocolo>,
  ) {}

  async findAll() {
    return this.protocolsRepository.find({
      relations: ['investigadorPrincipal'],
    });
  }

  async findOne(id: number) {
    return this.protocolsRepository.findOne({
      where: { id },
      relations: ['investigadorPrincipal'],
    });
  }

  async create(data: any) {
    const protocol = this.protocolsRepository.create(data);
    return this.protocolsRepository.save(protocol);
  }
}
