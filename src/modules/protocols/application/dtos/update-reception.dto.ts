import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateReceptionDto {
  @IsBoolean()
  isComplete!: boolean;

  @IsOptional()
  @IsString()
  missingRequirements?: string;
}
