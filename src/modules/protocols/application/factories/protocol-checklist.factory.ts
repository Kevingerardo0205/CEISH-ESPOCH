import { Injectable } from '@nestjs/common';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';

export interface RequirementTemplate {
  code: string;
  name: string;
}

@Injectable()
export class ProtocolChecklistFactory {
  private readonly requirementsMap: Record<
    StudyTypeCode,
    RequirementTemplate[]
  > = {
    [StudyTypeCode.IO]: [
      { code: 'REQ_A', name: 'Solicitud de evaluación (Anexo 1)' },
      {
        code: 'REQ_B',
        name: 'Formulario de presentación del protocolo (Anexo 2)',
      },
      { code: 'REQ_C', name: 'Consentimiento informado' },
      {
        code: 'REQ_D',
        name: 'Consentimiento colectivo/comunitario (si aplica)',
      },
      {
        code: 'REQ_E',
        name: 'Instrumentos de investigación (fichas, encuestas, etc.)',
      },
      { code: 'REQ_F', name: 'Declaratoria de confidencialidad' },
      { code: 'REQ_G', name: 'Declaración de conflicto de interés' },
      { code: 'REQ_H', name: 'Currículos vitae de investigadores' },
      {
        code: 'REQ_I',
        name: 'Declaración de responsabilidad del IP (Anexo 4)',
      },
      { code: 'REQ_J', name: 'Carta de interés institucional (Anexo 5)' },
    ],
    [StudyTypeCode.EI]: [
      { code: 'REQ_A', name: 'Solicitud de evaluación (Anexo 1)' },
      { code: 'REQ_B', name: 'Formulario de presentación (Anexo 2)' },
      { code: 'REQ_C', name: 'Ficha descriptiva de la intervención' },
      { code: 'REQ_D', name: 'Consentimiento informado' },
      {
        code: 'REQ_E',
        name: 'Consentimiento colectivo/comunitario (si aplica)',
      },
      { code: 'REQ_F', name: 'Instrumentos de investigación' },
      { code: 'REQ_G', name: 'Declaratoria de confidencialidad' },
      { code: 'REQ_H', name: 'Declaración de conflicto de interés' },
      { code: 'REQ_I', name: 'Currículos vitae' },
      {
        code: 'REQ_J',
        name: 'Declaración de responsabilidad del IP (Anexo 4)',
      },
      { code: 'REQ_K', name: 'Carta de interés institucional (Anexo 5)' },
      { code: 'REQ_L', name: 'Póliza de seguro de responsabilidad civil' },
      { code: 'REQ_M', name: 'Documentos de idoneidad de instalaciones' },
    ],
    [StudyTypeCode.EC]: [
      {
        code: 'REQ_A',
        name: 'Carta de solicitud de evaluación suscrita por IP (Anexo 6)',
      },
      {
        code: 'REQ_B',
        name: 'Declaración de responsabilidad del IP (Anexo 4)',
      },
      { code: 'REQ_C', name: 'Carta de interés institucional (Anexo 5)' },
      { code: 'REQ_D', name: 'Hojas de vida del IP e investigadores' },
      { code: 'REQ_E', name: 'Protocolo en idioma original y en castellano' },
      { code: 'REQ_F', name: 'Ficha descriptiva del ensayo clínico' },
      {
        code: 'REQ_G',
        name: 'Formulario de consentimiento informado (Anexo 3)',
      },
      { code: 'REQ_H', name: 'Manual del investigador (BPC + flujograma)' },
      { code: 'REQ_I', name: 'Instrumentos de reclutamiento (volantes, etc.)' },
      { code: 'REQ_J', name: 'Instrumentos de recolección de datos' },
      { code: 'REQ_K', name: 'Póliza de seguro' },
      { code: 'REQ_L', name: 'Certificados de capacitación en bioética' },
      { code: 'REQ_M', name: 'Registro SENESCYT del IP' },
      {
        code: 'REQ_N',
        name: 'Información de seguridad del fármaco experimental',
      },
      {
        code: 'REQ_O',
        name: 'Carta de aprobación del Comité de ética del país del patrocinador',
      },
      { code: 'REQ_P', name: 'Contrato promotor-investigadores' },
      { code: 'REQ_Q', name: 'Plan de monitoreo del ensayo clínico' },
      { code: 'REQ_R', name: 'Plan de seguridad del participante' },
    ],
    [StudyTypeCode.EX]: [
      { code: 'REQ_A', name: 'Solicitud de exención con justificación' },
      { code: 'REQ_B', name: 'Formulario de presentación del protocolo' },
      { code: 'REQ_C', name: 'Instrumentos de investigación (si aplica)' },
      { code: 'REQ_D', name: 'Carta de interés institucional (si aplica)' },
    ],
  };

  getRequirements(typeCode: StudyTypeCode): RequirementTemplate[] {
    return this.requirementsMap[typeCode] || [];
  }
}
