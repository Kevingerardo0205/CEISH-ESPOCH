import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentOrmEntity } from '../../infrastructure/database/document.entity.orm';
import { DocumentTemplateOrmEntity } from '../../infrastructure/database/document-template.entity.orm';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentOrmEntity)
    private readonly documentsRepository: Repository<DocumentOrmEntity>,
    @InjectRepository(DocumentTemplateOrmEntity)
    private readonly templatesRepository: Repository<DocumentTemplateOrmEntity>,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
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
      relations: ['requirement', 'tipoDocumento'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateValidation(id: number, isValidated: boolean) {
    return this.documentsRepository.update(id, {
      isValidatedBySecretary: isValidated,
      // Aquí se podrían agregar más campos de auditoría si fuera necesario
    });
  }

  // === MÉTODOS PARA PLANTILLAS DE DOCUMENTOS (ADMIN / SISTEMA) ===

  async findAllTemplates(): Promise<DocumentTemplateOrmEntity[]> {
    return this.templatesRepository.find({ where: { isActive: true } });
  }

  async findTemplateByCode(
    code: string,
  ): Promise<DocumentTemplateOrmEntity | null> {
    return this.templatesRepository.findOne({
      where: { code, isActive: true },
    });
  }

  async getTemplateDownloadUrl(code: string): Promise<string> {
    const template = await this.findTemplateByCode(code);
    if (!template || !template.filePath) {
      throw new NotFoundException(
        `Plantilla con código ${code} no encontrada o sin archivo asignado.`,
      );
    }
    return this.storageService.getDownloadUrl(template.filePath);
  }

  async uploadTemplateFile(
    code: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<DocumentTemplateOrmEntity> {
    const template = await this.findTemplateByCode(code);
    if (!template) {
      throw new NotFoundException(
        `Plantilla con código ${code} no encontrada.`,
      );
    }

    // Subir a Cloudflare R2 con una ruta estructurada
    const s3Key = `templates/${code.toLowerCase()}_${Date.now()}_${fileName}`;
    await this.storageService.uploadFile(s3Key, fileBuffer, contentType);

    // Actualizar registro en DB
    template.filePath = s3Key;
    await this.templatesRepository.save(template);

    return template;
  }

  async updateTemplateFilePath(
    code: string,
    filePath: string,
  ): Promise<DocumentTemplateOrmEntity> {
    const template = await this.findTemplateByCode(code);
    if (!template) {
      throw new NotFoundException(
        `Plantilla con código ${code} no encontrada.`,
      );
    }
    template.filePath = filePath;
    return this.templatesRepository.save(template);
  }

  async upsertTemplateMetadata(
    code: string,
    name: string,
  ): Promise<DocumentTemplateOrmEntity> {
    let template = await this.templatesRepository.findOne({ where: { code } });
    if (!template) {
      template = this.templatesRepository.create({ code, name });
    } else {
      template.name = name;
    }
    return this.templatesRepository.save(template);
  }
}
