import { IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';
import { ReviewType } from '../../../protocols/domain/enums/review-type.enum';

export class VerifyReceptionDto {
  @IsBoolean()
  isComplete!: boolean;

  @IsOptional()
  @IsString()
  missingItemsList?: string;

  // Tipo revisión para calcular plazo de respuesta (45 o 60 días)
  @IsOptional()
  @IsEnum(ReviewType)
  reviewType?: ReviewType;
}
