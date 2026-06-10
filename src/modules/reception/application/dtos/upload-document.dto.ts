import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SingleDocumentDto {
  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  requirementId?: number;

  @IsOptional()
  @IsString()
  requirementCode?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageCount?: number;

  @IsOptional()
  @IsBoolean()
  isConfidential?: boolean;

  @IsOptional()
  @Transform(({ value }) => value?.toString())
  @IsString()
  sizeBytes?: string;
}

export class UploadDocumentDto extends SingleDocumentDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  protocolId?: number;
}

export class UploadMultipleDocumentsDto {
  @IsNumber()
  @Type(() => Number)
  protocolId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleDocumentDto)
  documents!: SingleDocumentDto[];
}
