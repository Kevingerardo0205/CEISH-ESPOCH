import { IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPeerEvaluatorsDto {
  @ApiProperty({
    description:
      'IDs de los evaluadores asignados como pares (deben ser exactamente 2)',
    example: [3, 4],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  evaluatorIds!: number[];
}
