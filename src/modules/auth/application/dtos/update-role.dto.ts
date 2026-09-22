import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
