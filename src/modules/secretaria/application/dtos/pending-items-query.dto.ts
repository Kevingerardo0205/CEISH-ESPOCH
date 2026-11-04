import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PENDING_FILTERS } from '../../domain/pending-item';
import type { PendingFilter } from '../../domain/pending-item';

/** spec-003 RF-ALR.f.3: filtro de GET /secretaria/pendientes. */
export class PendingItemsQueryDto {
  @ApiPropertyOptional({ enum: PENDING_FILTERS, default: 'todos' })
  @IsOptional()
  @IsIn(PENDING_FILTERS, {
    message: `El filtro debe ser uno de: ${PENDING_FILTERS.join(', ')}.`,
  })
  filtro?: PendingFilter;
}
