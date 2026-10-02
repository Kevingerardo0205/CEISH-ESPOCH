import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCallDto {
  @IsString()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: string;
      obj?: Record<string, unknown>;
    }): string | undefined => {
      if (typeof value === 'string') return value;
      if (typeof obj?.meetingDate === 'string') {
        const d = new Date(obj.meetingDate);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
        const str = obj.meetingDate;
        return str.split('T')[0] || str.split(' ')[0];
      }
      return undefined;
    },
  )
  date?: string; // Format: 'YYYY-MM-DD'

  @IsString()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: string;
      obj?: Record<string, unknown>;
    }): string => {
      if (typeof value === 'string') return value;
      if (typeof obj?.meetingDate === 'string') {
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
    },
  )
  time?: string; // Format: 'HH:MM'

  @IsString()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: unknown;
      obj?: Record<string, unknown>;
    }): string | undefined => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (typeof obj?.meetingPlace === 'string') return obj.meetingPlace;
      if (typeof obj?.meetingPlace === 'number')
        return String(obj.meetingPlace);
      if (typeof obj?.locationId === 'string') return obj.locationId;
      return undefined;
    },
  )
  placeId?: string;

  @IsString()
  @IsNotEmpty()
  sessionType!: string; // 'ORDINARIA' o 'EXTRAORDINARIA'

  @IsString()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: string;
      obj?: Record<string, unknown>;
    }): string | undefined => {
      if (typeof value === 'string') return value;
      if (typeof obj?.agenda === 'string') return obj.agenda;
      return undefined;
    },
  )
  agendaSummary?: string;

  @IsArray()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: unknown;
      obj?: Record<string, unknown>;
    }): number[] | undefined => {
      const list = value || obj?.protocolVersionIds || obj?.protocolIds;
      if (Array.isArray(list)) {
        return list
          .map((item: unknown) => Number(item))
          .filter((n: number) => !isNaN(n));
      }
      return undefined;
    },
  )
  protocolIds?: number[];

  // Propiedades alternativas del frontend para evitar que class-validator dé error con whitelist
  @IsString()
  @IsOptional()
  callNumber?: string;

  @IsString()
  @IsOptional()
  meetingDate?: string;

  @IsOptional()
  meetingPlace?: unknown;

  @IsString()
  @IsOptional()
  agenda?: string;

  @IsArray()
  @IsOptional()
  protocolVersionIds?: unknown[];
}
