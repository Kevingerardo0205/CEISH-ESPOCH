import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';
import { IStorageService } from '../../../../shared/storage/domain/ports/storage.service.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { Permission } from '../../../../shared/enums/permission.enum';
import type { ResultadoPleno } from '../../../evaluations/application/dtos/registrar-resultado-pleno.dto';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import {
  CONTENT_TYPE_PDF,
  parseStorageKey,
} from '../../../storage-access/application/storage-key-access.policy';
import { canReadResolution, ResolutionReader } from './resolutions.service';
import {
  ResultadoResolucionService,
  TipoResolucion,
} from './resultado-resolucion.service';
import { VersionSubsanacionService } from './version-subsanacion.service';
import {
  AnexoCarta,
  CABECERA_PDF,
  TAMANO_MAXIMO_CARTA_BYTES,
  anexoParaResultado,
  esEstudioExento,
  etiquetaDecision,
  numeroVersionSiguiente,
  prefijoClaveCarta,
  requiereMotivo,
  tipoResolucionParaResultado,
} from './carta-firmada-rules';
import {
  RegistrarCartaFirmadaDto,
  SolicitarSubidaCartaDto,
} from '../dtos/cartas-firmadas.dto';
import { CartaFirmada } from '../../domain/entities/carta-firmada.entity';

/** Validez de la URL de subida (segundos). */
const EXPIRA_SUBIDA_SEGUNDOS = 900;
const NO_ENCONTRADO = 'Protocolo no encontrado.';
const MENSAJE_CARRERA_VERSION =
  'La versión de la carta cambió mientras se subía el archivo. Vuelva a subirlo.';

/** Fila cruda de una consulta SQL nativa. */
type Fila = Record<string, unknown>;

interface ContextoCarta {
  convocatoriaProtocoloId: string;
  protocoloId: number;
  versionId: number;
  investigadorId: number;
  tipoCodigo: string | null;
  resultado: ResultadoPleno | null;
}

export interface SubidaCartaRespuesta {
  uploadUrl: string;
  claveArchivo: string;
  anexoCodigo: AnexoCarta;
  numeroVersion: number;
}

/** Vista de una versión. `subidoPor` y `motivoReemplazo` solo para quien tiene RESOLUCION_HISTORIAL. */
export type CartaFirmadaVista = Omit<
  CartaFirmada,
  'protocolId' | 'versionId' | 'subidoPor' | 'motivoReemplazo'
> &
  Partial<Pick<CartaFirmada, 'subidoPor' | 'motivoReemplazo'>>;

/**
 * TSK-015-N09 — spec-003 RF-17.2, RF-17.4, RF-17.7 (v1.6.6). Carta firmada por versiones.
 * Upload en dos pasos: upload-url emite la clave (la genera el backend); el registro verifica el
 * archivo (HeadObject + cabecera %PDF-), guarda la versión y aplica el resultado en una transacción.
 * TSK-015-N13 (RF-17.5): el estado lo aplican los servicios compartidos con el legacy
 * (ResultadoResolucionService; VersionSubsanacionService para la v2.0 del Anexo 15).
 */
@Injectable()
export class CartasFirmadasService {
  private readonly logger = new Logger(CartasFirmadasService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(IStorageService)
    private readonly storage: IStorageService,
    @Inject(IEmailServicePort)
    private readonly email: IEmailServicePort,
    private readonly resultadoResolucion: ResultadoResolucionService,
    private readonly versionSubsanacion: VersionSubsanacionService,
  ) {}

  /** upload-url: valida resultado, EX y anexo; devuelve la URL firmada y la clave. No registra nada. */
  async solicitarSubida(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    dto: SolicitarSubidaCartaDto,
  ): Promise<SubidaCartaRespuesta> {
    const ctx = await this.cargarContexto(
      convocatoriaId,
      convocatoriaProtocoloId,
    );
    this.assertCartaAplicable(ctx, dto.anexoCodigo);

    const siguiente = numeroVersionSiguiente(
      await this.maximoVersion(this.dataSource, ctx.convocatoriaProtocoloId),
    );
    const claveArchivo = `${prefijoClaveCarta(ctx.protocoloId, ctx.convocatoriaProtocoloId, siguiente)}${randomUUID()}.pdf`;
    const uploadUrl = await this.storage.generateUploadUrl(
      claveArchivo,
      CONTENT_TYPE_PDF,
      EXPIRA_SUBIDA_SEGUNDOS,
    );
    return {
      uploadUrl,
      claveArchivo,
      anexoCodigo: dto.anexoCodigo,
      numeroVersion: siguiente,
    };
  }

  /** POST cartas: verifica el archivo, guarda la versión y fija el estado del protocolo. */
  async registrar(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    dto: RegistrarCartaFirmadaDto,
    usuarioId: number,
  ): Promise<CartaFirmadaVista> {
    const ctxInicial = await this.cargarContexto(
      convocatoriaId,
      convocatoriaProtocoloId,
    );
    this.assertCartaAplicable(ctxInicial, dto.anexoCodigo);
    const versionClave = this.versionDeClave(dto.claveArchivo, ctxInicial);

    const versionEsperada = numeroVersionSiguiente(
      await this.maximoVersion(
        this.dataSource,
        ctxInicial.convocatoriaProtocoloId,
      ),
    );
    if (versionClave !== versionEsperada) {
      throw new ConflictException(MENSAJE_CARRERA_VERSION);
    }

    await this.verificarArchivo(dto.claveArchivo);

    const motivo = dto.motivoReemplazo?.trim() || null;
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    let fila: Fila;
    let resultado: ResultadoPleno;
    try {
      // Bloqueo de la convocatoria-protocolo y del protocolo, en el mismo orden siempre.
      const [cp] = (await qr.query(
        `SELECT id, dictamen_resultado, dictamen_observaciones
           FROM evaluacion.convocatoria_protocolos
          WHERE id = $1 FOR UPDATE`,
        [ctxInicial.convocatoriaProtocoloId],
      )) as Fila[];
      await qr.query(
        `SELECT id FROM public.protocolos WHERE id = $1 FOR UPDATE`,
        [ctxInicial.protocoloId],
      );
      const ctx: ContextoCarta = {
        ...ctxInicial,
        resultado: (cp?.dictamen_resultado as ResultadoPleno | null) ?? null,
      };
      this.assertCartaAplicable(ctx, dto.anexoCodigo);
      resultado = ctx.resultado as ResultadoPleno;

      const siguiente = numeroVersionSiguiente(
        await this.maximoVersion(qr, ctx.convocatoriaProtocoloId),
      );
      if (siguiente !== versionClave) {
        throw new ConflictException(MENSAJE_CARRERA_VERSION);
      }

      const [vigenteActual] = (await qr.query(
        `SELECT id FROM resolucion.cartas_firmadas
          WHERE convocatoria_protocolo_id = $1 AND vigente FOR UPDATE`,
        [ctx.convocatoriaProtocoloId],
      )) as Fila[];
      if ((vigenteActual || requiereMotivo(siguiente)) && !motivo) {
        throw new BadRequestException(
          'Reemplazar una carta vigente exige el motivo del reemplazo.',
        );
      }
      if (vigenteActual) {
        await qr.query(
          `UPDATE resolucion.cartas_firmadas SET vigente = false WHERE id = $1`,
          [vigenteActual.id],
        );
      }

      const [insertada] = (await qr.query(
        `INSERT INTO resolucion.cartas_firmadas
           (convocatoria_protocolo_id, protocolo_id, version_id, numero_version, resultado,
            anexo_codigo, clave_archivo, vigente, motivo_reemplazo, subido_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
         RETURNING *`,
        [
          ctx.convocatoriaProtocoloId,
          ctx.protocoloId,
          ctx.versionId,
          siguiente,
          resultado,
          dto.anexoCodigo,
          dto.claveArchivo,
          requiereMotivo(siguiente) ? motivo : null,
          usuarioId,
        ],
      )) as Fila[];
      fila = insertada;

      // Estados con los servicios compartidos del legacy (sin SQL de estados aquí):
      // - ResultadoResolucionService: versión → 17/18/19 y protocolo → 17/18 (fecha_aprobacion en
      //   Guayaquil); con «aprobado con condición» el protocolo no se toca aquí.
      // - VersionSubsanacionService (solo Anexo 15): v2.0 en 21, protocolo apuntando a ella en 21,
      //   recepción en 9 y checklist. Cada rama guarda el protocolo una sola vez, así que TypeORM
      //   incrementa `version` una vez.
      const protocolOrm = await qr.manager.findOneByOrFail(ProtocolOrmEntity, {
        id: ctx.protocoloId,
      });
      const tipo = tipoResolucionParaResultado(resultado);
      await this.resultadoResolucion.aplicar(qr.manager, {
        protocolOrm,
        versionId: ctx.versionId,
        tipo,
      });
      if (resultado === 'APROBADO_CON_CONDICION') {
        const [evaluada] = (await qr.query(
          `SELECT numero_version FROM public.versiones_protocolo WHERE id = $1`,
          [ctx.versionId],
        )) as Fila[];
        await this.versionSubsanacion.crearSiguiente(qr.manager, {
          protocolId: ctx.protocoloId,
          protocolOrm,
          versionNumber: evaluada.numero_version as number,
          userId: usuarioId,
        });
      }
      await this.puenteResoluciones(qr, {
        protocoloId: ctx.protocoloId,
        versionId: ctx.versionId,
        tipo,
        observaciones: (cp?.dictamen_observaciones as string | null) ?? null,
        usuarioId,
      });
      await qr.commitTransaction();
    } catch (error) {
      await qr.rollbackTransaction();
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          'La carta firmada ya fue registrada por otra operación concurrente.',
        );
      }
      throw error;
    } finally {
      await qr.release();
    }

    await this.notificarCarta(
      ctxInicial.protocoloId,
      dto.claveArchivo,
      resultado,
    );
    return this.vista(this.mapear(fila), true);
  }

  /** GET cartas/vigente: investigador principal o RESOLUCION_HISTORIAL; si no, 404. */
  async vigente(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    lector: ResolutionReader,
  ): Promise<CartaFirmadaVista> {
    const ctx = await this.cargarContexto(
      convocatoriaId,
      convocatoriaProtocoloId,
    );
    if (!canReadResolution(ctx.investigadorId, lector)) {
      throw new NotFoundException(NO_ENCONTRADO);
    }
    const [fila] = await this.dataSource.query<Fila[]>(
      `SELECT * FROM resolucion.cartas_firmadas
        WHERE convocatoria_protocolo_id = $1 AND vigente`,
      [ctx.convocatoriaProtocoloId],
    );
    if (!fila) {
      throw new NotFoundException(
        'No hay una carta firmada vigente para este protocolo.',
      );
    }
    return this.vista(this.mapear(fila), this.puedeVerHistorial(lector));
  }

  /** GET cartas: solo RESOLUCION_HISTORIAL; los demás reciben 404 (RF-17.7). */
  async historial(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    lector: ResolutionReader,
  ): Promise<CartaFirmadaVista[]> {
    if (!this.puedeVerHistorial(lector)) {
      throw new NotFoundException(NO_ENCONTRADO);
    }
    await this.cargarContexto(convocatoriaId, convocatoriaProtocoloId);
    const filas = await this.dataSource.query<Fila[]>(
      `SELECT * FROM resolucion.cartas_firmadas
        WHERE convocatoria_protocolo_id = $1
        ORDER BY numero_version DESC`,
      [convocatoriaProtocoloId],
    );
    return filas.map((f) => this.vista(this.mapear(f), true));
  }

  // ---------------------------------------------------------------------------------------------

  private async cargarContexto(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
  ): Promise<ContextoCarta> {
    const [fila] = await this.dataSource.query<Fila[]>(
      `SELECT cp.id, cp.protocolo_id, cp.version_id, cp.dictamen_resultado,
              p.investigador_principal_id, te.codigo AS tipo_codigo
         FROM evaluacion.convocatoria_protocolos cp
         JOIN public.protocolos p ON p.id = cp.protocolo_id
         LEFT JOIN catalogos.tipos_estudio te ON te.id = p.tipo_estudio_id
        WHERE cp.id = $1 AND cp.convocatoria_id = $2 AND cp.eliminado_en IS NULL`,
      [convocatoriaProtocoloId, convocatoriaId],
    );
    if (!fila) {
      throw new NotFoundException(
        'No se encontró el protocolo en esta convocatoria.',
      );
    }
    return {
      convocatoriaProtocoloId: fila.id as string,
      protocoloId: fila.protocolo_id as number,
      versionId: fila.version_id as number,
      investigadorId: fila.investigador_principal_id as number,
      tipoCodigo: (fila.tipo_codigo as string | null) ?? null,
      resultado: (fila.dictamen_resultado as ResultadoPleno | null) ?? null,
    };
  }

  /** Reglas de RF-17.2: EX → 409; sin resultado → 409; anexo distinto del exigido → 400. */
  private assertCartaAplicable(ctx: ContextoCarta, anexo: AnexoCarta): void {
    if (ctx.tipoCodigo === null) {
      throw new ConflictException(
        'El protocolo no tiene tipo de estudio registrado.',
      );
    }
    if (esEstudioExento(ctx.tipoCodigo)) {
      throw new ConflictException(
        'El estudio exento (EX) no pasa por el pleno y no tiene carta de resolución.',
      );
    }
    if (ctx.resultado === null) {
      throw new ConflictException(
        'El protocolo no tiene resultado del pleno registrado.',
      );
    }
    const esperado = anexoParaResultado(ctx.resultado, ctx.tipoCodigo);
    if (esperado !== anexo) {
      throw new BadRequestException(
        `El anexo ${anexo} no corresponde al resultado del pleno. Debe ser ${esperado}.`,
      );
    }
  }

  /** Versión que indica la clave; 400 si la clave no es de una carta de esta convocatoria-protocolo. */
  private versionDeClave(clave: string, ctx: ContextoCarta): number {
    const parsed = parseStorageKey(clave);
    if (
      parsed.rule !== 'CARTA_FIRMADA' ||
      parsed.protocolId !== ctx.protocoloId ||
      parsed.convocatoriaProtocoloId?.toLowerCase() !==
        ctx.convocatoriaProtocoloId.toLowerCase() ||
      parsed.cartaVersion === undefined
    ) {
      throw new BadRequestException(
        'La clave del archivo no corresponde a esta carta firmada.',
      );
    }
    return parsed.cartaVersion;
  }

  /**
   * HeadObject (existe, application/pdf, ≤ 10 MB) y cabecera `%PDF-`. Si el archivo se rechaza,
   * se borra del bucket (best effort) y la respuesta sigue siendo 400.
   */
  private async verificarArchivo(clave: string): Promise<void> {
    let meta: Record<string, unknown>;
    try {
      meta = await this.storage.getMetadata(clave);
    } catch {
      throw new BadRequestException(
        'El archivo no existe en el almacenamiento. Súbalo antes de registrarlo.',
      );
    }
    const tipo =
      typeof meta.contentType === 'string'
        ? meta.contentType.toLowerCase()
        : '';
    const tamano = Number(meta.contentLength);
    if (tipo !== CONTENT_TYPE_PDF) {
      await this.rechazarArchivo(clave, 'El archivo debe ser un PDF.');
    }
    if (!(tamano > 0 && tamano <= TAMANO_MAXIMO_CARTA_BYTES)) {
      await this.rechazarArchivo(
        clave,
        'El PDF debe pesar entre 1 byte y 10 MB.',
      );
    }
    let cabecera = '';
    try {
      const bytes = await this.storage.readRange(
        clave,
        0,
        CABECERA_PDF.length - 1,
      );
      cabecera = bytes.toString('latin1');
    } catch {
      await this.rechazarArchivo(clave, 'No se pudo leer el archivo subido.');
    }
    if (cabecera !== CABECERA_PDF) {
      await this.rechazarArchivo(clave, 'El archivo no es un PDF válido.');
    }
  }

  private async rechazarArchivo(
    clave: string,
    mensaje: string,
  ): Promise<never> {
    try {
      await this.storage.deleteFile(clave);
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar el archivo rechazado ${clave}: ${String(error)}`,
      );
    }
    throw new BadRequestException(mensaje);
  }

  /** Correo con la carta vigente, después del commit. Sin datos de evaluadores (RF-17.6). */
  private async notificarCarta(
    protocoloId: number,
    clave: string,
    resultado: ResultadoPleno,
  ): Promise<void> {
    try {
      const [prot] = await this.dataSource.query<Fila[]>(
        `SELECT p.titulo, p.codigo_ceish, u.nombres_completos, u.email_institucional
           FROM public.protocolos p
           JOIN catalogos.usuarios u ON u.id = p.investigador_principal_id
          WHERE p.id = $1`,
        [protocoloId],
      );
      if (!prot?.email_institucional) return;
      const url = await this.storage.getDownloadUrl(clave);
      const respuesta = await fetch(url);
      if (!respuesta.ok) return;
      const pdf = Buffer.from(await respuesta.arrayBuffer());
      await this.email
        .sendResolutionEmail(
          prot.email_institucional as string,
          prot.nombres_completos as string,
          (prot.titulo as string | null) ?? 'Sin Título',
          (prot.codigo_ceish as string | null) ?? 'S/C',
          etiquetaDecision(resultado),
          pdf,
        )
        .catch((error: unknown) =>
          this.logger.error(
            `Error enviando la carta firmada: ${String(error)}`,
          ),
        );
    } catch (error) {
      this.logger.error(
        `No se pudo preparar el correo de la carta: ${String(error)}`,
      );
    }
  }

  /**
   * Puente con `resolucion.resoluciones`: lo lee el pendiente «Subir resolución» de secretaría
   * (`resolution_emitted`, por `version_id`). Una fila por versión evaluada: upsert bajo
   * `FOR UPDATE`. `vigencia_aprobacion_anios` = 1 (NOT NULL) y `periodo_seguimiento_dias` = NULL.
   */
  private async puenteResoluciones(
    qr: QueryRunner,
    p: {
      protocoloId: number;
      versionId: number;
      tipo: TipoResolucion;
      observaciones: string | null;
      usuarioId: number;
    },
  ): Promise<void> {
    const [existente] = (await qr.query(
      `SELECT id FROM resolucion.resoluciones WHERE version_id = $1 FOR UPDATE`,
      [p.versionId],
    )) as Fila[];
    if (existente) {
      await qr.query(
        `UPDATE resolucion.resoluciones
            SET tipo_resolucion_id = $2, observaciones = $3,
                vigencia_aprobacion_anios = 1, periodo_seguimiento_dias = NULL
          WHERE id = $1`,
        [existente.id, p.tipo, p.observaciones],
      );
      return;
    }
    await qr.query(
      `INSERT INTO resolucion.resoluciones
         (protocolo_id, version_id, tipo_resolucion_id, observaciones,
          vigencia_aprobacion_anios, periodo_seguimiento_dias, creado_por)
       VALUES ($1, $2, $3, $4, 1, NULL, $5)`,
      [p.protocoloId, p.versionId, p.tipo, p.observaciones, p.usuarioId],
    );
  }

  private async maximoVersion(
    runner: Pick<DataSource, 'query'>,
    convocatoriaProtocoloId: string,
  ): Promise<number> {
    const [fila] = await runner.query<Fila[]>(
      `SELECT COALESCE(MAX(numero_version), 0)::int AS maximo
         FROM resolucion.cartas_firmadas WHERE convocatoria_protocolo_id = $1`,
      [convocatoriaProtocoloId],
    );
    return fila.maximo as number;
  }

  private puedeVerHistorial(lector: ResolutionReader): boolean {
    return (lector.permissions ?? []).includes(Permission.RESOLUCION_HISTORIAL);
  }

  private vista(fila: CartaFirmada, completa: boolean): CartaFirmadaVista {
    const base: CartaFirmadaVista = {
      id: fila.id,
      convocatoriaProtocoloId: fila.convocatoriaProtocoloId,
      numeroVersion: fila.numeroVersion,
      resultado: fila.resultado,
      anexoCodigo: fila.anexoCodigo,
      claveArchivo: fila.claveArchivo,
      vigente: fila.vigente,
      subidoEn: fila.subidoEn,
    };
    if (!completa) return base;
    return {
      ...base,
      subidoPor: fila.subidoPor,
      motivoReemplazo: fila.motivoReemplazo,
    };
  }

  private mapear(fila: Fila): CartaFirmada {
    return {
      id: fila.id as string,
      convocatoriaProtocoloId: fila.convocatoria_protocolo_id as string,
      protocolId: fila.protocolo_id as number,
      versionId: fila.version_id as number,
      numeroVersion: fila.numero_version as number,
      resultado: fila.resultado as ResultadoPleno,
      anexoCodigo: fila.anexo_codigo as AnexoCarta,
      claveArchivo: fila.clave_archivo as string,
      vigente: fila.vigente as boolean,
      motivoReemplazo: (fila.motivo_reemplazo as string | null) ?? null,
      subidoPor: fila.subido_por as number,
      subidoEn: new Date(fila.subido_en as string),
    };
  }
}
