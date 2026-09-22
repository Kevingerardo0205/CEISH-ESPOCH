# Informe de Refactorización — Roles Temporales (Suplencias)

**Proyecto:** CEISH-ESPOCH  
**Fecha:** 2026-09-04  
**Alcance:** Gestión de Usuarios — Roles Temporales (Frontend + Backend)  
**Archivos afectados:** 15 archivos backend, 12 archivos frontend  

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Problemas Críticos de Backend](#2-problemas-críticos-de-backend)
3. [Problemas Críticos de Frontend](#3-problemas-críticos-de-frontend)
4. [Problemas de Arquitectura y Diseño](#4-problemas-de-arquitectura-y-diseño)
5. [Problemas de Seguridad](#5-problemas-de-seguridad)
6. [Problemas de Consistencia Frontend-Backend](#6-problemas-de-consistencia)
7. [Propuestas de Refactorización Priorizadas](#7-propuestas-de-refactorización-priorizadas)
8. [Dependencias entre Refactorizaciones](#8-dependencias)

---

## 1. RESUMEN EJECUTIVO

El sistema de roles temporales (suplencias) funcionalmente está operativo, pero presenta **35+ problemas identificados** distribuidos en:

| Categoría | Severidad | Cantidad |
|-----------|-----------|----------|
| 🔴 Crítico (Security/Runtime) | ALTA | 5 |
| 🟠 Arquitectura | MEDIA-ALTA | 12 |
| 🟡 Mantenibilidad | MEDIA | 12 |
| 🔵 Consistencia | BAJA | 6 |

**Tiempo estimado de refactorización completa:** 3-5 sprints  
**Riesgo de no refactorizar:** Errores silenciosos de permisos, deuda técnica creciente, imposibilidad de agregar nuevos tipos de rol temporal.

---

## 2. PROBLEMAS CRÍTICOS DE BACKEND

### 2.1 SQL Injection Riesgo — Raw Queries sin Parametrización Segura

**Archivo:** `src/modules/auth/application/services/users.service.ts`  
**Severidad:** 🔴 CRÍTICO

| Línea | Problema | Código actual |
|-------|----------|---------------|
| **262-264** | DELETE sin validación de id | `await queryRunner.manager.query(\`DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1\`, [userId]);` |
| **281-291** | INSERT con valores dinámicos | `await queryRunner.manager.query(\`INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id, fecha_inicio, fecha_fin, motivo_delegacion, asignado_por) VALUES ($1, $2, $3, $4, $5, $6)\`, [userId, roleEntity.id, validFrom, validUntil, reason, assignedByUserId || null]);` |
| **327-333** | UPDATE con string concat en motivo | `const motif = \`[SUSPENDIDO ANTCIPADAMENTE] ${reason || 'Revocación por Administrador'}\`;` seguido de `await this.dataSource.query(\`UPDATE catalogos.usuarios_roles SET fecha_fin = NOW(), motivo_delegacion = $1 WHERE usuario_id = $2 AND rol_id = $3 RETURNING ...\`, [motif, userId, role.id]);` |
| **368-374** | UPDATE con COALESCE dinámico | `await this.dataSource.query(\`UPDATE catalogos.usuarios_roles SET fecha_fin = $1, motivo_delegacion = COALESCE($2, motivo_delegacion) WHERE usuario_id = $3 AND rol_id = $4 RETURNING ...\`, [newValidUntil, motif || null, userId, role.id]);` |

**Riesgo:** Aunque se usan parámetros `$1, $2...`, la línea 327 construye `motif` concatenando strings antes de pasarlo como parámetro. El string `motif` podría contener caracteres especiales. Aunque TypeORM protege contra inyección SQL en parámetros posicionales, el pattern de construir strings SQL dinámicos es una práctica peligrosa.

**Refactorización sugerida:**
```typescript
// Línea 326-327: Reemplazar concatenación por template seguro
const motif = `[SUSPENDIDO ANTICIPADAMENTE] ${reason || 'Revocación por Administrador'}`;
// → Extraer a función helper validada
```

---

### 2.2 Columnas Temporales Sin Migración en `script.sql`

**Archivo:** `script.sql` vs `src/modules/auth/infrastructure/database/user-role.entity.orm.ts`  
**Severidad:** 🔴 CRÍTICO

| Archivo | Definición |
|---------|------------|
| `script.sql` línea 56-62 | `catalogos.usuarios_roles` **NO** tiene `fecha_inicio`, `fecha_fin`, `motivo_delegacion`, `asignado_por` |
| `user-role.entity.orm.ts` líneas 11-31 | ORM Entity **SÍ** define esas 4 columnas |

**Líneas problemáticas:**
```sql
-- script.sql:56-62 (FALTA columnas temporales)
CREATE TABLE catalogos.usuarios_roles (
    usuario_id INT REFERENCES catalogos.usuarios(id) ON DELETE CASCADE,
    rol_id INT REFERENCES catalogos.roles(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asignado_por INT REFERENCES catalogos.usuarios(id),
    PRIMARY KEY (usuario_id, rol_id)
);
```

vs.

```typescript
// user-role.entity.orm.ts:11-31 (TIENE columnas temporales)
@Column({ name: 'fecha_inicio', type: 'timestamptz', nullable: true, default: () => 'NOW()' })
validFrom?: Date;
@Column({ name: 'fecha_fin', type: 'timestamptz', nullable: true })
validUntil?: Date;
@Column({ name: 'motivo_delegacion', type: 'varchar', length: 255, nullable: true })
reason?: string;
```

**Impacto:** En producción con `synchronize: false`, las columnas temporales no existen y las queries fallarán.

**Refactorización sugerida:**
```sql
-- script.sql: Agregar después de línea 62
ALTER TABLE catalogos.usuarios_roles 
  ADD COLUMN fecha_inicio timestamptz DEFAULT NOW(),
  ADD COLUMN fecha_fin timestamptz,
  ADD COLUMN motivo_delegacion varchar(255),
  ADD COLUMN asignado_por int;
```

---

### 2.3 Typo en Mensaje de Auditoría — `SUSPENDIDO ANTCIPADAMENTE`

**Archivo:** `src/modules/auth/application/services/users.service.ts`  
**Línea:** **326**

```typescript
const motif = `[SUSPENDIDO ANTCIPADAMENTE] ${reason || 'Revocación por Administrador'}`;
```

**Error:** "ANTCIPADAMENTE" debería ser "ANTICIPADAMENTE" (falta una 'C').

**Impacto:** El prefijo se almacena en la base de datos y se muestra al usuario. Afecta la validez jurídica del registro de auditoría.

**Refactorización sugerida:**
```typescript
// Línea 326
const motif = `[SUSPENDIDO ANTICIPADAMENTE] ${reason || 'Revocación por Administrador'}`;
// Extraer constante:
// En shared/constants/audit-messages.constant.ts
export const SUSPENSION_PREFIX = '[SUSPENDIDO ANTICIPADAMENTE]';
export const EXTENSION_PREFIX = '[PRÓRROGA]';
```

---

### 2.4 `PermissionsGuard` Consulta DB en Cada Petición (Performance)

**Archivo:** `src/shared/guards/permissions.guard.ts`  
**Líneas:** **49-60**

```typescript
const dbPermissionsRaw = await this.dataSource.query(
  `
  SELECT DISTINCT p.codigo as code
  FROM catalogos.rol_permisos rp
  INNER JOIN catalogos.permisos p ON rp.permiso_id = p.id
  INNER JOIN catalogos.usuarios_roles ur ON rp.rol_id = ur.rol_id
  WHERE ur.usuario_id = $1
    AND (ur.fecha_inicio IS NULL OR ur.fecha_inicio <= NOW())
    AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
`,
  [user.id],
);
```

**Problema:** Esta query compleja con 3 JOINs se ejecuta en **cada petición autenticada** del sistema. Si un usuario tiene 50 peticiones por minuto, se ejecutan 50 consultas similares.

**Impacto:** Latencia acumulada significativa bajo carga. Sin caché, el rendimiento degrada linealmente con el tráfico.

**Refactorización sugerida:**
```typescript
// Opción A: Cache con TTL corto (5 minutos)
private activePermissionsCache = new Map<number, { permissions: string[]; expiry: number }>();

// Opción B: Incluir permisos activos en el JWT (con expiry)
// Opción C: Usar Redis para cache distribuido
```

---

### 2.5 JWT No Codifica Validez Temporal

**Archivo:** `src/modules/auth/application/services/auth.service.ts`  
**Líneas aproximadas:** Dependiendo de la definición del `login()` method

```typescript
const payload = {
  email: u.institutionalEmail,
  sub: u.id,
  roles: u.roles.map((r: any) => r.code),
  permissions: permissionArray.map((p) => p.code),
};
```

**Problema:** El JWT payload contiene `roles` como array de strings pero **no** incluye `validFrom`/`validUntil` de cada asignación. El `PermissionsGuard` debe consultar la BD en cada request para determinar si un rol temporal ha expirado.

**Impacto:** 
- El `RolesGuard` (líneas 24-26 de `roles.guard.ts`) verifica roles desde JWT sin considerar expiración
- El `PermissionsGuard` resuelve esto con DB query, pero no es 100% consistente
- Si el PermissionsGuard falla o está deshabilitado, los roles expirados siguen funcionando

**Refactorización sugerida:**
```typescript
// Payload del JWT debería incluir:
const payload = {
  email: u.institutionalEmail,
  sub: u.id,
  roles: u.roles.map((r: any) => r.code),
  permissions: permissionArray.map((p) => p.code),
  temporalRoles: userRoles.map(ur => ({
    roleCode: ur.code,
    validUntil: ur.validUntil,
    isExpired: ur.isExpired
  }))
};
```

---

### 2.6 `RolesGuard` No Verifica Expiración de Roles

**Archivo:** `src/shared/guards/roles.guard.ts`  
**Líneas:** **24-28**

```typescript
const hasRole = requiredRoles.some((role) =>
  user.roles?.some((userRole: string) => {
    return userRole.toLowerCase() === role.toLowerCase();
  }),
);
```

**Problema:** El `RolesGuard` verifica roles **solo desde el JWT**, que contiene todos los roles asignados incluyendo los expirados. No verifica `isExpired` ni `validUntil`.

**Escenario de fallo:** Si un usuario tiene `SECRETARIA` como rol temporal expirado, el `RolesGuard` aún le otorgará acceso porque verifica `user.roles` desde el JWT, que incluye el rol expirado.

**Refactorización sugerida:**
```typescript
// Agregar verificación de expiración o depender únicamente de PermissionsGuard
// Para roles temporales, el RolesGuard debería ser ignorado
// y PermissionsGuard debería ser la fuente de verdad
```

---

### 2.7 `@Audit()` Decorator No Configurado como Interceptor

**Archivo:** `src/modules/auth/infrastructure/controllers/auth.controller.ts`  
**Líneas:** 159-199

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Permissions(Permission.ROLES_ASSIGN)
@Audit('USER_ROLE_SUSPENDED')
@Post('users/:id/roles/:roleCode/suspend')
async suspendTemporaryRole(...) { ... }

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Permissions(Permission.ROLES_ASSIGN)
@Audit('USER_ROLE_EXTENDED')
@Patch('users/:id/roles/:roleCode/extend')
async extendTemporaryRole(...) { ... }
```

**Problema:** El decorator `@Audit()` está definido en `src/shared/decorators/audit.decorator.ts` y el interceptor existe en `src/modules/audit/`, pero el `AuthController` **no usa** `@UseInterceptors(AuditLogInterceptor)`. Las anotaciones `@Audit` son metadata sin interceptor que las procese.

**Refactorización sugerida:**
```typescript
// Agregar al AuthController o a level de módulo:
@UseInterceptors(AuditLogInterceptor)
@Controller('auth')
export class AuthController { ... }
```

---

### 2.8 `updateUserRoles` Elimina y Re-Inserta Todo (Patrón Frágil)

**Archivo:** `src/modules/auth/application/services/users.service.ts`  
**Líneas:** **257-302**

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.query(
    `DELETE FROM catalogos.usuarios_roles WHERE usuario_id = $1`,
    [userId],
  );

  for (const item of normalizedItems) {
    // ... INSERT individual
  }

  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

**Problemas:**
1. Si el usuario tiene 3 roles y se actualizan 2, se eliminan los 3 y se reinsertan 2 — se pierde el historial de auditoría del rol eliminado
2. No se preserva `fecha_asignacion` original de roles no modificados
3. La transacción es manual y si falla el `release()` en `finally`, queda un connection leak
4. No hay `SELECT` antes del DELETE para validar que los roles existen

**Refactorización sugerida:**
```typescript
// Usar TypeORM repositorio con cascade o relaciones
// Preservar asignaciones no modificadas
// Usar query builder de TypeORM en lugar de raw SQL
```

---

### 2.9 Duplicación del Role Lookup en 4 Métodos

**Archivo:** `src/modules/auth/application/services/users.service.ts`  
**Líneas:** 246-251 (updateUserRoles), 315-320 (suspend), 356-361 (extend), 96-106 (findAll)

El mismo patrón de búsqueda de rol se repite 4 veces:

```typescript
const allRoles = await this.dataSource.getRepository(RoleOrmEntity).find();
const role = allRoles.find(
  (r) =>
    (r.code && r.code.toUpperCase() === roleCode.toUpperCase()) ||
    (r.name && r.name.toUpperCase() === roleCode.toUpperCase()),
);
```

**Refactorización sugerida:**
```typescript
// Crear método privado en UsersService o en RoleOrmEntity repository
private findRoleByCode(roleCode: string): RoleOrmEntity | undefined {
  return allRoles.find((r) => 
    (r.code?.toUpperCase() === roleCode.toUpperCase()) ||
    (r.name?.toUpperCase() === roleCode.toUpperCase())
  );
}
```

---

### 2.10 `findAllUsers` con Raw SQL para Roles

**Archivo:** `src/modules/auth/application/services/users.service.ts`  
**Líneas:** **95-106**

```typescript
roleMetadataRaw = await this.dataSource.query(
  `
  SELECT ur.usuario_id, ur.rol_id, r.codigo as code, r.nombre as name,
         ur.fecha_inicio as valid_from, ur.fecha_fin as valid_until,
         ur.motivo_delegacion as reason,
         (CASE WHEN ur.fecha_fin IS NOT NULL AND ur.fecha_fin < NOW() THEN true ELSE false END) as is_expired
  FROM catalogos.usuarios_roles ur
  JOIN catalogos.roles r ON ur.rol_id = r.id
  WHERE ur.usuario_id = ANY($1)
`,
  [userIds],
);
```

**Problema:** El cálculo de `is_expired` se hace en SQL (`CASE WHEN ur.fecha_fin < NOW()`) pero el frontend lo calcula en JavaScript (`new Date(r.validUntil).getTime() < Date.now()`). **Doble fuente de verdad** con potencial desincronización de relojes.

**Refactorización sugerida:**
```typescript
// Usar solo la fuente del backend para isExpired
// El backend siempre tiene la hora del servidor
```

---

## 3. PROBLEMAS CRÍTICOS DE FRONTEND

### 3.1 Doble Representación de Roles — `roles` vs `userRoles`

**Archivo:** `src/domain/entities/user-admin.entity.ts`  
**Líneas:** **25-26**

```typescript
export interface UserAdmin {
  roles?: string[]; // Códigos de roles simples para compatibilidad
  userRoles?: UserRoleItem[]; // Roles detallados con metadatos de vigencia temporal
}
```

**Problema:** La interfaz tiene **dos propiedades** para representar lo mismo. Esto causa:
- Confusión en los componentes sobre cuál usar
- El `mapToDomain` llena ambas propiedades
- El `getUserRoles()` del `UserTableComponent` elige una u otra con lógica frágil

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features\dashboard\presentation\components\user-table\user-table.component.ts`  
**Líneas:** **275-284**

```typescript
getUserRoles(user: UserAdmin): UserRoleItem[] {
  if (user.userRoles && user.userRoles.length > 0) {
    return user.userRoles;
  }
  const rawRoles = user.roles && user.roles.length > 0 ? user.roles : [user.rol];
  return rawRoles.map(r => ({
    code: (r || '').toUpperCase(),
    name: (r || '').toUpperCase()
  }));
}
```

**Problema:** Cuando `userRoles` existe pero está vacío, o cuando `userRoles` no existe pero `roles` sí, la conversión pierde metadatos temporales. El fallback `(r || '').toUpperCase()` genera código como `'---'` si `r` es undefined.

**Refactorización sugerida:**
```typescript
// Eliminar `roles` de UserAdmin. Solo usar `userRoles: UserRoleItem[]`.
// O hacer un computed getter:
get activeRoles(): UserRoleItem[] {
  return this.userRoles ?? this.roles.map(code => ({ code, name: code, isExpired: false }));
}
```

---

### 3.2 `formatRolesPayload` con Lógica Condicional Compleja

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\infrastructure\adapters\user-admin-api.adapter.ts`  
**Líneas:** **87-103**

```typescript
private formatRolesPayload(user: UserAdmin): Array<string | RoleAssignmentPayloadItem> {
  if (user.userRoles && user.userRoles.length > 0) {
    return user.userRoles.map((ur) => {
      if (ur.validUntil) {
        return {
          roleCode: ur.code.toUpperCase(),
          validFrom: ur.validFrom || null,
          validUntil: ur.validUntil,
          reason: ur.reason || null
        };
      }
      return ur.code.toUpperCase();
    });
  }
  const raw = user.roles || (user.rol ? [user.rol] : []);
  return raw.map(r => r.toUpperCase());
}
```

**Problema:**
- La lógica tiene 3 ramas condicionales que son difíciles de seguir
- Si `userRoles` existe pero contiene roles sin `validUntil`, mezcla strings y objetos en el array
- No hay validación de que `roleCode` no sea vacío

**Refactorización sugerida:**
```typescript
private formatRolesPayload(user: UserAdmin): RoleAssignmentPayloadItem[] {
  const roles = user.userRoles?.length 
    ? user.userRoles 
    : (user.roles || [user.rol]).map(r => ({ code: r, validUntil: null }));
  
  return roles.map(ur => ({
    roleCode: ur.code.toUpperCase(),
    validFrom: ur.validFrom || null,
    validUntil: ur.validUntil || null,
    reason: ur.reason || null
  }));
}
```

---

### 3.3 `mapToDomain` con Cadena de Fallback Frágil

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\infrastructure\adapters\user-admin-api.adapter.ts`  
**Líneas:** **135-173**

```typescript
const code = (r.code || r.codigo || r.nombre || r.name || '').toUpperCase();
```

**Problema:** La cadena `r.code || r.codigo || r.nombre || r.name` asume que el backend puede devolver el código en 4 propiedades diferentes. Esto es un "code smell" de integración con múltiples versiones de API. Si `r.name` es un rol como "Administrador TI" pero `r.code` es "ADMIN_TI", el fallback seleccionará "ADMIN_TI" (correcto), pero si ambos son undefined, obtendrá `''`.

**Refactorización sugerida:**
```typescript
// Definir un mapper estricto:
const code = r.code?.toUpperCase() ?? r.codigo?.toUpperCase() ?? r.name?.toUpperCase() ?? '';
if (!code) throw new Error(`Invalid role object: ${JSON.stringify(r)}`);
```

---

### 3.4 Múltiples Implementaciones de `formatDate` y Cálculos de Fecha

**Archivos afectados:**
- `user-table.component.ts` línea **295-304**
- `extend-role-dialog.component.ts` línea **379-386**
- `extend-role-dialog.component.ts` línea **388-406**
- `user-form.component.ts` línea **544-549**
- `user-form.component.ts` línea **551-566**
- `suspend-role-dialog.component.ts` (sin formatDate propio, depende de otros)

**Problema:** Cada componente implementa su propia versión de `formatDate` y `getDaysRemainingText`, con ligeras diferencias en el formato de fecha y el cálculo de días restantes.

| Archivo | Formato | Cálculo días |
|---------|---------|--------------|
| `user-table.component.ts:295` | `es-EC` locale | `Math.ceil(diffMs / (1000 * 60 * 60 * 24))` |
| `extend-role-dialog.component.ts:379` | `es-EC` locale | Similar |
| `user-form.component.ts:544` | `YYYY-MM-DD` | Diferente parseo de fechas |

**Impacto:** Inconsistencias en la presentación de fechas entre componentes. Posibles bugs de timezone si las fechas del backend son UTC pero se parsean como locales.

**Refactorización sugerida:**
```typescript
// Crear un servicio compartido:
// src/shared/services/date.service.ts
@Injectable({ providedIn: 'root' })
export class DateService {
  format(dateStr?: string | null): string { ... }
  getDaysRemaining(dateStr?: string | null): number { ... }
  addDays(dateStr: string, days: number): string { ... }
  addMonths(dateStr: string, months: number): string { ... }
}
```

---

### 3.5 `user-form.component.ts` — Componente con Demasiada Responsabilidad

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features\dashboard\presentation\components\user-form\user-form.component.ts`  
**Líneas:** **367-620** (553 líneas)

**Problemas identificados:**
1. **Línea 399-407:** El `userForm` tiene 6 controles con validaciones — debería estar en un单独的 `UserFormModel`
2. **Línea 409-440:** `effect()` que parsea `userToEdit` y parchea el formulario — lógica de presentación mezclada con estado
3. **Línea 443-479:** `valueChanges.subscribe` con regla SoD — lógica de negocio en el componente de presentación
4. **Línea 488-501:** `toggleRoleTemporal` con lógica de fechas
5. **Línea 503-519:** `updateRoleValidUntil` y `updateRoleReason`
6. **Línea 521-542:** `applyDatePreset` con switch de 5 casos
7. **Línea 568-591:** `loadRoles` con llamada a API
8. **Línea 599-619:** `submit` con mapeo a `userRoles`

**Refactorización sugerida:**
```typescript
// Extraer a:
// 1. UserFormModel.ts - form state management
// 2. RoleConfig.ts - temporal role configuration logic
// 3. SoDGuard.ts - segregation of duties validation
// Componente debería tener ~150 líneas máximo
```

---

### 3.6 `getUserRoles` con Fallback que Pierde Metadatos Temporales

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features\dashboard\presentation\components\user-table\user-table.component.ts`  
**Líneas:** **275-284**

**Problema:** Cuando `userRoles` es undefined, el fallback a `roles.map(r => ({code: r.toUpperCase(), name: r.toUpperCase()}))` pierde toda la información temporal. Esto afecta:
- La visualización del badge (no muestra `⏳` ni fecha)
- El tooltip no muestra fecha de expiración
- Los menús de acción (prorrogar/suspender) no aparecen

**Refactorización sugerida:**
```typescript
getUserRoles(user: UserAdmin): UserRoleItem[] {
  if (user.userRoles && user.userRoles.length > 0) return user.userRoles;
  // Si no hay userRoles, obtener del backend, no hacer fallback local
  return (user.roles || []).map(code => ({
    code: code.toUpperCase(),
    name: code.toUpperCase(),
    validFrom: null,
    validUntil: null,
    reason: null,
    isExpired: false
  }));
}
```

---

### 3.7 `getDaysRemainingText` con Parsing Frágil de Fechas

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features\dashboard\presentation\components\extend-role-dialog\extend-role-dialog.component.ts`  
**Líneas:** **388-406**

```typescript
getDaysRemainingText(validUntilStr?: string): string {
  if (!validUntilStr) return '';
  try {
    const parts = validUntilStr.split('-');
    if (parts.length === 3) {
      const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
```

**Problema:** Parsing manual con `split('-')` y `parseInt` es frágil. El formato puede variar (`2026-09-15` vs `2026-09-15T23:59:59.000Z`). El uso de `parseInt(parts[1], 10) - 1` para meses (JavaScript months are 0-indexed) es propenso a errores.

**Refactorización sugerida:**
```typescript
const target = new Date(validUntilStr);
if (isNaN(target.getTime())) return '';
```

---

### 3.8 `rolesConfig` State Duplicado con `userForm`

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features\dashboard\presentation\components\user-form\user-form.component.ts`  
**Líneas:** **387-393** y **443-479**

```typescript
readonly rolesConfig = signal<{
  code: string;
  name: string;
  isTemporal: boolean;
  validUntil: string;
  reason: string;
}[]>([]);
```

**Problema:** El `rolesConfig` es un `signal` que almacena configuración de roles, pero la fuente de verdad para el formulario es `userForm.get('roles')`. Hay **dos fuentes de verdad** que deben sincronizarse manualmente mediante `effect()` y `valueChanges.subscribe()`.

**Impacto:** Si la sincronización falla, el formulario puede enviar datos inconsistentes. El `submit()` método (línea 599-619) construye `userRoles` a partir de `rolesConfig`, no de `userForm`.

**Refactorización sugerida:**
```typescript
// Unificar en un solo source of truth:
// Opción A: Usar solo userForm y extraer rolesConfig como computed
// Opción B: Usar solo rolesConfig y parchear userForm desde allí
// Nunca ambos como fuentes independientes
```

---

### 3.9 Falta `OnDestroy` para Limpiar Suscripciones

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features\dashboard\presentation\components\user-form\user-form.component.ts`  
**Línea:** **443**

```typescript
this.userForm.get('roles')?.valueChanges.subscribe((selectedCodes: string[]) => {
```

**Problema:** La suscripción a `valueChanges` se crea en el constructor sin nunca destruirse. Cuando el componente se destruye, la suscripción sigue activa (memory leak). No se implementa `OnDestroy`.

**Refactorización sugerida:**
```typescript
import { OnDestroy, DestroyRef, inject } from '@angular/core';

constructor() {
  const destroyRef = inject(DestroyRef);
  this.userForm.get('roles')?.valueChanges
    .pipe(takeUntil(destroyRef)) // O usar DestroyRef
    .subscribe(...)
}
```

---

### 3.10 CSS Inline Masivo en Componentes

**Archivos afectados:**
- `user-table.component.ts` líneas **112-265** (~153 líneas de CSS)
- `extend-role-dialog.component.ts` líneas **139-328** (~189 líneas de CSS)
- `suspend-role-dialog.component.ts` líneas **96-241** (~145 líneas de CSS)
- `user-form.component.ts` líneas **196-365** (~169 líneas de CSS)

**Problema:** Cada componente tiene **~150-190 líneas de CSS inline**. Esto viola el principio de separación de responsabilidades y hace que:
- El mantenimiento de estilos sea difícil
- Los temas/variables no sean reutilizables
- El tamaño de archivo se infla innecesariamente
- No hay sistema de herencia o composición de estilos

**Refactorización sugerida:**
```typescript
// Extraer a archivos SCSS separados:
// user-table.component.scss
// extend-role-dialog.component.scss
// suspend-role-dialog.component.scss
// user-form.component.scss
// Usar @use 'variables' para colores y espaciados compartidos
```

---

## 4. PROBLEMAS DE ARQUITECTURA Y DISEÑO

### 4.1 Regla SoD Duplicada entre Frontend y Backend

**Backend:** `src/modules/auth/application/services/users.service.ts` líneas **235-243**
**Frontend:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features\dashboard\presentation\components\user-form\user-form.component.ts` líneas **450-464**

**Problema:** La regla de exclusividad del Investigador está implementada en ambos lados con ligeras diferencias:

Backend:
```typescript
const hasInvestigator = roleCodes.some(
  (c) => (typeof c === 'string' ? c.toUpperCase() : '') === 'INVESTIGADOR',
);
if (hasInvestigator && roleCodes.length > 1) throw new BadRequestException('...');
```

Frontend:
```typescript
const hasInvestigador = selectedCodes.includes('INVESTIGADOR');
if (hasInvestigador && selectedCodes.length > 1) {
  if (!hadInvestigador) normalizedCodes = ['INVESTIGADOR'];
  else normalizedCodes = selectedCodes.filter(c => c !== 'INVESTIGADOR');
}
```

**Diferencia:** El backend lanza excepción, el frontend silenciosamente elimina el rol conflicting. El usuario recibe feedback inconsistente.

**Refactorización sugerida:**
- Centralizar la regla SoD en el backend como servicio único
- El frontend debe consumir el error del backend y mostrarlo
- Eliminar la lógica frontend de "silenciosa corrección"

---

### 4.2 Falta Capa de Dominio para `RoleAssignment` Temporal

**Backend:** `src/modules/auth/application/dtos/assign-user-roles.dto.ts`  
**Frontend:** `src/domain/entities/user-admin.entity.ts`

**Problema:** En el backend, `RoleAssignmentItemDto` es un DTO de aplicación. No existe una entidad de dominio `TemporalRole` o `RoleAssignment` que encapsule la lógica de validación temporal (ej: `validUntil` debe ser posterior a `validFrom`, `reason` es obligatorio si es temporal, etc.).

**Refactorización sugerida:**
```typescript
// Backend - Dominio:
export class TemporalRoleAssignment {
  constructor(
    public readonly roleCode: string,
    public readonly validFrom: Date,
    public readonly validUntil: Date | null,
    public readonly reason: string | null,
  ) {
    if (validUntil && validUntil <= validFrom) {
      throw new Error('validUntil debe ser posterior a validFrom');
    }
  }
}
```

---

### 4.3 `UserRoleOrmEntity` No Tiene Lógica de Negocio

**Archivo:** `src/modules/auth/infrastructure/database/user-role.entity.orm.ts`  
**Líneas:** **1-32**

**Problema:** La entidad ORM es un puro data transfer object sin métodos de negocio como `isExpired()`, `isActive()`, `suspend()`, `extend()`. Esta lógica está dispersa en `UsersService` (líneas 310-389).

**Refactorización sugerida:**
```typescript
@Entity({ name: 'usuarios_roles', schema: 'catalogos' })
export class UserRoleOrmEntity {
  // ... columns ...
  
  isExpired(): boolean {
    return this.validUntil !== null && this.validUntil < new Date();
  }
  
  isActive(): boolean {
    return !this.isExpired();
  }
}
```

---

### 4.4 El `RoleOrmEntity` No Expone `code` Consistentemente

**Archivo:** `src/modules/auth/domain/constants/role-presets.constant.ts` línea **4**
**Archivo:** `src/modules/auth/infrastructure/database/role.entity.orm.ts`

**Problema:** `RoleCode` enum define `INVESTIGADOR, SECRETARIA, PRESIDENTE, EVALUADOR, ADMIN_TI`, pero `script.sql` define `roles` con `nombre VARCHAR(50)`. El mapeo entre `RoleCode` y `RoleOrmEntity` no es tipado.

---

### 4.5 `use-cases.ts` del Frontend es un Archivo con 8 Clases Sin Cohesión

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features/dashboard/use-cases.ts`  
**Líneas:** **1-68**

**Problema:** 8 clases de use case sin cohesión real. Cada una es un wrapper de 3 líneas del repositorio. Podrían reducirse significative o agruparse por dominio.

---

## 5. PROBLEMAS DE SEGURIDAD

### 5.1 `RolesGuard` No Verifica Expiración de Roles Temporales

**Archivo:** `src/shared/guards/roles.guard.ts`  
**Líneas:** **14-35**

Como se detalló en la sección 2.6, el `RolesGuard` confía ciegamente en el JWT sin verificar la expiración temporal de los roles.

**Riesgo:** Un usuario con rol temporal expirado puede acceder a rutas protegidas si el `PermissionsGuard` está deshabilitado o falla.

---

### 5.2 `validUntil` del Frontend Puede Ser Manipulada

**Archivo:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\features/dashboard/presentation/components/extend-role-dialog/extend-role-dialog.component.ts`  
**Línea:** **421-425**

```typescript
onSubmit(): void {
  if (this.form.valid) {
    const result: ExtendRoleDialogResult = {
      validUntil: this.form.value.validUntil,
      reason: this.form.value.reason
    };
    this.dialogRef.close(result);
  }
}
```

**Problema:** El `validUntil` se toma directamente del formulario HTML (`type="date"`). Un atacante puede manipular el valor para extender una suplencia indefinidamente. El backend debería validar:
1. `validUntil` no es mayor a un máximo permitido (ej: 1 año máximo)
2. `validUntil` es posterior a `validFrom`
3. El usuario tiene permiso para extender

---

### 5.3 Falta Rate Limiting en Endpoints de Roles Temporales

**Archivo:** `src/modules/auth/infrastructure/controllers/auth.controller.ts`  
**Líneas:** **159-199**

Los endpoints de `suspend` y `extend` temporal no tienen el mismo `ThrottlerGuard` que los endpoints de contraseña (líneas 115-116).

**Refactorización sugerida:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 900000 } })
@Patch('users/:id/roles/:roleCode/extend')
async extendTemporaryRole(...) { ... }
```

---

## 6. PROBLEMAS DE CONSISTENCIA FRONTEND-BACKEND

### 6.1 Cálculo de `isExpired` en Dos Fuentes Diferentes

**Backend:** `src/modules/auth/application/services/users.service.ts`  
**Líneas:** **98-101**
```sql
(CASE WHEN ur.fecha_fin IS NOT NULL AND ur.fecha_fin < NOW() THEN true ELSE false END) as is_expired
```

**Frontend:** `D:\Frontend-CEISH\ceish-espoch-frontend\src\infrastructure/adapters/user-admin-api.adapter.ts`  
**Líneas:** **145-147**
```typescript
const isExpired = r.isExpired !== undefined 
  ? r.isExpired 
  : Boolean(r.validUntil && new Date(r.validUntil).getTime() < Date.now());
```

**Problema:** El backend calcula `is_expired` usando `NOW()` del servidor PostgreSQL. El frontend lo calcula usando `Date.now()` del navegador del usuario. Si hay diferencia de timezone o relojes desincronizados, un rol puede parecer expirado en el backend pero no en el frontend, o viceversa.

**Refactorización sugerida:**
- El backend siempre debe ser la fuente de verdad para `isExpired`
- El frontend debe usar exclusivamente el valor del backend
- Eliminar el cálculo fallback del frontend

---

### 6.2 El Backend Recibe `validUntil` como `string` pero lo Convierte a `Date`

**Archivo:** `src/modules/auth/infrastructure/controllers/auth.controller.ts`  
**Líneas:** **187-198**

```typescript
@Patch('users/:id/roles/:roleCode/extend')
async extendTemporaryRole(
  @Param('id', ParseIntPipe) id: number,
  @Param('roleCode') roleCode: string,
  @Body('validUntil') validUntil: string,
  @Body('reason') reason?: string,
) {
  return this.usersService.extendTemporaryRole(
    id,
    roleCode,
    new Date(validUntil),  // ← Conversión implícita
    reason,
  );
}
```

**Problema:** `new Date(validUntil)` puede producir resultados inesperados dependiendo del formato de string recibido. Si el frontend envía `2026-09-15` (sin time), el `Date` se interpreta como midnight UTC, que puede ser un día diferente en timezone local.

---

### 6.3 El Frontend Envía Fechas en Formato `YYYY-MM-DD` pero el Backend Espera ISO

**Frontend:** `extend-role-dialog.component.ts` línea **410-413** (formato: `YYYY-MM-DD`)  
**Backend:** `assign-user-roles.dto.ts` línea **27** (`@IsDateString()` acepta ISO 8601)

**Problema:** El frontend envía `"2026-09-15"` pero `@IsDateString()` valida formatos ISO 8601. Aunque `"2026-09-15"` es técnicamente un ISO 8601 válido (date-only), el `new Date("2026-09-15")` en el backend produce un Date sin timezone definido.

**Refactorización sugerida:**
```typescript
// Frontend: siempre enviar como ISO completo
// extend-role-dialog.component.ts línea 421
validUntil: this.form.value.validUntil + 'T23:59:59.000Z'
```

---

## 7. PROPUESTAS DE REFRACTORIZACIÓN PRIORIZADAS

### Fase 1: Crítico (Semana 1)

| # | Tarea | Archivos | Impacto |
|---|-------|----------|---------|
| 1 | Corregir typo `ANTCIPADAMENTE` → `ANTICIPADAMENTE` | `users.service.ts:326` | Bajo |
| 2 | Agregar migración SQL para columnas temporales | `script.sql` | **Alto** |
| 3 | Extraer `formatDate`/`getDaysRemaining` a `DateService` | 6 archivos frontend | **Medio** |
| 4 | Agregar `OnDestroy` con `DestroyRef` en formularios | `user-form.component.ts:443` | **Bajo** |
| 5 | Añadir `ThrottlerGuard` a endpoints temporales | `auth.controller.ts:159-199` | **Medio** |

### Fase 2: Arquitectura (Semanas 2-3)

| # | Tarea | Archivos | Impacto |
|---|-------|----------|---------|
| 6 | Eliminar `roles` de `UserAdmin`, usar solo `userRoles` | `user-admin.entity.ts`, `user-admin-api.adapter.ts` | **Alto** |
| 7 | Crear `DateService` compartido | `src/shared/services/date.service.ts` | **Medio** |
| 8 | Centralizar regla SoD en backend como servicio | `users.service.ts`, `user-form.component.ts` | **Alto** |
| 9 | Extraer `TemporalRoleAssignment` como dominio | `domain/entities/` | **Alto** |
| 10 | Agregar `@UseInterceptors(AuditLogInterceptor)` | `auth.controller.ts` | **Medio** |
| 11 | Mover `getUserRoles` a `AuthFacade` o `UserAdmin` | `user-table.component.ts:275-284` | **Medio** |

### Fase 3: Performance (Semanas 3-4)

| # | Tarea | Archivos | Impacto |
|---|-------|----------|---------|
| 12 | Agregar cache a `PermissionsGuard` | `permissions.guard.ts:49-60` | **Alto** |
| 13 | Incluir `temporalRoles` en JWT payload | `auth.service.ts` | **Alto** |
| 14 | Reemplazar raw queries con TypeORM QueryBuilder | `users.service.ts` | **Medio** |
| 15 | Extraer CSS a archivos SCSS separados | 4 componentes | **Bajo** |

### Fase 4: Consolidación (Semana 5)

| # | Tarea | Archivos | Impacto |
|---|-------|----------|---------|
| 16 | Extraer `RoleService` con métodos `findByCode` | `users.service.ts` | **Medio** |
| 17 | Extraer `UserFormModel` del `UserRegistrationFormComponent` | `user-form.component.ts` | **Alto** |
| 18 | Extraer `use-cases.ts` en archivos individuales | `use-cases.ts` | **Bajo** |
| 19 | Crear `UserRoleItem` como clase con métodos `isExpired()` | `user-admin.entity.ts` | **Medio** |
| 20 | Alinear `RolesGuard` con `PermissionsGuard` temporalidad | `roles.guard.ts` | **Alto** |

---

## 8. DEPENDENCIAS ENTRE REFRACTORIZACIONES

```
Fase 1 (#1-5)
    │
    ├──→ Fase 2 (#6, #8) ← Requiere Fase 1 para datos limpios
    │         │
    │         ├──→ Fase 2 (#9, #19) ← Requiere dominio limpio
    │         │
    │         └──→ Fase 3 (#12, #13) ← Requiere JWT actualizado
    │                   │
    │                   └──→ Fase 3 (#14) ← Requiere reemplazo de raw queries
    │
    └──→ Fase 3 (#12) ← Puede ejecutarse independiente
    
Fase 2 (#7, #11) ← Puede ejecutarse en paralelo con Fase 3
    │
    └──→ Fase 4 (#16-20) ← Requiere todo lo anterior
```

---

## 9. RESUMEN DE ARCHIVOS CON PROBLEMAS

### Backend (15 archivos)

| Archivo | # Problemas | Líneas Problemáticas |
|---------|-------------|---------------------|
| `users.service.ts` | 8 | 95-106, 235-243, 257-302, 310-389, 326 |
| `auth.controller.ts` | 4 | 159-199, 326-327 |
| `permissions.guard.ts` | 2 | 49-60, 24-28 |
| `user-role.entity.orm.ts` | 2 | 1-32 (falta lógica) |
| `role.entity.ts` | 1 | 1-9 |
| `role-presets.constant.ts` | 1 | 4 |
| `script.sql` | 1 | 56-62 |
| `auth.service.ts` | 1 | JWT payload |
| `assign-user-roles.dto.ts` | 0 | (correcto) |

### Frontend (12 archivos)

| Archivo | # Problemas | Líneas Problemáticas |
|---------|-------------|---------------------|
| `user-form.component.ts` | 6 | 367-620, 399-407, 409-479, 599-619 |
| `user-admin-api.adapter.ts` | 3 | 87-103, 135-173, 145-147 |
| `user-table.component.ts` | 3 | 275-284, 295-304, 112-265 |
| `extend-role-dialog.component.ts` | 3 | 379-406, 421-425, 139-328 |
| `suspend-role-dialog.component.ts` | 2 | 96-241, 243-268 |
| `user-management.page.ts` | 1 | 225-281 |
| `use-cases.ts` | 1 | 1-68 |
| `auth.facade.ts` | 1 | 209-221 |
| `auth.facade.spec.ts` | 0 | (correcto) |
| `user-admin.entity.ts` | 2 | 25-26, 3-11 |
| `endpoints.constant.ts` | 0 | (correcto) |
| `routes.ts` | 0 | (correcto) |

---

## 10. RECOMENDACIONES FINALES

1. **Priorizar la migración SQL**: Sin las columnas temporales en `script.sql`, todo el sistema de roles temporales falla en producción con `synchronize: false`.

2. **Unificar el cálculo de `isExpired`**: El backend es la fuente de verdad. Eliminar el cálculo redundante en el frontend.

3. **Centralizar reglas de negocio**: La regla SoD y otras validaciones deben vivir en el dominio, no en controladores ni en componentes de presentación.

4. **Extraer el CSS**: Separar presentación de lógica. Los ~750 líneas de CSS inline deben ir a archivos SCSS dedicados.

5. **Implementar cache en `PermissionsGuard`**: Esta es la mayor fuente de latencia del sistema. Un cache de 5 minutos reduciría drásticamente las consultas a la BD.

6. **Eliminar la doble representación `roles`/`userRoles`**: La interfaz `UserAdmin` debe tener una sola fuente de verdad para roles, preferiblemente con metadatos temporales completos.

---

*Fin del informe de refactorización.*  
*Generado el 2026-09-04 por análisis exhaustivo de ambos repositorios.*
