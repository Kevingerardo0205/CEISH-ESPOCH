import { IsEnum } from 'class-validator';
import { ReviewType } from '../../domain/enums/review-type.enum';

export class AssignReviewDto {
  @IsEnum(ReviewType)
  reviewType!: ReviewType;
}
