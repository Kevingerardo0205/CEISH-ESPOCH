import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateEvaluatorProfileDto {
  @IsString()
  @MaxLength(100)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordenPrioridad?: number;
}

export class UpdateEvaluatorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordenPrioridad?: number;
}
