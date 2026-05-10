import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { InvestigatorRole } from '../../domain/enums/investigator-role.enum';

export class CreateInvestigatorDto {
  @IsString()
  fullName!: string;

  @IsString()
  identification!: string;

  @IsString()
  position!: string;

  @IsString()
  institution!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsString()
  education!: string;

  @IsEnum(InvestigatorRole)
  role!: InvestigatorRole;

  @IsOptional()
  @IsNumber()
  userId?: number;
}
