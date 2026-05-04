import { Injectable } from '@nestjs/common';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';

@Injectable()
export class ProtocolCodeGenerator {
  /**
   * Generates a code in the format: CEISH-ESPOCH-[TIPO]-[SECUENCIAL]-[AÑO]
   * @param typeCode IO, EI, EC, EX
   * @param sequence The next sequential number for the year
   * @returns Formatted string
   */
  generate(typeCode: StudyTypeCode, sequence: number): string {
    const year = new Date().getFullYear();
    const formattedSequence = sequence.toString().padStart(3, '0');
    return `CEISH-ESPOCH-${typeCode}-${formattedSequence}-${year}`;
  }
}
