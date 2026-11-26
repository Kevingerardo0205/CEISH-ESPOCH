import {
  anexoParaResultado,
  estadoProtocoloParaResultado,
  esEstudioExento,
  numeroVersionSiguiente,
  prefijoClaveCarta,
  requiereMotivo,
  tipoResolucionParaResultado,
  TAMANO_MAXIMO_CARTA_BYTES,
  etiquetaDecision,
} from './carta-firmada-rules';
import { StudyTypeCode } from '../../../protocols/domain/enums/study-type.enum';

/** TSK-015-N09 — RF-17.2 y RF-17.4 (v1.6.6): reglas puras de la carta firmada. */
describe('TSK-015-N09 — carta-firmada-rules', () => {
  describe('anexoParaResultado (RF-17.2)', () => {
    it.each([
      ['APROBADO_DEFINITIVO', StudyTypeCode.IO, 'ANEXO_13'],
      ['APROBADO_DEFINITIVO', StudyTypeCode.EI, 'ANEXO_13'],
      ['APROBADO_DEFINITIVO', StudyTypeCode.EC, 'ANEXO_14'],
      ['APROBADO_CON_CONDICION', StudyTypeCode.IO, 'ANEXO_15'],
      ['APROBADO_CON_CONDICION', StudyTypeCode.EC, 'ANEXO_15'],
      ['NO_APROBADO', StudyTypeCode.IO, 'ANEXO_16'],
      ['NO_APROBADO', StudyTypeCode.EC, 'ANEXO_16'],
    ] as const)('%s con %s exige %s', (resultado, tipo, anexo) => {
      expect(anexoParaResultado(resultado, tipo)).toBe(anexo);
    });

    it('el EX no pasa por el pleno: devuelve null para cualquier resultado', () => {
      expect(
        anexoParaResultado('APROBADO_DEFINITIVO', StudyTypeCode.EX),
      ).toBeNull();
      expect(anexoParaResultado('NO_APROBADO', StudyTypeCode.EX)).toBeNull();
    });
  });

  it('EX se reconoce como estudio exento y los demás no', () => {
    expect(esEstudioExento(StudyTypeCode.EX)).toBe(true);
    expect(esEstudioExento(StudyTypeCode.IO)).toBe(false);
    expect(esEstudioExento(StudyTypeCode.EC)).toBe(false);
  });

  describe('versión de la carta (RF-17.4)', () => {
    it('numero_version es máximo + 1, empezando en 1', () => {
      expect(numeroVersionSiguiente(0)).toBe(1);
      expect(numeroVersionSiguiente(1)).toBe(2);
      expect(numeroVersionSiguiente(4)).toBe(5);
    });

    it('el motivo es obligatorio desde la versión 2', () => {
      expect(requiereMotivo(1)).toBe(false);
      expect(requiereMotivo(2)).toBe(true);
      expect(requiereMotivo(7)).toBe(true);
    });
  });

  describe('estado y tipo de resolución por resultado (RF-17.4)', () => {
    it('APROBADO_DEFINITIVO → 17 y tipo 1; APROBADO_CON_CONDICION → 19 y tipo 2; NO_APROBADO → 18 y tipo 3', () => {
      expect(estadoProtocoloParaResultado('APROBADO_DEFINITIVO')).toBe(17);
      expect(tipoResolucionParaResultado('APROBADO_DEFINITIVO')).toBe(1);
      expect(estadoProtocoloParaResultado('APROBADO_CON_CONDICION')).toBe(19);
      expect(tipoResolucionParaResultado('APROBADO_CON_CONDICION')).toBe(2);
      expect(estadoProtocoloParaResultado('NO_APROBADO')).toBe(18);
      expect(tipoResolucionParaResultado('NO_APROBADO')).toBe(3);
    });
  });

  it('la clave de una versión lleva protocolo, convocatoria-protocolo y versión', () => {
    expect(
      prefijoClaveCarta(5, '6f1c2a4e-1b2c-4d5e-8f90-123456789abc', 2),
    ).toBe('protocols/5/resolutions/6f1c2a4e-1b2c-4d5e-8f90-123456789abc/v2/');
  });

  it('el tamaño máximo es 10 MB y la etiqueta del correo sigue al resultado', () => {
    expect(TAMANO_MAXIMO_CARTA_BYTES).toBe(10 * 1024 * 1024);
    expect(etiquetaDecision('APROBADO_DEFINITIVO')).toBe('Protocolo Aprobado');
    expect(etiquetaDecision('NO_APROBADO')).toBe('Protocolo Rechazado');
    expect(etiquetaDecision('APROBADO_CON_CONDICION')).toBe(
      'Aprobado con Observaciones / Subsanación',
    );
  });
});
