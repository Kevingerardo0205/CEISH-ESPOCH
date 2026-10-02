import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';

export interface AssignmentHistoryProps {
  id?: number | string;
  previousAssignmentId: number | string;
  previousEvaluatorId: number | string;
  evaluatorProfile: EvaluatorProfile;
  reassignmentReason: ReassignmentReason;
  newEvaluatorId: number | string;
  newAssignmentId?: number | string;
  executedBy: number | string;
  executedAt: Date;
  justification?: string;
}

export class AssignmentHistoryEntity {
  public readonly id?: number | string;
  public readonly previousAssignmentId: number | string;
  public readonly previousEvaluatorId: number | string;
  public readonly evaluatorProfile: EvaluatorProfile;
  public readonly reassignmentReason: ReassignmentReason;
  public readonly newEvaluatorId: number | string;
  public readonly newAssignmentId?: number | string;
  public readonly executedBy: number | string;
  public readonly executedAt: Date;
  public readonly justification?: string;

  constructor(props: AssignmentHistoryProps) {
    if (
      props.id !== undefined &&
      props.id !== null &&
      `${props.id}`.trim() === ''
    ) {
      throw new Error('El ID de historial es obligatorio.');
    }
    if (
      props.previousAssignmentId === undefined ||
      props.previousAssignmentId === null ||
      `${props.previousAssignmentId}`.trim() === ''
    ) {
      throw new Error('El ID de la asignación anterior es obligatorio.');
    }
    if (
      props.previousEvaluatorId === undefined ||
      props.previousEvaluatorId === null ||
      `${props.previousEvaluatorId}`.trim() === ''
    ) {
      throw new Error('El ID del evaluador anterior es obligatorio.');
    }
    if (
      props.newEvaluatorId === undefined ||
      props.newEvaluatorId === null ||
      `${props.newEvaluatorId}`.trim() === ''
    ) {
      throw new Error('El ID del nuevo evaluador es obligatorio.');
    }
    if (
      props.executedBy === undefined ||
      props.executedBy === null ||
      `${props.executedBy}`.trim() === ''
    ) {
      throw new Error('El usuario administrativo ejecutor es obligatorio.');
    }

    this.id = props.id;
    this.previousAssignmentId = props.previousAssignmentId;
    this.previousEvaluatorId = props.previousEvaluatorId;
    this.evaluatorProfile = props.evaluatorProfile;
    this.reassignmentReason = props.reassignmentReason;
    this.newEvaluatorId = props.newEvaluatorId;
    this.newAssignmentId = props.newAssignmentId;
    this.executedBy = props.executedBy;
    this.executedAt = props.executedAt;
    this.justification = props.justification;
  }
}
