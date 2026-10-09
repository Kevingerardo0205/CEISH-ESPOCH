import { IsDateString } from 'class-validator';

export class CalculateEvalDateDto {
  @IsDateString(
    {},
    { message: 'fecha_reunion debe ser una cadena ISO 8601 válida' },
  )
  meetingDate: string;
}
