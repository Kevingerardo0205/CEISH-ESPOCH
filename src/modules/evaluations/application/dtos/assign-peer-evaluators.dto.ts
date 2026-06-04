import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPeerEvaluatorsDto {
  @ApiProperty({
    description:
      'IDs de los evaluadores a asignar al protocolo (mínimo 4). El sistema seleccionará aleatoriamente 2 de ellos para la estratificación de riesgo.',
    example: [3, 4, 7, 12],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(4)
  evaluatorIds!: number[];
}
