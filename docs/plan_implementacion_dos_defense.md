# Plan de Implementación Detallado
## Disponibilidad y Defensa contra Ataques DoS — CEISH-ESPOCH (NestJS)
### Basado en: *Caiza-Vega et al., ESPOCH 2026*

---

## 1. ANÁLISIS DE LA DOCUMENTACIÓN

### 1.1 Fuente
**Título:** "Controles de Disponibilidad y Defensa Activa en Arquitecturas Web"  
**Autores:** F. P. Caiza-Vega et al. — ESPOCH, Riobamba, Ecuador  
**Sistema de referencia:** SICACI (Node.js + Express)

### 1.2 Problema que resuelve
Los ataques **DoS de Capa 7 (Aplicación)** explotan la lógica HTTP con peticiones *aparentemente legítimas*:
- **HTTP Flooding**: miles de GET/POST válidos hacia endpoints costosos
- **Slowloris**: conexiones lentas que agotan el pool del servidor
- **HTTP/2 Rapid Reset**: variantes modernas sobre protocolos nuevos

> Dato clave: Cloudflare Q4-2024 reportó **6.9 millones de ataques DDoS**, el 73% desde botnets que imitan navegadores reales. Los filtros de red perimetral no los detectan.

### 1.3 Marcos normativos obligatorios

| Norma | Control | Qué exige |
|---|---|---|
| ISO/IEC 27002:2022 | **8.6** | Gestión de Capacidad: monitorear uso de recursos por IP |
| ISO/IEC 27002:2022 | **8.14** | Redundancia: múltiples capas de protección |
| ISO/IEC 27002:2022 | **8.16** | Monitoreo y detección de anomalías en tiempo real |
| ISO/IEC 27002:2022 | **8.29** | Pruebas de seguridad durante el desarrollo (no al final) |
| NIST SP 800-53 Rev.5 | **SC-5** | DoS Protection: proteger servicios contra denegación de servicio |
| NIST SP 800-53 Rev.5 | **SC-7** | Boundary Protection: bloqueo automático por reincidencia |
| NIST SP 800-53 Rev.5 | **SI-4** | Monitoreo del sistema: registro de eventos anómalos |
| NIST SP 800-53 Rev.5 | **CA-8** | Pruebas de penetración: validar controles con carga real |

### 1.4 Solución técnica documentada

**Algoritmo elegido: Sliding Window (Ventana Deslizante)**
- Evita el problema de "borde de ventana" del Fixed Window (atacante puede duplicar peticiones aprovechando el reinicio del contador)
- Cada petición deja un timestamp en el historial → auditabilidad completa
- Solo 2.3% de falsos positivos bajo carga extrema (Manoharan, 2024)

**Parámetros exactos del documento:**
```
VENTANA_MS            = 60,000 ms  (1 minuto)
MAX_PETICIONES        = 50 req/ventana
MAX_INFRACCIONES      = 3 veces
DURACION_BLOQUEO_MS   = 300,000 ms (5 minutos)
INTERVALO_LIMPIEZA_MS = 120,000 ms (2 minutos)
```

**Respuesta HTTP 429 (RFC 6585):**
```
Retry-After: 35
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-05-24T12:35:00.000Z
Body: { error, codigo, mensaje, limite, ventana, reintentar, advertencia }
```

**Blacklist de IPs — estructura de datos:**
```js
blacklist["192.168.1.100"] = {
  bloqueadoHasta: 1716555600000,   // timestamp Unix expiración
  razon: "Excedió el límite...",
  bloqueadoEn: "2025-05-24T..."
}
```

**Flujo completo del middleware:**
```
Request → ¿IP en blacklist?
  SÍ → HTTP 403 Forbidden (fin)
  NO → ¿requests_en_ventana >= MAX_PETICIONES?
         SÍ → infracciones++
              ¿infracciones >= MAX_INFRACCIONES? → añadir a blacklist automáticamente
              → HTTP 429 con headers RFC 6585 (fin)
         NO → registrar timestamp + next() → HTTP 200
```

**Resultados JMeter (100 usuarios, 10 req/usuario):**

| Métrica | Sin defensa | Con defensa |
|---|---|---|
| Average | 2,667 ms | 1,343 ms |
| Median | 2,916 ms | 475 ms |
| Error % | 0% | 47.5% (403/429 = esperado ✅) |
| Throughput | 26.7 req/s | 3.8 req/s legítimos |

---

## 2. EVALUACIÓN DEL ESTADO ACTUAL DEL PROYECTO

### 2.1 Lo que YA existe en CEISH-ESPOCH ✅

| Componente | Archivo | Estado |
|---|---|---|
| `@nestjs/throttler` v6.5.0 | `package.json` | ✅ Instalado |
| `ThrottlerModule.forRoot` global | `app.module.ts` L35-40 | ✅ Configurado (10 req/60s — Fixed Window) |
| `ThrottlerGuard` en auth | `auth.controller.ts` L113, L145 | ✅ En endpoints críticos |
| `@Throttle` en forgot-password | `auth.controller.ts` L114 | ✅ 3 req/15min |
| `HttpExceptionFilter` global | `main.ts` L29 | ✅ Operativo |
| `AuditInterceptor` global | `app.module.ts` L54-56 | ✅ Funcional |
| `AuditService` (`@Global`) | `audit.module.ts` L6 | ✅ Exportado globalmente — inyectable en middleware |
| `ResponseInterceptor` | `main.ts` L30 | ✅ Respuestas estándar |
| Guards cadena JWT→Roles→Permisos | `shared/guards/` | ✅ Completos |

### 2.2 Brechas identificadas ❌

| Brecha | Impacto | Prioridad |
|---|---|---|
| ThrottlerModule usa **Fixed Window**, no Sliding Window | 🔴 Alto | P1 |
| Límite global **10 req/60s** — inconsistente entre módulos | 🔴 Alto | P1 |
| **Sin blacklist de IPs** por reincidencia | 🔴 Alto | P1 |
| **Sin headers RFC 6585** en respuestas 429 (`X-RateLimit-*`, `Retry-After`) | 🟡 Medio | P2 |
| **Sin logs de seguridad** diferenciados (IP_BLOCKED, RATE_LIMIT_EXCEEDED) | 🟡 Medio | P2 |
| **Sin diferenciación de límites** entre endpoints públicos y autenticados | 🟡 Medio | P2 |
| Storage en **Map en memoria** (pierde estado al reiniciar servidor) | 🟢 Bajo | P3 |
| **Sin pruebas de stress** automatizadas con JMeter | 🟢 Bajo | P3 |

### 2.3 Veredicto de viabilidad

> ✅ **100% IMPLEMENTABLE SIN INSTALAR NUEVAS DEPENDENCIAS**
>
> `@nestjs/throttler` ya está instalado. La arquitectura hexagonal modular permite
> añadir el middleware en `src/shared/` sin tocar ningún módulo de negocio.
> El `AuditModule` es `@Global()` — el middleware puede inyectar `AuditService` directamente.
> **Tiempo estimado total: 4-5 horas de desarrollo.**

---

## 3. DÓNDE IMPLEMENTAR

### 3.1 Mapa exacto de archivos

```
src/
├── shared/
│   ├── middleware/                          🆕 CREAR CARPETA
│   │   ├── dos-defense.config.ts            🆕 CREAR — Parámetros centralizados
│   │   └── dos-defense.middleware.ts        🆕 CREAR — Sliding Window + Blacklist IP
│   ├── filters/
│   │   ├── http-exception.filter.ts         ✅ EXISTENTE (sin cambios)
│   │   └── throttle-exception.filter.ts     🆕 CREAR — 429/403 con headers RFC 6585
│   └── guards/
│       └── (todos existentes, sin cambios)
├── app.module.ts                            ✏️ MODIFICAR — Registrar middleware + ThrottlerModule doble capa
└── main.ts                                  ✏️ MODIFICAR — 1 línea: trust proxy para Docker/nginx
```

### 3.2 Justificación de arquitectura

| Ubicación | Razón |
|---|---|
| `src/shared/middleware/` | El middleware es **transversal** a todos los módulos. Ningún módulo de negocio debe conocerlo. Sigue la convención del proyecto. |
| `app.module.ts` | NestJS ejecuta: **middleware → guards → interceptors → controllers**. Solo desde aquí se puede registrar el middleware antes que todos los guards. |
| `throttle-exception.filter.ts` | Separar formato de respuesta del middleware (Single Responsibility Principle). |

### 3.3 Niveles de protección por endpoint

```
🔴 MÁXIMA PROTECCIÓN — 10 req/min por IP
  POST /api/auth/login
  POST /api/auth/register
  POST /api/auth/forgot-password
  POST /api/auth/reset-password
  POST /api/auth/refresh
  POST /api/auth/confirm-email
  POST /api/auth/resend-confirmation
  POST /api/auth/setup-account

🟡 PROTECCIÓN MEDIA — 30 req/min por IP
  POST /api/protocols
  POST /api/documents (upload)
  GET  /api/reports/*
  POST /api/resolutions

🟢 PROTECCIÓN ESTÁNDAR — 60 req/min por IP
  Todos los demás endpoints autenticados
```

---

## 4. PLAN DE IMPLEMENTACIÓN DETALLADO

---

### FASE 1 — Configuración Centralizada
**Archivo a crear:** `src/shared/middleware/dos-defense.config.ts`  
**Tiempo estimado:** 20 minutos  
**Normativa cubierta:** ISO 8.6 (gestión de capacidad centralizada)

```typescript
// src/shared/middleware/dos-defense.config.ts

export const DOS_DEFENSE_CONFIG = {
  // ── Sliding Window ──────────────────────────────────────────────────
  /** Tamaño de la ventana temporal de evaluación (ISO 8.6) */
  VENTANA_MS: 60_000,                     // 1 minuto

  /** Límite global de peticiones por IP por ventana */
  MAX_PETICIONES: 60,

  /** Límite estricto para endpoints de autenticación */
  MAX_PETICIONES_AUTH: 10,

  /** Límite para endpoints de reportes/documentos */
  MAX_PETICIONES_MEDIA: 30,

  // ── Blacklist automática (NIST SC-7) ──────────────────────────────
  /** Número de infracciones antes del bloqueo automático */
  MAX_INFRACCIONES: 3,

  /** Duración del bloqueo automático en ms */
  DURACION_BLOQUEO_MS: 300_000,           // 5 minutos

  // ── Limpieza de memoria (ISO 8.6) ─────────────────────────────────
  /** Intervalo de limpieza del Map de historial */
  INTERVALO_LIMPIEZA_MS: 120_000,         // 2 minutos

  // ── Rutas con límite estricto ──────────────────────────────────────
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

  /** Rutas con límite medio */
  MEDIA_PATHS: [
    '/api/protocols',
    '/api/documents',
    '/api/reports',
    '/api/resolutions',
  ],
} as const;

/** Tipos para el almacenamiento en memoria */
export interface BlacklistEntry {
  blockedUntil: number;    // timestamp Unix de expiración
  reason: string;          // motivo del bloqueo
  blockedAt: string;       // timestamp ISO de inicio
  violations: number;      // infracciones acumuladas
}

export interface RequestHistoryEntry {
  timestamps: number[];    // array de timestamps en la ventana activa
  violations: number;      // contador de infracciones totales
}
```

---

### FASE 2 — Middleware Principal (Core del Sistema)
**Archivo a crear:** `src/shared/middleware/dos-defense.middleware.ts`  
**Tiempo estimado:** 2-3 horas  
**Normativa cubierta:** ISO 8.6, ISO 8.16, NIST SC-5, NIST SC-7, NIST SI-4

```typescript
// src/shared/middleware/dos-defense.middleware.ts

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

  // ── Almacenamiento en memoria O(1) — Map de JS ────────────────────
  /** Historial de timestamps por IP — núcleo del Sliding Window */
  private readonly requestHistory = new Map<string, RequestHistoryEntry>();

  /** Blacklist temporal de IPs bloqueadas (NIST SC-7) */
  private readonly blacklist = new Map<string, BlacklistEntry>();

  constructor(private readonly auditService: AuditService) {
    // Limpieza periódica de memoria para evitar memory leaks (ISO 8.6)
    setInterval(() => this.cleanupMemory(), DOS_DEFENSE_CONFIG.INTERVALO_LIMPIEZA_MS);
    this.logger.log('✅ DoS Defense Middleware activo — Sliding Window + Blacklist IP');
  }

  // ─────────────────────────────────────────────────────────────────────
  // MÉTODO PRINCIPAL — ejecutado en cada request
  // ─────────────────────────────────────────────────────────────────────
  use(req: Request, res: Response, next: NextFunction): void {
    const clientIp = this.extractIp(req);
    const now = Date.now();

    // PASO 1: Verificar si la IP está en la blacklist (NIST SC-7)
    const blocked = this.checkBlacklist(clientIp, now, req, res);
    if (blocked) return;

    // PASO 2: Aplicar Sliding Window rate limiting (ISO 8.6 / NIST SC-5)
    const limited = this.checkRateLimit(clientIp, now, req, res);
    if (limited) return;

    // PASO 3: Request legítimo — registrar y continuar
    this.recordRequest(clientIp, now);
    next();
  }

  // ─────────────────────────────────────────────────────────────────────
  // PASO 1 — Verificación de Blacklist
  // ─────────────────────────────────────────────────────────────────────
  private checkBlacklist(
    ip: string,
    now: number,
    req: Request,
    res: Response,
  ): boolean {
    const entry = this.blacklist.get(ip);
    if (!entry) return false;

    if (now < entry.blockedUntil) {
      // IP aún bloqueada → HTTP 403 Forbidden
      const secondsRemaining = Math.ceil((entry.blockedUntil - now) / 1000);

      this.logger.warn(
        `🚫 IP BLOQUEADA: ${ip} | Path: ${req.path} | Resta: ${secondsRemaining}s`,
      );

      // Auditoría asíncrona (NIST SI-4, ISO 8.16)
      this.logSecurityEvent('IP_BLOCKED_ACCESS_ATTEMPT', ip, req.path, {
        blockedUntil: new Date(entry.blockedUntil).toISOString(),
        secondsRemaining,
        violations: entry.violations,
      });

      res.status(403).json({
        statusCode: 403,
        timestamp: new Date().toISOString(),
        path: req.path,
        error: {
          codigo: 'IP_BLOQUEADA',
          mensaje: 'Tu dirección IP ha sido bloqueada temporalmente por comportamiento anómalo.',
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
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────
  // PASO 2 — Sliding Window Rate Limiting
  // ─────────────────────────────────────────────────────────────────────
  private checkRateLimit(
    ip: string,
    now: number,
    req: Request,
    res: Response,
  ): boolean {
    const limit = this.getLimit(req.path);
    const windowStart = now - DOS_DEFENSE_CONFIG.VENTANA_MS;

    // Obtener o crear historial de esta IP
    let history = this.requestHistory.get(ip);
    if (!history) {
      history = { timestamps: [], violations: 0 };
      this.requestHistory.set(ip, history);
    }

    // Sliding Window: mantener SOLO timestamps dentro de la ventana activa
    history.timestamps = history.timestamps.filter((ts) => ts > windowStart);
    const requestsInWindow = history.timestamps.length;

    if (requestsInWindow >= limit) {
      // Límite superado → registrar infracción
      history.violations += 1;
      const violation = history.violations;

      this.logger.warn(
        `⚠️ RATE LIMIT: ${ip} | ${requestsInWindow}/${limit} req | ` +
        `Infracción ${violation}/${DOS_DEFENSE_CONFIG.MAX_INFRACCIONES} | Path: ${req.path}`,
      );

      // ¿Supera el máximo de infracciones? → Blacklist automática (NIST SC-7)
      if (violation >= DOS_DEFENSE_CONFIG.MAX_INFRACCIONES) {
        this.addToBlacklist(ip, history.violations, req.path);
      }

      // Calcular tiempo de reset de la ventana
      const oldestRequest = history.timestamps[0] ?? now;
      const resetTime = oldestRequest + DOS_DEFENSE_CONFIG.VENTANA_MS;
      const secondsToReset = Math.ceil((resetTime - now) / 1000);
      const remaining = Math.max(0, limit - requestsInWindow);

      // Auditoría (NIST SI-4)
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', ip, req.path, {
        requestsInWindow,
        limit,
        violation,
        maxViolations: DOS_DEFENSE_CONFIG.MAX_INFRACCIONES,
      });

      // Headers RFC 6585 — obligatorios según el documento
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
            violation < DOS_DEFENSE_CONFIG.MAX_INFRACCIONES
              ? `Infracción ${violation}/${DOS_DEFENSE_CONFIG.MAX_INFRACCIONES}. ` +
                `Más infracciones resultarán en bloqueo automático.`
              : 'Tu IP ha sido bloqueada automáticamente por reincidencia.',
        },
      });
      return true;
    }

    return false;
  }

  // ─────────────────────────────────────────────────────────────────────
  // PASO 3 — Registrar request legítimo en el historial
  // ─────────────────────────────────────────────────────────────────────
  private recordRequest(ip: string, now: number): void {
    const history = this.requestHistory.get(ip);
    if (history) {
      history.timestamps.push(now);
    } else {
      this.requestHistory.set(ip, { timestamps: [now], violations: 0 });
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // UTILIDADES INTERNAS
  // ─────────────────────────────────────────────────────────────────────

  /** Determina el límite según el tipo de endpoint */
  private getLimit(path: string): number {
    const isAuth = DOS_DEFENSE_CONFIG.AUTH_PATHS.some((p) => path.startsWith(p));
    if (isAuth) return DOS_DEFENSE_CONFIG.MAX_PETICIONES_AUTH;

    const isMedia = DOS_DEFENSE_CONFIG.MEDIA_PATHS.some((p) => path.startsWith(p));
    if (isMedia) return DOS_DEFENSE_CONFIG.MAX_PETICIONES_MEDIA;

    return DOS_DEFENSE_CONFIG.MAX_PETICIONES;
  }

  /** Añade una IP a la blacklist temporal con metadata completa */
  private addToBlacklist(ip: string, violations: number, path: string): void {
    const blockedUntil = Date.now() + DOS_DEFENSE_CONFIG.DURACION_BLOQUEO_MS;
    const entry: BlacklistEntry = {
      blockedUntil,
      reason: `Excedió ${DOS_DEFENSE_CONFIG.MAX_INFRACCIONES} infracciones de rate limit`,
      blockedAt: new Date().toISOString(),
      violations,
    };
    this.blacklist.set(ip, entry);

    this.logger.error(
      `🚨 IP AÑADIDA A BLACKLIST: ${ip} | Infracciones: ${violations} | ` +
      `Bloqueada por ${DOS_DEFENSE_CONFIG.DURACION_BLOQUEO_MS / 60000} min`,
    );

    // Log crítico de auditoría (NIST SI-4, ISO 8.16)
    this.logSecurityEvent('IP_AUTO_BLOCKED', ip, path, {
      blockedUntil: new Date(blockedUntil).toISOString(),
      durationMinutes: DOS_DEFENSE_CONFIG.DURACION_BLOQUEO_MS / 60000,
      violations,
    });
  }

  /** Extrae la IP real del cliente (soporta proxies y Docker) */
  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded)
        .split(',')[0]
        .trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }

  /** Log asíncrono fire-and-forget — no bloquea la respuesta HTTP */
  private logSecurityEvent(
    action: string,
    ip: string,
    path: string,
    metadata: Record<string, any>,
  ): void {
    this.auditService
      .createLog({
        action,
        ipAddress: ip,
        table: 'dos_defense',
        newData: { path, ...metadata },
      })
      .catch((err) =>
        this.logger.error(`Error al registrar evento de seguridad: ${err.message}`),
      );
  }

  /** Limpieza periódica del Map — previene memory leaks (ISO 8.6) */
  private cleanupMemory(): void {
    const now = Date.now();
    const windowStart = now - DOS_DEFENSE_CONFIG.VENTANA_MS;
    let cleanedHistory = 0;
    let cleanedBlacklist = 0;

    for (const [ip, history] of this.requestHistory.entries()) {
      history.timestamps = history.timestamps.filter((ts) => ts > windowStart);
      if (history.timestamps.length === 0 && history.violations === 0) {
        this.requestHistory.delete(ip);
        cleanedHistory++;
      }
    }

    for (const [ip, entry] of this.blacklist.entries()) {
      if (now >= entry.blockedUntil) {
        this.blacklist.delete(ip);
        cleanedBlacklist++;
      }
    }

    if (cleanedHistory > 0 || cleanedBlacklist > 0) {
      this.logger.debug(
        `🧹 Limpieza de memoria: ${cleanedHistory} historiales, ${cleanedBlacklist} IPs desbloqueadas`,
      );
    }
  }
}
```

---

### FASE 3 — Filtro de Excepciones para ThrottlerGuard
**Archivo a crear:** `src/shared/filters/throttle-exception.filter.ts`  
**Tiempo estimado:** 30 minutos  
**Normativa cubierta:** RFC 6585, ISO 8.16

```typescript
// src/shared/filters/throttle-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

/**
 * Filtro para excepciones del ThrottlerGuard de NestJS (@nestjs/throttler).
 * Añade headers RFC 6585 a respuestas 429 generadas por la capa @Throttle().
 * Complementa al DosDefenseMiddleware que gestiona el Sliding Window propio.
 */
@Catch(ThrottlerException)
export class ThrottleExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ThrottleExceptionFilter.name);

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.TOO_MANY_REQUESTS;
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      request.ip ??
      'unknown';

    this.logger.warn(
      `⚠️ ThrottlerGuard (burst): ${clientIp} → ${request.method} ${request.path}`,
    );

    // Headers RFC 6585 — estándar obligatorio
    response.setHeader('Retry-After', 60);
    response.setHeader('X-RateLimit-Limit', 'burst-limit-exceeded');
    response.setHeader('X-RateLimit-Remaining', 0);
    response.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60_000).toISOString());

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.path,
      error: {
        codigo: 'THROTTLE_EXCEDIDO',
        mensaje: 'Demasiadas solicitudes en un período muy corto de tiempo.',
        reintentar: 'En 60 segundos',
      },
    });
  }
}
```

---

### FASE 4 — Integración Global en AppModule y main.ts
**Archivos a modificar:** `src/app.module.ts` y `src/main.ts`  
**Tiempo estimado:** 20 minutos  
**Normativa cubierta:** ISO 8.14 (redundancia multicapa), NIST SC-5

#### `src/app.module.ts` — Versión completa modificada

```typescript
// src/app.module.ts

import { Module, OnModuleInit, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { ProtocolsModule } from './modules/protocols/protocols.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReceptionModule } from './modules/reception/reception.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { ResolutionsModule } from './modules/resolutions/resolutions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { EncryptionService } from './shared/encryption/encryption.service';
import { setEncryptionService } from './shared/encryption/encryption.transformer';
// ── NUEVAS IMPORTACIONES ────────────────────────────────────────────────
import { DosDefenseMiddleware } from './shared/middleware/dos-defense.middleware';
import { ThrottleExceptionFilter } from './shared/filters/throttle-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('database');
        if (!config) throw new Error('Database configuration not found');
        return config;
      },
    }),
    // ThrottlerModule mejorado a DOS CAPAS (ISO 8.14 — Redundancia)
    // Capa 1 (short): protección burst — máx 5 req/segundo
    // Capa 2 (medium): protección media — máx 100 req/minuto
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1_000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    AuthModule,
    AuditModule,
    ProtocolsModule,
    DocumentsModule,
    ReceptionModule,
    EvaluationsModule,
    ResolutionsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [
    EncryptionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    // Filtro global para ThrottlerException — añade headers RFC 6585
    {
      provide: APP_FILTER,
      useClass: ThrottleExceptionFilter,
    },
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(private readonly encryptionService: EncryptionService) {}

  onModuleInit() {
    setEncryptionService(this.encryptionService);
  }

  // Registrar DosDefenseMiddleware globalmente (NIST SC-5)
  // Se ejecuta ANTES que cualquier guard o controlador
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DosDefenseMiddleware)
      .forRoutes('*');
  }
}
```

#### `src/main.ts` — Añadir una línea para soporte de proxy/Docker

```typescript
// En la función bootstrap(), ANTES de app.listen():

// Confiar en el primer proxy (Docker / nginx / reverse proxy)
// Necesario para obtener la IP real del cliente vía x-forwarded-for
app.set('trust proxy', 1);
```

---

### FASE 5 — Logging y Monitoreo en AuditModule
**Tiempo estimado:** 0 minutos adicionales (ya integrado en Fase 2)  
**Normativa cubierta:** ISO 8.16, NIST SI-4

El `DosDefenseMiddleware` ya invoca `AuditService.createLog()` automáticamente.
Todos los eventos quedan en la tabla existente `sistema.audit_log`.

| Evento (`action`) | Trigger | Datos en `datos_nuevos` (JSONB) |
|---|---|---|
| `RATE_LIMIT_EXCEEDED` | IP supera Sliding Window | `requestsInWindow`, `limit`, `violation` |
| `IP_AUTO_BLOCKED` | IP entra a blacklist automáticamente | `blockedUntil`, `durationMinutes`, `violations` |
| `IP_BLOCKED_ACCESS_ATTEMPT` | IP bloqueada intenta acceder | `blockedUntil`, `secondsRemaining` |

> **No se requiere ningún cambio en `AuditService` ni `AuditModule`.**  
> El módulo es `@Global()` — la inyección funciona automáticamente.

---

### FASE 6 — Pruebas de Stress con Apache JMeter (Opcional)
**Tiempo estimado:** 2-3 horas  
**Normativa cubierta:** ISO 8.29, NIST CA-8

#### Configuración del Thread Group

```
Number of Threads (usuarios simultáneos): 100
Ramp-Up Period:  10 segundos (10 usuarios/segundo)
Loop Count:      10 peticiones por usuario
Total requests:  1,000
```

#### Endpoint a probar — CEISH-ESPOCH

```
Protocolo: HTTP
Servidor:  localhost
Puerto:    3002
Método:    POST
Ruta:      /api/auth/login
Body:      {"email":"test@test.com","password":"test123"}
```

#### Escenarios de validación

**Escenario 1 — Sin defensa (baseline):**
```typescript
// En app.module.ts, comentar temporalmente:
// consumer.apply(DosDefenseMiddleware).forRoutes('*');
```
Métricas esperadas: 0% error, throughput alto (~26 req/s), latencia alta (>2,000ms)

**Escenario 2 — Con defensa activa:**
Descomentar el middleware y ejecutar de nuevo.  
Métricas esperadas: ~47% bloqueado (429/403), latencia muy baja para bloqueados (1-2ms), servidor estable.

#### Listeners de JMeter a configurar
1. **View Results Tree** — cada request individualmente (200/429/403)
2. **Response Time Graph** — gráfica temporal de latencia
3. **Aggregate Report** — resumen estadístico completo

#### Tabla de resultados esperados

| Métrica | Escenario 1 (sin defensa) | Escenario 2 (con defensa) |
|---|---|---|
| Average | > 2,000 ms | < 1,500 ms |
| Median | > 2,500 ms | < 500 ms |
| Error % | 0% | ~47% (403+429 = ✅ esperado) |
| Throughput | ~26 req/s | ~3.8 req/s legítimos |
| Servidor | Degradado | Estable bajo carga |

---

## 5. RESUMEN EJECUTIVO

### Archivos del plan

| Archivo | Acción | Normativa |
|---|---|---|
| `src/shared/middleware/dos-defense.config.ts` | 🆕 Crear | ISO 8.6 |
| `src/shared/middleware/dos-defense.middleware.ts` | 🆕 Crear | ISO 8.6, 8.16, NIST SC-5, SC-7, SI-4 |
| `src/shared/filters/throttle-exception.filter.ts` | 🆕 Crear | RFC 6585, ISO 8.16 |
| `src/app.module.ts` | ✏️ Modificar | ISO 8.14, NIST SC-5 |
| `src/main.ts` | ✏️ Modificar (1 línea) | Soporte proxy/Docker |

**Sin nuevas dependencias npm. Sin cambios en módulos de negocio.**

### Arquitectura de capas resultante

```
Request HTTP entrante
        │
        ▼
┌───────────────────────────────────────────────────┐
│  DosDefenseMiddleware  (NUEVA — src/shared/)      │
│  • Verificar blacklist → HTTP 403 si bloqueada    │
│  • Sliding Window → HTTP 429 si excede límite     │
│  • Auto-blacklist → 3 infracciones = 5 min block  │
│  • Headers RFC 6585 en toda respuesta 429/403     │
│  • Log en AuditService (fire-and-forget)          │
└───────────────────────────────────────────────────┘
        │ (solo requests legítimas pasan)
        ▼
┌───────────────────────────────────────────────────┐
│  ThrottlerGuard  (EXISTENTE — doble capa)         │
│  • short:  5 req/segundo (burst protection)       │
│  • medium: 100 req/minuto                         │
└───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────┐
│  JwtAuthGuard → RolesGuard → PermissionsGuard     │
│  (EXISTENTES — sin cambios)                       │
└───────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────┐
│  Controller → Service → Repository                │
│  (módulos de negocio — sin cambios)               │
└───────────────────────────────────────────────────┘
```

### Checklist de implementación

```
[ ] Fase 1: Crear src/shared/middleware/dos-defense.config.ts
[ ] Fase 2: Crear src/shared/middleware/dos-defense.middleware.ts
[ ] Fase 3: Crear src/shared/filters/throttle-exception.filter.ts
[ ] Fase 4: Modificar src/app.module.ts (middleware + ThrottlerModule + filtro)
[ ] Fase 4: Modificar src/main.ts (1 línea: trust proxy)
[ ] Verificar: npm run start:dev — sin errores de arranque
[ ] Probar:   curl -X POST http://localhost:3002/api/auth/login (×15 veces)
[ ] Verificar: headers X-RateLimit-* en respuestas 429
[ ] Verificar: logs en consola (RATE LIMIT, IP BLOQUEADA)
[ ] Verificar: registros en tabla sistema.audit_log
[ ] Fase 6 (opcional): Apache JMeter stress test
```

---

*Plan generado: 2026-06-04 | Proyecto: CEISH-ESPOCH Backend (NestJS)*  
*Basado en: "Controles de Disponibilidad y Defensa Activa en Arquitecturas Web" — Caiza-Vega et al., ESPOCH*
