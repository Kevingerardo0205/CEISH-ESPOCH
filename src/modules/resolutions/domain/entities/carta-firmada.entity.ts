import type { AnexoCarta } from '../../application/services/carta-firmada-rules';
import type { ResultadoPleno } from '../../../evaluations/domain/services/calcular-resultado-pleno';

/**
 * TSK-015-N09 (RF-17.4 v1.6.6): una versión de la carta firmada. Tipo de dominio, sin ORM.
 * `motivoReemplazo` y `subidoPor` no se devuelven al investigador (RF-17.4 v1.6.6).
 */
export interface CartaFirmada {
  readonly id: string;
  readonly convocatoriaProtocoloId: string;
  readonly protocolId: number;
  readonly versionId: number;
  readonly numeroVersion: number;
  readonly resultado: ResultadoPleno;
  readonly anexoCodigo: AnexoCarta;
  readonly claveArchivo: string;
  readonly vigente: boolean;
  readonly motivoReemplazo: string | null;
  readonly subidoPor: number;
  readonly subidoEn: Date;
}
