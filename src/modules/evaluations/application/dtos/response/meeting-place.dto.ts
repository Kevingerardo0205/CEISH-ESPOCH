import { ApiProperty } from '@nestjs/swagger';

/** DTO de lugar para endpoints /meetings/places (incluye isActive). */
export class MeetingPlaceDto {
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

  @ApiProperty()
  isActive!: boolean;
}

export class PlaceListResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Lugares obtenidos exitosamente' })
  message!: string;

  @ApiProperty({ type: [MeetingPlaceDto] })
  data!: MeetingPlaceDto[];
}

export class PlaceSingleResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'Lugar obtenido exitosamente' })
  message!: string;

  @ApiProperty({ type: MeetingPlaceDto })
  data!: MeetingPlaceDto;
}
