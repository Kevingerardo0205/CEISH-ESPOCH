import { EvaluatorProfile } from '../../../../shared/enums/evaluator-enums';
import { AssignmentStatus } from '../enums/assignment-status.enum';

export interface EvaluationAssignmentProps {
  id?: number | string;
  protocolId: number | string;
  evaluatorId: number | string;
  evaluatorProfile: EvaluatorProfile;
  isAssignedForAnnex10: boolean;
  deadlineDate: Date | string;
  status?: AssignmentStatus;
}

export class EvaluationAssignmentEntity {
  public readonly id?: number | string;
  public readonly protocolId: number | string;
  public readonly evaluatorId: number | string;
  public readonly evaluatorProfile: EvaluatorProfile;
  public readonly isAssignedForAnnex10: boolean;
  public readonly deadlineDate: Date | string;
  private _status: AssignmentStatus;

  constructor(props: EvaluationAssignmentProps) {
    if (
      props.id !== undefined &&
      props.id !== null &&
      `${props.id}`.trim() === ''
    ) {
      throw new Error('El ID de asignación es obligatorio.');
    }
    if (
      props.protocolId === undefined ||
      props.protocolId === null ||
      `${props.protocolId}`.trim() === ''
    ) {
      throw new Error('El ID del protocolo es obligatorio.');
    }
    if (
      props.evaluatorId === undefined ||
      props.evaluatorId === null ||
      `${props.evaluatorId}`.trim() === ''
    ) {
      throw new Error('El ID del evaluador es obligatorio.');
    }
    if (!props.evaluatorProfile) {
      throw new Error('El perfil del evaluador es obligatorio.');
    }

    this.id = props.id;
    this.protocolId = props.protocolId;
    this.evaluatorId = props.evaluatorId;
    this.evaluatorProfile = props.evaluatorProfile;
    this.isAssignedForAnnex10 = props.isAssignedForAnnex10;
    this.deadlineDate = props.deadlineDate;
    this._status = props.status ?? AssignmentStatus.ASSIGNED;
  }

  public get status(): AssignmentStatus {
    return this._status;
  }

  public markAsReassigned(newStatus: AssignmentStatus): void {
    if (
      newStatus !== AssignmentStatus.REASIGNED_COI &&
      newStatus !== AssignmentStatus.REASIGNED_VENCIMIENTO
    ) {
      throw new Error('Estado de reasignación inválido.');
    }
    this._status = newStatus;
  }

  public markAsCompleted(): void {
    this._status = AssignmentStatus.COMPLETED;
  }
}
