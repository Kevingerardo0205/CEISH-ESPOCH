/**
 * Plazos normativos centralizados del CEISH-ESPOCH.
 * Fuente canónica: specs/001-flujo-mvp/spec.md (v3.3.1) RF-NORM, RF-CAL
 *                  specs/002-flujo-mvp/spec.md (v1.1.0) RF-12.7
 *                  specs/003-flujo-mvp/spec.md (v1.4.1) RF-09.1, RF-14.1, RF-15.1, RF-16.1, RF-ALR
 *
 * PR-A: refactor sólo — ningún valor en ejecución cambia.
 * Constantes LEGACY preservan el valor actual del código cuando difiere del spec.
 * Las contradicciones se marcan con TODO PR-B en los sitios de uso.
 */

/**
 * RF-07.1 / RF-13 (spec-001/spec-003): plazo_subsanacion_documental_dias = 30 días hábiles.
 * No se usa donde el código aún tiene el valor legado; ver PLAZO_SUBSANACION_DOCUMENTAL_LEGACY_DIAS.
 */
export const PLAZO_SUBSANACION_DOCUMENTAL_DIAS = 30 as const;

/**
 * Valor actual del código para subsanar documentos faltantes (días hábiles).
 * TODO PR-B: contradice spec-001 RF-07.1 que fija plazo_subsanacion_documental_dias = 30.
 */
export const PLAZO_SUBSANACION_DOCUMENTAL_LEGACY_DIAS = 15 as const;

/** RF-14.1 (spec-003): Días hábiles para subsanar una versión mayor (APROBADO_CON_CONDICIONES). */
export const PLAZO_CONDICION_DIAS = 30 as const;

/** RF-12.7(c) (spec-002): Días hábiles de plazo de entrega para revisión EXPEDITA tras asignación. */
export const PLAZO_REVISION_OFICIO_DIAS = 8 as const;

/**
 * Plazo legado de entrega para revisión PLENO (días hábiles).
 * TODO PR-B: contradice spec-002 RF-12.7(a) — la asignación PLENO no tiene plazo
 *            hasta la convocatoria ("Pendiente de convocatoria").
 */
export const PLAZO_REVISION_OFICIO_PLENO_LEGACY_DIAS = 15 as const;

/** RF-CAL (spec-001): Plazo normativo total para revisión EXPEDITA (días hábiles). */
export const PLAZO_NORMATIVO_EXPEDITA_DIAS = 45 as const;

/** RF-CAL (spec-001): Plazo normativo total para revisión PLENO / Ensayo Clínico (días hábiles). */
export const PLAZO_NORMATIVO_PLENO_DIAS = 60 as const;

/** RF-09.1 (spec-003): Días hábiles DESPUÉS de la reunión para la entrega de evaluación. */
export const ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION = 2 as const;

/** RF-09.1 (spec-003): Hora de corte para entrega de evaluación (formato HH:mm). */
export const ENTREGA_EVALUACION_HORA_CORTE = '12:00' as const;

/** RF-09.1 (spec-003): Zona horaria canónica del CEISH-ESPOCH. */
export const ENTREGA_EVALUACION_ZONA_HORARIA = 'America/Guayaquil' as const;

/**
 * Umbral en días restantes para marcar una asignación como urgente en la UI.
 * Sin definición en el spec; valor hoy hardcodeado.
 * TODO PR-B: urgente solo si existe fecha de entrega definida según RF-09.1.
 */
export const EVALUADOR_URGENTE_UMBRAL_DIAS = 2 as const;

/** RF-12.7(d) (spec-002): días máximos desde la fecha de asignación más antigua activa sin convocatoria antes de alertar. */
export const DIAS_MAX_SIN_CONVOCATORIA = 8 as const;
// DIAS_ALERTA_NORMATIVO_SIN_CONVOCATORIA: pendiente de confirmar, ver spec-002 §10

/** RF-ALR (spec-001/spec-003): Offsets en días para alertas generales de plazo normativo. */
export const ALERTA_OFFSETS_DIAS = [7, 1] as const;

/** RF-16.1 (spec-003): Offsets en días para alertas preventivas de renovación. */
export const ALERTA_RENOVACION_OFFSETS_DIAS = [90, 60, 15] as const;

/** RF-15.2 / RF-16.1 (spec-003): Días de gracia antes de pasar a VENCIDO / SUSPENDIDO. */
export const PLAZO_GRACIA_SEGUIMIENTO_DIAS = 30 as const;

/** RF-15.1 (spec-003): Días desde aprobación hasta el primer informe de inicio. */
export const PLAZO_INFORME_INICIO_DIAS = 30 as const;
