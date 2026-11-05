import { ApiProperty } from '@nestjs/swagger';

/** Lugar de la próxima reunión (RF-ALR.f.7). */
export class NextMeetingPlaceDto {
  @ApiProperty({ example: 'Sala de Sesiones CEISH' })
  nombre!: string;

  @ApiProperty()
  esVirtual!: boolean;

  @ApiProperty({ example: 'https://meet.example.com/ceish', nullable: true })
  enlaceReunion!: string | null;
}

/** Tarjeta «Próxima reunión» de Mis pendientes (spec-003 RF-ALR.f.7, TSK-015-N07). */
export class NextMeetingDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-000000000010' })
  id!: string;

  @ApiProperty({ example: '010-2026' })
  numeroConvocatoria!: string;

  @ApiProperty({ example: 'ORDINARIA' })
  tipoSesion!: string;

  @ApiProperty({ example: '2026-11-10T14:00:00.000Z' })
  fechaReunion!: string;

  @ApiProperty({ type: NextMeetingPlaceDto, nullable: true })
  lugar!: NextMeetingPlaceDto | null;

  @ApiProperty({
    example: 3,
    description:
      'Protocolos distintos del orden del día (sin filas eliminadas); 0 si no hay.',
  })
  protocolosATratar!: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: null,
    description:
      'Siempre null: los informes de seguimiento (Sección III) no se pueden agendar hasta RF-15 ' +
      '(POST /evaluations/meetings responde SEGUIMIENTO_NO_DISPONIBLE). null = no disponible, no cero.',
  })
  informesATratar!: null;
}

/** Envelope de GET /evaluations/meetings/next; data es null si no hay reunión próxima. */
export class NextMeetingResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Próxima reunión obtenida exitosamente' })
  message!: string;

  @ApiProperty({ type: NextMeetingDto, nullable: true })
  data!: NextMeetingDto | null;
}
