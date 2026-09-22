import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RoleAssignmentItemDto {
  @ApiProperty({
    example: 'SECRETARIA',
    description: 'Código del rol a asignar',
  })
  @IsString()
  @IsNotEmpty()
  roleCode!: string;

  @ApiProperty({
    example: '2026-09-01T00:00:00.000Z',
    required: false,
    description: 'Fecha de inicio de vigencia (Default: NOW())',
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({
    example: '2026-09-15T23:59:59.000Z',
    required: false,
    description: 'Fecha de fin/expiración (null = Permanente)',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({
    example: 'Subrogación por licencia médica de la Secretaria titular',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignUserRolesDto {
  @ApiProperty({
    example: [
      'INVESTIGADOR',
      {
        roleCode: 'SECRETARIA',
        validFrom: '2026-09-01T00:00:00.000Z',
        validUntil: '2026-09-15T23:59:59.000Z',
        reason: 'Subrogación por vacaciones',
      },
    ],
    description:
      'Lista de asignaciones de rol (cadenas simples de texto u objetos con vigencia)',
  })
  @IsArray()
  roles!: (string | RoleAssignmentItemDto)[];
}
