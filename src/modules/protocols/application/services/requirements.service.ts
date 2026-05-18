import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';
import { TipoDocumentoEstudioOrmEntity } from '../../infrastructure/database/tipo-documento-estudio.entity.orm';
import { StudyTypeOrmEntity } from '../../infrastructure/database/study-type.entity.orm';

export interface RequirementInfo {
  id: number;
  code: string;
  name: string;
  isRequired: boolean;
  isConditional: boolean;
}

@Injectable()
export class RequirementsService {
  private readonly logger = new Logger(RequirementsService.name);

  constructor(
    @InjectRepository(TipoDocumentoEstudioOrmEntity)
    private readonly tipoDocumentoEstudioRepository: Repository<TipoDocumentoEstudioOrmEntity>,
    @InjectRepository(StudyTypeOrmEntity)
    private readonly studyTypeRepository: Repository<StudyTypeOrmEntity>,
  ) {}

  /**
   * Calcula los requisitos exigidos según el PET CEISH-ESPOCH V2
   * Refactorizado para ser ultra-robusto y dinámico.
   */
  async calcularRequeridos(
    typeCode: StudyTypeCode,
    flags: {
      muestras?: boolean;
      vulnerable?: boolean;
      multicentrico?: boolean;
      riesgoMayor?: boolean;
      institucionesPublicas?: boolean;
      poblacionIndigena?: boolean;
    },
  ): Promise<RequirementInfo[]> {
    this.logger.debug(
      `Calculando requisitos para tipo: ${typeCode} con flags: ${JSON.stringify(flags)}`,
    );

    // 1. Obtener el ID real del tipo de estudio desde el catálogo
    const studyType = await this.studyTypeRepository.findOne({
      where: { code: typeCode },
    });

    if (!studyType) {
      this.logger.error(`Tipo de estudio no encontrado en DB: ${typeCode}`);
      return [];
    }

    // 2. Consultar relaciones por ID de estudio
    const studyTypeRequirements = await this.tipoDocumentoEstudioRepository.find({
      where: { tipoEstudioId: studyType.id },
      relations: ['tipoDocumento'],
      order: { tipoDocumentoId: 'ASC' },
    });

    this.logger.debug(
      `Encontrados ${studyTypeRequirements.length} requisitos base para estudio ID ${studyType.id}`,
    );

    const requirements: RequirementInfo[] = [];

    for (const rel of studyTypeRequirements) {
      const doc = rel.tipoDocumento;
      if (!doc) continue;

      // Usamos el campo con el nombre exacto de la entidad: codigoAnexo
      let reqCode = doc.codigoAnexo;

      if (!reqCode || reqCode.trim() === '') {
        // FALLBACK: Si no hay código, generamos uno basado en el nombre para no romper el frontend
        reqCode = `REQ_${doc.id}`;
        this.logger.warn(
          `Documento ID ${doc.id} (${doc.nombre}) no tiene código de anexo definido. Usando fallback: ${reqCode}. ¡POR FAVOR ACTUALIZAR BASE DE DATOS!`,
        );
      }

      // 3. Evaluar lógica condicional desde el JSON
      const condicionJson = doc.condicionJson as any;
      
      // Si el JSON no tiene la clave para este tipo de estudio, 
      // significa que no hay reglas condicionales específicas, 
      // por lo tanto, se incluye si la tabla relacional lo dijo.
      const condiciones = condicionJson?.condiciones_por_tipo?.[typeCode];

      let shouldInclude = false;
      const isConditional = Array.isArray(condiciones) && condiciones.length > 0;

      if (!condiciones || (Array.isArray(condiciones) && condiciones.length === 0)) {
        // Obligatorio por defecto para este tipo de estudio si no hay condiciones en el JSON
        shouldInclude = true;
      } else {
        // Se incluye si AL MENOS UN flag requerido es verdadero (OR)
        shouldInclude = condiciones.some((flag) => flags[flag] === true);
      }

      if (shouldInclude) {
        requirements.push({
          id: doc.id,
          code: reqCode,
          name: doc.nombre,
          isRequired: rel.esObligatorio,
          isConditional: isConditional,
        });
      }
    }

    this.logger.debug(`Total requisitos finales: ${requirements.length}`);
    return requirements;
  }
}
