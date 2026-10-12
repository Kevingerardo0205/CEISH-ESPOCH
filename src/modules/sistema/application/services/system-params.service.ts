import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemParamOrmEntity } from '../../infrastructure/database/system-param.entity.orm';
import {
  PLAZO_SUBSANACION_DOCUMENTAL_DIAS,
  PLAZO_REVISION_OFICIO_DIAS,
  ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION,
  EVALUADOR_URGENTE_UMBRAL_DIAS,
  PLAZO_CONDICION_DIAS,
} from '../../../../shared/deadlines/deadline-rules';

export const SP_PLAZO_SUBSANACION_DOCUMENTAL =
  'plazo_subsanacion_documental_dias' as const;
export const SP_PLAZO_REVISION_OFICIO = 'plazo_revision_oficio_dias' as const;
export const SP_ENTREGA_EVALUACION_DIAS =
  'entrega_evaluacion_dias_habiles_tras_reunion' as const;
export const SP_EVALUADOR_URGENTE_UMBRAL =
  'evaluador_urgente_umbral_dias' as const;
export const SP_PLAZO_CONDICION = 'plazo_condicion_dias' as const;

export type SystemParamKey =
  | typeof SP_PLAZO_SUBSANACION_DOCUMENTAL
  | typeof SP_PLAZO_REVISION_OFICIO
  | typeof SP_ENTREGA_EVALUACION_DIAS
  | typeof SP_EVALUADOR_URGENTE_UMBRAL
  | typeof SP_PLAZO_CONDICION;

export const SYSTEM_PARAM_FALLBACKS: Record<SystemParamKey, number> = {
  [SP_PLAZO_SUBSANACION_DOCUMENTAL]: PLAZO_SUBSANACION_DOCUMENTAL_DIAS,
  [SP_PLAZO_REVISION_OFICIO]: PLAZO_REVISION_OFICIO_DIAS,
  [SP_ENTREGA_EVALUACION_DIAS]: ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION,
  [SP_EVALUADOR_URGENTE_UMBRAL]: EVALUADOR_URGENTE_UMBRAL_DIAS,
  [SP_PLAZO_CONDICION]: PLAZO_CONDICION_DIAS,
};

@Injectable()
export class SystemParamsService implements OnModuleInit {
  private readonly logger = new Logger(SystemParamsService.name);
  private readonly cache = new Map<string, number>();
  private readonly warnedKeys = new Set<string>();
  private degraded = false;

  constructor(
    @InjectRepository(SystemParamOrmEntity)
    private readonly repo: Repository<SystemParamOrmEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.refresh();
    } catch (e) {
      this.degraded = true;
      this.logger.warn(
        `SystemParamsService: arranque degradado — usando fallbacks (${(e as Error).message})`,
      );
    }
  }

  async refresh(): Promise<void> {
    const rows = await this.repo.find();
    const knownKeys = new Set(Object.keys(SYSTEM_PARAM_FALLBACKS));
    const newCache = new Map<string, number>();

    for (const row of rows) {
      if (!knownKeys.has(row.clave)) {
        this.logger.warn(
          `SystemParam: clave desconocida '${row.clave}' en parametros_sistema — ignorada`,
        );
        continue;
      }
      if (row.tipoDato !== 'INTEGER') {
        this.logger.warn(
          `SystemParam: tipo_dato de '${row.clave}' es '${row.tipoDato}', se esperaba 'INTEGER' — ignorado`,
        );
        continue;
      }
      const valorStr = String(row.valor ?? '');
      if (!/^\d+$/.test(valorStr)) {
        this.logger.warn(
          `SystemParam: valor inválido para '${row.clave}': '${row.valor}' — ignorado, usando fallback`,
        );
        continue;
      }
      const valorNum = parseInt(valorStr, 10);
      if (valorNum <= 0) {
        this.logger.warn(
          `SystemParam: valor no positivo para '${row.clave}': ${valorNum} — ignorado, usando fallback`,
        );
        continue;
      }
      newCache.set(row.clave, valorNum);
    }

    this.cache.clear();
    for (const [k, v] of newCache) {
      this.cache.set(k, v);
    }

    for (const key of Object.keys(SYSTEM_PARAM_FALLBACKS) as SystemParamKey[]) {
      const cached = this.cache.get(key);
      if (cached !== undefined && cached !== SYSTEM_PARAM_FALLBACKS[key]) {
        this.logger.log(
          `SystemParam: ${key} = ${cached} (fallback hardcoded: ${SYSTEM_PARAM_FALLBACKS[key]})`,
        );
      }
    }

    this.degraded = false;
    this.warnedKeys.clear();
  }

  get(clave: SystemParamKey): number {
    const cached = this.cache.get(clave);
    if (cached !== undefined) {
      return cached;
    }
    if (!this.degraded && !this.warnedKeys.has(clave)) {
      this.warnedKeys.add(clave);
      this.logger.warn(
        `SystemParam: '${clave}' no está en caché, usando fallback ${SYSTEM_PARAM_FALLBACKS[clave]}`,
      );
    }
    return SYSTEM_PARAM_FALLBACKS[clave];
  }
}
