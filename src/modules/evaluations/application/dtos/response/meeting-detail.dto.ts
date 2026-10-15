import { ApiProperty } from '@nestjs/swagger';
import { MeetingSummaryDto } from './meeting-summary.dto';

export class AgendaProtocolDto {
  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 42 })
  protocolId!: number;

  @ApiProperty({ example: 137 })
  versionId!: number;

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
