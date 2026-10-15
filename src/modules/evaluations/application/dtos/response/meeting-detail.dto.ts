import { ApiProperty } from '@nestjs/swagger';
import { MeetingSummaryDto } from './meeting-summary.dto';

export class AgendaProtocolDto {
  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 42, nullable: true })
  protocolId!: number | null;

  @ApiProperty({ example: 137, nullable: true })
  versionId!: number | null;

  @ApiProperty({ example: 2, nullable: true })
  versionNumber!: number | null;

  @ApiProperty({ example: 'CEISH-042-2026', nullable: true })
  ceishCode!: string | null;

  @ApiProperty({ example: 'Estudio clínico fase II', nullable: true })
  title!: string | null;

  @ApiProperty({ example: 'Ensayo clínico', nullable: true })
  studyType!: string | null;

  @ApiProperty({ example: 'Juan Pérez Torres', nullable: true })
  investigatorName!: string | null;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z', nullable: true })
  normativeDeadline!: string | null;
}

export class MeetingDetailDto extends MeetingSummaryDto {
  @ApiProperty({ type: [AgendaProtocolDto] })
  protocols!: AgendaProtocolDto[];
}

/** Wrapper de envelope para @ApiOkResponse en GET /meetings/:id */
export class MeetingDetailResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Convocatoria obtenida exitosamente' })
  message!: string;

  @ApiProperty({ type: MeetingDetailDto })
  data!: MeetingDetailDto;
}
