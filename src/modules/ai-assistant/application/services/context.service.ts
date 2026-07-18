import { Injectable, Logger } from '@nestjs/common';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(private readonly protocolRepository: IProtocolRepository) {}

  /**
   * Obtiene la metadata estructurada del protocolo, sus versiones e items presentados
   * para adjuntarlos como contexto de negocio a Gemini.
   * @param protocolId ID del protocolo en revisión
   */
  async getProtocolContext(protocolId: number): Promise<string> {
    try {
      const protocol = await this.protocolRepository.findById(protocolId);
      if (!protocol) {
        return 'Contexto del Protocolo: No se encontró ningún protocolo con el ID suministrado.';
      }

      let contextStr = `=== CONTEXTO DEL PROTOCOLO DE INVESTIGACIÓN (ID: ${protocol.id}) ===\n`;
      contextStr += `Código CEISH: ${protocol.ceishCode || 'Pendiente de Asignación'}\n`;
      contextStr += `Título: ${protocol.title || 'Sin Título'}\n`;
      contextStr += `Tipo de Estudio ID: ${protocol.studyTypeId || 'No Definido'}\n`;
      contextStr += `Nivel de Riesgo ID: ${protocol.riskLevelId || 'No Definido'}\n`;
      contextStr += `Población Vulnerable: ${protocol.isVulnerablePopulation ? 'SÍ' : 'NO'}\n`;
      contextStr += `Muestras Biológicas: ${protocol.usesBiologicalSamples ? 'SÍ' : 'NO'}\n`;
      contextStr += `Multicéntrico: ${protocol.isMulticentric ? 'SÍ' : 'NO'}\n`;
      contextStr += `Población Indígena: ${protocol.isIndigenousPopulation ? 'SÍ' : 'NO'}\n`;
      contextStr += `Monto Financiamiento: $${protocol.financingAmount || '0.00'}\n\n`;

      // Versiones del Protocolo
      contextStr += `--- HISTORIAL DE VERSIONES DEL PROTOCOLO ---\n`;
      if (protocol.versions && protocol.versions.length > 0) {
        protocol.versions.forEach((v) => {
          contextStr += `- Versión ${v.versionNumber || 1}.0 | Fecha Envío: ${v.submissionDate || 'N/A'} | Estado ID: ${v.statusId || 'N/A'} | Observaciones: ${v.observations || 'Ninguna'}\n`;
        });
      } else {
        contextStr += `No hay versiones registradas aún para este protocolo.\n`;
      }
      contextStr += `\n`;

      // Requisitos del Checklist (Recepción)
      contextStr += `--- CHECKLIST DE REQUISITOS (RECEPCIÓN DIGITAL) ---\n`;
      if (protocol.checklist && protocol.checklist.length > 0) {
        protocol.checklist.forEach((req) => {
          contextStr += `- [${req.status}] Código: ${req.requirementCode} | Nombre: ${req.requirementName} | Páginas: ${req.pageCount} | Obs: ${req.observations || 'Ninguna'}\n`;
        });
      } else {
        contextStr += `El checklist de recepción no ha sido generado o está vacío.\n`;
      }

      return contextStr;
    } catch (err) {
      this.logger.error(
        `Error al recuperar contexto para el protocolo ${protocolId}:`,
        err,
      );
      return 'Error de Contexto: No se pudo obtener la información detallada del protocolo debido a un error del sistema.';
    }
  }
}
