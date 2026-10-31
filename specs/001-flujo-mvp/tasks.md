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
