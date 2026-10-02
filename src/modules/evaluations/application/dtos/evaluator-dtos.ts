import {
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsString,
  IsOptional,
  IsNotEmpty,
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

export class AssignEvaluatorsDto {
  @IsNotEmpty({
    message: 'El ID del protocolo es obligatorio.',
  })
  protocolId: number | string;

  @IsOptional()
  versionId?: number;

  @IsOptional()
  @IsEnum(ReviewType, {
    message: 'El tipo de revisión no es válido.',
  })
  reviewType?: ReviewType;

  @IsArray({ message: 'La lista de evaluadores debe ser un arreglo.' })
  @ArrayMinSize(4, {
    message: 'Se debe proporcionar exactamente 4 evaluadores.',
  })
  @ArrayMaxSize(4, {
    message: 'Se debe proporcionar exactamente 4 evaluadores.',
  })
  @ValidateNested({ each: true })
  @Type(() => EvaluatorItemDto)
  evaluators: EvaluatorItemDto[];
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
