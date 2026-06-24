import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';
import { ReceptionStatus } from '../../domain/enums/reception-status.enum';
import { ReviewType } from '../../domain/enums/review-type.enum';

export class QueryProtocolDto {
  @ApiPropertyOptional({ enum: StudyTypeCode, type: String })
  @IsOptional()
  @IsEnum(StudyTypeCode)
  studyType?: StudyTypeCode;

  @ApiPropertyOptional({ enum: ReceptionStatus, type: String })
  @IsOptional()
  @IsEnum(ReceptionStatus)
  receptionStatus?: ReceptionStatus;

  @ApiPropertyOptional({ enum: ReviewType, type: String })
  @IsOptional()
  @IsEnum(ReviewType)
  reviewType?: ReviewType;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  investigatorId?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  statusId?: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  subsanar?: string;

  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
