import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryProtocolDto } from './query-protocol.dto';
import { ProtocolStage } from '../../domain/enums/protocol-stage.enum';

export const LIST_PROTOCOLS_MAX_LIMIT = 100;
export const LIST_PROTOCOLS_SEARCH_MAX_LENGTH = 100;

/**
 * Query de GET /protocols (spec-001 RF-EST.3, TSK-001.4). Extiende QueryProtocolDto
 * para no cambiar mis-protocolos ni mis-subsanaciones, que siguen con QueryProtocolDto.
 */
export class ListProtocolsQueryDto extends QueryProtocolDto {
  @ApiPropertyOptional({
    type: String,
    maxLength: LIST_PROTOCOLS_SEARCH_MAX_LENGTH,
    description:
      'Código CEISH, título, coinvestigador o investigador principal (sin distinguir mayúsculas).',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(LIST_PROTOCOLS_SEARCH_MAX_LENGTH)
  search?: string;

  @ApiPropertyOptional({
    type: Number,
    minimum: 2000,
    maximum: 2100,
    description:
      'Año (America/Guayaquil) de la fecha de recepción de la versión activa o, si no hay, de la creación.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ enum: ProtocolStage, type: String })
  @IsOptional()
  @IsEnum(ProtocolStage)
  etapa?: ProtocolStage;

  @ApiPropertyOptional({
    type: Number,
    default: 20,
    maximum: LIST_PROTOCOLS_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIST_PROTOCOLS_MAX_LIMIT)
  limit?: number = 20;
}
