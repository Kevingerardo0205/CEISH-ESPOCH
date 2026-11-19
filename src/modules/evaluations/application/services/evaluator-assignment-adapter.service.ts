import { Injectable, BadRequestException } from '@nestjs/common';
import { AssignEvaluatorsUseCase } from '../use-cases/assign-evaluators.use-case';
import { AssignEvaluatorsDto } from '../dtos/evaluator-dtos';
import { EvaluationAssignmentEntity } from '../../domain/entities/evaluation-assignment.entity';

@Injectable()
export class EvaluatorAssignmentAdapterService {
  constructor(
    private readonly assignEvaluatorsUseCase: AssignEvaluatorsUseCase,
  ) {}

  /**
   * POST /evaluations/protocols/:id/assign-peer-evaluators (TSK-002-N52): el protocolo
   * es el de la ruta; si el cuerpo trae otro, 400. Delega en el caso de uso canónico.
   * El formato antiguo { evaluatorIds } lo rechaza el DTO (400).
   */
  async adaptAndAssign(
    protocolId: number,
    dto: AssignEvaluatorsDto,
    assignedByUserId: number,
  ): Promise<EvaluationAssignmentEntity[]> {
    if (
      dto.protocolId !== undefined &&
      dto.protocolId !== null &&
      String(dto.protocolId).trim() !== String(protocolId)
    ) {
      throw new BadRequestException(
        `El protocolId del cuerpo (${String(dto.protocolId)}) no coincide con el de la ruta (${protocolId}).`,
      );
    }

    return this.assignEvaluatorsUseCase.execute({
      protocolId,
      versionId: dto.versionId,
      reviewType: dto.reviewType,
      evaluators: dto.evaluators,
      assignedByUserId,
    });
  }
}
