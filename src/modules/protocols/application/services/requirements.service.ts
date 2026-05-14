import { Injectable } from '@nestjs/common';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';

export interface RequirementInfo {
  code: string;
  name: string;
  isRequired: boolean;
  isConditional: boolean;
}

@Injectable()
export class RequirementsService {
  /**
   * Calcula los requisitos exigidos según el PET CEISH-ESPOCH V2
   * E6: Lógica condicional de requisitos
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
    const requirements: RequirementInfo[] = [];

    // 1. Requisitos Base (Observacional / Intervención)
    if (typeCode === StudyTypeCode.IO || typeCode === StudyTypeCode.EI) {
      requirements.push(
        {
          code: 'ANEXO_1',
          name: 'Anexo 1: Solicitud de Evaluación',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'ANEXO_2',
          name: 'Anexo 2: Formulario de Protocolo',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CONSENTIMIENTO',
          name: 'Consentimiento/Asentimiento Informado (Anexo 3)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'INSTRUMENTOS_INV',
          name: 'Instrumentos de Investigación (Fichas, encuestas, manuales)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CV_INVESTIGADORES',
          name: 'Currículos Vitae de Investigadores',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'DECLARACION_RESP',
          name: 'Declaración de Responsabilidad (Anexo 4)',
          isRequired: true,
          isConditional: false,
        },
      );

      // Condicional por población indígena (PET 4.1.2.c y d)
      if (flags.poblacionIndigena) {
        requirements.push(
          {
            code: 'TRADUCCION_ANCESTRAL',
            name: 'Traducción a idiomas ancestrales',
            isRequired: true,
            isConditional: true,
          },
          {
            code: 'CONSENTIMIENTO_COMUNITARIO',
            name: 'Consentimiento Colectivo o Comunitario (Líder/Asamblea)',
            isRequired: true,
            isConditional: true,
          },
        );
      }

      // Condicionales por muestras o población vulnerable (PET 4.1.2.f y g)
      if (flags.muestras || flags.vulnerable) {
        requirements.push(
          {
            code: 'DECLARATORIA_CONF',
            name: 'Declaratoria de Compromiso de Confidencialidad',
            isRequired: true,
            isConditional: true,
          },
          {
            code: 'DECLARACION_CI',
            name: 'Declaración de Conflicto de Interés',
            isRequired: true,
            isConditional: true,
          },
        );
      }

      // Condicional por instituciones públicas/privadas (Anexo 5)
      if (flags.institucionesPublicas) {
        requirements.push({
          code: 'CARTA_INTERES',
          name: 'Carta de Interés Institucional (Anexo 5)',
          isRequired: true,
          isConditional: true,
        });
      }

      // Específicos para Intervención (PET 4.1.2.c-intervención)
      if (typeCode === StudyTypeCode.EI) {
        requirements.push({
          code: 'FICHA_INTERVENCION',
          name: 'Ficha Descriptiva de la Intervención y Riesgos',
          isRequired: true,
          isConditional: false,
        });

        if (flags.riesgoMayor) {
          requirements.push(
            {
              code: 'POLIZA_SEGURO',
              name: 'Copia de Póliza de Seguro de Responsabilidad Civil',
              isRequired: true,
              isConditional: true,
            },
            {
              code: 'IDONEIDAD_INST',
              name: 'Documentos de Idoneidad de Instalaciones',
              isRequired: true,
              isConditional: true,
            },
          );
        }
      }
    }

    // 2. Requisitos para Ensayo Clínico (EC) (PET 4.1.2 a-r)
    if (typeCode === StudyTypeCode.EC) {
      requirements.push(
        {
          code: 'ANEXO_6',
          name: 'Anexo 6: Carta de Solicitud de Evaluación',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'DECLARACION_RESP',
          name: 'Declaración de Responsabilidad (Anexo 4)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CARTA_INTERES',
          name: 'Carta de Interés Institucional (Anexo 5)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CV_IP',
          name: 'Hoja de Vida del IP e Investigadores',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'PROTOCOLO_COMPLETO',
          name: 'Protocolo de Investigación (Original y Castellano)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'FICHA_DESCRIPTIVA',
          name: 'Ficha Descriptiva de Ensayos Clínicos',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CONSENTIMIENTO',
          name: 'Formulario de Consentimiento Informado',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'MANUAL_INV',
          name: 'Manual del Investigador (Buenas Prácticas Clínicas)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'INSTRUMENTOS_REC',
          name: 'Procedimientos e Instrumentos de Reclutamiento y Recolección',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'POLIZA_SEGURO',
          name: 'Copia de Póliza de Seguro (Vigente en Ecuador)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CERT_CAPACITACION',
          name: 'Certificados de Capacitación y Experiencia (Bioética)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'REGISTRO_SENESCYT',
          name: 'Registro SENESCYT del Investigador Principal',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'INFO_SEG_FARMACO',
          name: 'Información sobre Seguridad del Fármaco Experimental',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CONTRATO_PROMOTOR',
          name: 'Copia del Contrato entre Promotor e Investigadores',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'PLAN_MONITOREO',
          name: 'Plan de Monitoreo del Ensayo Clínico',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'PLAN_SEGURIDAD',
          name: 'Plan de Seguridad del Participante',
          isRequired: true,
          isConditional: false,
        },
      );

      if (flags.multicentrico) {
        requirements.push({
          code: 'APROBACION_PAIS_ORIGEN',
          name: 'Carta de Aprobación del Comité de Ética del País de Origen',
          isRequired: true,
          isConditional: true,
        });
      }

      if (flags.poblacionIndigena) {
        requirements.push({
          code: 'TRADUCCION_ANCESTRAL',
          name: 'Traducción de Consentimiento a Idiomas Ancestrales',
          isRequired: true,
          isConditional: true,
        });
      }
    }

    return requirements;
  }
}
