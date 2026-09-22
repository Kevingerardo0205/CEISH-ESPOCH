import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCallDto {
  @IsString()
  @IsOptional()
  @Transform(({ value, obj }) => {
    if (value) return value;
    if (obj.meetingDate) {
      const d = new Date(obj.meetingDate);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return obj.meetingDate.split('T')[0] || obj.meetingDate.split(' ')[0];
    }
    return undefined;
  })
  date?: string; // Format: 'YYYY-MM-DD'

  @IsString()
  @IsOptional()
  @Transform(({ value, obj }) => {
    if (value) return value;
    if (obj.meetingDate) {
      const d = new Date(obj.meetingDate);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      if (obj.meetingDate.includes('T')) {
        return obj.meetingDate.split('T')[1].substring(0, 5);
      }
    }
    return '09:00';
  })
  time?: string; // Format: 'HH:MM'

  @IsInt()
  @IsOptional()
  @Transform(({ value, obj }) => {
    if (value !== undefined && value !== null) return Number(value);
    if (typeof obj.meetingPlace === 'number') return obj.meetingPlace;
    if (obj.meetingPlace && !isNaN(Number(obj.meetingPlace)))
      return Number(obj.meetingPlace);
    return undefined;
  })
  placeId?: number;

  @IsString()
  @IsNotEmpty()
  sessionType!: string; // 'ORDINARIA' o 'EXTRAORDINARIA'

  @IsString()
  @IsOptional()
  @Transform(({ value, obj }) => value || obj.agenda)
  agendaSummary?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value, obj }) => {
    const list = value || obj.protocolVersionIds || obj.protocolIds;
    if (Array.isArray(list)) {
      return list
        .map((item: any) => Number(item))
        .filter((n: number) => !isNaN(n));
    }
    return undefined;
  })
  protocolIds?: number[];

  // Propiedades alternativas del frontend para evitar que class-validator dé error con whitelist
  @IsString()
  @IsOptional()
  callNumber?: string;

  @IsString()
  @IsOptional()
  meetingDate?: string;

  @IsOptional()
  meetingPlace?: any;

  @IsString()
  @IsOptional()
  agenda?: string;

  @IsArray()
  @IsOptional()
  protocolVersionIds?: any[];
}
