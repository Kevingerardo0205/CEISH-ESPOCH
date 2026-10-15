import { ApiProperty } from '@nestjs/swagger';

/** DTO del lugar embebido en convocatorias (sin isActive). */
export class PlaceEmbedDto {
  @ApiProperty({ example: 'b1ffbc88-8c0a-3ef7-aa5c-5bb8bd270a22' })
  id!: string;

  @ApiProperty({ example: 'Sala de Sesiones CEISH' })
  name!: string;

  @ApiProperty({ example: 'Edificio Central, piso 3', nullable: true })
  address!: string | null;

  @ApiProperty()
  isVirtual!: boolean;

  @ApiProperty({ example: 'https://meet.example.com/ceish', nullable: true })
  meetingLink!: string | null;
}

export class MeetingSummaryDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-000000000010' })
  id!: string;

  @ApiProperty({ example: '010-2026' })
  meetingNumber!: string;

  @ApiProperty({ example: 2026, nullable: true })
  academicYear!: number | null;

  @ApiProperty({ example: 'ORDINARIA' })
  sessionType!: string;

  @ApiProperty({ example: '2026-10-15T09:00:00.000Z', nullable: true })
  meetingDate!: string | null;

  @ApiProperty({ example: '2026-10-08T23:59:59.000Z', nullable: true })
  evalSubmissionDeadline!: string | null;

  @ApiProperty({ example: 'PROGRAMADA' })
  status!: string;

  @ApiProperty({ type: PlaceEmbedDto, nullable: true })
  place!: PlaceEmbedDto | null;

  @ApiProperty({ example: '/api/evaluations/meetings/f47ac10b.../pdf' })
  agendaPdfUrl!: string;

  @ApiProperty({ example: 3 })
  protocolCount!: number;
}

export class MeetingListMetaDto {
  @ApiProperty({ example: 25 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;
}

/** Wrapper de envelope para @ApiOkResponse en GET /meetings */
export class MeetingListResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Convocatorias obtenidas exitosamente' })
  message!: string;

  @ApiProperty({ type: [MeetingSummaryDto] })
  data!: MeetingSummaryDto[];

  @ApiProperty({ type: MeetingListMetaDto })
  meta!: MeetingListMetaDto;
}
