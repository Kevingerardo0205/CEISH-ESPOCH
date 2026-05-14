import { Injectable, NotFoundException } from '@nestjs/common';
import { IEvaluationRepository } from '../../domain/ports/evaluation.repository.port';
import { IProtocolRepository } from '../../../protocols/domain/ports/protocol.repository.port';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { EvaluationOrmEntity } from '../../infrastructure/database/evaluation.entity.orm';

@Injectable()
export class EvaluationConsolidationService {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository,
    private readonly protocolRepository: IProtocolRepository,
  ) {}

  /**
   * Genera un resumen consolidado de todas las evaluaciones para una versión de protocolo.
   * Útil para la Sesión de Pleno (Anexo 12).
   */
  async consolidate(protocolId: number, versionNumber: number = 1) {
    const version = await this.evaluationRepository.findVersionByProtocolId(protocolId, versionNumber);
    if (!version) throw new NotFoundException('Versión de protocolo no encontrada');

    const assignments = await this.evaluationRepository.findAssignmentsByVersionId(version.id);
    const completedAssignments = assignments.filter(a => a.statusId === AssignmentStatus.COMPLETED);

    if (completedAssignments.length === 0) {
      return {
        message: 'Aún no existen evaluaciones completadas para consolidar.',
        isReadyForPlenary: false
      };
    }

    // 1. Obtener todas las evaluaciones detalladas
    const evaluations: EvaluationOrmEntity[] = [];
    for (const assignment of completedAssignments) {
      const detail = await this.evaluationRepository.findEvaluationByAssignmentId(assignment.id);
      if (detail) evaluations.push(detail);
    }

    // 2. Consolidar Aspectos Cualitativos
    const consolidation = {
      protocolId,
      versionNumber,
      totalEvaluators: assignments.length,
      completedEvaluations: evaluations.length,
      recommendations: evaluations.map(e => ({
        evaluator: e.evaluatedBy?.fullName || 'Anónimo',
        result: e.result,
        observations: e.observations
      })),
      summary: {
        ethical: evaluations.map(e => e.ethicalAspects).filter(Boolean),
        methodological: evaluations.map(e => e.methodologicalAspects).filter(Boolean),
        legal: evaluations.map(e => e.legalAspects).filter(Boolean),
      },
      // Lógica de decisión sugerida (Unanimidad o Mayoría)
      suggestedGlobalResult: this.calculateGlobalResult(
        evaluations.map((e) => e.result).filter((r): r is string => !!r),
      ),
    };

    return consolidation;
  }

  private calculateGlobalResult(results: string[]): string {
    const counts = results.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Si hay al menos un "RECHAZADO" o "REQUIERE_CAMBIOS_MAYORES", sugerir precaución
    if (counts['RECHAZADO'] > 0) return 'DISCUTIR_EN_PLENO (Existen Rechazos)';
    
    // Devolver el resultado más frecuente
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
}
