import { IsString, IsEnum, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateInstitutionDto {
  @IsString()
  name!: string;

  @IsEnum(['PUBLIC', 'PRIVATE'])
  type!: 'PUBLIC' | 'PRIVATE';

  @IsString()
  address!: string;

  @IsString()
  contactPerson!: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  hasInterestLetter: boolean = false;
}
