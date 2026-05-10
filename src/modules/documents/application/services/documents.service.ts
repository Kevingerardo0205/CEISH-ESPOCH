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

  /**
   * E4: Operaciones unificadas en recepcion.documentos
   */
  async create(data: Partial<DocumentOrmEntity>) {
    const document = this.documentsRepository.create(data);
    return this.documentsRepository.save(document);
  }

  async findAll() {
    return this.documentsRepository.find({ relations: ['protocol'] });
  }

  async findByProtocol(protocolId: number) {
    return this.documentsRepository.find({
      where: { protocolId: protocolId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateValidation(id: number, isValidated: boolean, userId: number) {
    return this.documentsRepository.update(id, {
      isValidatedBySecretary: isValidated,
      // Aquí se podrían agregar más campos de auditoría si fuera necesario
    });
  }
}
