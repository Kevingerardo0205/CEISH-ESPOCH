import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  moduleId?: number;
}
