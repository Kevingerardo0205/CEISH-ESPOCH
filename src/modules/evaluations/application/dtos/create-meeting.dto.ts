import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
  IsArray,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SessionType } from '../../infrastructure/database/entities/convocatoria.orm-entity';

export class CreateMeetingDto {
  @IsEnum(SessionType, {
    message: 'tipo_session debe ser ORDINARIA o EXTRAORDINARIA',
  })
  sessionType: SessionType;

  @IsDateString(
    {},
    { message: 'fecha_reunion debe ser una cadena ISO 8601 válida' },
  )
  meetingDate: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'fecha_entrega_evaluacion debe ser una cadena ISO 8601 válida' },
  )
  evalSubmissionDeadline?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'lugar_id debe ser un UUID válido' })
  locationId?: string;

  @IsOptional()
  @IsArray({ message: 'protocol_version_ids debe ser una lista' })
  @IsInt({
    each: true,
    message: 'Cada id de versión debe ser un entero válido',
  })
  @Type(() => Number)
  protocolVersionIds?: number[];

  @IsOptional()
  @IsArray({ message: 'follow_up_report_ids debe ser una lista' })
  @IsInt({
    each: true,
    message: 'Cada id de informe de seguimiento debe ser un entero válido',
  })
  @Type(() => Number)
  followUpReportIds?: number[];
}
