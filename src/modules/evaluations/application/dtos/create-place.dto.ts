import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: string;
      obj?: Record<string, unknown>;
    }): string =>
      typeof value === 'string'
        ? value
        : typeof obj?.nombre === 'string'
          ? obj.nombre
          : '',
  )
  name!: string;

  @IsString()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: string;
      obj?: Record<string, unknown>;
    }): string | undefined =>
      typeof value === 'string'
        ? value
        : typeof obj?.direccion === 'string'
          ? obj.direccion
          : undefined,
  )
  location?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: boolean;
      obj?: Record<string, unknown>;
    }): boolean | undefined =>
      typeof value === 'boolean'
        ? value
        : typeof obj?.activo === 'boolean'
          ? obj.activo
          : undefined,
  )
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  esVirtual?: boolean;

  @IsString()
  @IsOptional()
  enlaceReunion?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdatePlaceDto {
  @IsString()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: string;
      obj?: Record<string, unknown>;
    }): string | undefined =>
      typeof value === 'string'
        ? value
        : typeof obj?.nombre === 'string'
          ? obj.nombre
          : undefined,
  )
  name?: string;

  @IsString()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: string;
      obj?: Record<string, unknown>;
    }): string | undefined =>
      typeof value === 'string'
        ? value
        : typeof obj?.direccion === 'string'
          ? obj.direccion
          : undefined,
  )
  location?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(
    ({
      value,
      obj,
    }: {
      value?: boolean;
      obj?: Record<string, unknown>;
    }): boolean | undefined =>
      typeof value === 'boolean'
        ? value
        : typeof obj?.activo === 'boolean'
          ? obj.activo
          : undefined,
  )
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  esVirtual?: boolean;

  @IsString()
  @IsOptional()
  enlaceReunion?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
