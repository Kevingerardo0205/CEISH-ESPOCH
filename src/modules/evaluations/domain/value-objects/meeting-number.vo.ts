import { BadRequestException } from '@nestjs/common';

export class MeetingNumberValueObject {
  readonly value: string;
  readonly sequenceNumber: number;
  readonly academicYear: number;

  private constructor(sequenceNumber: number, academicYear: number) {
    if (!sequenceNumber || sequenceNumber <= 0) {
      throw new BadRequestException(
        'NUMERO_SECUENCIAL_INVALIDO: El número correlativo debe ser mayor a 0',
      );
    }
    if (!academicYear || academicYear < 2000) {
      throw new BadRequestException(
        'ANIO_LECTIVO_INVALIDO: El año lectivo es requerido y debe ser válido',
      );
    }

    this.sequenceNumber = sequenceNumber;
    this.academicYear = academicYear;
    this.value = `${String(sequenceNumber).padStart(3, '0')}-${academicYear}`;
  }

  static fromSequence(
    sequenceNumber: number,
    academicYear: number,
  ): MeetingNumberValueObject {
    return new MeetingNumberValueObject(sequenceNumber, academicYear);
  }

  static fromString(value: string): MeetingNumberValueObject {
    const regex = /^(\d{3,})-(\d{4})$/;
    const match = value ? value.match(regex) : null;

    if (!match) {
      throw new BadRequestException(
        `FORMATO_CONVOCATORIA_INVALIDO: El código '${value}' no cumple el formato '001-2026'`,
      );
    }

    const seq = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    return new MeetingNumberValueObject(seq, year);
  }
}
