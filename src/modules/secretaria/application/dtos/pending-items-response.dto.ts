import { ApiProperty } from '@nestjs/swagger';
import { ProtocolStage } from '../../../protocols/domain/enums/protocol-stage.enum';
import { DeadlineGroup, PendingAction } from '../../domain/pending-item';

export class PendingItemDto {
  @ApiProperty({ example: 42 })
  protocolId!: number;

  @ApiProperty({ example: 'CEISH-042-2026', nullable: true })
  ceishCode!: string | null;

  @ApiProperty({ example: 'Estudio de ejemplo', nullable: true })
  title!: string | null;

  @ApiProperty({ example: 'En evaluación · dictamen vencido' })
  estadoActual!: string;

  @ApiProperty({ enum: ProtocolStage, nullable: true })
  etapa!: ProtocolStage | null;

  @ApiProperty({ example: 3, nullable: true })
  etapaOrden!: number | null;

  @ApiProperty({ example: '2026-10-21T04:59:59.999Z', nullable: true })
  fechaPlazo!: string | null;

  @ApiProperty({ enum: DeadlineGroup })
  estadoPlazo!: DeadlineGroup;

  @ApiProperty({ enum: PendingAction })
  accion!: PendingAction;

  @ApiProperty({ example: 'Reasignar evaluador' })
  accionTexto!: string;
}

export class PendingTotalsDto {
  @ApiProperty({ example: 3 })
  todos!: number;

  @ApiProperty({ example: 1 })
  vencidos!: number;

  @ApiProperty({ example: 0 })
  hoy!: number;

  @ApiProperty({ example: 0 })
  semana!: number;
}

export class PendingItemsDataDto {
  @ApiProperty({ example: '2026-11-04' })
  fechaReferencia!: string;

  @ApiProperty({ type: () => PendingTotalsDto })
  totales!: PendingTotalsDto;

  @ApiProperty({ type: () => [PendingItemDto] })
  items!: PendingItemDto[];
}

export class PendingItemsResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Pendientes obtenidos exitosamente' })
  message!: string;

  @ApiProperty({ type: () => PendingItemsDataDto })
  data!: PendingItemsDataDto;
}
