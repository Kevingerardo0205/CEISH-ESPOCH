# Plan de Tareas de Implementación: CEISH-ESPOCH Backend (RF-12 a RF-19)

**Código de Especificación Activa:** `specs/001-flujo-mvp/spec.md` (v3.3.1)  
**Ubicación de Plan:** `specs/001-flujo-mvp/plan.md`  
**Ubicación de Tareas:** `specs/001-flujo-mvp/tasks.md`  
**Alcance Solicitado:** Tareas de granularidad fina (20-30 min) desde el **Requerimiento Funcional 12 en adelante** (`RF-12` a `RF-19`).

---

## 📋 Lista de Tareas por Módulo y Orden de Dependencia

### Módulo: Autenticación y RBAC (`auth`)

- [x] **TSK-001.1a**: Matriz de roles fija — migración + enum + sesión + guards + E2E + mutaciones *(subdividida en 1a/1b/1c — ver plan.md §1b)*
  - **Subtareas:** [x] 1a · [x] 1a.1 · [x] 1b Segregación INVESTIGADOR y unicidad SECRETARIA · [x] 1c Retirar RolesController/PermissionsController + limpiar ADMIN_TI
  - **Resultados TSK-001.1a:** 202 E2E / 454 unit · 12 mutaciones detectadas (10 nombradas + MUT-2b + MUT-4b)
  - **Resultados TSK-001.1a.1:** 207 E2E / 454 unit · 3 nuevas mutaciones detectadas
  - **Resultados TSK-001.1b:** 221 E2E / 467 unit · 10 mutaciones detectadas (M1 a M10)
  - **Resultados TSK-001.1c (PR #63):** 234 E2E (14 suites; fixed-roles-matrix 69, estable en 4 corridas seguidas) / 469 unit · 7 mutaciones detectadas (MUT-A, MUT-B, MUT-D, MUT-E, MUT-E2, MUT-F, MUT-H) y 1 no detectable (MUT-G) · Incluye la corrección de un fallo intermitente que venía de TSK-001.1b: fecha_inicio se guardaba con el reloj de la API y el guard compara con NOW() de Postgres; causa probable, desfase entre el reloj de Windows y el de Postgres en Docker (medido entre −385 y −484 ms en un momento dado, variable). Se reproduce con una E2E que adelanta el reloj de la API 120 s · El spec v3.5.3 (5ec6269) se actualizó después del primer commit de código (82193b3).

  | Mutación | Condición eliminada | Prueba que falla |
  |---|---|---|
  | MUT-1 sesión | `fecha_fin >= NOW()` en `buildActiveSessionData` | REVOCADO: login devuelve roles=[] y permissions=[] + REVOCADO-SEC: login no incluye RECEPCION_LISTA |
  | MUT-2 sesión | `r.activo = true` en `buildActiveSessionData` | ROL INACTIVO: login no incluye RECEPCION_LISTA |
  | MUT-2b sesión | `r.eliminado_en IS NULL` en `buildActiveSessionData` | ROL ELIMINADO: login no incluye RECEPCION_LISTA |
  | MUT-3 sesión | `p.eliminado_en IS NULL` en `buildActiveSessionData` | PERMISO RETIRADO: GET /auth/me no incluye PERMISOS_GESTIONAR |
  | MUT-4 guard | `r.activo = true` en `PermissionsGuard` | ROL INACTIVO: GET /reception/protocols → 403 |
  | MUT-4b guard | `r.eliminado_en IS NULL` en `PermissionsGuard` | ROL ELIMINADO: GET /reception/protocols → 403 |
  | MUT-5 guard | `p.eliminado_en IS NULL` en `PermissionsGuard` | PERMISO RETIRADO: GET /auth/roles → 403 |
  | MUT-6 guard | `fecha_fin >= NOW()` en `PermissionsGuard` | REVOCADO-SEC: GET /reception/protocols → 403 |
  | MUT-7 enum | `EVALUATORS_WORKLOAD_VIEW = 'EVALUACION_RIESGO'` | EVALUADOR: GET /evaluations/evaluators/dashboard → 403 |
  | MUT-8 enum | `ROLES_ASSIGN = 'PERMISOS_GESTIONAR'` | SECRETARIA: PATCH /auth/users/:id/roles → no 403 |
  | MUT-9 enum | `PERMISSIONS_MANAGE = 'PERMISOS_GESTIONAR'` | SECRETARIA: POST /evaluations/profiles → no 403 |
  | MUT-10 migración | Quitar aborto por falta de secretaria@test.com | MIGRACIÓN: up() lanza [TSK-001.1a] ABORT |

  ##### Mutaciones TSK-001.1a.1 (Vigencia temporalRoles y down() rol 43)

  | Mutación | Condición eliminada | Prueba que falla |
  |---|---|---|
  | MUT-1a.1-1 temporalRoles | `r.activo = true AND r.eliminado_en IS NULL` en `temporalRolesRaw` | ROL INACTIVO con @Roles: el token decodificado no debe contener el código en roles ni en temporalRoles con isExpired = false |
  | MUT-1a.1-2 temporalRoles | `(ur.fecha_inicio IS NOT NULL AND ur.fecha_inicio > NOW())` en `is_expired` | ROL PROGRAMADO: en temporalRoles aparece con isExpired = true |
  | MUT-1a.1-3 migración down | `activo = true` en `UPDATE catalogos.roles WHERE codigo = '43'` en `down()` | down() del rol 43: dentro de transacción con ROLLBACK, 43 queda con activo=false y eliminado_en=NULL, y ADMIN_TI con activo=true |

  ##### Mutaciones TSK-001.1c (Retirar RolesController/PermissionsController + validación de códigos de rol)

  | Mutación | Condición alterada / eliminada | Prueba que falla (nombre exacto) | Tests |
  |---|---|---|---|
  | MUT-A getRoles | `activo = true AND eliminado_en IS NULL` en `getRoles` | `GET /auth/roles → devuelve exactamente 4 roles activos (SECRETARIA, PRESIDENTE, EVALUADOR, INVESTIGADOR)` | detectada (sin conteo registrado) |
  | MUT-B IA | Validación de código SECRETARIA exclusivo en `ai-assistant-admin` | `PUT /admin/ai-assistant/roles → 403 con PRESIDENTE (solo SECRETARIA tiene acceso)` | detectada (sin conteo registrado) |
  | MUT-D guard | `@Permissions(Permission.USERS_VIEW)` en `GET /auth/roles` | `GET /auth/roles → 200 con SECRETARIA (tiene USUARIOS_VER)` | detectada (sin conteo registrado) |
  | MUT-E activos | `isActive: true` en `find()` de `updateUserRoles` | `PATCH /auth/users/:id/roles con rol inactivo → 400 (activo=false excluido)` | 1 failed, 67 passed |
  | MUT-E2 eliminados | añade `withDeleted: true` al `find()` de `updateUserRoles` (evita el `@DeleteDateColumn` de BaseOrmEntity) | `PATCH /auth/users/:id/roles con ZZ_TEST_DEL (activo=true, eliminado_en=NOW) → 400` | 6 failed, 62 passed |
  | MUT-F código inexistente | elimina `throw BadRequestException` cuando `invalidCodes.length > 0` | `PATCH /auth/users/:id/roles con ["ADMIN_TI"] → 400` · `PATCH /auth/users/:id/roles con ["FOO","EVALUADOR"] → 400` | 4 failed, 64 passed |
  | MUT-G búsqueda por name | añade `...map(c => ({ name: c, isActive: true }))` al `where` del `find()` | **MUT-G no detectable**: ningún nombre de rol activo coincide con los códigos de prueba; la condición adicional nunca retorna filas | 0 failed, 68 passed |
  | MUT-H clock-skew | vuelve a `new Date()` y `fecha_inicio = $n` sin COALESCE en el INSERT y el UPDATE | `sin validFrom: fecha_inicio ≤ NOW() y el guard acepta EVALUADOR (200, no 403)` · 2 unitarias de COALESCE en users.service.spec.ts | 1 E2E failed, 68 skipped · 2 unit failed |

  > **MUT-H0**: pasar `null` sin `COALESCE` guarda `fecha_inicio = NULL`; el guard lo acepta (`fecha_inicio IS NULL OR …`), pero eso no representa el código anterior. No cuenta como detección del reloj.

  ##### Mutaciones TSK-001.1b (Segregación INVESTIGADOR y unicidad SECRETARIA)

  | Mutación | Condición alterada / eliminada | Prueba que falla |
  |---|---|---|
  | M1 SoD | Permitir INVESTIGADOR + Comité en `validateRoleChange` | `debe rechazar mezclar INVESTIGADOR con roles de comité` |
  | M2 SoD comité a inv | Permitir Comité -> INVESTIGADOR en `validateRoleChange` | `debe rechazar asignar INVESTIGADOR si ya tiene rol de comité` |
  | M3 SoD protocolos | Permitir cambio de INVESTIGADOR a Comité con protocolos activos (`count > 0`) | `debe rechazar cambio si tiene protocolos en curso como IP` |
  | M4 Unicidad SECRETARIA | Ignorar superposición de períodos en `validateSingleSecretaria` | `debe rechazar segunda SECRETARIA si los períodos se superponen` |
  | M5 Co-investigador | Omitir conteo de co-investigadores en `users.service.ts:395` | E2E: `rechaza cambio de INVESTIGADOR a comité si es co-investigador de protocolo en curso` (esperaba 400, recibió 200) |
  | M6 Transacción createUser | Guardar usuario antes de validar roles fuera de transacción | E2E: `no persiste el usuario si la asignación de roles viola segregación` (conteo aumentó de 39 a 40) |
  | M7 Unicidad extend | Omitir validación de unicidad de SECRETARIA en `extendTemporaryRole` | E2E: `rechaza prorrogar SECRETARIA si se superpone con otra titular activa` (esperaba 400, recibió 200) |
  | M8 SoD extend | Omitir validación de segregación en `extendTemporaryRole` | E2E: `rechaza prorrogar SECRETARIA si el usuario tiene rol INVESTIGADOR vigente` (esperaba 400, recibió 200) |
  | M9 Concurrencia FOR UPDATE | Omitir `FOR UPDATE` sobre SECRETARIA en `updateUserRoles` | E2E: `dos peticiones concurrentes de asignación de SECRETARIA a usuarios distintos` (ambas tuvieron éxito 200 en lugar de 1 rechazo 400) |
  | M10 Cédula register | Omitir validación previa de cédula única en `register` de `auth.service.ts` | E2E: `rechaza registro con cédula ya registrada (400 con mensaje claro)` (esperaba 400, recibió 500 por error interno de BD) |
  - **Requisitos cubiertos:** `HU-001` (puntos a–j), `RF-001`
  - **Hecho cuando:**
    - La migración, aplicada por el agente solo en `ceish_test_db`, siembra la matriz de permisos canónica (`USUARIOS_GESTIONAR` y todos los permisos de HU-001 c), retira con `eliminado_en` los permisos `PERMISOS_GESTIONAR`, `SEGUIMIENTO_ENMIENDAS`, `TRADUCCION_ANCESTRAL`, `DASHBOARD_SLA` y `CONFIG_INTEGRACIONES`, aplica las reglas de datos existentes del punto h) (revocación de `ADMIN_TI`, unicidad de `SECRETARIA`, segregación `INVESTIGADOR`+`SECRETARIA`, rol inactivo provisional).
    - La migración guarda una copia de `rol_permisos` en una tabla de respaldo antes de reemplazarla, y `down()` la restaura.
    - Si no existe la cuenta de prueba que conserva `SECRETARIA`, la migración falla (no revoca `SECRETARIA` a todos).
    - Solo se desactivan las cuentas con `ADMIN_TI` vigente.
    - La migración quita `ADMIN_TI` de `ai_assistant_config.allowed_roles`.
    - Se retiran RolesController y PermissionsController completos.
    - `ADMIN_TI` y el identificador `ADMIN` salen del código, de los presets de seed y de las pruebas.
    - `Permission.ROLES_ASSIGN` apunta a `USUARIOS_GESTIONAR`.
    - Los alias del enum `Permission` cumplen el punto i).
    - Login, `/auth/me`, refresh y los dos guards aplican el punto j).
    - La segregación de funciones (`INVESTIGADOR` excluyente de roles del comité) se aplica en el registro y en la asignación de roles.
    - La asignación del rol `SECRETARIA` rechaza a un segundo titular vigente (unicidad b2).
    - `allowed_roles` del módulo de IA queda sin `ADMIN_TI`.
    - Hay pruebas E2E con el `PermissionsGuard` REAL (sin `overrideGuard`) que confirman, por cada rol, al menos un permiso permitido y uno denegado.
    - Hay pruebas E2E de la segregación de funciones y de la regla de una sola Secretaría.
    - Hay pruebas E2E con login real que confirman que una cuenta a la que se le revocó `SECRETARIA` recibe 403 tanto en un endpoint con `@Permissions` como en uno con `@Roles`.
    - Hay mutaciones que comprueban que esas pruebas fallan si se quita cada regla.
    - El lint se corre solo sobre los archivos cambiados (`npx eslint <archivos>`, sin `--fix`).

- [x] **TSK-001.1d**: Rechazos del login con código estable y mensajes en español (HU-001 k, spec v3.5.4 — 04/11/2026)
  - **Archivos:** CREAR `src/modules/auth/domain/enums/login-error-code.enum.ts` (`LoginErrorCode`, `LOGIN_ERROR_MESSAGES`) · MODIFICAR `src/modules/auth/application/services/auth.service.ts` (`validateUser`) · CREAR `test/login-errors.e2e-spec.ts`
  - **Cambio:** cada rechazo de `POST /auth/login` devuelve `code` (`INVALID_CREDENTIALS`, `ACCOUNT_DISABLED`, `EMAIL_NOT_VERIFIED`, `ACCOUNT_LOCKED`) en `body.error.code`, con la forma previa (`statusCode`, `message`, `error`). Sin cambios en status, orden de validaciones, lógica de bloqueo ni en `HttpExceptionFilter`.
  - **Resultados (04/11/2026):** 469 unit (58 suites) · E2E `login-errors` 8 + `fixed-roles-matrix` 69 = 77, estable en 2 corridas seguidas · tsc 0 errores · eslint sin errores en los 3 archivos · residuos `@e2e-login.test` en `ceish_test_db` = 0 · suite E2E completa: NO EJECUTADO (la corre el usuario)

  | Mutación | Qué se rompió | Prueba que falla (nombre exacto) | Tests |
  |---|---|---|---|
  | MUT-L1 sin code en bloqueo | `ACCOUNT_LOCKED` lanza `{ statusCode, message, error }` sin `code` | `cuenta bloqueada → 403, ACCOUNT_LOCKED, mensaje en español` · `bloqueo sin cambios: el 3.er fallo responde INVALID_CREDENTIALS y el siguiente ACCOUNT_LOCKED` | 2 failed, 6 passed |
  | MUT-L2 mensaje de verificación | `EMAIL_NOT_VERIFIED` → "Debe verificar su correo electrónico antes de iniciar sesión." (sin "confirma tu correo") | `correo sin verificar → 403, EMAIL_NOT_VERIFIED, mensaje de verificación sin cambios` | 1 failed, 7 passed |
  | MUT-L3 distinguir correo inexistente | correo inexistente → mensaje "El correo no está registrado." | `correo inexistente → 401, INVALID_CREDENTIALS, "Correo o contraseña incorrectos."` · `correo inexistente y contraseña incorrecta devuelven el mismo cuerpo de error` | 2 failed, 6 passed |

  - **Nota frontend:** el mensaje de bloqueo ya no contiene "locked"; el frontend debe reconocer ese caso por `code === 'ACCOUNT_LOCKED'`.

### Módulo: Catálogo de Estados y Etapas del Protocolo (`protocols` / `reception`)

- [x] **TSK-001.2**: Etapa y orden en `catalogos.estados`, y la etapa en los listados de protocolos (RF-EST.1, RF-EST.2 parcial — spec v3.5.5, 04/11/2026)
  - **Requisitos cubiertos:** `RF-EST.1`, `RF-EST.2` (parcial)
  - **Archivos:**
    - CREAR `src/migrations/1890000000000-AddEtapaOrdenToEstados.ts` — columnas `etapa` (varchar, NULL, CHECK de las 6 etapas) y `orden` (smallint, NULL, CHECK 1-6) y siembra por id; `down` quita los CHECK y las columnas.
    - CREAR `src/modules/protocols/infrastructure/database/status.entity.orm.ts` (`StatusOrmEntity`, `catalogos.estados`).
    - CREAR `src/modules/protocols/domain/enums/protocol-stage.enum.ts` (`ProtocolStage`, `PROTOCOL_STAGE_ORDER`).
    - CREAR `src/modules/protocols/domain/services/resolve-protocol-stage.ts` y su `resolve-protocol-stage.spec.ts` (`resolveProtocolStage`).
    - CREAR `test/protocol-stage.e2e-spec.ts`.
    - MODIFICAR `src/modules/protocols/infrastructure/database/protocol.entity.orm.ts` (relación `status`), `src/modules/reception/infrastructure/database/reception.entity.orm.ts` (relación `status`), `src/modules/evaluations/infrastructure/database/protocol-version.entity.orm.ts` (relación `resolutions`, para E4), `src/modules/protocols/protocols.module.ts` (registra `StatusOrmEntity`), `src/modules/protocols/infrastructure/repositories/protocol.typeorm.repository.ts` (joins en `findAll` y `findProtocolsForReception`), `src/modules/protocols/application/mappers/protocol.mapper.ts`, `src/modules/protocols/application/services/protocols.service.ts` (`findAll`), `src/modules/reception/application/services/reception.service.ts` (`getProtocolsForReception`).
  - **Cambio:** `GET /protocols` (y `mis-protocolos`, `mis-subsanaciones`, que usan el mismo `findAll`) y `GET /reception/protocols` agregan `etapa` (código) y `etapaOrden` (1-6, o null). La etapa sale de `resolveProtocolStage` con la regla de RF-EST.1 (protocolo → recepción → RECEPCION; APROBADO pasa a SEGUIMIENTO con resolución emitida para la versión activa). Sin otros cambios en esas respuestas. `findById` no se toca, porque sus llamadores guardan la entidad después y una relación `status` cargada podría pisar `estado_id`.
  - **Pruebas:** unitarias de `resolveProtocolStage` (cada fila de la tabla, la precedencia y la excepción APROBADO); E2E `test/protocol-stage.e2e-spec.ts` contra `ceish_test_db` con datos `ZZ_TEST_` (catálogo por id; `GET /protocols` y `GET /reception/protocols` para NULL+COMPLETO → ASIGNACION, EN_EVALUACION → EVALUACION, APROBADO sin resolución → RESOLUCION, APROBADO con resolución → SEGUIMIENTO, NULL+INICIADO → RECEPCION).
  - **Hecho cuando:** la migración corre en `ceish_test_db` (en `ceish_db` la aplica el usuario), las pruebas nuevas y las existentes pasan, y las mutaciones (precedencia invertida, APROBADO siempre SEGUIMIENTO, COMPLETO → RECEPCION en la semilla, sin join del estado de la recepción, orden por estado) hacen fallar al menos una prueba cada una.
  - **Resultados (04/11/2026):** 509 unit (59 suites; +40 de `resolve-protocol-stage.spec.ts`) · E2E `protocol-stage` 12 + `fixed-roles-matrix` 69 + `login-errors` 8 = 89, estable en 2 corridas seguidas · tsc 0 errores · eslint: 0 errores en los archivos tocados salvo `protocols.service.ts` (10, igual que en `dev`) · migración aplicada en `ceish_test_db` (up, down y up de nuevo); en `ceish_db`: NO EJECUTADO (la aplica el usuario) · convocatorias huérfanas en `ceish_test_db` = 57 · residuos `ZZ_TEST_` y `@e2e-etapas.test` = 0 · suite E2E completa: NO EJECUTADO (la corre el usuario)
  - **Consultas:** `GET /protocols` = 2 SELECT (ids distintos para paginar + principal, como antes) y `GET /reception/protocols` = 1 SELECT; los estados y las resoluciones van por `LEFT JOIN` (`catalogos.estados` ×2, `resolucion.resoluciones`), sin consultas por fila.

  | Mutación | Qué se rompió | Prueba que falla (nombre exacto) | Tests |
  |---|---|---|---|
  | MUT-E1 precedencia invertida | `receptionStatus ?? protocolStatus` | unit: `el estado del protocolo manda sobre el de la recepción` · `APROBADO sin resolución emitida → RESOLUCION (4)` · E2E (en los dos endpoints): `EN_EVALUACION → etapa EVALUACION, etapaOrden 3` · `APROBADO_SIN_RES → etapa RESOLUCION, etapaOrden 4` | unit 2 failed, 38 passed · E2E 4 failed, 8 passed |
  | MUT-E2 APROBADO siempre SEGUIMIENTO | se ignora `resolutionEmitted` | unit: `estado 17 → etapa RESOLUCION` · `APROBADO sin resolución emitida → RESOLUCION (4)` · E2E (en los dos endpoints): `APROBADO_SIN_RES → etapa RESOLUCION, etapaOrden 4` | unit 2 failed, 38 passed · E2E 2 failed, 10 passed |
  | MUT-E3 semilla COMPLETO → RECEPCION | migración: id 10 con `RECEPCION`/1 (revert + run en `ceish_test_db`) | `el catálogo tiene la etapa y el orden esperados por id (E3)` · (en los dos endpoints) `NULL_COMPLETO → etapa ASIGNACION, etapaOrden 2` | E2E 3 failed, 9 passed |
  | MUT-E4 sin join del estado de la recepción | se quita `leftJoinAndSelect('reception.status', …)` en los dos listados | (en los dos endpoints) `NULL_COMPLETO → etapa ASIGNACION, etapaOrden 2` | E2E 2 failed, 10 passed |
  | MUT-E5 orden por estado | `order` = id del estado en lugar de la posición de la etapa | unit: 25 casos (p. ej. `estado 9 → etapa RECEPCION`, `estado 10 → etapa ASIGNACION`) · E2E: 10 casos (todos los de los dos endpoints salvo `NULL_SIN_RECEPCION`) | unit 25 failed, 15 passed · E2E 10 failed, 2 passed |

  - **Notas:**
    - `ProtocolMapper.toResponse` no cambia: lo usan también `GET /protocols/:id` y `POST /protocols`, que cargan el protocolo con `findById` sin los joins. Los listados usan `ProtocolMapper.toListResponse` (= `toResponse` + `toStage`) y `GET /reception/protocols` usa `ProtocolMapper.toStage`.
    - Marca de «resolución emitida» (E4): fila en `resolucion.resoluciones` con `version_id` = versión activa (`fecha_emision` NOT NULL, DEFAULT now()). Hoy `resolutions.service.ts` crea esa fila en la misma transacción en la que pone el protocolo en APROBADO, así que «APROBADO sin resolución» solo aparece con datos cargados fuera de ese flujo.
    - En `ceish_db` el usuario aplica la migración con `MIGRATION_CONFIRM_DB=ceish_db npm run migration:run`.

- [ ] **TSK-001.3**: `etapa` y `etapaOrden` en el resto de endpoints con datos de protocolo (RF-EST.2, resto)
  - **Requisitos cubiertos:** `RF-EST.2`
  - **Endpoints:** `GET /protocols/:id`, `POST /protocols` (requieren cargar el estado sin arriesgar los `save` que siguen a `findById`), `GET /reception/protocol/:id`, `GET /evaluations/protocols/pending-peer-assignment`, `GET /evaluations/my-assignments`, `GET /evaluations/evaluators/dashboard`, `GET /evaluations/peer-assignments/my-pending`, `GET /evaluations/meetings/pending-protocols`, `GET /evaluations/meetings`, `GET /resolutions/protocol/:protocolId`. `CallsController` queda fuera (legacy).
  - **Hecho cuando:** cada endpoint devuelve la etapa calculada con `resolveProtocolStage`, con pruebas E2E.

- [x] **TSK-001.4**: Filtros y acceso de `GET /api/protocols` (RF-EST.3 — spec v3.5.6, 04/11/2026)
  - **Requisitos cubiertos:** `RF-EST.3` (búsqueda, año, etapa), HU-001 c (`PROTOCOLOS_LISTAR`)
  - **Archivos:**
    - CREAR `src/migrations/1900000000000-AddProtocolosListarPermission.ts`: inserta `PROTOCOLOS_LISTAR` («Listar protocolos», `MOD_RECEPCION`) y lo asigna a SECRETARIA y PRESIDENTE (patrón de `FixedRolesMatrix1880000000000`); `down` borra esas 2 filas de `rol_permisos` y el permiso.
    - CREAR `src/modules/protocols/application/dtos/list-protocols-query.dto.ts` (`ListProtocolsQueryDto extends QueryProtocolDto`: `search`, `year`, `etapa`, `limit` máximo 100) y `list-protocols-query.dto.spec.ts`. Es un DTO propio de `@Get()` para que `mis-protocolos` no cambie.
    - CREAR `src/modules/protocols/domain/services/protocol-stage.sql.ts` (`protocolStageSql`: CASE que replica `resolveProtocolStage`).
    - CREAR `src/shared/db/like-pattern.ts` (`escapeLikePattern`) y `like-pattern.spec.ts`.
    - CREAR `test/protocols-list.e2e-spec.ts`.
    - MODIFICAR `src/shared/enums/permission.enum.ts` (`PROTOCOLOS_LISTAR`), `src/modules/protocols/infrastructure/controllers/protocol.controller.ts` (solo el handler `@Get()`), `src/modules/protocols/application/services/protocols.service.ts`, `src/modules/protocols/domain/ports/protocol.repository.port.ts`, `src/modules/protocols/infrastructure/repositories/protocol.typeorm.repository.ts` (`findAll`), `src/modules/protocols/application/mappers/protocol.mapper.ts` (`toListResponse` con `principalInvestigator`), `src/modules/protocols/domain/services/resolve-protocol-stage.ts` (comentario cruzado), `test/fixed-roles-matrix.e2e-spec.ts` (totales 36/22/9/8 = 75).
  - **Cambio:** contrato de RF-EST.3 en spec v3.5.6 (acceso, `search`, `year`, `etapa`, `limit`, `principalInvestigator`). El orden y los campos existentes no cambian.
  - **Pruebas:** unitarias del DTO (`year`, `etapa`, `search` vacío y largo, `limit` 101) y de `escapeLikePattern`. E2E `test/protocols-list.e2e-spec.ts` con guards reales y login real (`secretaria@test.com` y `presidente@test.com` con `E2E_TEST_ACCOUNTS_PASSWORD`; EVALUADOR e INVESTIGADOR `ZZ_TEST_PLIST_` con contraseña generada): 401, 200, 403, `mis-protocolos` 200 para INVESTIGADOR, regresión `?statusId=14`, búsqueda por código, título, coinvestigador y principal, año con y sin recepción (borde 31/12 en hora de Ecuador), etapa (items y suma de totales por etapa = total sin filtro), paginación por etapa, 400 de `limit` y `etapa`, `principalInvestigator`. Datos `ZZ_TEST_PLIST_`, residuos = 0.
  - **Hecho cuando:** la migración pasa up/down/up en `ceish_test_db` (en `ceish_db` la aplica el usuario), las pruebas nuevas y las existentes pasan (E2E completa dos veces) y al menos 6 mutaciones (rol, permiso, escape, EXISTS, año, una rama del CASE) hacen fallar una prueba cada una.
  - **Resultados (04/11/2026, commit 53d2bec):** 561 unit (63 suites; antes 530: +27 de `list-protocols-query.dto.spec.ts` y +4 de `like-pattern.spec.ts`) · E2E `protocols-list` 30/30 en 2 corridas seguidas · E2E completa 18 suites, 311 pruebas (279 + 30 + 2 nuevas de `fixed-roles-matrix`) en 2 corridas seguidas · tsc 0 errores · `nest build` OK · eslint: 0 en los archivos tocados salvo `protocols.service.ts` (10) y `protocol.controller.ts` (1 error y 1 warning), iguales que en `dev` · migración en `ceish_test_db`: antes SECRETARIA 35 / PRESIDENTE 21 / EVALUADOR 9 / INVESTIGADOR 8 y permiso 0 → up 36/22/9/8 y 1 → down 35/21/9/8 y 0 → up 36/22/9/8 y 1 (75 filas para los 4 roles); en `ceish_db`: NO EJECUTADO (la aplica el usuario) · totales por etapa en `ceish_test_db` (con los 21 protocolos de prueba): RECEPCION 130, ASIGNACION 6, EVALUACION 15, RESOLUCION 2, SEGUIMIENTO 3, RENOVACION 0 = 156 = total sin filtro · residuos `ZZ_TEST_PLIST_` / `@e2e-plist.test` (protocolos, versiones, recepciones, investigadores, usuarios, roles de usuario) = 0 · convocatorias huérfanas = 57

  | Mutación | Qué se rompió | Prueba que falla (nombre exacto) | Tests |
  |---|---|---|---|
  | M1 rol | `@Roles(SECRETARIA, PRESIDENTE)` → `@Roles(SECRETARIA)` | `acceso › PRESIDENTE → 200, y ?statusId=14 sigue filtrando EVALUADO` | 1 failed, 29 passed |
  | M2 permiso | sin `@Permissions(PROTOCOLOS_LISTAR)` en `@Get()` | `acceso › PRESIDENTE sin PROTOCOLOS_LISTAR en su rol → 403` | 1 failed, 29 passed |
  | M3 escape | `%${search}%` sin `escapeLikePattern` | `search › "%" se busca literal` · `search › por código: "_" se busca literal (no como comodín)` | 2 failed, 28 passed |
  | M4A EXISTS coinvestigador | `OR FALSE AND EXISTS (… protocolo_investigadores` | `search › por coinvestigador: una sola fila aunque coincidan 2, con total correcto` | 1 failed, 29 passed |
  | M4B EXISTS principal | `OR FALSE AND EXISTS (… catalogos.usuarios` | `search › por investigador principal sin fila en protocolo_investigadores` · `respuesta › principalInvestigator { id, fullName } y los campos previos` | 2 failed, 28 passed |
  | M5 año sin zona | sin `AT TIME ZONE 'UTC' AT TIME ZONE 'America/Guayaquil'` | `year (America/Guayaquil) › 2030: recepción del 31/12 a las 23:30 en Ecuador` · `› 2031: recepción a medianoche del 1/1 y creación (sin recepción) del 31/12 a las 23:59` · `› 2032: nada (la creación de las 04:59 UTC sigue siendo 2031 en Ecuador)` | 3 failed, 27 passed |
  | M7 COALESCE invertido | `COALESCE(creado_en, fecha_recepcion)` | `year › 2030: …` · `year › 2031: …` | 2 failed, 28 passed |
  | M6 CASE APROBADO | `THEN 'SEGUIMIENTO'` → `THEN ps.etapa` | `etapa › RESOLUCION: devuelve solo esa etapa` · `etapa › SEGUIMIENTO: devuelve solo esa etapa` · `etapa › sobre todo ceish_test_db: cada item trae la etapa filtrada y la suma por etapa = total sin filtro` (repetida 2 veces, mismo resultado) | 3 failed, 27 passed |
  | M8 CASE recepción | `WHEN rs.id … THEN 'RECEPCION'` | `etapa › ASIGNACION: devuelve solo esa etapa` · `etapa › RECEPCION: devuelve solo esa etapa` · `etapa › sobre todo ceish_test_db: …` | 3 failed, 27 passed |

  - **Notas:**
    - `principalInvestigator` también aparece en `GET /protocols/mis-protocolos` y `mis-subsanaciones`, que usan el mismo `findAll`/`toListResponse` (cambio aditivo). Esos dos handlers siguen validando con `QueryProtocolDto`.
    - Diferencias con nestjs-best-practices/nestjs-patterns, por seguir el repo: respuesta con mappers (no `ClassSerializerInterceptor` ni DTO de respuesta), `ValidationPipe` global del repo sin `enableImplicitConversion` (`@Type(() => Number)` en el DTO), guards en `src/shared/guards`.
    - La migración usa `as Array<{ id: number }>` en lugar del `eslint-disable` de la 1880; tras ese cambio se repitió down/up en `ceish_test_db` (35/21 → 36/22).
    - En `ceish_db` el usuario aplica la migración con `MIGRATION_CONFIRM_DB=ceish_db npm run migration:run`.

- [x] **Corrección: arranque con SWC** (rama `fix/swc-entidades-circulares`, commit 04d8d3f, 04/11/2026)
  - **Causa:** `nest build` y `nest start --watch` compilan con SWC, que emite `design:type` con la clase de cada propiedad decorada. `f0ca23d` (TSK-001.2) añadió `ProtocolVersionOrmEntity.resolutions` e importó `ResolutionOrmEntity`, que cerró el ciclo protocolo → versión → resolución → protocolo. `ResolutionOrmEntity.protocol` y `.version` no iban en `Relation<>`, así que `node dist/main` fallaba con `ReferenceError: Cannot access 'ProtocolOrmEntity' before initialization` (`resolution.entity.orm.ts:22`). ts-jest y `tsc` no lo reproducen. El contenedor `ceish_api` (`npm run build` + `node dist/main`) habría fallado igual en el próximo `docker compose build`.
  - **Cambio:** las 46 propiedades de relación que faltaban en los 20 `*.entity.orm.ts` van ahora en `Relation<>` (`import type { Relation } from 'typeorm'`); ya lo estaban las otras 14. Sin cambios en columnas, nombres, decoradores, lógica, SWC ni esquema (sin migración).
  - **Regresión:** `test/swc-entities-boot.e2e-spec.ts` compila `src/` con `@swc/core` y las mismas opciones que `nest build` (`swcDefaultsFactory` de `@nestjs/cli`) y carga cada una de las 35 entidades como primer módulo de un proceso nuevo, sin base ni `.env`. Con `resolution.entity.orm.ts` como en `dev` falla en 14 entidades (`ReferenceError: Cannot access 'ProtocolOrmEntity'`/`'ProtocolVersionOrmEntity' before initialization`).
  - **Resultados:** `node dist/main` y `npm run start:dev` → «Nest application successfully started» · tsc 0 · `nest build` OK · eslint 0 en los 21 archivos (también 0 en `dev`) · 561 unit · E2E completa 19 suites, 313 pruebas (311 + 2) en 2 corridas seguidas.
  - **Nota (pruebas E2E):** `real-db-evaluations`, `active-assignments` y `reassignment-history` insertan asignaciones con id fijo (9501–9994). Cuando la secuencia `evaluacion.asignaciones_evaluacion_id_seq` de `ceish_test_db` cruzó esa franja (9926), chocaron con ids de la secuencia (`duplicate key … asignaciones_evaluacion_pkey`, Key (id)=(9911)). Se hizo `setval(…, 10000)` en `ceish_test_db`. Pendiente: que esas pruebas no dependan del valor de la secuencia. `meeting-pdf-real` M4-04 superó una vez su timeout de 60 s con la máquina cargada.

- [ ] **Pendiente aparte (E8):** en `ceish_test_db` faltan las FK hacia `catalogos.estados` que crea `1791000000000-RefactorEstadosDictamenes` (asignaciones_evaluacion, versiones_protocolo, recepciones), aunque la migración figura como aplicada. Revisar en otra tarea.

---

### Módulo: Creación del protocolo (`protocols` / `reception` / `audit`) — spec v3.6.0, 09/11/2026

> Origen: pruebas del 09/11/2026 (protocolos 171 y 173), reunión del 06/11/2026 con la Secretaría y la Presidenta, decisiones de la usuaria del 09/11/2026. Diseño en plan.md §1c. Orden sugerido: 001.5 → 001.7 → 001.8 → 001.9 → 001.10 → 001.6 → 001.14; 001.13 aparte; 001.11 con el rediseño del frontend; 001.12 después del 12/11/2026. Todas las E2E con login real, guards reales, datos `ZZ_TEST_` o correos `@e2e-<tarea>.test`, limpieza en `beforeAll` y `afterAll`, `--runInBand`.

- [x] **TSK-001.5**: Borrador invisible para la Secretaría y envío o reenvío desde `INICIADO`, `INCOMPLETO` o `REQUIERE_SUBSANACION_DOC` (RF-02.3, HU-002 3 y 4, RF-EST.3 punto 5)
  - **Requisitos cubiertos:** `RF-02.3 a–e`, `RF-EST.3` punto 5
  - **Archivos:**
    - MODIFICAR `src/modules/protocols/infrastructure/repositories/protocol.typeorm.repository.ts` (`findProtocolsForReception`: `pendientes` = 15, sin filtro excluye 9; `findAll`: opción para excluir borradores)
    - MODIFICAR `src/modules/protocols/domain/ports/protocol.repository.port.ts` (opción de `findAll`, si hace falta)
    - MODIFICAR `src/modules/protocols/application/services/protocols.service.ts` (`findAll` del handler `@Get()` excluye borradores; `submit` acepta 9, 11 y 20 y rechaza con 409 en cualquier otro estado)
    - MODIFICAR `src/modules/reception/application/services/reception.service.ts` (solo si `updateReceptionStatus` necesita el estado de origen)
    - CREAR `test/protocol-draft-submit.e2e-spec.ts`
    - Función de dominio para la regla de envío: buscar antes equivalentes con Grep; si hace falta un archivo nuevo, se reporta antes de crearlo.
  - **Pruebas (E2E):** borrador recién creado → no aparece en `GET /reception/protocols` (sin filtro y con `status=pendientes`) ni en `GET /protocols` (SECRETARIA y PRESIDENTE); sí en `GET /protocols/mis-protocolos` del investigador · `submit` → recepción en 15 y aparece en `GET /reception/protocols?status=pendientes` y en la fila `VALIDAR` de `GET /secretaria/pendientes` · reenvío desde `INCOMPLETO` (11) → 15 · reenvío desde `REQUIERE_SUBSANACION_DOC` (20) → 15 · segundo `submit` (ya en 15) → 409 y el estado no cambia · `submit` con recepción en 10, 12 y 21 → 409 con mensaje en español y el estado no cambia · `submit` de otro investigador → 400 (sin cambios) · `PROTOCOL_SUBMITTED` con `registro_id` = id · regresión de `test/protocols-list.e2e-spec.ts` y `test/secretaria-pendientes.e2e-spec.ts`.
  - **Mutaciones:** (M1) `pendientes` vuelve a `IN (9, 15)` · (M2) quitar la exclusión del 9 sin filtro · (M3) quitar la exclusión en `findAll` de `GET /protocols` · (M4) `submit` sin validar el estado de origen (código actual) · (M5) excluir el 9 también en `mis-protocolos` · (M6) aceptar solo 9 (sin 11 ni 20) · (M7) aceptar también 15.
  - **Hecho cuando:** las pruebas nuevas y las existentes pasan dos veces seguidas, cada mutación hace fallar al menos una prueba con su nombre exacto, `npx tsc --noEmit` sin errores y `npx eslint` de los archivos tocados no empeora frente a `dev`.
  - **Hecho (09/11/2026, commit 8779421).** Decisiones de la usuaria del 09/11/2026 (A–E): (A) `protocol.controller.ts:61` pasa `{ excludeDrafts: true }` solo en el handler `@Get()`; el filtro `(reception.statusId IS NULL OR reception.statusId <> 9)` va antes de paginar y cuenta en el total · (B) en `test/protocols-list.e2e-spec.ts`, `YEAR_REC_BORDE`, `YEAR_REC_MEDIANOCHE` y `ST_REC` pasan de recepción 9 a 15 (mismas fechas e intención) · (C) CREAR `src/modules/protocols/domain/services/can-submit-protocol.ts` y `.spec.ts` (`SUBMITTABLE_RECEPTION_STATUS_IDS`, `canSubmitProtocol`; sin equivalentes previos); el 409 lo lanza el servicio · (D) 11 y 12 por endpoints reales (`finalize`, `archive-vencimiento`); 10, 20 y 21 con un `UPDATE` solo sobre la recepción del protocolo `ZZ_TEST_DSUB_` creado por la prueba · (E) `submitActiveReception` en el puerto y el repositorio de protocolos: `UPDATE recepcion.recepciones … AND r.estado_id = ANY(9, 11, 20)`, 0 filas → 409. Regresión no prevista: `test/protocol-stage.e2e-spec.ts` (`NULL_INICIADO`, recepción en 9) pasa a esperar que el borrador no aparezca en `GET /protocols` ni en `GET /reception/protocols` (decisión de la usuaria). `reception.service.ts` no se tocó; `updateReceptionStatus` quedó sin uso (su retiro, en otra tarea).
  - **Resultados (09/11/2026):** unit 582 (64 suites; antes 573 en 63: +9 de `can-submit-protocol.spec.ts`) en 2 corridas · E2E `protocol-draft-submit` 20/20 · E2E completa 21 suites, 350 pruebas en 2 corridas seguidas (línea base en `dev`: 20 suites, 330 pruebas; 329 pasan y `swc-entities-boot` falla solo en el worktree temporal por `reflect-metadata` fuera de `node_modules`, y pasa 2/2 en la carpeta del repo) · tsc 0 errores · eslint de los archivos tocados: 13 (10 errores, 3 avisos) frente a 14 en `dev` (`protocols.service.ts` 10 → 9; `protocol.controller.ts` 1 error y 1 aviso, y `protocol-stage.e2e-spec.ts` 2 avisos, iguales; archivos nuevos y `protocols-list` 0) · residuos `ZZ_TEST_DSUB_` / `@e2e-tsk-001-5.test` (protocolos, usuarios, `audit_log`) = 0 · convocatorias huérfanas = 57.
  - **Mutaciones (E2E `protocol-draft-submit`; cada una revertida editando y comprobada con `cmp` contra la copia previa):**

    | Mutación | Prueba que falla | Resultado |
    |---|---|---|
    | M1 `pendientes` vuelve a `IN (9, 15)` | no aparece en GET /reception/protocols?status=pendientes | 1 failed, 19 passed |
    | M2 sin la exclusión del 9 sin filtro | no aparece en GET /reception/protocols sin filtro | 1 failed, 19 passed |
    | M3 sin la exclusión en `findAll` de GET /protocols | no aparece en GET /protocols para SECRETARIA, tampoco en el total · no aparece en GET /protocols para PRESIDENTE | 2 failed, 18 passed |
    | M4 `submit` sin validar el estado de origen (código anterior) | segundo submit (ya en 15) → 409… · submit con la recepción en ARCHIVADO_VENCIMIENTO (12…) → 409… · …COMPLETO (10)… · …EN_CONTROL_DOCUMENTAL (21)… · dos submit simultáneos del mismo borrador: uno 201 y el otro 409 | 5 failed, 15 passed |
    | M5 excluir el 9 también en `mis-protocolos` | sí aparece en GET /protocols/mis-protocolos del investigador | 1 failed, 19 passed |
    | M6 aceptar solo 9 | reenvío desde INCOMPLETO (11, por POST finalize de la Secretaría) → 15 · reenvío desde REQUIERE_SUBSANACION_DOC (20) → 15 (unit: 3 failed, 6 passed) | 2 failed, 18 passed |
    | M7 aceptar también 15 | segundo submit (ya en 15) → 409… · dos submit simultáneos del mismo borrador: uno 201 y el otro 409 (unit: 2 failed, 7 passed) | 2 failed, 18 passed |

  - **Deuda técnica:** `submitActiveReception` escribe en `recepcion.recepciones` desde el módulo de protocolos; lo ideal sería un método en `IReceptionRepository`. **TSK-001.6:** agrega `fecha_recepcion = COALESCE(r.fecha_recepcion, NOW())` al `SET` de ese mismo `UPDATE`; la condición del estado de origen ya está.

- [ ] **TSK-001.6**: `fecha_recepcion` NULL al crear, `NOW()` al enviar y sin pisar al completar; `fecha_constancia` como fecha de documentación completa (RF-02.4, RF-NORM.1) — desbloqueada: pendiente 13 cerrado el 09/11/2026
  - **Requisitos cubiertos:** `RF-02.4 a–g`, `RF-NORM.1` (origen del plazo); cierra los pendientes 10 y 13 de la sección 11
  - **Dependencias:** TSK-001.5 (el `submit` con estado de origen 9)
  - **Archivos:**
    - CREAR `src/migrations/1910000000000-NullableFechaRecepcion.ts` (`DROP NOT NULL`, `DROP DEFAULT`; `down()` rellena NULL con `COALESCE(v.fecha_envio, p.creado_en)` y restaura `NOT NULL DEFAULT now()`). Timestamp a confirmar contra la última migración al implementar.
    - MODIFICAR `src/modules/reception/infrastructure/database/reception.entity.orm.ts` (`nullable: true`, sin `default`), `src/modules/reception/domain/entities/reception.entity.ts` (tipo con null)
    - MODIFICAR `src/modules/reception/application/services/reception.service.ts` (`iniciarRecepcion` :437 con null; `finalizarRevision` :277 y `verificarRequisitos` :660 sin escribir `receptionDate`)
    - MODIFICAR `src/modules/protocols/application/services/protocols.service.ts` (`submit`: `UPDATE … SET fecha_recepcion = COALESCE(fecha_recepcion, NOW()), estado_id = 15 WHERE id = $1 AND estado_id IN (9, 11, 20)`)
    - MODIFICAR `src/modules/reception/application/services/reception.service.ts` también en `finalizarRevision` y `verificarRequisitos` (fijar `fecha_constancia = NOW()` al pasar a 10) y en `emitirConstancia` :835 (`COALESCE(fecha_constancia, NOW())`)
    - MODIFICAR los consumidores del plazo normativo para leer `fecha_constancia` y los demás para tolerar NULL (lista en plan.md §1c)
    - En la misma migración o en una segunda (se decide al implementar y se lista aquí antes de crearla): relleno de `fecha_constancia = fecha_recepcion` donde es NULL y la recepción ya pasó por `COMPLETO` (aprobado el 09/11/2026; reversible: `down()` vuelve a NULL solo las filas que rellenó; el agente la corre solo en `ceish_test_db`, la usuaria en `ceish_db`)
    - CREAR `test/reception-date.e2e-spec.ts`
  - **Pruebas (E2E):** al crear, `fecha_recepcion` IS NULL en la base · tras `submit`, `fecha_recepcion` está entre el `NOW()` de la base antes y después de la petición (sin desfase de zona: comparar con `NOW()`, no con el reloj de Node) · tras `finalizarRevision` y tras `verificarRequisitos(isComplete=true)`, `fecha_recepcion` no cambia · reenvío desde 11 y desde 20 → `fecha_recepcion` sigue siendo la del primer envío · un `submit` rechazado (409) no cambia `fecha_recepcion` · `GET /protocols?year=` con borrador sin fecha usa `creado_en` · la migración pasa up/down/up en `ceish_test_db` · reloj de la API adelantado (como MUT-H de TSK-001.1c) no cambia la fecha guardada · al aprobar (por `finalizarRevision` y por `verificarRequisitos`), `fecha_constancia` queda con `NOW()` de la base · `emitirConstancia` después de aprobar no cambia `fecha_constancia` · el plazo normativo (`responseDeadline` y la advertencia de la convocatoria) cuenta desde `fecha_constancia`, no desde el envío (protocolo con envío y aprobación en días distintos) · para un protocolo ya completo antes de la migración, el plazo calculado es el mismo antes y después del relleno.
  - **Mutaciones:** (M1) `iniciarRecepcion` vuelve a `new Date()` (código actual) · (M2) `submit` con `new Date()` de Node · (M3) `finalizarRevision` vuelve a `receptionDate = now` · (M4) `verificarRequisitos` vuelve a `receptionDate = now` · (M5) quitar `AND estado_id IN (9, 11, 20)` del `UPDATE` · (M5b) `fecha_recepcion = NOW()` sin `COALESCE` (un reenvío pisa el primer envío) · (M6) aprobar sin fijar `fecha_constancia` (código actual) · (M7) `emitirConstancia` vuelve a `certificateDate = now` (código actual) · (M8) `responseDeadline` vuelve a leer `fecha_recepcion` (código actual).
  - **Hecho cuando:** la migración corre en `ceish_test_db` (en `ceish_db` la aplica el usuario con `MIGRATION_CONFIRM_DB`), los cálculos del plazo normativo siguen dando lo mismo para protocolos ya completos, las pruebas pasan dos veces y cada mutación es detectada.

- [x] **TSK-001.7**: `receptionStatus = BORRADOR` con la recepción en `INICIADO` y versión activa 1 (RF-02.5 v3.7.2, HU-002 3)
  - **Requisitos cubiertos:** `RF-02.5`
  - **Archivos:** MODIFICAR `src/modules/protocols/domain/enums/reception-status.enum.ts` (`BORRADOR`), `src/modules/protocols/infrastructure/database/protocol.entity.orm.ts` (getter :162-175) · CREAR `src/modules/protocols/infrastructure/database/protocol.entity.orm.spec.ts` (no había prueba del getter; aprobado el 09/11/2026) · casos en `test/protocol-draft-submit.e2e-spec.ts`.
  - **Pruebas:** unitarias por estado (9 con versión 1 → `BORRADOR`; 9 con versión > 1 → `EVALUACION_SUBSANACIONES` como hoy; 10, 11, 12, 15 sin cambios; sin recepción → lo mismo que hoy) · E2E: `POST /protocols` y `GET /protocols/mis-protocolos` devuelven `BORRADOR`; tras `submit`, `EN_REVISION_SECRETARIA`.
  - **Mutaciones:** (M1) quitar la rama del 9 (código actual: `PENDIENTE_SUBSANACION`) · (M2) devolver `BORRADOR` también para 9 con versión > 1 · (M3) devolver `BORRADOR` también para 15 · (M4) quitar la condición de versión 1 (todo 9 → `BORRADOR`).
  - **Hecho cuando:** pruebas y mutaciones como arriba, y el valor nuevo queda anotado para el contrato del frontend.
  - **Hecho (09/11/2026).** Decisiones de la usuaria del 09/11/2026: (1) `BORRADOR` solo con 9 y versión activa 1 (spec v3.7.2, RF-02.5 y alcance de RF-02.7) · (2) `?receptionStatus=BORRADOR` queda aceptado tal como resulta del enum (`@IsEnum` en `query-protocol.dto.ts:14-17`): cae en `reception.statusId = 9` por la rama por defecto; en `GET /protocols` no devuelve nada (TSK-001.5 excluye los borradores) y en `mis-protocolos` filtra los borradores del investigador; el DTO no se tocó · (3) CREAR `protocol.entity.orm.spec.ts`. Además, con aprobación: cast solo de tipo en `protocol.typeorm.repository.ts:148` (`(receptionStatus as string) === 'ARCHIVADO'`), porque con el valor nuevo tsc daba TS2367; no cambia el comportamiento. Ningún consumidor del backend dependía de que 9 devolviera `PENDIENTE_SUBSANACION`.
  - **Resultados (09/11/2026):** unit 595 (65 suites; antes 582 en 64: +13 de `protocol.entity.orm.spec.ts`) en 2 corridas · E2E `protocol-draft-submit` 23/23 (+3 de TSK-001.7) · E2E completa 21 suites, 353 pruebas en 2 corridas seguidas (antes 350), incluida `swc-entities-boot` · tsc 0 errores · eslint de los archivos tocados: 0 (en `dev`, 0; el archivo del repositorio de `dev` analizado con el enum nuevo da 1, el mismo TS2367 que resuelve el cast) · residuos `ZZ_TEST_DSUB_` / `@e2e-tsk-001-5.test` = 0 · convocatorias huérfanas = 57.
  - **Mutaciones (unitaria `protocol.entity.orm.spec.ts` y E2E `protocol-draft-submit`; cada una revertida editando y comprobada con `cmp`):**

    | Mutación | Prueba que falla | Resultado |
    |---|---|---|
    | M1 quitar la rama del 9 | unit: recepción 9, versión 1 → BORRADOR · E2E: POST /api/protocols responde receptionStatus BORRADOR · GET /protocols/mis-protocolos devuelve receptionStatus BORRADOR | unit 1 failed, 12 passed · E2E 2 failed, 21 passed |
    | M2 `BORRADOR` también para 9 con versión > 1 | unit: recepción 9, versión 2 → EVALUACION_SUBSANACIONES | unit 1 failed, 12 passed · E2E 0 failed (no hay caso E2E de versión 2) |
    | M3 `BORRADOR` también para 15 | unit: recepción 15, versión 1 → EN_REVISION_SECRETARIA · recepción 15, versión 2 → EN_REVISION_SECRETARIA · E2E: después de submit, mis-protocolos devuelve receptionStatus EN_REVISION_SECRETARIA (ya no BORRADOR) | unit 2 failed, 11 passed · E2E 1 failed, 22 passed |
    | M4 quitar la condición de versión 1 | unit: recepción 9, versión 2 → EVALUACION_SUBSANACIONES | unit 1 failed, 12 passed · E2E 0 failed |

  - **Dependencia del frontend (tarea en el repo del frontend):** el valor nuevo `BORRADOR` llega en `receptionStatus`. Ya existe: alias `BORRADOR → INICIADO` (`estado.alias.ts:5`), `ProtocolStatus.BORRADOR` y `EstadoProtocolo.BORRADOR`, etiqueta «Borrador» (`protocol-workspace.component.ts:732`, `dashboard-home.page.ts:599`), botón «Completar / Editar» para `BORRADOR` (`detalle-protocolo.page.ts:194-205`) y `estado: p.receptionStatus` en `protocolo.service.ts:312, 364, 392`. Falta: verificar en pantalla que el borrador ya no se muestra como «requiere subsanación» (antes llegaba `PENDIENTE_SUBSANACION`, que `estado.alias.ts:10` traduce a `REQUIERE_SUBSANACION_DOC`) y que `mis-protocolos` no ofrece «Subir correcciones» a un borrador.
  - **Hallazgos para tareas aparte (no se arreglaron):** (a) el getter devuelve `'ARCHIVADO'` para 12, que no está en `ReceptionStatus` · (b) frontend `subsanacion.page.ts:1124-1129` filtra `GET /reception/protocols` por `EVALUACION_SUBSANACIONES`, y desde TSK-001.5 esa bandeja ya no recibe el 9: revisar si esa pantalla dejó de mostrar protocolos · (c) sugerencia: mover la regla del getter a una función de dominio pura.

- [ ] **TSK-001.8**: Título con trim y entre 20 y 200 caracteres (RF-02.2, HU-002 1)
  - **Requisitos cubiertos:** `RF-02.2`
  - **Archivos:** MODIFICAR `src/modules/protocols/application/dtos/create-protocol.dto.ts` · CREAR `src/modules/protocols/application/dtos/create-protocol.dto.spec.ts` · casos E2E en `test/protocol-draft-submit.e2e-spec.ts`.
  - **Pruebas:** unitarias con `plainToInstance` + `validate`: 19 caracteres → error; 20 → válido; 200 → válido; 201 → error; `"   " + 19 caracteres + "   "` → error; `"  " + 20 caracteres + "  "` → válido y guardado sin espacios; solo espacios → error; no string → error. E2E: `POST /protocols` con título corto → 400 con mensaje en español; con espacios alrededor → 201 y `title` recortado en la respuesta y en la base.
  - **Mutaciones:** (M1) sin `@Transform` (trim) · (M2) `@Length(20, 1000)` · (M3) sin `@Length` (código actual: solo `@IsNotEmpty`).
  - **Edición (spec v3.6.1, pendiente 16 cerrado):** hoy no hay endpoint ni DTO de edición del protocolo en el backend (verificado el 09/11/2026: sin `@Put`/`@Patch` en `protocol.controller.ts`, sin `UpdateProtocolDto`), así que esta tarea no tiene nada más que tocar. Si una tarea futura crea un DTO de edición con `title`, debe reutilizar esta misma validación (no duplicarla) y probar los mismos bordes.
  - **Hecho cuando:** pruebas y mutaciones como arriba; la regla del frontend va en su propia tarea del repo del frontend.

- [ ] **TSK-001.9**: `PROTOCOL_CREATED` con `registro_id` y sin cédulas ni teléfonos (RF-02.6)
  - **Requisitos cubiertos:** `RF-02.6 a–b`
  - **Archivos:** MODIFICAR `src/shared/interceptors/audit.interceptor.ts`, `src/modules/protocols/infrastructure/controllers/protocol.controller.ts` (solo el handler `create`, para dejar `request.auditDetails` saneado) · función pura de saneo: buscar antes equivalentes; archivo nuevo solo si se reporta · CREAR `test/protocol-created-audit.e2e-spec.ts`.
  - **Pruebas:** primero una E2E que reproduce el fallo (fila `PROTOCOL_CREATED` con `registro_id` NULL) · después: `registro_id` = id del protocolo creado; `datos_nuevos` sin `identification`, `phone` ni `sponsorPhone` en ningún nivel (también dentro de `investigators`), con el resto de campos · `PROTOCOL_SUBMITTED` y `DOCUMENT_UPLOADED` siguen con su `registro_id` · unitarias de la función de saneo.
  - **Mutaciones:** (M1) volver a `data?.id` (código actual) · (M2) `auditDetails` = `request.body` sin sanear (código actual) · (M3) sanear solo el primer nivel (deja las cédulas de `investigators`).
  - **Hecho cuando:** pruebas y mutaciones como arriba y la causa confirmada queda escrita en las notas de la tarea.

- [ ] **TSK-001.10**: Catálogo: CONFIDENCIALIDAD, CONFLICTO_INTERES y ANEXO_5 obligatorios en EI e IO (RF-03.3)
  - **Requisitos cubiertos:** `RF-03.3 a–c`
  - **Archivos:** CREAR `src/migrations/1920000000000-RequisitosObligatoriosEiIo.ts` (timestamp a confirmar; por `codigo_anexo`, aborta si falta un código o su relación EI/IO; `down()` restaura las condiciones anteriores por código) · CREAR `test/requirements-by-type.e2e-spec.ts`.
  - **Pruebas:** E2E: crear EI sin marcas → 10 requisitos (lista exacta de RF-03.3); IO sin marcas → 9; EI con población indígena → 12; IO con población indígena → 11; EC sin cambios frente a antes · el checklist de un protocolo `ZZ_TEST_` creado antes de la migración no cambia · migración up/down/up en `ceish_test_db` con conteos antes y después · la migración no usa ids (revisión del archivo).
  - **Mutaciones:** (M1) dejar `CONFIDENCIALIDAD` con `["muestras","vulnerable"]` (catálogo actual) → EI 9 / IO 8 · (M2) actualizar solo EI → IO sin marcas sigue en 6 · (M3) `UPDATE` por id en lugar de por código con un id distinto en `ceish_test_db` (si no se puede reproducir, «no detectable: <razón>»).
  - **Hecho cuando:** la migración corre en `ceish_test_db` (en `ceish_db` la aplica el usuario), pruebas y mutaciones como arriba. La reconstrucción del catálogo en una base nueva va en TSK-001.13.

- [ ] **TSK-001.11** *(para después, con el rediseño del frontend)*: Ciclo del borrador (RF-02.7)
  - **Requisitos cubiertos:** `RF-02.7 a–d`
  - **Alcance (pendiente 14 cerrado el 09/11/2026; precisado en spec v3.7.2):** todo aplica **solo a la versión 1 con su recepción en 9**; una versión > 1 en 9 es una subsanación en curso y no se elimina, no cuenta como borrador abierto ni se puede descartar. Eliminación automática a los 8 días de calendario desde la creación sin envío (`eliminado_en` + borrado de archivos en R2), fecha de eliminación en las respuestas del borrador para mostrarla en pantalla, un solo borrador abierto por investigador (rechazo en `POST /protocols`), «Descartar borrador». Sin avisos por correo.
  - **Dependencias:** TSK-001.5 (borrador = recepción en 9), rediseño del frontend (pantalla con la fecha de eliminación y botón «Descartar»).
  - **Archivos:** se definen con el diseño del frontend; los nuevos se listan aquí con Acción CREAR antes de implementar.
  - **Pruebas y mutaciones (previstas):** reloj forzado (`jest.useFakeTimers` o `NOW()` simulado) en los días 7, 8 y 9 de calendario, incluido un borrador creado a las 23:30 de Ecuador (borde de día en America/Guayaquil); la fecha de eliminación de la respuesta coincide con la del job; editar el borrador no mueve la fecha; segundo borrador rechazado; descartar borra el protocolo y sus archivos (almacenamiento simulado en unitarias); mutaciones: sin filtro de estado 9 (borraría protocolos enviados), sin la condición de versión 1 (borraría una subsanación de versión en curso), sin `eliminado_en IS NULL` en el conteo de borradores, borrado físico en lugar de soft delete, días laborables en lugar de calendario, contar desde la última modificación.
  - **Hecho cuando:** el frontend tiene el flujo y las pruebas y mutaciones pasan como en las demás tareas.

- [ ] **TSK-001.12** *(pendiente de confirmar con la Secretaría, jueves 12/11/2026)*: Tesis, requisitos de riesgo mayor y formatos descargables
  - **Requisitos cubiertos:** pendientes 11 (tesis: informe antiplagio, oficio del tutor, bandera «es tesis»; relación con RF-19.1), 15 (`POLIZA_RC` e `IDONEIDAD_INST` con `riesgoMayor`) y 18 (formatos oficiales en Configuración, descarga uno por uno y en ZIP; RF-18.1).
  - **Hecho cuando:** la Secretaría confirma cada punto, el spec se actualiza con RF y criterios EARS, y cada punto se divide en su propia TSK con archivos, pruebas y mutaciones. No se implementa nada antes.

- [ ] **TSK-001.13** *(aparte; no se implementa en esta rama)*: Reconstrucción del catálogo de requisitos por `codigo_anexo` en una base nueva (RF-03.3, pendiente 17 cerrado el 09/11/2026)
  - **Requisitos cubiertos:** `RF-03.3` (nota del catálogo), `RF-03.1`
  - **Problema:** `1778800000000-SeedTiposDocumento` inserta por `nombre` con el id de la secuencia, y `1778850000000-ForceDocumentCodesById` y `1778870000000-FixAllDocumentCodes` escriben `codigo_anexo` por `id`; en una base nueva (con `script.sql`, sin filas previas) los códigos no quedan como en `ceish_db` (19 ANEXO_1 … 45 APROB_ORIGEN). Análisis estático del 09/11/2026; no ejecutado en una base nueva.
  - **Archivos:** CREAR una migración nueva (nombre y timestamp al implementar, después de la de TSK-001.10) · CREAR una E2E o script de verificación que levante una base vacía (nombre a definir; si hace falta otro archivo, se reporta antes). Las migraciones viejas no se modifican.
  - **Cambio:** deja `catalogos.tipos_documento` (código, nombre, tipos de estudio, `condicion_json`, `es_obligatorio`) y `catalogos.tipo_documento_estudio` como en `ceish_db` después de TSK-001.10, identificando cada fila por `codigo_anexo` (inserta si falta, actualiza si existe); idempotente; en `ceish_db` no cambia nada.
  - **Pruebas:** base vacía + `script.sql` + todas las migraciones → mismo conjunto de (código, tipos, condiciones, obligatoriedad) que `ceish_db` y mismos conteos de RF-03.3 (EI 10, IO 9, con indígena 12 y 11) · correrla dos veces no cambia nada · en `ceish_test_db` no cambia ninguna fila.
  - **Mutaciones:** (M1) actualizar por id (como 1778870000000) · (M2) omitir la relación en `tipo_documento_estudio` de un código · (M3) quitar la idempotencia (insert sin comprobar).
  - **Hecho cuando:** la comparación con `ceish_db` da 0 diferencias en la base nueva, pruebas y mutaciones como en las demás tareas.

- [ ] **TSK-001.14**: Edición del borrador con `PATCH /protocols/:id` (RF-02.8, HU-002 5)
  - **Requisitos cubiertos:** `RF-02.8 a–g`
  - **Dependencias:** TSK-001.5 (borrador = recepción en 9), TSK-001.8 (validación del título, se reutiliza), TSK-001.9 (saneo de `datos_nuevos`, se reutiliza para `PROTOCOL_UPDATED`). **Frontend:** tarea en el repo del frontend para cambiar `PUT /protocols/:id` por `PATCH` en `protocolo.service.ts:472-476` y permitir la edición solo en borrador (`editar-protocolo.page.ts`); hasta entonces la pantalla sigue fallando.
  - **Archivos:**
    - MODIFICAR `src/modules/protocols/infrastructure/controllers/protocol.controller.ts` (handler `@Patch(':id')` con `@Audit('PROTOCOL_UPDATED')`)
    - MODIFICAR `src/modules/protocols/application/services/protocols.service.ts` (`update`: propiedad, estado 9, transacción, recálculo y conciliación del checklist)
    - CREAR `src/modules/protocols/application/dtos/update-protocol.dto.ts` (derivado de `CreateProtocolDto`, sin `principalInvestigatorId` ni `isAffidavitAccepted`) y `update-protocol.dto.spec.ts`
    - CREAR `test/protocol-edit-draft.e2e-spec.ts`
    - Antes de crear: Grep de `UpdateProtocolDto`, `PartialType`, `OmitType` y de una función de conciliación de checklist ya existente.
  - **Pruebas:** unitarias del DTO (título con los bordes de TSK-001.8, indicadores no booleanos → error, `riskLevelId` → rechazado por el pipe global, `principalInvestigatorId` → rechazado) · E2E: el investigador principal edita el borrador → 200 y cambios guardados · otro investigador → rechazo sin cambios · recepción en 15 y en 10 → 409 con mensaje en español, sin cambios · cambio de IO a EI sin marcas → el checklist pasa de 9 a 10 requisitos y el documento ya subido de un requisito que sigue aplicando conserva su estado y su `requisito_id` · desmarcar población indígena con documento subido en `TRADUCCION_ANCESTRAL` → ese requisito queda `NO_APLICA` y el documento y su archivo siguen (RF-02.8 f) · volver a marcarla → el requisito recupera su estado con el mismo documento · requisito sin documento que deja de aplicar → se quita · `fecha_recepcion` sigue NULL y `creado_en` no cambia · fila `PROTOCOL_UPDATED` con `registro_id` y sin cédulas ni teléfonos · un fallo a mitad del recálculo no deja cambios parciales (transacción).
  - **Mutaciones:** (M1) sin la comprobación del estado 9 · (M2) sin la comprobación de investigador principal · (M3) recalcular borrando y recreando todo el checklist (pierde `requisito_id` y estados) · (M4) borrar el documento del requisito que deja de aplicar · (M5) no recalcular cuando solo cambia un indicador · (M6) DTO sin la validación de título.
  - **Hecho cuando:** las pruebas nuevas y las existentes pasan dos veces seguidas, cada mutación es detectada, `tsc` sin errores, eslint de los archivos tocados sin empeorar frente a `dev`, y la tarea del frontend queda anotada como dependencia abierta.

---

### Módulo: Evaluaciones y Cuotas por Perfil (`evaluations`)

- [ ] **TSK-12.1**: Implementar la entidad y DTO para asignación de evaluadores con su rol/perfil profesional (`ETICA_METODOLOGICO_SALUD`, `JURIDICO`, `SOCIEDAD_CIVIL`).
  - **Requisitos cubiertos:** `RF-12.1`
  - **Hecho cuando:** La entidad `EvaluationAssignmentOrmEntity` almacena `evaluatorRole` y las validaciones DTO rechazan roles inválidos.

- [ ] **TSK-12.2**: Implementar el servicio de dominio `QuotaValidatorService` para verificar cuotas de evaluadores por protocolo.
  - **Requisitos cubiertos:** `RF-12.1`
  - **Hecho cuando:** La función de validación retorna `false` o lanza un error explicativo en español cuando se intenta asignar un 2do evaluador de cualquier perfil (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO`, `SALUD`) al mismo protocolo.

- [ ] **TSK-12.3**: Crear las pruebas unitarias en `src/modules/evaluations/domain/services/quota-validator.service.spec.ts`.
  - **Requisitos cubiertos:** `RF-12.1`
  - **Hecho cuando:** `npm test` ejecuta los casos de prueba probando asignaciones válidas (1 Jurídico, 1 Sociedad Civil, 1 Metodológico, 1 Salud) y rechaza combinaciones excedidas o incompletas.

- [ ] **TSK-13.1**: Extender la entidad `ChecklistItemOrmEntity` para soportar campo de observación multilínea (`observationText`).
  - **Requisitos cubiertos:** `RF-13.1`, `RF-18.3`
  - **Hecho cuando:** La columna `observation_text` en la DB acepte texto multilínea sin scroll perezoso ni truncamiento.

- [ ] **TSK-13.2**: Crear endpoint de auditoría documental por ítem de checklist (`PATCH /api/reception/checklist/:id/audit`).
  - **Requisitos cubiertos:** `RF-13.1`, `RF-05.1`
  - **Hecho cuando:** La Secretaria envía un estado `OBSERVED` junto a su `observationText` y el backend actualiza el ítem y consolida las observaciones.

---

### Módulo: Control Multiversión y Ciclo de Vida (`protocols`)

- [ ] **TSK-14.1**: Crear el servicio de migración de versión `VersioningService` (v1.0 ➔ v2.0 ➔ v3.0).
  - **Requisitos cubiertos:** `RF-14.1`
  - **Hecho cuando:** Al invocarse con un dictamen de "Aprobado con Observaciones" (`resolutionTypeId: 2`), congela la versión actual y crea la v2.0.

- [ ] **TSK-14.2**: Implementar la herencia de requisitos inmutables en `ChecklistService`.
  - **Requisitos cubiertos:** `RF-14.1`, `RF-04.2`
  - **Hecho cuando:** Los requisitos previamente calificados como `APPROVED` mantengan `isLocked = true` en v2.0 y los observados cambien a `NO_PRESENTADO` para re-subida.

- [ ] **TSK-14.3**: Integrar el cálculo de `plazo_condicion_dias` días hábiles en `VersioningService`.
  - **Requisitos cubiertos:** `RF-14.1`, `RF-07.1`
  - **Hecho cuando:** Invocación a `BusinessDayCalculator.calculateDeadline` con `plazo_condicion_dias` (inicial 30 días hábiles) asignando `correctionDeadlineDate`.

---

### Módulo: Seguimiento Post-Aprobación, Avance y Cierre (`follow-up`)

- [ ] **TSK-15.1**: Crear entidad y migraciones para la agenda de entregables (`FollowUpScheduleOrmEntity`).
  - **Requisitos cubiertos:** `RF-15.1`
  - **Hecho cuando:** Se registren automáticamente los hitos de entrega periódica (semestral/anual) e Informe Final al aprobar la versión final del protocolo.

- [ ] **TSK-15.2**: Crear comando CLI `npm run cli:notify-deliverables` para alertas preventivas de entrega.
  - **Requisitos cubiertos:** `RF-15.1`
  - **Hecho cuando:** La ejecución del comando identifique los informes con vencimiento próximo y despache los correos de recordatorio al Investigador Principal.

- [ ] **TSK-16.1**: Implementar endpoint para la recepción de solicitudes de Enmienda (`POST /api/follow-up/amendments`).
  - **Requisitos cubiertos:** `RF-16.1`
  - **Hecho cuando:** El Investigador envíe el documento de cambios justificados y el sistema registre la solicitud en estado `SEGUIMIENTO_ENMIENDAS`.

- [ ] **TSK-16.2**: Implementar el servicio de Alerta Roja por Evento Adverso Grave (EAG) (`POST /api/follow-up/adverse-events`).
  - **Requisitos cubiertos:** `RF-16.1`
  - **Hecho cuando:** Al registrar un EAG, el sistema genere un log de urgencia y notifique por correo prioritario (alerta roja) al Presidente y Secretaria en un plazo no mayor a 24-48h.

- [ ] **TSK-17.1**: Implementar endpoint de Suspensión / Revocatoria ética del Pleno (`POST /api/resolutions/suspend`).
  - **Requisitos cubiertos:** `RF-17.1`
  - **Hecho cuando:** El Pleno cambie el estado del protocolo a `SUSPENDIDO` o `REVOCADO`, inhabilitando la carga de nuevos entregables y notificando por correo interno.

---

### Módulo: Usabilidad, Plantillas, Tesis, Anexos e Integración Quipux (`documents` / `reception` / `resolutions`)

- [ ] **TSK-18.1**: Extender el catálogo de requisitos para retornar `downloadTemplateUrl`.
  - **Requisitos cubiertos:** `RF-18.1`
  - **Hecho cuando:** `GET /api/reception/requirements` retorne la URL de descarga del formato oficial Word/PDF para cada Anexo.

- [ ] **TSK-18.2**: Configurar enlaces Deep-Linking en notificaciones por correo.
  - **Requisitos cubiertos:** `RF-18.2`
  - **Hecho cuando:** El cuerpo del correo de recepción contenga el enlace que redirige directamente a la pantalla de Aceptación Explícita de Plazos de ese protocolo (`/protocols/:id/explicit-acceptance`).

- [ ] **TSK-19.1**: Inyectar requisitos de Tesis de Grado/Posgrado en `ChecklistService`.
  - **Requisitos cubiertos:** `RF-19.1`
  - **Hecho cuando:** Si `isThesis = true`, el checklist incluya automáticamente los ítems obligatorios: *Acta de Aprobación de Tema* y *Certificado del Director de Tesis*.

- [ ] **TSK-19.2**: Permitir la subida de Informe Narrativo de Evaluador en `POST /api/evaluations/narrative-report`.
  - **Requisitos cubiertos:** `RF-19.2`
  - **Hecho cuando:** El Evaluador pueda subir su informe detallado (Word/PDF) junto a los dictámenes digitalizados de los Anexos 9 y 10.

- [ ] **TSK-19.3**: Añadir el campo de referencia Quipux en Convocatorias y Comunicados (`quipuxReferenceNumber`).
  - **Requisitos cubiertos:** `RF-19.3`
  - **Hecho cuando:** Al agendar una Convocatoria (`001-2026`), el campo opcional `quipuxReferenceNumber` se guarde en la DB y se imprima en la cabecera del PDF oficial.

---

## 🧪 Verificación Final de Tareas

- [ ] **TSK-V.1**: Ejecutar suite completa de linters y pruebas unitarias (`npm run lint` && `npm test`).
  - **Hecho cuando:** No existan errores de linting en TypeScript y los 16+ tests pasen limpiamente en 0 errores.
