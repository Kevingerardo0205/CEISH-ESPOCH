import { IsNumber, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class CreateReceptionDto {
  @IsNumber()
  protocolId!: number;

  @IsOptional()
  @IsNumber()
  statusId?: number;

  @IsOptional()
  @IsBoolean()
  hasMissingItems?: boolean;

  @IsOptional()
  @IsString()
  missingItemsList?: string;

  @IsOptional()
  @IsDateString()
  missingItemsNotificationDate?: Date;

  @IsOptional()
  @IsNumber()
  completionDeadlineDays?: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
