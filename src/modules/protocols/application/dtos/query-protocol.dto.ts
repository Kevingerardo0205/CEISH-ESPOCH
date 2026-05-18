import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';
import { ReceptionStatus } from '../../domain/enums/reception-status.enum';
import { ReviewType } from '../../domain/enums/review-type.enum';

export class QueryProtocolDto {
  @IsOptional()
  @IsEnum(StudyTypeCode)
  studyType?: StudyTypeCode;

  @IsOptional()
  @IsEnum(ReceptionStatus)
  receptionStatus?: ReceptionStatus;

  @IsOptional()
  @IsEnum(ReviewType)
  reviewType?: ReviewType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  investigatorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
