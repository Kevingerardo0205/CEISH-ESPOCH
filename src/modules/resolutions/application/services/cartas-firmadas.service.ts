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
import {
  AsignacionParaResultado,
  calcularResultadoPleno,
  ResultadoPleno,
} from '../../../evaluations/domain/services/calcular-resultado-pleno';
import { ACTIVE_ASSIGNMENT_STATES } from '../../../evaluations/domain/enums/assignment-status.enum';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import {
  CONTENT_TYPE_PDF,
  parseStorageKey,
} from '../../../storage-access/application/storage-key-access.policy';
import { canReadResolution, ResolutionReader } from './resolutions.service';
import { ventanaResultadoPlenoAbierta } from '../../../evaluations/domain/services/ventana-resultado-pleno';
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
const MENSAJE_RESUELTO_LEGACY =
  'Este protocolo ya tiene una resolución emitida con el flujo anterior y no admite una carta firmada nueva.';
const MENSAJE_PENDIENTE =
  'El resultado del pleno aún no está disponible: hay evaluaciones pendientes de dictamen.';

/** Fila cruda de una consulta SQL nativa. */
type Fila = Record<string, unknown>;

/** TSK-015-N25: carta vigente de una convocatoria, tal como la ve el contexto de resolución. */
export interface CartaVigenteContexto {
  numeroVersion: number;
  anexoCodigo: AnexoCarta;
  subidoEn: Date;
  claveArchivo: string;
}

/** TSK-015-N25: una convocatoria del protocolo en la etapa Resolución. */
export interface ContextoResolucionConvocatoria {
  convocatoriaId: string;
  convocatoriaProtocoloId: string;
  numeroConvocatoria: string;
  fechaReunion: Date | null;
  versionEvaluada: number;
  resultado: ResultadoPleno | null;
  anexoEsperado: AnexoCarta | null;
  cartaVigente: CartaVigenteContexto | null;
  puedeRegistrarResultado: boolean;
  puedeSubirCarta: boolean;
  /** Solo para lectores con RESOLUCION_HISTORIAL. */
  motivo?: string | null;
  /** Solo para lectores con RESOLUCION_HISTORIAL. */
  observaciones?: string | null;
}

interface ContextoCarta {
  convocatoriaProtocoloId: string;
  protocoloId: number;
  versionId: number;
  investigadorId: number;
  tipoCodigo: string | null;
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

  /**
   * upload-url (TSK-015-N27-6): valida EX, bloqueo legacy y resultado (vigente o calculado en este
   * momento); devuelve la URL firmada, la clave y el anexo derivado. No registra nada.
   * `_dto` no tiene campos: el ValidationPipe rechaza cualquier propiedad (p. ej. `anexoCodigo`).
   */
  async solicitarSubida(
    convocatoriaId: string,
    convocatoriaProtocoloId: string,
    // El DTO no aporta datos: el @Body existe para que ValidationPipe rechace propiedades extra (400).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dto: SolicitarSubidaCartaDto,
  ): Promise<SubidaCartaRespuesta> {
    const ctx = await this.cargarContexto(
      convocatoriaId,
      convocatoriaProtocoloId,
    );
    this.assertCartaAplicable(ctx);
    const { anexo } = await this.resultadoParaCarta(
      this.dataSource,
      ctx,
      false,
    );

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
      anexoCodigo: anexo,
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
    this.assertCartaAplicable(ctxInicial);
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
    let anexo: AnexoCarta;
    try {
      // Bloqueo de la convocatoria-protocolo y del protocolo, en el mismo orden siempre.
      await qr.query(
        `SELECT id FROM evaluacion.convocatoria_protocolos
          WHERE id = $1 FOR UPDATE`,
        [ctxInicial.convocatoriaProtocoloId],
      );
      await qr.query(
        `SELECT id FROM public.protocolos WHERE id = $1 FOR UPDATE`,
        [ctxInicial.protocoloId],
      );
      // Primera carta: se calcula ahora, bajo bloqueo, y se congela. Reemplazo: usa el congelado.
      ({ resultado, anexo } = await this.resultadoParaCarta(
        qr,
        ctxInicial,
        true,
      ));

      const siguiente = numeroVersionSiguiente(
        await this.maximoVersion(qr, ctxInicial.convocatoriaProtocoloId),
      );
      if (siguiente !== versionClave) {
        throw new ConflictException(MENSAJE_CARRERA_VERSION);
      }

      const [vigenteActual] = (await qr.query(
        `SELECT id FROM resolucion.cartas_firmadas
          WHERE convocatoria_protocolo_id = $1 AND vigente FOR UPDATE`,
        [ctxInicial.convocatoriaProtocoloId],
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
          ctxInicial.convocatoriaProtocoloId,
          ctxInicial.protocoloId,
          ctxInicial.versionId,
          siguiente,
          resultado,
          anexo,
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
        id: ctxInicial.protocoloId,
      });
      const tipo = tipoResolucionParaResultado(resultado);
      await this.resultadoResolucion.aplicar(qr.manager, {
        protocolOrm,
        versionId: ctxInicial.versionId,
        tipo,
      });
      if (resultado === 'APROBADO_CON_CONDICION') {
        const [evaluada] = (await qr.query(
          `SELECT numero_version FROM public.versiones_protocolo WHERE id = $1`,
          [ctxInicial.versionId],
        )) as Fila[];
        await this.versionSubsanacion.crearSiguiente(qr.manager, {
          protocolId: ctxInicial.protocoloId,
          protocolOrm,
          versionNumber: evaluada.numero_version as number,
          userId: usuarioId,
        });
      }
      await this.puenteResoluciones(qr, {
        protocoloId: ctxInicial.protocoloId,
        versionId: ctxInicial.versionId,
        tipo,
        observaciones: null,
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

  /**
   * TSK-015-N25 (RF-17.1, RF-17.4, RF-17.6): etapa Resolución de un protocolo. Lista todas sus
   * convocatorias (fecha de reunión descendente). Acceso: investigador principal o RESOLUCION_HISTORIAL;
   * el resto recibe 404. Visibilidad: sin RESOLUCION_HISTORIAL, `resultado` y `anexoEsperado` solo
   * con carta vigente, y sin `motivo` ni `observaciones`. `claveArchivo` solo dentro de `cartaVigente`.
   */
  async contextoProtocolo(
    protocoloId: number,
    lector: ResolutionReader,
    ahora: Date,
  ): Promise<ContextoResolucionConvocatoria[]> {
    const [protocolo] = await this.dataSource.query<Fila[]>(
      `SELECT investigador_principal_id FROM public.protocolos WHERE id = $1`,
      [protocoloId],
    );
    if (
      !protocolo ||
      !canReadResolution(
        protocolo.investigador_principal_id as number | null,
        lector,
      )
    ) {
      throw new NotFoundException('Protocolo no encontrado.');
    }

    const filas = await this.dataSource.query<Fila[]>(
      `SELECT cp.id AS convocatoria_protocolo_id, c.id AS convocatoria_id,
              c.numero_convocatoria, c.fecha_reunion, c.estado AS convocatoria_estado,
              cp.dictamen_resultado, cp.dictamen_motivo, cp.dictamen_observaciones,
              v.numero_version, te.codigo AS tipo_codigo
         FROM evaluacion.convocatoria_protocolos cp
         JOIN evaluacion.convocatorias c ON c.id = cp.convocatoria_id
         JOIN public.versiones_protocolo v ON v.id = cp.version_id
         JOIN public.protocolos p ON p.id = cp.protocolo_id
         LEFT JOIN catalogos.tipos_estudio te ON te.id = p.tipo_estudio_id
        WHERE cp.protocolo_id = $1 AND cp.eliminado_en IS NULL
        ORDER BY c.fecha_reunion DESC NULLS LAST`,
      [protocoloId],
    );
    const cartas = await this.dataSource.query<Fila[]>(
      `SELECT convocatoria_protocolo_id, numero_version, anexo_codigo, subido_en, clave_archivo
         FROM resolucion.cartas_firmadas
        WHERE protocolo_id = $1 AND vigente`,
      [protocoloId],
    );
    const cartaPorCp = new Map(
      cartas.map((c) => [c.convocatoria_protocolo_id as string, c]),
    );

    const permisos = lector.permissions ?? [];
    const completa = permisos.includes(Permission.RESOLUCION_HISTORIAL);
    return filas.map((f) => {
      const resultado = (f.dictamen_resultado as ResultadoPleno | null) ?? null;
      const tipo = (f.tipo_codigo as string | null) ?? null;
      const anexo =
        resultado !== null && tipo !== null
          ? anexoParaResultado(resultado, tipo)
          : null;
      const carta = cartaPorCp.get(f.convocatoria_protocolo_id as string);
      const cartaVigente: CartaVigenteContexto | null = carta
        ? {
            numeroVersion: carta.numero_version as number,
            anexoCodigo: carta.anexo_codigo as AnexoCarta,
            subidoEn: carta.subido_en as Date,
            claveArchivo: carta.clave_archivo as string,
          }
        : null;
      const verResultado = completa || cartaVigente !== null;
      const exento = tipo !== null && esEstudioExento(tipo);
      const fechaReunion = (f.fecha_reunion as Date | null) ?? null;

      return {
        convocatoriaId: f.convocatoria_id as string,
        convocatoriaProtocoloId: f.convocatoria_protocolo_id as string,
        numeroConvocatoria: f.numero_convocatoria as string,
        fechaReunion,
        versionEvaluada: f.numero_version as number,
        resultado: verResultado ? resultado : null,
        anexoEsperado: verResultado ? anexo : null,
        cartaVigente,
        puedeRegistrarResultado:
          permisos.includes(Permission.PLENO_RESULTADO_REGISTRAR) &&
          !exento &&
          ventanaResultadoPlenoAbierta({
            convocatoriaEstado: f.convocatoria_estado as string,
            fechaReunion,
            ahora,
          }),
        puedeSubirCarta:
          permisos.includes(Permission.RESOLUCION_CREAR) &&
          resultado !== null &&
          anexo !== null,
        ...(completa
          ? {
              motivo: (f.dictamen_motivo as string | null) ?? null,
              observaciones:
                (f.dictamen_observaciones as string | null) ?? null,
            }
          : {}),
      };
    });
  }

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
    };
  }

  /** Reglas de RF-17.2 (TSK-015-N27-6): sin tipo de estudio → 409; EX → 409. */
  private assertCartaAplicable(ctx: ContextoCarta): void {
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
  }

  /**
   * Resultado y anexo de la carta (TSK-015-N27-6, RF-17.1 v1.6.8). Con carta vigente (reemplazo)
   * usa el resultado congelado y no recalcula. Sin carta, calcula ahora; con `bloqueo` toma
   * `FOR UPDATE` sobre las asignaciones de la versión. 409 si el protocolo se resolvió con el flujo
   * legacy o si el cálculo está pendiente.
   */
  private async resultadoParaCarta(
    runner: Pick<DataSource, 'query'>,
    ctx: ContextoCarta,
    bloqueo: boolean,
  ): Promise<{ resultado: ResultadoPleno; anexo: AnexoCarta }> {
    const [vigente] = await runner.query<Fila[]>(
      `SELECT resultado FROM resolucion.cartas_firmadas
        WHERE convocatoria_protocolo_id = $1 AND vigente`,
      [ctx.convocatoriaProtocoloId],
    );
    let resultado = (vigente?.resultado as ResultadoPleno | undefined) ?? null;
    if (resultado === null) {
      if (await this.resueltoPorLegacy(runner, ctx)) {
        throw new ConflictException(MENSAJE_RESUELTO_LEGACY);
      }
      const calculo = calcularResultadoPleno(
        await this.asignacionesDeVersion(runner, ctx.versionId, bloqueo),
      );
      if (calculo.estado === 'PENDIENTE') {
        throw new ConflictException(MENSAJE_PENDIENTE);
      }
      resultado = calculo.resultado;
    }
    const anexo = anexoParaResultado(resultado, ctx.tipoCodigo ?? '');
    if (anexo === null) {
      throw new ConflictException(
        'El estudio exento (EX) no pasa por el pleno y no tiene carta de resolución.',
      );
    }
    return { resultado, anexo };
  }

  /** Protocolo resuelto con el flujo legacy: fila en resolucion.resoluciones de su versión y ninguna carta. */
  private async resueltoPorLegacy(
    runner: Pick<DataSource, 'query'>,
    ctx: ContextoCarta,
  ): Promise<boolean> {
    const [fila] = await runner.query<Fila[]>(
      `SELECT EXISTS (SELECT 1 FROM resolucion.resoluciones WHERE version_id = $1)
              AND NOT EXISTS (SELECT 1 FROM resolucion.cartas_firmadas
                               WHERE convocatoria_protocolo_id = $2) AS legacy`,
      [ctx.versionId, ctx.convocatoriaProtocoloId],
    );
    return fila?.legacy === true;
  }

  /**
   * Asignaciones activas (5, 6, 7) de la versión con el dictamen de su última evaluación.
   * `bloqueo` toma `FOR UPDATE OF a`: la reasignación de una activa espera al commit de la carta.
   */
  private async asignacionesDeVersion(
    runner: Pick<DataSource, 'query'>,
    versionId: number,
    bloqueo: boolean,
  ): Promise<AsignacionParaResultado[]> {
    const filas = await runner.query<Fila[]>(
      `SELECT a.estado_id, e.resultado_id
         FROM evaluacion.asignaciones_evaluacion a
         LEFT JOIN LATERAL (
           SELECT x.resultado_id FROM evaluacion.evaluaciones x
            WHERE x.asignacion_id = a.id
            ORDER BY x.id DESC
            LIMIT 1
         ) e ON true
        WHERE a.version_id = $1 AND a.estado_id = ANY($2::int[])
        ${bloqueo ? 'FOR UPDATE OF a' : ''}`,
      [versionId, [...ACTIVE_ASSIGNMENT_STATES]],
    );
    return filas.map((f) => ({
      estadoId: f.estado_id as number,
      resultadoId: (f.resultado_id as number | null) ?? null,
    }));
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
