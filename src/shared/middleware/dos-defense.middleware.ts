/**
 * dos-defense.middleware.ts
 * Middleware principal de defensa contra ataques DoS de Capa 7.
 *
 * Implementa dos mecanismos en cascada:
 *  1. Blacklist temporal de IPs (NIST SC-7 — Boundary Protection)
 *  2. Rate Limiting con algoritmo Sliding Window (ISO 8.6 / NIST SC-5)
 *
 * Normativa cubierta:
 *  - ISO/IEC 27002:2022 — 8.6 (Gestión de Capacidad), 8.16 (Monitoreo)
 *  - NIST SP 800-53 Rev.5 — SC-5 (DoS Protection), SC-7 (Boundary Protection), SI-4 (Monitoreo)
 *  - RFC 6585 — Headers HTTP para rate limiting (X-RateLimit-*, Retry-After)
 *
 * Basado en: Caiza-Vega et al., ESPOCH 2026.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../modules/audit/application/services/audit.service';
import {
  DOS_DEFENSE_CONFIG,
  BlacklistEntry,
  RequestHistoryEntry,
} from './dos-defense.config';

@Injectable()
export class DosDefenseMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DosDefenseMiddleware.name);

  // ── Almacenamiento en memoria — O(1) con Map de JS ──────────────────────
  /** Historial de timestamps por IP — núcleo del algoritmo Sliding Window */
  private readonly requestHistory = new Map<string, RequestHistoryEntry>();

  /** Blacklist temporal de IPs bloqueadas por reincidencia */
  private readonly blacklist = new Map<string, BlacklistEntry>();

  /**
   * Debounce de auditoría para IPs en blacklist.
   * Evita el "audit storm": cuando una IP bloqueada recibe cientos de
   * requests simultáneos (JMeter / ataque real), solo se registra
   * 1 evento de auditoría cada AUDIT_DEBOUNCE_MS por IP.
   */
  private readonly lastAuditLog = new Map<string, number>();
  private readonly AUDIT_DEBOUNCE_MS = 30_000; // 1 log cada 30 segundos por IP

  constructor(private readonly auditService: AuditService) {
    // Limpieza periódica para evitar memory leaks — ISO 8.6
    setInterval(
      () => this.cleanupMemory(),
      DOS_DEFENSE_CONFIG.INTERVALO_LIMPIEZA_MS,
    );
    this.logger.log(
      '✅ DoS Defense Middleware iniciado — Sliding Window + Blacklist IP activos',
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MÉTODO PRINCIPAL — ejecutado en cada request entrante
  // ──────────────────────────────────────────────────────────────────────────
  use(req: Request, res: Response, next: NextFunction): void {
    const clientIp = this.extractIp(req);
    const now = Date.now();

    // ── PASO 1: Blacklist check (NIST SC-7) ──────────────────────────────
    const isBlocked = this.checkBlacklist(clientIp, now, req, res);
    if (isBlocked) return;

    // ── PASO 2: Sliding Window rate limiting (ISO 8.6 / NIST SC-5) ───────
    const isLimited = this.checkRateLimit(clientIp, now, req, res);
    if (isLimited) return;

    // ── PASO 3: Request legítimo — registrar y continuar al controlador ───
    this.recordRequest(clientIp, now);
    next();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 1 — Verificación de Blacklist de IPs
  // ──────────────────────────────────────────────────────────────────────────
  private checkBlacklist(
    ip: string,
    now: number,
    req: Request,
    res: Response,
  ): boolean {
    const entry = this.blacklist.get(ip);
    if (!entry) return false;

    if (now < entry.blockedUntil) {
      // IP aún en período de bloqueo → HTTP 403 Forbidden
      const secondsRemaining = Math.ceil((entry.blockedUntil - now) / 1000);

      this.logger.warn(
        `🚫 ACCESO DENEGADO — IP: ${ip} | ` +
          `Path: ${req.method} ${req.path} | ` +
          `Tiempo restante: ${secondsRemaining}s`,
      );

      // ── Debounce de auditoría (evita INSERT storm durante ataques)
      // Solo registra 1 log cada AUDIT_DEBOUNCE_MS por IP bloqueada
      const lastLog = this.lastAuditLog.get(ip) ?? 0;
      if (now - lastLog >= this.AUDIT_DEBOUNCE_MS) {
        this.lastAuditLog.set(ip, now);
        this.logSecurityEvent('IP_BLOCKED_ACCESS_ATTEMPT', ip, req.path, {
          method: req.method,
          blockedUntil: new Date(entry.blockedUntil).toISOString(),
          secondsRemaining,
          totalViolations: entry.violations,
        });
      }

      res.status(403).json({
        statusCode: 403,
        timestamp: new Date().toISOString(),
        path: req.path,
        error: {
          codigo: 'IP_BLOQUEADA',
          mensaje:
            'Tu dirección IP ha sido bloqueada temporalmente por comportamiento anómalo.',
          bloqueadoEn: entry.blockedAt,
          desbloqueoEn: new Date(entry.blockedUntil).toISOString(),
          reintentar: `En ${secondsRemaining} segundos`,
        },
      });
      return true;
    }

    // Bloqueo expirado → liberar automáticamente
    this.logger.log(`✅ IP desbloqueada automáticamente: ${ip}`);
    this.blacklist.delete(ip);
    this.lastAuditLog.delete(ip); // limpiar también el debounce
    return false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 2 — Sliding Window Rate Limiting
  // ──────────────────────────────────────────────────────────────────────────
  private checkRateLimit(
    ip: string,
    now: number,
    req: Request,
    res: Response,
  ): boolean {
    const limit = this.getLimit(req.path);
    const windowStart = now - DOS_DEFENSE_CONFIG.VENTANA_MS;

    // Obtener o inicializar historial para esta IP
    let history = this.requestHistory.get(ip);
    if (!history) {
      history = { timestamps: [], violations: 0 };
      this.requestHistory.set(ip, history);
    }

    // Sliding Window: conservar SOLO timestamps dentro de la ventana activa
    // Esto diferencia Sliding Window del Fixed Window — no hay "edge burst"
    history.timestamps = history.timestamps.filter((ts) => ts > windowStart);
    const requestsInWindow = history.timestamps.length;

    if (requestsInWindow >= limit) {
      // Límite superado → registrar infracción
      history.violations += 1;
      const currentViolation = history.violations;

      this.logger.warn(
        `⚠️  RATE LIMIT — IP: ${ip} | ` +
          `Requests: ${requestsInWindow}/${limit} | ` +
          `Infracción: ${currentViolation}/${DOS_DEFENSE_CONFIG.MAX_INFRACCIONES} | ` +
          `Path: ${req.method} ${req.path}`,
      );

      // ¿Infracciones máximas alcanzadas? → Blacklist automática (NIST SC-7)
      if (currentViolation >= DOS_DEFENSE_CONFIG.MAX_INFRACCIONES) {
        this.addToBlacklist(ip, currentViolation, req.path);
      }

      // Calcular tiempo hasta reset de la ventana
      const oldestTimestamp = history.timestamps[0] ?? now;
      const resetTime = oldestTimestamp + DOS_DEFENSE_CONFIG.VENTANA_MS;
      const secondsToReset = Math.ceil((resetTime - now) / 1000);
      const remaining = Math.max(0, limit - requestsInWindow);

      // Registro de auditoría — NIST SI-4
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', ip, req.path, {
        method: req.method,
        requestsInWindow,
        limit,
        violation: currentViolation,
        maxViolations: DOS_DEFENSE_CONFIG.MAX_INFRACCIONES,
        autoBlocked: currentViolation >= DOS_DEFENSE_CONFIG.MAX_INFRACCIONES,
      });

      // Headers RFC 6585 — estándar obligatorio para respuestas 429
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
      res.setHeader('Retry-After', secondsToReset);

      res.status(429).json({
        statusCode: 429,
        timestamp: new Date().toISOString(),
        path: req.path,
        error: {
          codigo: 'RATE_LIMIT_EXCEDIDO',
          mensaje: 'Has excedido el límite de solicitudes permitidas.',
          limite: limit,
          ventana: `${DOS_DEFENSE_CONFIG.VENTANA_MS / 1000} segundos`,
          reintentar: `En ${secondsToReset} segundos`,
          advertencia:
            currentViolation < DOS_DEFENSE_CONFIG.MAX_INFRACCIONES
              ? `Infracción ${currentViolation}/${DOS_DEFENSE_CONFIG.MAX_INFRACCIONES}. ` +
                `Más infracciones resultarán en bloqueo automático de tu IP.`
              : 'Tu IP ha sido bloqueada automáticamente por reincidencia.',
        },
      });
      return true;
    }

    return false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PASO 3 — Registrar request legítimo en el historial
  // ──────────────────────────────────────────────────────────────────────────
  private recordRequest(ip: string, now: number): void {
    const history = this.requestHistory.get(ip);
    if (history) {
      history.timestamps.push(now);
    } else {
      this.requestHistory.set(ip, { timestamps: [now], violations: 0 });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MÉTODOS AUXILIARES
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Determina el límite de requests según el tipo de endpoint.
   * Endpoints de auth tienen límite más estricto; otros tienen límite estándar.
   */
  private getLimit(path: string): number {
    const isAuthPath = DOS_DEFENSE_CONFIG.AUTH_PATHS.some((p) =>
      path.startsWith(p),
    );
    if (isAuthPath) return DOS_DEFENSE_CONFIG.MAX_PETICIONES_AUTH;

    const isMediaPath = DOS_DEFENSE_CONFIG.MEDIA_PATHS.some((p) =>
      path.startsWith(p),
    );
    if (isMediaPath) return DOS_DEFENSE_CONFIG.MAX_PETICIONES_MEDIA;

    return DOS_DEFENSE_CONFIG.MAX_PETICIONES;
  }

  /**
   * Añade una IP a la blacklist temporal con metadata de auditoría.
   * Responde al control NIST SC-7 (Boundary Protection).
   */
  private addToBlacklist(
    ip: string,
    violations: number,
    path: string,
  ): void {
    const blockedUntil = Date.now() + DOS_DEFENSE_CONFIG.DURACION_BLOQUEO_MS;
    const entry: BlacklistEntry = {
      blockedUntil,
      reason: `Superó ${DOS_DEFENSE_CONFIG.MAX_INFRACCIONES} infracciones de rate limiting`,
      blockedAt: new Date().toISOString(),
      violations,
    };
    this.blacklist.set(ip, entry);

    this.logger.error(
      `🚨 BLACKLIST — IP: ${ip} bloqueada | ` +
        `Infracciones: ${violations} | ` +
        `Duración: ${DOS_DEFENSE_CONFIG.DURACION_BLOQUEO_MS / 60_000} min | ` +
        `Hasta: ${new Date(blockedUntil).toISOString()}`,
    );

    // Registro crítico de auditoría — NIST SI-4, ISO 8.16
    this.logSecurityEvent('IP_AUTO_BLOCKED', ip, path, {
      blockedUntil: new Date(blockedUntil).toISOString(),
      durationMinutes: DOS_DEFENSE_CONFIG.DURACION_BLOQUEO_MS / 60_000,
      violations,
      reason: entry.reason,
    });
  }

  /**
   * Extrae la IP real del cliente.
   * Soporta proxies inversos (nginx), balanceadores y Docker
   * mediante el header x-forwarded-for.
   */
  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ip.split(',')[0].trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }

  /**
   * Registra un evento de seguridad en el AuditService de forma asíncrona.
   * Fire-and-forget: no bloquea ni retrasa la respuesta HTTP.
   * Cumple ISO 8.16 (Monitoreo de actividades) y NIST SI-4.
   */
  private logSecurityEvent(
    action: string,
    ip: string,
    path: string,
    metadata: Record<string, unknown>,
  ): void {
    this.auditService
      .createLog({
        action,
        ipAddress: ip,
        table: 'dos_defense',
        newData: { path, ...metadata },
      })
      .catch((err: Error) =>
        this.logger.error(
          `Error al registrar evento de seguridad [${action}]: ${err.message}`,
        ),
      );
  }

  /**
   * Limpieza periódica del almacenamiento en memoria.
   * Elimina historiales viejos y blacklist expirada.
   * Previene memory leaks — ISO 8.6 (Gestión de Capacidad).
   */
  private cleanupMemory(): void {
    const now = Date.now();
    const windowStart = now - DOS_DEFENSE_CONFIG.VENTANA_MS;
    let cleanedHistory = 0;
    let cleanedBlacklist = 0;

    // Limpiar timestamps fuera de ventana; eliminar IPs inactivas
    for (const [ip, history] of this.requestHistory.entries()) {
      history.timestamps = history.timestamps.filter((ts) => ts > windowStart);
      if (history.timestamps.length === 0 && history.violations === 0) {
        this.requestHistory.delete(ip);
        cleanedHistory++;
      }
    }

    // Eliminar IPs cuyo bloqueo ya expiró
    for (const [ip, entry] of this.blacklist.entries()) {
      if (now >= entry.blockedUntil) {
        this.blacklist.delete(ip);
        this.lastAuditLog.delete(ip); // limpiar debounce junto con blacklist
        cleanedBlacklist++;
        this.logger.log(`🔓 IP liberada por expiración de bloqueo: ${ip}`);
      }
    }

    if (cleanedHistory > 0 || cleanedBlacklist > 0) {
      this.logger.debug(
        `🧹 Limpieza de memoria completada — ` +
          `Historiales eliminados: ${cleanedHistory} | ` +
          `IPs desbloqueadas: ${cleanedBlacklist} | ` +
          `IPs activas en historial: ${this.requestHistory.size} | ` +
          `IPs en blacklist: ${this.blacklist.size}`,
      );
    }
  }
}
