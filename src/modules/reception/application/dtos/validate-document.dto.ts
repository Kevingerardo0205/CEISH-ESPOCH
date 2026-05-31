import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ValidateDocumentDto {
  @IsNumber()
  statusId!: number;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsNumber()
  pageCount?: number;
}
