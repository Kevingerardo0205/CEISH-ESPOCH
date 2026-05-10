import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SingleDocumentDto {
  @IsString()
  fileName!: string;

  @IsString()
  path!: string;

  @IsOptional()
  @IsNumber()
  pageCount?: number;

  @IsOptional()
  @IsBoolean()
  isConfidential?: boolean;

  @IsOptional()
  @IsString()
  sizeBytes?: string;
}

export class UploadDocumentDto extends SingleDocumentDto {
  @IsNumber()
  protocolId!: number;
}

export class UploadMultipleDocumentsDto {
  @IsNumber()
  protocolId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleDocumentDto)
  documents!: SingleDocumentDto[];
}
