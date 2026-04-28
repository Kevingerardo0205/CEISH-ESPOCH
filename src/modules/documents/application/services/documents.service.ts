import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentOrmEntity } from '../../infrastructure/database/document.entity.orm';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentOrmEntity)
    private readonly documentsRepository: Repository<DocumentOrmEntity>,
  ) {}

  async create(data: any) {
    const document = this.documentsRepository.create(data);
    return this.documentsRepository.save(document);
  }

  async findAll() {
    return this.documentsRepository.find({ relations: ['protocol'] });
  }

  async findByProtocol(protocolId: number) {
    return this.documentsRepository.find({
      where: { protocolId: protocolId },
    });
  }
}
