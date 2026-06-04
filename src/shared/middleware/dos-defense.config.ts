/**
 * dos-defense.config.ts
 * Configuración centralizada del mecanismo de defensa contra ataques DoS de Capa 7.
 *
 * Normativa cubierta:
 *  - ISO/IEC 27002:2022 — Control 8.6 (Gestión de Capacidad)
 *  - NIST SP 800-53 Rev.5 — SC-5 (DoS Protection), SC-7 (Boundary Protection)
 *
 * Basado en: Caiza-Vega et al., "Controles de Disponibilidad y Defensa Activa
 * en Arquitecturas Web", ESPOCH 2026.
 */

export const DOS_DEFENSE_CONFIG = {
  // ── Sliding Window ──────────────────────────────────────────────────────
  /** Tamaño de la ventana temporal de evaluación — ISO 8.6 */
  VENTANA_MS: 60_000, // 1 minuto

  /** Límite global de peticiones por IP por ventana (endpoints generales) */
  MAX_PETICIONES: 60,

  /** Límite estricto para endpoints de autenticación (alta sensibilidad) */
  MAX_PETICIONES_AUTH: 10,

  /** Límite intermedio para endpoints de carga/reportes */
  MAX_PETICIONES_MEDIA: 30,

  // ── Blacklist automática por reincidencia — NIST SC-7 ──────────────────
  /** Número de infracciones consecutivas antes del bloqueo automático */
  MAX_INFRACCIONES: 3,

  /** Duración del bloqueo automático de IP en ms (5 minutos) */
  DURACION_BLOQUEO_MS: 300_000,

  // ── Limpieza periódica de memoria — ISO 8.6 ────────────────────────────
  /** Intervalo de limpieza del historial de IPs (2 minutos) */
  INTERVALO_LIMPIEZA_MS: 120_000,

  // ── Clasificación de endpoints ─────────────────────────────────────────
  /** Endpoints de autenticación — límite más estricto */
  AUTH_PATHS: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/confirm-email',
    '/api/auth/resend-confirmation',
    '/api/auth/setup-account',
  ],

  /** Endpoints de carga media — límite intermedio */
  MEDIA_PATHS: [
    '/api/protocols',
    '/api/documents',
    '/api/reports',
    '/api/resolutions',
  ],
} as const;

// ── Interfaces de tipos para el almacenamiento en memoria ──────────────────

/** Entrada en la blacklist de IPs bloqueadas */
export interface BlacklistEntry {
  /** Timestamp Unix de expiración del bloqueo */
  blockedUntil: number;
  /** Motivo del bloqueo (texto legible) */
  reason: string;
  /** Timestamp ISO del momento del bloqueo */
  blockedAt: string;
  /** Total de infracciones acumuladas por esta IP */
  violations: number;
}

/** Historial de requests de una IP en el Sliding Window */
export interface RequestHistoryEntry {
  /** Array de timestamps de cada request dentro de la ventana activa */
  timestamps: number[];
  /** Contador de infracciones totales (resets al desbloquear) */
  violations: number;
}
