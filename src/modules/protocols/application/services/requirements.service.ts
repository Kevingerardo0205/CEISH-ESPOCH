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
    },
  ): Promise<RequirementInfo[]> {
    const requirements: RequirementInfo[] = [];

    // 1. Requisitos Base (Observacional / Intervención)
    if (typeCode === StudyTypeCode.IO || typeCode === StudyTypeCode.EI) {
      requirements.push(
        {
          code: 'ANEXO_1',
          name: 'Anexo 1: Formulario de Solicitud',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'ANEXO_2',
          name: 'Anexo 2: Resumen del Protocolo',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CONSENTIMIENTO',
          name: 'Consentimiento Informado',
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
          name: 'Declaración de Responsabilidad',
          isRequired: true,
          isConditional: false,
        },
      );

      // Condicionales por muestras o población vulnerable
      if (flags.muestras || flags.vulnerable) {
        requirements.push(
          {
            code: 'DECLARATORIA_CONF',
            name: 'Declaratoria de Confidencialidad',
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

      // Condicional por instituciones públicas
      if (flags.institucionesPublicas) {
        requirements.push({
          code: 'CARTA_INTERES',
          name: 'Carta de Interés Institucional',
          isRequired: true,
          isConditional: true,
        });
      }

      // Específicos para Intervención
      if (typeCode === StudyTypeCode.EI) {
        requirements.push({
          code: 'FICHA_INTERVENCION',
          name: 'Ficha de Intervención',
          isRequired: true,
          isConditional: false,
        });

        if (flags.riesgoMayor) {
          requirements.push(
            {
              code: 'POLIZA_SEGURO',
              name: 'Póliza de Seguro',
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

    // 2. Requisitos para Ensayo Clínico (EC)
    if (typeCode === StudyTypeCode.EC) {
      requirements.push(
        {
          code: 'ANEXO_6',
          name: 'Anexo 6: Formulario para Ensayo Clínico',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CONSENTIMIENTO',
          name: 'Consentimiento Informado',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'DECLARACION_RESP',
          name: 'Declaración de Responsabilidad',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CARTA_INTERES',
          name: 'Carta de Interés',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CV_IP',
          name: 'Hoja de Vida del IP',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'PROTOCOLO_COMPLETO',
          name: 'Protocolo Completo de Investigación',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'FICHA_DESCRIPTIVA',
          name: 'Ficha Descriptiva del Medicamento/Dispositivo',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'MANUAL_INV',
          name: 'Manual del Investigador',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'MATERIAL_RECLUTAMIENTO',
          name: 'Material de Reclutamiento',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'INSTRUMENTOS_REC',
          name: 'Instrumentos de Recolección de Datos',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'POLIZA_SEGURO',
          name: 'Póliza de Seguro',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'CERT_CAPACITACION',
          name: 'Certificados de Capacitación (GCP)',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'REGISTRO_SENESCYT',
          name: 'Registro SENESCYT del IP',
          isRequired: true,
          isConditional: false,
        },
        {
          code: 'INFO_SEG_FARMACO',
          name: 'Información de Seguridad del Fármaco',
          isRequired: true,
          isConditional: false,
        },
      );
    }

    return requirements;
  }
}
