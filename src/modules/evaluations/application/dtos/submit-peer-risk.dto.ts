import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitPeerRiskDto {
  @ApiProperty({
    description: 'ID del nivel de riesgo propuesto',
    example: 5,
  })
  @IsInt()
  riskLevelId!: number;

  @ApiProperty({
    description:
      'Observaciones o justificación de la asignación del nivel de riesgo',
    example: 'Se detecta uso de datos sensibles en la metodología.',
    required: false,
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
