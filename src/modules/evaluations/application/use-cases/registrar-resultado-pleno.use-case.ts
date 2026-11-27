import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IMeetingRepositoryPort } from '../../domain/ports/meeting-repository.port';
import {
  RegistrarResultadoPlenoDto,
  ResultadoPleno,
} from '../dtos/registrar-resultado-pleno.dto';
import { esEstudioExento } from '../../../resolutions/application/services/carta-firmada-rules';
import { evaluarVentanaResultadoPleno } from '../../domain/services/ventana-resultado-pleno';

export interface RegistrarResultadoPlenoInput {
  convocatoriaId: string;
  convocatoriaProtocoloId: string;
  dto: RegistrarResultadoPlenoDto;
  registradoPor: number;
  /** Instante de la petición; se compara con fecha_reunion en America/Guayaquil. */
  now: Date;
}

export interface RegistrarResultadoPlenoResult {
  convocatoriaProtocoloId: string;
  resultado: ResultadoPleno;
  motivo: string | null;
  observaciones: string | null;
  motivoCorreccion: string | null;
  registradoPor: number;
}

function textoOpcional(valor: string | undefined): string | null {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

/**
 * TSK-015-N08 (spec-003 RF-17.1 v1.6.2): registra o corrige el resultado del pleno de un
 * punto de la convocatoria. No cambia protocolos.estado_id ni cierra la sesión (TSK-015-N16).
 */
@Injectable()
export class RegistrarResultadoPlenoUseCase {
  constructor(
    @Inject('IMeetingRepositoryPort')
    private readonly meetingRepository: IMeetingRepositoryPort,
  ) {}

  async execute(
    input: RegistrarResultadoPlenoInput,
  ): Promise<RegistrarResultadoPlenoResult> {
    const contexto = await this.meetingRepository.findResultadoPlenoContext(
      input.convocatoriaId,
      input.convocatoriaProtocoloId,
    );
    if (!contexto) {
      throw new NotFoundException(
        'No se encontró el protocolo en esta convocatoria.',
      );
    }

    // Ventana (TSK-015-N25: función pura compartida con el contexto de resolución).
    const cierreVentana = evaluarVentanaResultadoPleno({
      convocatoriaEstado: contexto.convocatoriaEstado,
      fechaReunion: contexto.fechaReunion,
      ahora: input.now,
    });
    if (cierreVentana === 'CANCELADA') {
      throw new ConflictException(
        'La convocatoria está cancelada y no admite el registro de resultados.',
      );
    }

    // TSK-015-N20 (RF-17.2): el estudio EX no pasa por el pleno; no admite resultado.
    if (
      contexto.tipoEstudioCodigo !== null &&
      esEstudioExento(contexto.tipoEstudioCodigo)
    ) {
      throw new ConflictException(
        'El estudio exento (EX) no pasa por el pleno y no admite el registro de resultados.',
      );
    }

    if (cierreVentana === 'FECHA_NO_CELEBRADA') {
      throw new ConflictException(
        'La reunión todavía no se ha celebrado. El resultado solo puede registrarse desde la fecha de la reunión (hora de Ecuador).',
      );
    }

    const { resultado } = input.dto;
    const motivo = textoOpcional(input.dto.motivo);
    const observaciones = textoOpcional(input.dto.observaciones);
    const motivoCorreccion = textoOpcional(input.dto.motivoCorreccion);

    if (resultado === 'NO_APROBADO' && !motivo) {
      throw new BadRequestException(
        'Debe indicar el motivo para un resultado NO_APROBADO.',
      );
    }
    if (resultado === 'APROBADO_CON_CONDICION' && !observaciones) {
      throw new BadRequestException(
        'Debe indicar las observaciones para un resultado APROBADO_CON_CONDICION.',
      );
    }
    if (contexto.dictamenResultado !== null && !motivoCorreccion) {
      throw new BadRequestException(
        'Este protocolo ya tiene un resultado registrado. Indique el motivo de la corrección.',
      );
    }

    await this.meetingRepository.registrarResultadoPleno({
      convocatoriaProtocoloId: input.convocatoriaProtocoloId,
      resultadoAnterior: contexto.dictamenResultado,
      resultado,
      motivo,
      observaciones,
      motivoCorreccion,
      registradoPor: input.registradoPor,
    });

    return {
      convocatoriaProtocoloId: input.convocatoriaProtocoloId,
      resultado,
      motivo,
      observaciones,
      motivoCorreccion,
      registradoPor: input.registradoPor,
    };
  }
}
