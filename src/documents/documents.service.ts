import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from '../models/documentos';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentsRepository: Repository<Documento>,
  ) {}

  async create(data: any) {
    // Al guardar, el transformer encriptará nombre_archivo y ruta
    const document = this.documentsRepository.create(data);
    return this.documentsRepository.save(document);
  }

  async findAll() {
    // Al listar, el transformer desencriptará los campos para mostrar el texto plano
    return this.documentsRepository.find({ relations: ['protocolo'] });
  }

  async findByProtocol(protocolId: number) {
    return this.documentsRepository.find({
      where: { protocoloId: protocolId },
    });
  }
}
