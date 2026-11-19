import {
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsEmpty,
  IsIn,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../../../../shared/enums/evaluator-enums';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';

export class EvaluatorItemDto {
  @IsNotEmpty({
    message: 'El ID del evaluador es obligatorio.',
  })
  evaluatorId: number | string;

  @IsEnum(EvaluatorProfile, {
    message: 'El perfil del evaluador no es válido.',
  })
  profile: EvaluatorProfile;
}

/** Mensaje del 400 para el cuerpo antiguo { evaluatorIds } (TSK-002-N52). */
export const LEGACY_EVALUATOR_IDS_MESSAGE =
  'El formato { evaluatorIds } ya no se acepta; envíe { reviewType, evaluators: [{ evaluatorId, profile }] }.';

export class AssignEvaluatorsDto {
  /** Obligatorio en POST /evaluations/assign; en assign-peer-evaluators manda el de la ruta. */
  @IsOptional()
  @IsNotEmpty({
    message: 'El ID del protocolo es obligatorio.',
  })
  protocolId?: number | string;

  @IsOptional()
  versionId?: number;

  /** RF-12.REV: la Presidente elige primero el tipo de revisión; ENSAYO_CLINICO no es opción. */
  @IsIn([ReviewType.EXPEDITA, ReviewType.PLENO], {
    message: 'El tipo de revisión es obligatorio y debe ser EXPEDITA o PLENO.',
  })
  reviewType: ReviewType.EXPEDITA | ReviewType.PLENO;

  @IsArray({ message: 'La lista de evaluadores debe ser un arreglo.' })
  @ArrayMinSize(2, {
    message: 'Se deben asignar al menos 2 evaluadores.',
  })
  @ValidateNested({ each: true })
  @Type(() => EvaluatorItemDto)
  evaluators: EvaluatorItemDto[];

  /** Formato antiguo: ya no se acepta (400 en español). */
  @IsEmpty({ message: LEGACY_EVALUATOR_IDS_MESSAGE })
  evaluatorIds?: unknown;
}

export class DesignatePlenumRiskDto {
  @IsInt({ message: 'El ID del nivel de riesgo debe ser un entero.' })
  @IsPositive({
    message: 'El ID del nivel de riesgo debe ser un entero positivo.',
  })
  riskLevelId: number;

  @IsUUID(undefined, {
    message: 'El ID de la convocatoria debe ser un UUID válido.',
  })
  meetingId: string;
}

export class ReassignEvaluatorDto {
  @IsNotEmpty({
    message: 'El ID de la asignación actual es obligatorio.',
  })
  currentAssignmentId: number | string;

  @IsNotEmpty({
    message: 'El ID del evaluador de reemplazo es obligatorio.',
  })
  replacementEvaluatorId: number | string;

  @IsEnum(EvaluatorProfile, {
    message: 'El perfil del evaluador de reemplazo no es válido.',
  })
  replacementEvaluatorProfile: EvaluatorProfile;

  @IsEnum(ReassignmentReason, {
    message: 'El motivo de reasignación no es válido.',
  })
  reason: ReassignmentReason;

  @IsOptional()
  @IsString({ message: 'La descripción del motivo debe ser una cadena.' })
  reasonDescription?: string;
}
