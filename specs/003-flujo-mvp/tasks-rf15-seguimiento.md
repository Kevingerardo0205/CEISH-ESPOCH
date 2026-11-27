# Desglose de Tareas de Implementación (TDD): RF-15 Seguimiento Post-Aprobación, Anexo 18 y Anexo 8

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.4.1, HU-015, RF-15.1, RF-15.2)  
**Plan Técnico de Referencia:** `specs/003-flujo-mvp/plan-rf15-seguimiento.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/tasks-rf15-seguimiento.md`  
**Metodología:** TDD Estricto (Test Red ➔ Implementation Green ➔ Refactor), Arquitectura Hexagonal.

---

## Leyenda de Notaciones
- `[P]`: Tarea ejecutable en paralelo con otras del mismo bloque (sin dependencias cruzadas).
- `EARS 1`: Pre-llenado de agenda (Inicio 30 días, Avances, Renovación 60 días antes, Cierre 60 días) y edición libre por Presidencia.
- `EARS 2`: Recepción de Anexo 18 (Avances) y Anexo 8 (Cierre Final).
- `EARS 3`: Alertas preventivas parametrizadas según RF-ALR (`alerta_offsets_dias` [7, 1] para hitos generales; `alerta_renovacion_offsets_dias` [90, 60, 15] para renovación) y cambio a `VENCIDO`/`SUSPENDIDO` con 30 días de gracia.

---

## Fase 1: Setup y Estructura Base

### Task T001 [P]
- **Descripción**: Crear directorios hexagonales para el módulo de seguimiento `follow-up`.
- **Archivos Afectados**:
  - `src/modules/follow-up/domain/entities/`
  - `src/modules/follow-up/application/dtos/`
  - `src/modules/follow-up/application/services/`
  - `src/modules/follow-up/infrastructure/controllers/`
- **Dependencias**: Ninguna
- **Cobertura Plan**: Sección 2 (Estructura de Módulos)

### Task T002 [P]
- **Descripción**: Definir la entidad ORM `AgendaEntregableOrmEntity` (`seguimiento.agenda_entregables`).
- **Archivos Afectados**: `src/modules/follow-up/infrastructure/database/entities/agenda-entregable.orm-entity.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 2 (Entidades ORM Afectadas), `EARS 1`

### Task T003 [P]
- **Descripción**: Definir la entidad ORM `InformeSeguimientoOrmEntity` (`seguimiento.informes_seguimiento`).
- **Archivos Afectados**: `src/modules/follow-up/infrastructure/database/entities/informe-seguimiento.orm-entity.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 2 (Entidades ORM Afectadas), `EARS 2`

---

## Fase 2: Tests Unitarios de Dominio (TDD Red)

### Task T004 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para la generación de la agenda sugerida por defecto al aprobar un protocolo (Informe de Inicio a 30 días, Avances, Renovación a 60 días antes, Cierre Anexo 8 a 60 días).
- **Archivos Afectados**: `src/modules/follow-up/application/services/generate-schedule.use-case.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmo A.1), `EARS 1`

### Task T005 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para la personalización de la agenda por la Presidencia.
- **Archivos Afectados**: `src/modules/follow-up/application/services/update-schedule.use-case.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmo A.2), `EARS 1`

### Task T006 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para la recepción de entregables oficiales (Anexo 18 para avances y Anexo 8 para cierre).
- **Archivos Afectados**: `src/modules/follow-up/application/services/process-deliverable.use-case.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmos), `EARS 2`

### Task T007 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para la auditoría de alertas preventivas por hito según RF-ALR (`alerta_offsets_dias` [7, 1] para hitos generales; `alerta_renovacion_offsets_dias` [90, 60, 15] para renovación) y el paso a `VENCIDO`/`SUSPENDIDO` con activación del contador de 30 días de gracia.
- **Archivos Afectados**: `src/modules/follow-up/application/services/audit-deliverable-grace.service.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmos B y C), `EARS 3`

---

## Fase 3: Core y Lógica de Dominio (TDD Green)

### Task T008
- **Descripción**: Implementar `GenerateScheduleUseCase` respondiendo a la prueba T004 (pre-cálculo de fechas por defecto).
- **Archivos Afectados**: `src/modules/follow-up/application/services/generate-schedule.use-case.ts`
- **Dependencias**: T004
- **Cobertura Plan**: Sección 4 (Algoritmo A.1), `EARS 1`

### Task T009
- **Descripción**: Implementar `UpdateScheduleUseCase` respondiendo a la prueba T005 (edición manual de la Presidencia).
- **Archivos Afectados**: `src/modules/follow-up/application/services/update-schedule.use-case.ts`
- **Dependencias**: T005
- **Cobertura Plan**: Sección 4 (Algoritmo A.2), `EARS 1`

### Task T010
- **Descripción**: Implementar `ProcessDeliverableUseCase` respondiendo a la prueba T006 (validación de Anexo 18 vs Anexo 8 y cambio de estado a `ENTREGADO`).
- **Archivos Afectados**: `src/modules/follow-up/application/services/process-deliverable.use-case.ts`
- **Dependencias**: T006
- **Cobertura Plan**: Sección 4, `EARS 2`

### Task T011
- **Descripción**: Implementar `AuditDeliverableGraceService` respondiendo a la prueba T007 (alertas preventivas, paso a `VENCIDO`/`SUSPENDIDO`, 30 días de gracia y revocatoria si expira la gracia).
- **Archivos Afectados**: `src/modules/follow-up/application/services/audit-deliverable-grace.service.ts`
- **Dependencias**: T007
- **Cobertura Plan**: Sección 4 (Algoritmos B y C), `EARS 3`

---

## Fase 4: API REST, DTOs e Integración de Cron / Job

### Task T012 [P]
- **Descripción**: Crear DTO `ConfigureScheduleDto` para la edición de agenda por Presidencia.
- **Archivos Afectados**: `src/modules/follow-up/application/dtos/configure-schedule.dto.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 5 (Contrato API REST)

### Task T013 [P]
- **Descripción**: Crear DTO `SubmitReportDto` para la recepción de Anexo 18 / Anexo 8.
- **Archivos Afectados**: `src/modules/follow-up/application/dtos/submit-report.dto.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 5 (Contrato API REST)

### Task T014
- **Descripción**: Crear `FollowUpController` exponiendo `PUT /api/follow-up/protocols/:id/schedule` y `POST /api/follow-up/protocols/:id/deliverables/:deliverableId/submit`.
- **Archivos Afectados**: `src/modules/follow-up/infrastructure/controllers/follow-up.controller.ts`
- **Dependencias**: T008, T009, T010, T012, T013
- **Cobertura Plan**: Sección 5 (Contrato API REST)

### Task T015
- **Descripción**: Registrar el servicio de auditoría `AuditDeliverableGraceService` dentro de un Scheduler / Cron interno de NestJS en `FollowUpModule`.
- **Archivos Afectados**: `src/modules/follow-up/follow-up.module.ts`
- **Dependencias**: T011, T014
- **Cobertura Plan**: Sección 2 (Estructura de Módulos)

---

## Fase 5: Pruebas E2E y Verificación Obligatoria

### Task T016
- **Descripción**: Crear prueba E2E `follow-up.e2e-spec.ts` probando la edición de agenda por Presidencia, la recepción del Anexo 18 y el cambio a `VENCIDO` tras vencer la fecha límite.
- **Archivos Afectados**: `test/follow-up.e2e-spec.ts`
- **Dependencias**: T015
- **Cobertura Plan**: Sección 7 (Estrategia E2E), `EARS 1`, `EARS 2`, `EARS 3`

### Task T017
- **Descripción**: Verificación obligatoria de la Constitución: `npm test`, `npm run test:e2e`, `npm run lint` y `npm run format`.
- **Archivos Afectados**: Todo el proyecto.
- **Dependencias**: T016
- **Cobertura Plan**: Sección 7 (Definition of Done), Constitución del Proyecto

---

## Fase 6: Nuevas Tareas RF-ALR (Pendientes de código)

### Task TSK-015-N01 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N01`
- **Requisito Relacionado**: `RF-ALR`, `RF-15.2`
- **Criterio EARS**: `EARS 3`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/follow-up/application/services/audit-deliverable-grace.service.ts`
- **Dependencias**: `T011`
- **Descripción**: Conectar `AuditDeliverableGraceService` con el sistema centralizado de alertas RF-ALR: para hitos generales (INFORME_INICIO, INFORME_AVANCE, INFORME_FINAL_CIERRE) usar `alerta_offsets_dias` [7, 1]; para el hito `RENOVACION_AVAL` usar `alerta_renovacion_offsets_dias` [90, 60, 15]. Los offsets deben leerse desde la configuración del sistema, no estar hardcodeados. Usar `Intl.DateTimeFormat` con zona `America/Guayaquil` para comparaciones de fecha (nunca `.toISOString().split('T')[0]`).
- **Tests**: `audit-deliverable-grace.service.spec.ts`.
- **Criterio "Hecho cuando:"**: Tests confirman que un hito general dispara alertas a 7 y 1 días, y el hito de renovación dispara alertas a 90, 60 y 15 días, leyendo ambos parámetros desde configuración.

### Task TSK-015-N02 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N02`
- **Requisito Relacionado**: `RF-ALR`, `RF-16.1`
- **Criterio EARS**: `EARS 3`
- **Acción**: `CREAR`
- **Archivos Afectados**:
  - `src/modules/follow-up/application/services/renewal-alert.service.ts`
- **Dependencias**: `TSK-015-N01`
- **Descripción**: Implementar servicio dedicado `RenewalAlertService` que procesa los tres avisos de renovación definidos en `alerta_renovacion_offsets_dias` [90, 60, 15]: (i) aviso a 90 días — equivale al anterior "3 meses antes"; (ii) aviso a 60 días — fecha límite para presentar la solicitud; (iii) aviso a 15 días — recordatorio final. Notificar a Investigador y Secretaría en cada disparo. Ver RF-16.1 en `specs/001-flujo-mvp/spec.md` v3.3.1.
- **Tests**: `renewal-alert.service.spec.ts`.
- **Criterio "Hecho cuando:"**: Tests unitarios validan los tres avisos con los offsets del parámetro, la lista de destinatarios (Investigador + Secretaría) y que el aviso a 90 días reemplaza la lógica antigua de "3 meses antes".

### Task TSK-015-N03 - [x] COMPLETADO (PR-C1 feat/system-params)
- **ID Único**: `TSK-015-N03`
- **Requisito Relacionado**: `RF-ALR`, `RF-CAL`, `RF-12.7(c)`, `RF-12.7(d)`
- **Criterio EARS**: `EARS 3`
- **Acción**: `CREAR`
- **Archivos Afectados**:
  - Nuevo módulo o servicio dentro de `src/shared/` o `src/modules/system-params/`
  - Migración TypeORM nueva para la tabla `sistema.parametros_sistema`
- **Dependencias**: Ninguna (esta tarea es prerrequisito de `TSK-015-N01` y `TSK-015-N02` para offsets configurables, y de PR-C para feriados)
- **Descripción**: Crear la tabla `sistema.parametros_sistema` y su entidad/servicio en NestJS para almacenar parámetros configurables del sistema. Sembrar los valores iniciales derivados de las constantes en `deadline-rules.ts`.
  - **Hallazgo Paso 1 (b)**: No existe ninguna entidad, repositorio ni servicio para `sistema.parametros_sistema` en el código actual (búsqueda en `src/` sin resultados). Las tareas `TSK-015-N01` y `TSK-015-N02` que requieren leer offsets desde configuración quedan bloqueadas hasta que esta tarea esté completa.
  - Parámetros mínimos a sembrar: `alerta_offsets_dias` ([7, 1]), `alerta_renovacion_offsets_dias` ([90, 60, 15]), `plazo_gracia_seguimiento_dias` (30), `dias_max_sin_convocatoria` (8), `plazo_revision_oficio_dias` (8).
  - Feriados del Ecuador 2026: **Pendiente de verificar** — lista oficial de feriados a obtener de fuente autorizada (IESS/gobierno) antes de sembrar.
- **Tests**: Prueba unitaria del servicio de lectura de parámetros; verificación de migración (`up`/`down`).
- **Criterio "Hecho cuando:"**: `SystemParamsService.get(key)` retorna el valor sembrado para los parámetros numéricos; la tabla `sistema.parametros_sistema` existe con los 5 parámetros del flujo de evaluación: `plazo_subsanacion_documental_dias`, `plazo_revision_oficio_dias`, `entrega_evaluacion_dias_habiles_tras_reunion`, `evaluador_urgente_umbral_dias` (PR-C1) y `plazo_condicion_dias` (PR-C2). Los parámetros tipo array (`alerta_offsets_dias`, `alerta_renovacion_offsets_dias`) se difieren a `TSK-015-N01`, que extenderá el esquema de valor para soportar arrays.
- **Nota v1**: los cambios por BD requieren reiniciar el backend (caché en memoria); sin endpoint de edición ni recarga en vivo.

### Task TSK-015-N04 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N04`
- **Requisito Relacionado**: `RF-CAL`
- **PR**: PR-C6 (`feat/ecuador-holidays`)
- **Criterio EARS**: `EARS 3`
- **Acción**: `CREAR`
- **Archivos Afectados**:
  - `src/shared/services/ecuador-holidays.service.ts` (nuevo)
  - `src/shared/services/deadline-calculator.service.ts` (modificar para consumir feriados)
- **Dependencias**: `TSK-015-N03` (los feriados pueden almacenarse en `sistema.parametros_sistema` o en tabla dedicada)
- **Descripción**: Implementar una biblioteca interna de feriados de Ecuador que alimente `BusinessDayCalculator.calculateDeadlineDateString({ holidays })`. Requisitos: (i) sin acceso a internet en runtime; (ii) sin carga manual en cada despliegue; (iii) los feriados se almacenan como datos en BD (seeder en migración) o como constante estática en código.
  - **Hallazgo Paso 1 (e)**: `BusinessDayCalculator` ya acepta `holidays: string[]` pero siempre recibe `[]` (`deadline-calculator.service.ts`). La integración es mínima: proveer la lista de fechas.
  - **Fuente oficial de feriados Ecuador**: **Pendiente de verificar** — obtener lista oficial de feriados nacionales del Ecuador para años 2026+ desde fuente gubernamental (IESS, MRL u otra).
- **Tests**: Prueba unitaria con feriado conocido: si 2026-11-02 (Día de los Difuntos) es feriado y la fecha límite caería en ese día, el cálculo lo debe saltar.
- **Criterio "Hecho cuando:"**: `BusinessDayCalculator.calculateDeadlineDateString({ ..., holidays: ['2026-11-02'] })` salta el 2 de noviembre; la lista de feriados 2026 está sembrada y `EcuadorHolidaysService.getHolidays(year)` retorna el array correcto.

### Task TSK-015-N05 - [~] EN PROGRESO (PR-C1 y PR-C2 — C2 cableado parcial)
- **ID Único**: `TSK-015-N05`
- **Requisito Relacionado**: `RF-CAL` (spec-001), `RF-07.1`, `RF-09.1`, `RF-12.7`, `RF-14.1`, `RF-15`
- **PR**: PR-C1 (`feat/system-params`) y PR-C2 (`feat/system-params-followup`), dependiente de TSK-015-N03
- **Estado C1 (cableado):** `plazo_subsanacion_documental_dias`, `plazo_revision_oficio_dias`, `entrega_evaluacion_dias_habiles_tras_reunion`, `evaluador_urgente_umbral_dias` → cableados y funcionando con fallback. Email template recibe `plazo` dinámico.
- **Estado C2 (cableado):** `plazo_condicion_dias` → cableado en `ProtocolDeadlineService.getCondicionDias()` y consumido por `calculateSubsanacionDeadline()`, `resolutions.service.ts` y `evaluations.service.ts`. La constante `PLAZO_CONDICION_DIAS` ya no se usa directamente en el flujo canónico (queda solo en `deadline-rules.ts` como fallback y en `calls.service.ts` como deuda legacy).
- **Pendiente (PR independiente, sin asignación aún — plazos normativos):** `plazo_normativo_expedita_dias` y `plazo_normativo_pleno_dias` requieren un PR independiente: hay que retirar el getter `responseDeadline` del ORM entity `ProtocolOrmEntity` (lógica de negocio en infraestructura) y migrar sus llamadores, incluyendo `calls.service.ts` (actualmente fuera de límites). No está atado a C3, C4, C5 ni C6.
- **Pendiente C5 (alertas, seguimiento):** alertas (`alerta_offsets_dias`, `alerta_renovacion_offsets_dias`) y otros parámetros de seguimiento.
- **Nota sobre entrega de evaluación (RF-09.1):** La entrega es `reunión + 2 días hábiles a las 12:00 America/Guayaquil` para cualquier día de la semana, incluidas reuniones extraordinarias. Los feriados quedan excluidos del cálculo hasta `TSK-015-N04`.
- **Criterio EARS**: Cuando `SystemParamsService` esté disponible, las constantes parametrizables de `deadline-rules.ts` se leen desde `sistema.parametros_sistema` con fallback al valor hardcodeado.
- **Acción**: `MODIFICAR`
- **Descripción**: Definir cuáles constantes de `deadline-rules.ts` son parametrizables vía BD y cuáles permanecen como constantes estáticas en código.
  - **Parametrizables (leer de BD via `SystemParamsService`, fallback al valor actual):**
    - `plazo_subsanacion_documental_dias` = 30 (RF-07.1 / RF-13) — fallback: `PLAZO_SUBSANACION_DOCUMENTAL_DIAS` ✅ C1
    - `plazo_condicion_dias` = 30 (RF-14.1) — fallback: `PLAZO_CONDICION_DIAS` ✅ C2
    - `plazo_revision_oficio_dias` = 8 (RF-12.7(c)) — fallback: `PLAZO_REVISION_OFICIO_DIAS` ✅ C1
    - `plazo_normativo_expedita_dias` = 45 (RF-CAL) — fallback: `PLAZO_NORMATIVO_EXPEDITA_DIAS` 🔲 PR independiente (sin asignación aún)
    - `plazo_normativo_pleno_dias` = 60 (RF-CAL) — fallback: `PLAZO_NORMATIVO_PLENO_DIAS` 🔲 PR independiente (sin asignación aún)
    - `entrega_evaluacion_dias_habiles_tras_reunion` = 2 (RF-09.1) — fallback: `ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION` ✅ C1
    - `evaluador_urgente_umbral_dias` = 2 (RF-09.1) — valor provisional, **pendiente de confirmar con presidente/secretaria** — fallback: `EVALUADOR_URGENTE_UMBRAL_DIAS` ✅ C1
    - `alerta_offsets_dias` = [7, 1] (RF-ALR) 🔲 C5 (TSK-015-N01, requiere soporte array)
    - `alerta_renovacion_offsets_dias` = [90, 60, 15] (RF-16.1) 🔲 C5 (TSK-015-N01, requiere soporte array)
    - `plazo_gracia_seguimiento_dias` = 30 (RF-15.2) — fallback: `PLAZO_GRACIA_SEGUIMIENTO_DIAS` 🔲 C5
    - `plazo_informe_inicio_dias` = 30 (RF-15.1) — fallback: `PLAZO_INFORME_INICIO_DIAS` 🔲 C5
    - `dias_max_sin_convocatoria` = 8 (RF-12.7(d)) — fallback: `DIAS_MAX_SIN_CONVOCATORIA` 🔲 C4
    - **`DIAS_ALERTA_NORMATIVO_SIN_CONVOCATORIA`**: sin valor definido aún — **parametrizable, valor pendiente de confirmación con presidente/secretaria** 🔲 C4
    - **Plazo OBSERVADO (estado RF-15.2)**: 30 días hábiles (decisión del proyecto; el PET dice "no mayor a treinta días" sin precisar hábiles; confirmar con la secretaria). Clave prevista: `plazo_observaciones_seguimiento_dias`. A sembrar y cablear en C5. **No sembrar en C2.**
  - **No parametrizables (constantes de diseño fijas en código):**
    - `ENTREGA_EVALUACION_HORA_CORTE = '12:00'` — parte del protocolo de entrega, cambiar requeriría coordinación con frontend.
    - `ENTREGA_EVALUACION_ZONA_HORARIA = 'America/Guayaquil'` — constante geográfica institucional.
- **Dependencias**: `TSK-015-N03` (SystemParamsService debe existir primero)
- **Archivos afectados:**
  - `src/shared/deadlines/deadline-rules.ts` — los valores hardcodeados pasan a ser fallback.
  - Servicios que usen las constantes parametrizables — inyectar `SystemParamsService` donde sea necesario.
- **Tests**: Prueba unitaria: si `SystemParamsService.get('plazo_subsanacion_documental_dias')` retorna `20`, el servicio usa `20`; si retorna `null`, usa el fallback `30`. Ídem para `plazo_condicion_dias`.
- **Criterio "Hecho cuando:"**: Al menos las constantes listadas se leen desde BD en runtime; la prueba de fallback pasa en verde; `npx tsc --noEmit` limpio.

### Task TSK-015-N06 - [x] COMPLETADO (rama feat/rf-alr-f-pendientes)
- **ID Único**: `TSK-015-N06`
- **Requisito Relacionado**: `RF-ALR.f` (spec-003 v1.5.2, RF-ALR.f.1 a f.6), `RF-EST.1` (spec-001, `resolveProtocolStage`)
- **Criterio EARS**: **Cuando** la Secretaría consulte `GET /api/secretaria/pendientes`, **el sistema debe** devolver en una sola consulta sus pendientes VALIDAR, ASIGNAR y REASIGNAR, con `estadoPlazo` calculado en America/Guayaquil, ordenados con los vencidos primero y con los totales por grupo.
- **Acción**: `CREAR` (módulo nuevo) y `MODIFICAR` (`AppModule`)
- **Archivos Afectados**:
  - CREAR `src/modules/secretaria/secretaria.module.ts`
  - CREAR `src/modules/secretaria/domain/pending-item.ts` — enums `PendingAction`, `DeadlineGroup` y tipos de fila
  - CREAR `src/modules/secretaria/domain/services/classify-deadline.ts` — clasificación de `estadoPlazo` y domingo de la semana en Ecuador (usa `toCalendarDateString` de `deadline-calculator.service.ts`)
  - CREAR `src/modules/secretaria/domain/services/classify-deadline.spec.ts`
  - CREAR `src/modules/secretaria/domain/ports/pending-items.repository.port.ts`
  - CREAR `src/modules/secretaria/application/services/pending-items.service.ts` — etapa con `resolveProtocolStage`, orden, filtro y totales
  - CREAR `src/modules/secretaria/application/services/pending-items.service.spec.ts`
  - CREAR `src/modules/secretaria/application/dtos/pending-items-query.dto.ts` — `filtro` con `@IsOptional` + `@IsIn`
  - CREAR `src/modules/secretaria/application/dtos/pending-items-response.dto.ts`
  - CREAR `src/modules/secretaria/infrastructure/repositories/pending-items.typeorm.repository.ts` — una consulta SQL parametrizada con CTEs y `UNION ALL`
  - CREAR `src/modules/secretaria/infrastructure/controllers/secretaria.controller.ts` — `@Roles(SECRETARIA)` + `@Permissions(DASHBOARD_VENCIMIENTOS)`
  - CREAR `test/secretaria-pendientes.e2e-spec.ts`
  - MODIFICAR `src/app.module.ts` — registrar `SecretariaModule`
- **Dependencias**: TSK-001.2 (`resolveProtocolStage`), TSK-002-N44 (`fecha_limite_ts` al agendar)
- **Descripción**: Vista unificada de pendientes de la Secretaría según RF-ALR.f.1–f.5. Sin migraciones. Las filas a) y b) llevan `fechaPlazo = null` y `estadoPlazo = SIN_PLAZO`; la fila c) usa el plazo vencido más antiguo del protocolo. No se implementan las filas de RF-ALR.f.6.
- **Tests**:
  - Unitarias: clasificación de `estadoPlazo` (plazo que ya pasó hoy, vence hoy más tarde, domingo de la semana, lunes siguiente, sin plazo, 23:30 en Ecuador cuando en UTC ya es el día siguiente); orden, filtro y totales del servicio.
  - E2E `test/secretaria-pendientes.e2e-spec.ts` con login real (`secretaria@test.com`, `presidente@test.com`; la contraseña se lee de `E2E_TEST_ACCOUNTS_PASSWORD`): filas a/b/c, exclusiones, filtros, totales, 400, 401 y 403 para PRESIDENTE. Datos con prefijo `ZZ_TEST_PEND_`, borrados en `beforeAll` y `afterAll` (residuos = 0).
- **Criterio "Hecho cuando:"**: tsc, `nest build`, unitarias y E2E (suite nueva 2 veces seguidas y la corrida completa con `--runInBand`) en verde; eslint limpio en los archivos tocados; mutaciones de cada regla detectadas.
- **Resultados (04/11/2026, commits `e668979` docs, `243cb8e` código, `b1702a0` timeout de PDF real)**:
  - `npx tsc --noEmit`: sin errores. `npx eslint` sobre los archivos tocados: sin errores. `nest build`: 370 archivos compilados.
  - Unitarias: 59 suites / 509 pruebas antes → 61 suites / 530 pruebas después, todas en verde (+21 del módulo `secretaria`).
  - E2E `test/secretaria-pendientes.e2e-spec.ts`: 25/25 en dos corridas seguidas.
  - E2E completa (`--runInBand`), dos corridas seguidas tras `b1702a0`: 17 suites / 279 pruebas en verde las dos veces.
  - `ceish_test_db`: residuos de la suite nueva = 0 (protocolos, versiones, convocatorias, usuarios y asignaciones huérfanas); convocatorias huérfanas = 57, sin cambio.
  - Mutaciones: 12 de 12 detectadas.

    | Mutación | Prueba que falla | Tests |
    |---|---|---|
    | M1 a) `IN ($4, 9)` | excluye VAL_INICIADO · totales | 2 failed, 23 passed |
    | M2 b) sin `sometimiento_tiempos_aceptado` | excluye ASIG_SIN_ACEPTACION · totales | 2 failed, 23 passed |
    | M3 c) sin `estado_id = 6` | fila REASIGNAR · excluye REAS_COMPLETADA · totales | 3 failed, 22 passed |
    | M4 c) sin exigir convocatoria | excluye REAS_SIN_CONV · excluye REAS_CANCELADA · totales | 3 failed, 22 passed |
    | M5 c) sin excluir CANCELADA | excluye REAS_CANCELADA · totales | 2 failed, 23 passed |
    | M6 c) `MAX` en vez de `MIN` | fila REASIGNAR | 1 failed, 24 passed |
    | M7 c) fin del día en UTC | fila REASIGNAR | 1 failed, 24 passed |
    | M8 fecha de calendario en UTC | clasificación HOY/SEMANA y orden/filtro del servicio (unitarias) | 7 failed, 14 passed |
    | M9 semana de domingo a sábado | `sundayOfWeek` y clasificación (unitarias) | 7 failed, 14 passed |
    | M10 totales después del filtro | totales no dependen del filtro (unitaria) | 1 failed, 20 passed |
    | M11 sin prioridad de grupo | orden VENCIDO, HOY, … (unitaria) | 1 failed, 20 passed |
    | M12 sin `@Roles(SECRETARIA)` | PRESIDENTE → 403 | 1 failed, 24 passed |

  - Nota sobre `test/meeting-pdf-real.e2e-spec.ts`: en la corrida completa, M4-01, M4-03 y M4-04 (generan el PDF real) tardaron entre 24 y 34 s y fallaron por el timeout de 30 s, sin fallos de aserción. Esa suite sola pasó 7/7 en 6 corridas, con y sin `SecretariaModule`. En `b1702a0` se subió a 60 s el timeout de esas tres pruebas (tercer argumento de `it`), sin cambiar aserciones ni la configuración de Jest.

### Task TSK-015-N07 - [x] COMPLETADO (rama feat/proxima-reunion)
- **ID Único**: `TSK-015-N07`
- **Requisito Relacionado**: `RF-ALR.f.7` (spec-003 v1.5.3), `RF-09`
- **Criterio EARS**: **Cuando** la Secretaría o la Presidencia consulten `GET /api/evaluations/meetings/next`, **el sistema debe** devolver la convocatoria `PROGRAMADA` o `EN_CURSO` más cercana desde el inicio del día de hoy en America/Guayaquil, con su lugar y los protocolos distintos a tratar, o `data: null` si no hay ninguna.
- **Acción**: `CREAR` y `MODIFICAR`
- **Archivos Afectados**:
  - CREAR `src/modules/evaluations/application/dtos/response/next-meeting.dto.ts` — `NextMeetingDto`, `NextMeetingPlaceDto` y `NextMeetingResponseDto` (Swagger; documenta `informesATratar: null`)
  - CREAR `test/meetings-next.e2e-spec.ts`
  - MODIFICAR `src/modules/evaluations/domain/entities/meeting.entity.ts` — `NextMeetingModel` / `NextMeetingEntity`
  - MODIFICAR `src/modules/evaluations/domain/ports/meeting-repository.port.ts` — `findNextMeeting()`
  - MODIFICAR `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` — una consulta SQL parametrizada (sin relaciones nuevas)
  - MODIFICAR `src/modules/evaluations/application/mappers/meeting.mapper.ts` — `toNextMeeting`
  - MODIFICAR `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts` — solo el handler nuevo `GET next`, antes de `GET :id`, con `@UseGuards(PermissionsGuard)`, `@Roles(SECRETARIA, PRESIDENTE)` y `@Permissions(RESOLUCION_CONVOCATORIAS)`
  - MODIFICAR `src/modules/evaluations/application/mappers/meeting.mapper.spec.ts`, `src/modules/evaluations/infrastructure/controllers/meetings.controller.spec.ts` y `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.spec.ts`
  - Commit aparte (arranque con SWC): MODIFICAR `src/modules/evaluations/infrastructure/database/entities/{assignment-history,convocatoria,convocatoria-protocolo,risk-proposal}.orm-entity.ts` (`Relation<>` en las 11 relaciones) y `test/swc-entities-boot.e2e-spec.ts` (cubre `*.entity.orm.ts` y `*.orm-entity.ts`)
- **Dependencias**: TSK-015-N06 (vista Mis pendientes), TSK-009 (convocatorias)
- **Descripción**: según RF-ALR.f.7. Sin migraciones. No se implementan los pendientes a), b) y c) de RF-ALR.f.7.
- **Tests**:
  - Unitarias: `toNextMeeting` (ISO, lugar null y virtual, `informesATratar` null), el handler con `data: null` cuando no hay reunión, y el mapeo y los parámetros de `findNextMeeting`.
  - E2E `test/meetings-next.e2e-spec.ts` con guards reales y login real (`secretaria@test.com` y `presidente@test.com` con `E2E_TEST_ACCOUNTS_PASSWORD`; EVALUADOR, INVESTIGADOR y un PRESIDENTE con el rol vencido, usuarios `ZZ_TEST_NXT_` con contraseña generada): 401, 200, 403, `next` no cae en `:id`, la más cercana, desempate por número, estados, hoy a una hora pasada, ayer excluida, `DISTINCT` y `eliminado_en`, 0 protocolos, `informesATratar` null, lugar null y virtual, `data: null`. Datos `ZZ_TEST_NXT_` con fechas en 2090, borrados en `beforeAll` y `afterAll`.
- **Criterio "Hecho cuando:"**: tsc, `nest build`, `node dist/main.js` arranca, unitarias y E2E (suite nueva 2 veces y la completa 2 veces con `--runInBand`) en verde; eslint sin empeorar respecto de `dev`; residuos = 0 y convocatorias huérfanas = 57; al menos 6 mutaciones (rol, permiso, estado, borde de hoy, DISTINCT, `eliminado_en`) y la de SWC detectadas.
- **Resultados (05/11/2026, commits `a80935b` docs del spec, `1334e66` código del endpoint, `3e94c4a` `Relation<>` y prueba de SWC)**:
  - `npx tsc --noEmit`: sin errores. `nest build`: 377 archivos compilados con SWC. `node dist/main.js` (PORT=3099): «Nest application successfully started», luego detenido.
  - Prettier y eslint solo en los 19 archivos de `dev..HEAD`: prettier sin cambios pendientes; eslint 0 errores y 1 warning (`meetings.controller.spec.ts`, `no-unsafe-argument`), que ya estaba en `dev`. Ningún archivo empeora.
  - Unitarias: 63 suites / 573 pruebas en verde.
  - E2E `test/meetings-next.e2e-spec.ts`: 17/17 en cada corrida aislada (`--runInBand`).
  - E2E completa (`--runInBand`), dos corridas seguidas: 20 suites / 330 pruebas en verde las dos veces (antes 313; +17 de `meetings-next`).
  - `test/swc-entities-boot.e2e-spec.ts` carga ahora también los `*.orm-entity.ts` (6). Sin los 11 `Relation<>` la prueba ya pasaba (2/2): ninguna de esas relaciones cerraba un ciclo; se agregan para que un ciclo futuro no rompa el arranque.
  - `ceish_test_db`: residuos `ZZ_TEST_` = 0 (convocatorias, lugares, protocolos, versiones, usuarios; usuarios `@e2e-nxt.test` = 0); convocatorias huérfanas = 57 (total 65), sin cambio; convocatorias ajenas `PROGRAMADA`/`EN_CURSO` desde hoy = 0.
  - Archivos de mocks no listados en «Archivos afectados» (incluidos y señalados en `1334e66`; solo agregan `findNextMeeting` al mock del puerto): `create-meeting.use-case.spec.ts`, `test/meetings-concurrency.e2e-spec.ts`, `test/meetings-pdf.e2e-spec.ts`, `test/meetings.e2e-spec.ts`.
  - Mutaciones: 9 de 9 detectadas (E2E con `--runInBand`; cada una revertida editando, `cmp` OK con la copia previa).

    | Mutación | Qué se rompió | Prueba que falla | Resultado |
    |---|---|---|---|
    | M1 rol | `@Roles(SECRETARIA)` sin PRESIDENTE | acceso › PRESIDENTE → 200; acceso › PRESIDENTE con el rol vencido en la base (sin RESOLUCION_CONVOCATORIAS vigente) → 403 | 2 failed, 15 passed |
    | M2a permiso | sin `@Permissions(RESOLUCION_CONVOCATORIAS)` | acceso › PRESIDENTE con el rol vencido en la base (sin RESOLUCION_CONVOCATORIAS vigente) → 403 | 1 failed, 16 passed |
    | M2b permiso | sin `@UseGuards(PermissionsGuard)` en el handler | acceso › PRESIDENTE con el rol vencido en la base (sin RESOLUCION_CONVOCATORIAS vigente) → 403 | 1 failed, 16 passed |
    | M3a estado | sin `EN_CURSO` (PROGRAMADA en los dos parámetros) | qué reunión es › incluye EN_CURSO | 1 failed, 16 passed |
    | M3b estado | `CANCELADA` en lugar de `EN_CURSO` | qué reunión es › excluye CANCELADA y CONCLUIDA aunque sean más cercanas; qué reunión es › incluye EN_CURSO | 2 failed, 15 passed |
    | M4 borde de hoy | `fecha_reunion >= NOW()` en lugar del inicio del día | qué reunión es › la reunión de hoy (Ecuador) a una hora ya pasada sigue siendo la próxima | 1 failed, 16 passed |
    | M5 DISTINCT | `COUNT(cp.protocolo_id)` | respuesta › protocolosATratar cuenta protocolos distintos y no las filas con eliminado_en | 1 failed, 16 passed |
    | M6 `eliminado_en` | sin `AND cp.eliminado_en IS NULL` | respuesta › protocolosATratar cuenta protocolos distintos y no las filas con eliminado_en | 1 failed, 16 passed |
    | M7 SWC | `convocatoria?: ConvocatoriaOrmEntity` sin `Relation<>` en `convocatoria-protocolo.orm-entity.ts` | Arranque compilado con SWC › cada entidad se carga como primer módulo sin ReferenceError ni otro error (`convocatoria.orm-entity.js`, `minutes.entity.orm.js`, `session.entity.orm.js`: `ReferenceError: Cannot access 'ConvocatoriaOrmEntity' before initialization`) | 1 failed, 1 passed |

### Task TSK-015-N08 - [x] COMPLETADO (rama feat/tsk-015-n08-resultado-pleno)
- **ID Único**: `TSK-015-N08`
- **Requisito Relacionado**: `RF-17.1` (spec-003 v1.6.2), `RF-09.4`, `RF-ALR.f.8`
- **Criterio EARS**: `EARS 5` (RF-17.1)
- **Acción**: `CREAR` y `MODIFICAR`
- **Archivos Afectados** (tentativos; cada `CREAR` se confirma antes de escribirlo):
  - `src/migrations/<timestamp>-ConvocatoriaProtocoloResultados.ts` — CREAR, **migración de esquema aditiva**: columnas `dictamen_motivo`, `dictamen_observaciones`, `dictamen_registrado_por` (integer, FK a `catalogos.usuarios(id)`), `dictamen_registrado_en`; CHECK de los tres valores o NULL; CHECK de motivo para `NO_APROBADO`; CHECK de observaciones para `APROBADO_CON_CONDICION`; tabla `evaluacion.convocatoria_protocolo_resultados` (append-only, `registrado_por` NOT NULL con FK, `motivo_correccion`).
  - `src/migrations/<timestamp>-PermisoPlenoResultadoRegistrar.ts` — CREAR, **migración de datos** separada: inserta `PLENO_RESULTADO_REGISTRAR` en `catalogos.permisos` (`codigo`, `nombre`, `modulo_id` = 10, el mismo módulo que `EVALUACION_PLENO`) y lo concede en `catalogos.rol_permisos` solo al rol SECRETARIA.
  - `src/shared/enums/permission.enum.ts` — MODIFICAR: añadir `PLENO_RESULTADO_REGISTRAR`.
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts` — MODIFICAR: `PATCH :id/protocolos/:convocatoriaProtocoloId/resultado` con `@Roles(SECRETARIA)`, `@Permissions(PLENO_RESULTADO_REGISTRAR)` y `@Audit`.
  - `src/modules/evaluations/application/dtos/request/registrar-resultado-pleno.dto.ts` — CREAR: DTO con `class-validator` (ubicación de los DTO de entrada a confirmar con el directorio existente).
  - `src/modules/evaluations/application/use-cases/registrar-resultado-pleno.use-case.ts` — CREAR: ventana, pertenencia, validaciones, escritura del valor vigente y del historial en una transacción.
  - `src/modules/evaluations/application/use-cases/registrar-resultado-pleno.use-case.spec.ts` — CREAR: pruebas unitarias.
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts` — MODIFICAR: método `registrarResultadoPleno`.
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` — MODIFICAR: implementación transaccional (no existe puerto propio para `convocatoria_protocolo`).
  - `src/modules/evaluations/infrastructure/database/entities/convocatoria-protocolo.orm-entity.ts` — MODIFICAR: mapear las columnas nuevas (`dictamen_resultado` en líneas 54-55).
  - `src/modules/evaluations/infrastructure/database/entities/convocatoria-protocolo-resultado.orm-entity.ts` — CREAR: entidad del historial.
  - Mocks de `MeetingRepository` en los specs existentes — MODIFICAR (se listan al implementar, como en N07).
  - `test/meetings-resultado-pleno.e2e-spec.ts` — CREAR.
- **Dependencias**: Ninguna
- **Paso 0 (resuelto 24/11/2026)**:
  - Frontend: solo usa `evaluations/meetings`. Uso en `src/infrastructure/adapters/meeting-api.adapter.ts:34, 41, 48, 56, 73, 81, 90, 96`, constantes en `src/infrastructure/api/endpoints.constant.ts:72-79`. No hay uso de `evaluations/calls` en código no-spec.
  - Ruta, payload, permiso, ventana, historial y supuesto de Sección II: según RF-17.1 de spec-003 v1.6.2.
- **Descripción**: Registrar, por protocolo de la Sección II de la convocatoria, el resultado del pleno (`APROBADO_DEFINITIVO`, `APROBADO_CON_CONDICION` o `NO_APROBADO`). Cada registro o corrección inserta una fila en `convocatoria_protocolo_resultados` y actualiza el valor vigente en `convocatoria_protocolos`. Si el protocolo ya tenía resultado, `motivoCorreccion` es obligatorio. `SUSPENDIDO` no es resultado del pleno. **No** cambia `protocolos.estado_id` (lo hace la subida de la carta, TSK-015-N09/N13). **No** cierra la sesión (TSK-015-N16).
- **Riesgo conocido**: la comparación legacy de `calls.service.ts:483-484` (`'APROBADO_CON_CONDICIONES'` o `'25'`) no reconoce el valor nuevo `APROBADO_CON_CONDICION`. No se toca (AGENTS.md); queda documentada aquí. El CHECK de esquema bloquea los valores legacy si alguien intenta escribirlos. **Hallazgo (doble envoltorio, tarea futura)**: `ResponseInterceptor` (`main.ts:39`) envuelve también los handlers de `meetings.controller.ts` que ya devuelven `{ statusCode, message, data }` (`GET places`, `GET places/:id`, `POST places`, `PATCH places/:id`, `DELETE places/:id`, `GET pending-protocols`, `GET /`, `GET next`, `POST calculate-eval-date`, `POST /`, `GET :id`); esas respuestas llegan con `data.data`. El frontend lo tolera con `stripTransportEnvelope` (`meeting-api.adapter.ts:110`). N08 no lo cambia: su `PATCH …/resultado` devuelve el payload plano. Tarea futura: unificar la envoltura de Meetings.
- **Tests**:
  - Unitarias (`registrar-resultado-pleno.use-case.spec.ts`): DTO (tres valores, `motivo` para `NO_APROBADO`, `observaciones` para `APROBADO_CON_CONDICION`, `motivoCorreccion` en corrección); caso de uso (`404` si el cp no es de la convocatoria, `409` si la convocatoria está `CANCELADA`, `409` si `fecha_reunion` es futura, `400` si falta `motivoCorreccion`, una fila nueva en el historial, valor vigente actualizado, estado del protocolo sin cambios).
  - E2E (`test/meetings-resultado-pleno.e2e-spec.ts`, datos `ZZ_TEST_`): `200` SECRETARIA; `403` PRESIDENTE, EVALUADOR e INVESTIGADOR; `400` con valor inválido; `400` `NO_APROBADO` sin motivo; `400` `APROBADO_CON_CONDICION` sin observaciones; `404` con cp de otra convocatoria; `409` convocatoria `CANCELADA`; `409` `fecha_reunion` futura; `400` corrección sin `motivoCorreccion`; corrección con motivo: 2 filas en el historial y valor vigente actualizado; el estado del protocolo no cambia; residuos `ZZ_TEST_` = 0 al final. Contraseñas solo por la variable de entorno `E2E_TEST_ACCOUNTS_PASSWORD`; en los reportes aparecerá como `<contraseña de prueba>`. Ejecución con `--runInBand`.
- **Criterio de aceptación**:
  1. Solo SECRETARIA puede registrar o corregir (`403` para los demás roles).
  2. Valor fuera de los tres resultados → `400` en español.
  3. `NO_APROBADO` sin `motivo` → `400`; `APROBADO_CON_CONDICION` sin `observaciones` → `400`.
  4. cp que no pertenece a la convocatoria → `404`.
  5. Convocatoria `CANCELADA` o `fecha_reunion` futura → `409` en español.
  6. Corrección sin `motivoCorreccion` → `400`; con motivo → nueva fila en `convocatoria_protocolo_resultados` (nunca UPDATE ni DELETE) y valor vigente actualizado.
  7. El registro no modifica `protocolos.estado_id`.
  8. `calls.service.ts` no cambia.

### Task TSK-015-N09 - [x] COMPLETADO (rama feat/tsk-015-n09-n13-carta-firmada)
- **ID Único**: `TSK-015-N09`
- **Requisito Relacionado**: `RF-17.1`, `RF-17.2`, `RF-17.4`, `RF-17.7` (spec-003 v1.6.4)
- **Criterio EARS**: `EARS 5` (RF-17.2, RF-17.4, RF-17.7)
- **Acción**: `CREAR` (migración, entidad y endpoints nuevos) y `MODIFICAR` (marca de legacy en `POST /resolutions`)
- **Archivos Afectados** (ningún archivo nuevo sin esta lista; si aparece otro, detenerse):
  - `src/migrations/<timestamp>-CartasFirmadasResolucion.ts` — CREAR: tabla aditiva `resolucion.cartas_firmadas` con las columnas, UNIQUE, índice parcial de vigente y CHECK de RF-17.4 (spec v1.6.4). Requiere autorización previa del esquema (AGENTS.md). Sin cambios en `resolucion.resoluciones`.
  - `src/modules/resolutions/infrastructure/database/carta-firmada.entity.orm.ts` — CREAR: entidad ORM de la tabla.
  - `src/modules/resolutions/domain/entities/carta-firmada.entity.ts` — CREAR: entidad de dominio y reglas puras de versión (`numero_version`, vigencia, motivo).
  - `src/modules/resolutions/application/services/carta-firmada-rules.ts` — CREAR: matriz anexo ↔ (resultado, tipo de estudio). Antes de crearlo, buscar con Grep matrices equivalentes (anexos 13 a 16) y reutilizarlas si existen.
  - `src/modules/resolutions/application/services/cartas-firmadas.service.ts` — CREAR: `upload-url`, registro de versión, vigente e historial, con transacción y `SELECT … FOR UPDATE`.
  - `src/modules/resolutions/application/dtos/cartas-firmadas.dto.ts` — CREAR: DTO de clase con `class-validator` para `{ anexoCodigo }`, `{ claveArchivo, anexoCodigo, motivoReemplazo? }` (reemplaza la interfaz `CreateResolutionPayload` como contrato nuevo).
  - `src/modules/resolutions/infrastructure/controllers/cartas-firmadas.controller.ts` — CREAR: endpoints de RF-17.4 con `RESOLUCION_CREAR` o `RESOLUCION_HISTORIAL`, según corresponda.
  - `src/modules/resolutions/resolutions.module.ts` — MODIFICAR: registrar entidad, servicio y controlador nuevos.
  - `src/modules/resolutions/infrastructure/controllers/resolutions.controller.ts` — MODIFICAR: marcar `POST /resolutions` como legacy (comentario y sin cambios de lógica; retiro en TSK-015-N18).
  - `src/shared/storage/domain/ports/storage.service.port.ts` — MODIFICAR (aprobado 26/11/2026): método nuevo para leer un rango de bytes (`%PDF-`). `generateUploadUrl` y `getMetadata` se reutilizan.
  - `src/shared/storage/infrastructure/adapters/s3-storage.adapter.ts` — MODIFICAR: implementación del rango (GetObject con `Range`).
  - Doble de storage de las pruebas — MODIFICAR: el método nuevo.
  - `src/modules/storage-access/application/storage-key-access.policy.ts` — MODIFICAR (aprobado): regla `CARTA_FIRMADA` (clave de seis segmentos): lectura solo de la vigente para el investigador; escritura rechazada con 404 en el upload genérico.
  - Pruebas: `src/modules/resolutions/application/services/carta-firmada-rules.spec.ts` y `cartas-firmadas.service.spec.ts` (CREAR); `test/cartas-firmadas.e2e-spec.ts` (CREAR).
  - **No se modifica** `resolution.entity.orm.ts`, `determineResolutionType` ni `calls.service.ts`. Tampoco `resolutions.service.ts`: la lógica nueva vive en el servicio nuevo. El tipo calculado por dictámenes queda como referencia (RF-17.1).
- **Dependencias**: TSK-015-N08 (resultado del pleno), TSK-015-N11 (quitar `RESOLUCION_CREAR` a PRESIDENTE), TSK-015-N14 (anexos ANEXO_13 a 16 sembrados), TSK-015-N17 (lectura restringida del legado). Se entrega **junto con TSK-015-N13** (misma rama y PR, commits separados; N09 primero).
- **Descripción**: Cada carta firmada se guarda como versión nueva en `resolucion.cartas_firmadas`. `numero_version` es un entero (1, 2, 3…) independiente por protocolo y convocatoria, distinto de la versión del protocolo de RF-14. Reemplazar exige `motivoReemplazo`, marca la anterior como no vigente y la conserva. La clave del archivo la genera el backend (`protocols/{protocolId}/resolutions/{convocatoriaProtocoloId}/v{n}/{uuid}.pdf`). El investigador ve solo la versión vigente, sin datos del evaluador.
- **Flujo**:
  1. `POST …/cartas/upload-url` → valida `RESOLUCION_CREAR`, resultado del pleno (N08), anexo ↔ resultado y tipo de estudio, y que el estudio no sea EX; devuelve `{ uploadUrl, claveArchivo }`. No registra nada.
  2. `POST …/cartas` con `{ claveArchivo, anexoCodigo, motivoReemplazo? }` → verifica prefijo exacto, `HeadObject` (existe, `application/pdf`, ≤ 10 MB), anexo, y motivo si hay vigente; crea la versión y cambia el estado en la misma transacción.
- **Estado del protocolo** (misma transacción): `APROBADO_DEFINITIVO` → 17; `APROBADO_CON_CONDICION` → versión evaluada **19** y protocolo **21** (`EN_CONTROL_DOCUMENTAL`), con la v2.0 de TSK-015-N13 (corregido 26/11/2026); `NO_APROBADO` → 18. El estado 25 queda sin uso.
- **Endpoints**:
  - `POST /resolutions/convocatorias/:convocatoriaId/protocolos/:convocatoriaProtocoloId/cartas/upload-url`: `RESOLUCION_CREAR`.
  - `POST /resolutions/convocatorias/:convocatoriaId/protocolos/:convocatoriaProtocoloId/cartas`: `RESOLUCION_CREAR`.
  - `GET /resolutions/convocatorias/:convocatoriaId/protocolos/:convocatoriaProtocoloId/cartas/vigente`: investigador principal y `RESOLUCION_HISTORIAL`; resto `404` «Protocolo no encontrado.».
  - `GET /resolutions/convocatorias/:convocatoriaId/protocolos/:convocatoriaProtocoloId/cartas`: solo `RESOLUCION_HISTORIAL`; investigador `404`.
- **Códigos**: `400` (anexo incompatible, motivo faltante, clave fuera de prefijo, objeto inexistente / no PDF / > 10 MB); `404` (convocatoria, convocatoria-protocolo o protocolo inexistente, o no pertenece a la convocatoria); `409` (sin resultado del pleno, estudio EX, colisión de versión o del índice parcial). Mensajes en español.
- **Paso 0**: resuelto en la decisión del 25/11/2026 (tabla propia; clave por el backend; PDF ≤ 10 MB; POST legacy).
- **Tests**:
  - Unitarias: matriz anexo ↔ (resultado, tipo de estudio); cálculo de `numero_version`; motivo obligatorio desde la versión 2; EX → 409.
  - E2E (`test/cartas-firmadas.e2e-spec.ts`): upload-url devuelve clave con el prefijo; registro con clave ajena → 400; objeto no PDF o > 10 MB → 400 (con storage de prueba); segunda subida crea v2 y deja v1 no vigente; reemplazo sin motivo → 400; investigador ve solo la vigente; estado del protocolo cambia en la misma transacción.
  - Datos con prefijo `ZZ_TEST_`; residuos = 0 al terminar; contraseñas solo por `E2E_TEST_ACCOUNTS_PASSWORD`; `--runInBand`; `ResponseInterceptor` aplicado como en `main.ts:39`.
- **Criterio de aceptación**:
  1. `upload-url` devuelve `{ uploadUrl, claveArchivo }` con la clave generada por el backend; el frontend no elige la clave.
  2. Registrar con una clave que no tenga el prefijo generado responde `400` en español.
  3. Un objeto que no existe, no es `application/pdf` o pesa más de 10 MB responde `400`.
  4. Un anexo incompatible con el resultado o el tipo de estudio responde `400`.
  5. Una segunda subida crea la versión 2 y deja la 1 como no vigente; sin motivo responde `400`.
  6. Sin resultado del pleno, o con estudio EX, responde `409`.
  7. El estado del protocolo cambia en la misma transacción que la versión vigente.
  8. El investigador recibe solo la versión vigente y ningún dato del evaluador.
  9. Esta tarea no crea la v2.0 de RF-14 (eso es TSK-015-N13, misma entrega).

- **Resultados** (26/11/2026, `ceish_test_db`, rama `feat/tsk-015-n09-n13-carta-firmada`):
  - Migración `2000000000004-CartasFirmadasResolucion`: run, revert, run correctos (commit `be3bb42`).
  - `npx tsc --noEmit`: exit 0. `npm test`: 76 suites, 847 tests, todos pasan.
  - ESLint de los archivos tocados: 0 errores. Queda un warning preexistente en `storage-key-access.policy.spec.ts:1` (directiva `eslint-disable` sin uso).
  - E2E `--runInBand`: `cartas-firmadas` 13/13, `resolutions-legacy-v2` 1/1 (sin cambios), `storage-access` y `resolutions-permisos` en verde. Residuos `ZZ_TEST_CAR_` = 0.
  - Mutaciones (original restaurado e idéntico): M1 sin `%PDF-` → 3 fallos; M2 sin rechazo de EX → 1 fallo; M3 sin motivo desde v2 → 1 fallo; M4 `fecha_aprobacion` a NULL → 1 fallo.
  - Decisiones: `version = version + 1` en `protocolos` (el UPDATE nativo no incrementa el `@VersionColumn`). Al aprobar (17) se fija `fecha_aprobacion` como el legacy (`resolutions.service.ts:210`, `approvalDate`), con fecha de Guayaquil.
  - Diferencia con el legacy, a confirmar: en tipo 1 el legacy crea una fila en `resolucion.resoluciones` (`resolutions.service.ts:188`); el flujo nuevo no la crea, la fuente de la carta es `resolucion.cartas_firmadas`.
  - Entrega conjunta: con `APROBADO_CON_CONDICION` N09 pone el protocolo en 19 sin v2.0 hasta que N13 esté en el mismo PR.
  - Cubierto: investigador sin permiso → 403 en upload. No cubierto aquí: caso PRESIDENTE (depende de TSK-015-N11).

### Task TSK-015-N10 - [ ] PENDIENTE
- **Hallazgo (26/11/2026, obligatorio para esta tarea)**: el pendiente «Subir resolución» se calcula con `resolution_emitted` en `src/modules/secretaria/infrastructure/repositories/pending-items.typeorm.repository.ts` (`EXISTS … resolucion.resoluciones WHERE version_id = p.version_actual_id`). Tras ANEXO_15 la fila del puente queda en la **versión evaluada** (19) y la activa es la **v2.0**, así que el pendiente seguiría mostrándose. La fila «Subir resolución firmada» de N10 debe basarse en la **carta vigente de `resolucion.cartas_firmadas`** por convocatoria-protocolo (o, como mínimo, en la versión evaluada `convocatoria_protocolos.version_id`), **no** en `version_actual_id`. Mismo problema que ya existía con el legado tipo 2.
- **Hallazgo (26/11/2026, corregido el mismo día)**: `convocatorias.fecha_reunion` es `timestamptz` (verificado con `\d evaluacion.convocatorias` en `ceish_test_db` y en la entidad ORM), así que lleva fecha **y** hora. La nota anterior («`date` sin hora») era incorrecta. Las columnas `convocatorias.fecha` (date) y `convocatorias.hora` (time) existen en la base, pero no están mapeadas en la entidad y el código no las usa. Fuente de la hora del plazo de 96 h: `fecha_reunion`.
- **ID Único**: `TSK-015-N10`
- **Requisito Relacionado**: `RF-17.3` (spec-003 v1.6.1), `RF-ALR.f.8`
- **Criterio EARS**: `EARS 5` (RF-17.3)
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/secretaria/domain/pending-item.ts` — añadir `SUBIR_RESOLUCION` al enum `PendingAction`
  - `src/modules/secretaria/application/services/pending-items.service.ts` — texto «Subir resolución firmada» y grupos de plazo
  - `src/modules/secretaria/infrastructure/repositories/pending-items.typeorm.repository.ts:140-142` — cuarta fila en la consulta única
  - `src/shared/deadlines/deadline-rules.ts` — usa `PLAZO_RESOLUCION_FIRMADA_HORAS` (TSK-015-N15)
- **Dependencias**: TSK-015-N08, TSK-015-N15
- **Descripción**: Fila d) de RF-ALR.f.1 y RF-ALR.f.8: el protocolo tiene resultado del pleno y no tiene versión vigente de la carta. Plazo `convocatorias.fecha_reunion + 96 h corridas`; si `fecha_reunion` es null, `SIN_PLAZO`. Si vence, `estadoPlazo = VENCIDO` sin bloquear la subida.
- **Tests**: unitarias de la clasificación de grupos; E2E de `GET /secretaria/pendientes`.
- **Criterio de aceptación**:
  1. La fila aparece con `accion = SUBIR_RESOLUCION` y `accionTexto = «Subir resolución firmada»`.
  2. `fechaPlazo = fecha_reunion + 96 h`.
  3. Con plazo pasado, `estadoPlazo = VENCIDO`.
  4. Una sola fila por protocolo.
  5. La fila desaparece al subir la carta (TSK-015-N09).

### Task TSK-015-N11 - [x] COMPLETADO (rama feat/tsk-015-n11-presidente-sin-resolucion-crear, commit 9613c07)
- **ID Único**: `TSK-015-N11`
- **Resultados** (25/11/2026, `ceish_test_db`):
  - Migración `2000000000002-QuitarResolucionCrearPresidente` aplicada: run → revert → run. Estado final: PRESIDENTE 22 permisos, matriz 76 filas, SECRETARIA sin cambios (37).
  - `npx tsc --noEmit`: sin errores. `npm test`: 71 suites, 728 pruebas, todas en verde.
  - E2E `--runInBand`: `fixed-roles-matrix` (PRESIDENTE 23 → 22; matriz 77 → 76), `resolutions-permisos` (nueva, 3 pruebas) y `evaluations-contract`: 116 pruebas en verde.
  - Mutación (a), quitar el DELETE de la migración: fallan 3 pruebas (403 de PRESIDENTE, 22 permisos y 76 filas). Restaurada con hash verificado.
  - Mutación (b), quitar `@Permissions` de `POST /resolutions`: falla la prueba 403 de PRESIDENTE. Restaurada con hash verificado.
  - `resolucion.resoluciones` sin cambios (7 filas antes y después).
  - ESLint sobre los archivos tocados: sin errores. Prettier: `test/fixed-roles-matrix.e2e-spec.ts` ya fallaba antes de esta tarea (finales de línea CRLF en `HEAD`); no se reformatea el archivo entero para no ensuciar el diff.
  - **Caché**: `PermissionsGuard` cachea permisos 5 min. La API se reinicia tras aplicar la migración en cada entorno.
  - **Frontend**: no se toca. Ver TSK-015-N21 (ajuste de pantallas que todavía muestran la acción a PRESIDENTE).
- **Requisito Relacionado**: `RF-17.7` (spec-003 v1.6.4), `HU-001`
- **Criterio EARS**: `EARS 5` (RF-17.7)
- **Acción**: `CREAR` (migración)
- **Archivos Afectados**:
  - `src/migrations/<timestamp>-QuitarResolucionCrearPresidente.ts` — CREAR: quita la asignación de `RESOLUCION_CREAR` a PRESIDENTE sembrada en `src/migrations/1880000000000-FixedRolesMatrix.ts:133`. Solo cambio de datos; sin cambios de esquema.
- **Dependencias**: Ninguna
- **Descripción**: Solo `SECRETARIA` crea o sube resoluciones. `PRESIDENTE` conserva `RESOLUCION_HISTORIAL` (lectura). La matriz fija de specs/001 ya está actualizada (v3.7.10).
- **Tests**: E2E: PRESIDENTE → `403` en `POST /resolutions`; SECRETARIA → no cambia; PRESIDENTE → `200` en lectura.
- **Criterio de aceptación**:
  1. `POST /resolutions` responde `403` para PRESIDENTE.
  2. `POST /resolutions` sigue permitido para SECRETARIA.
  3. La lectura de resoluciones sigue disponible para PRESIDENTE.

### Task TSK-015-N12 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N12`
- **Requisito Relacionado**: `RF-17.6` (spec-003 v1.6.1), `RF-17.1`
- **Criterio EARS**: `EARS 5` (RF-17.6)
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/shared/utils/pdf-generator.service.ts:795-797` — MODIFICAR: dejar de imprimir `revisores` en el Anexo 9 PDF
  - `src/shared/utils/docx-generator.service.ts:469` — MODIFICAR: dejar de imprimir `revisorName` en el Anexo 9 DOCX
  - `src/modules/evaluations/application/services/evaluations.service.ts:585` — MODIFICAR: quitar el respaldo `evaluator?.fullName` de `investigatorName`
  - `src/modules/evaluations/application/services/evaluations.service.ts:614` y `:622` — MODIFICAR: dejar de pasar el nombre del evaluador
  - `src/modules/resolutions/application/services/resolutions.service.ts:103-130` — MODIFICAR: dejar de adjuntar los informes individuales
  - `src/modules/resolutions/application/services/resolutions.service.ts:317-327` — MODIFICAR: el correo lleva solo la carta firmada
  - Respuestas API del investigador: archivos por confirmar tras auditoría (ver preguntas abiertas). Si la lista crece, detenerse y reportar (AGENTS.md)
  - **Hallazgo de TSK-015-N17 (25/11/2026)**: la respuesta de `GET /resolutions/protocol/:id` (que el investigador sí consume en `subsanacion.page.ts`) incluye la relación `protocol` con columnas planas de `ProtocolOrmEntity`: `affidavitIp`, `timelineTermsAcceptedIp` y datos de patrocinador (`patrocinador_ruc`, `patrocinador_telefono_institucional`, `patrocinador_direccion`, `patrocinador_pagina_web`, `patrocinador_organo_ejecutor`). No son datos de evaluador, pero no los necesita la pantalla del investigador. Decisión de N17: no recortar en esa tarea; se revisa aquí como parte de la auditoría de respuestas del investigador.
- **Dependencias**: TSK-015-N08, TSK-015-N11
- **Descripción**: El investigador nunca recibe nombre, correo ni identificador del evaluador, ni en la API, ni en el Anexo 9, ni en adjuntos ni en el correo. Ve el perfil y el dictamen de cada par.
- **Paso 0**: resuelve la pregunta 6 (lista de endpoints del investigador a auditar) antes de fijar los archivos de la API.
- **Tests**: unitarias de la generación del Anexo 9 (texto sin nombre); E2E del correo (sin adjuntos de informe) y de las respuestas del investigador.
- **Criterio de aceptación**:
  1. El PDF y el DOCX del Anexo 9 no contienen el nombre del revisor.
  2. El correo de la resolución no adjunta informes individuales.
  3. Las respuestas del investigador no contienen nombre, correo ni `userId` del evaluador.

### Task TSK-015-N13 - [x] COMPLETADO (rama feat/tsk-015-n09-n13-carta-firmada)
- **Hallazgo (26/11/2026, no se toca)**: `calls.service.ts:483-484` compara `dictamenResultado` con `'APROBADO_CON_CONDICIONES'` (plural) y con `'25'`; el valor real es `APROBADO_CON_CONDICION`. La rama no se cumple nunca. Fuera de alcance: N13 prohíbe cambiar `calls.service.ts`.
- **ID Único**: `TSK-015-N13`
- **Requisito Relacionado**: `RF-17.5` (spec-003 v1.6.1), `RF-14.1`
- **Criterio EARS**: `EARS 5` (RF-17.5)
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/resolutions/application/services/version-subsanacion.service.ts` — CREAR (aprobado): la creación de la v2.0 (pasos 2 a 6), compartida con el legacy.
  - `src/modules/resolutions/application/services/resultado-resolucion.service.ts` — CREAR (movido desde N09 el 26/11/2026): aplica 17/18/19 a versión y protocolo; lo usan ambos flujos.
  - `src/modules/resolutions/application/services/resolutions.service.ts:203-237` — MODIFICAR (aprobado, extracción): el bloque del tipo 2 llama al servicio compartido **sin cambio de comportamiento**. El legacy **deja de crear la v2.0 en TSK-015-N18**, no en esta tarea.
  - `src/modules/resolutions/application/services/cartas-firmadas.service.ts` (TSK-015-N09): llama a `VersionSubsanacionService` solo con `APROBADO_CON_CONDICION` (Anexo 15)
  - `src/shared/deadlines/deadline-rules.ts:15` — usa `PLAZO_CONDICION_DIAS` (ya existe, 30)
- **Dependencias**: TSK-015-N08, TSK-015-N09 (se entrega en el mismo PR, commit posterior a N09)
- **Descripción**: Al subir el Anexo 15, en la misma transacción: se congelan los requisitos aprobados, se crea la v2.0 y se asigna `plazo_condicion_dias` = 30, con el cálculo actual de `protocol-deadline.service.ts` (no se cambia en esta tarea; ver pregunta 9). La versión evaluada pasa a 19 (tipo 2) y el protocolo a 21 (`EN_CONTROL_DOCUMENTAL`), apuntando a la v2.0 (corregido 26/11/2026: la versión anterior de esta tarea decía que el protocolo quedaba en 19; el flujo real deja 21). No se toca `calls.service.ts`.
- **Tests**: E2E: con Anexo 15 crea v2.0; con Anexo 13, 14 o 16 no la crea.
- **Criterio de aceptación**:
  1. Subir el Anexo 15 con resultado `APROBADO_CON_CONDICION` crea la v2.0 en la misma transacción.
  2. El plazo de subsanación es `plazo_condicion_dias` = 30, con el cálculo actual.
  3. La versión evaluada queda en 19 y el protocolo en 21 (`EN_CONTROL_DOCUMENTAL`), apuntando a la v2.0.
  3. Con resultado `APROBADO_DEFINITIVO` o `NO_APROBADO` no se crea la v2.0.
  4. `calls.service.ts` no cambia.
- **Resultados** (26/11/2026, `ceish_test_db`; commits `0a19728` decisión 2 y `175be5c` ANEXO_15):
  - Caracterización tipo 1/3 (`resolutions-legacy-v1-v3`) y tipo 2 (`resolutions-legacy-v2`): en verde. La de tipo 1 comprueba ahora que `fecha_aprobacion` es el día de calendario de Ecuador. Un fallo previo: TypeORM escribe las partes locales de un `Date`, así que el primer intento con medianoche UTC guardaba el día anterior en UTC-5; se corrigió con medianoche local.
  - Mutación «`new Date()` en vez del día de Ecuador»: **no discrimina a esta hora** (17:29 en Ecuador, mismo día en ambas zonas). Verificada la lógica con una comprobación puntual con `TZ=UTC` y el instante 2026-11-25 23:30 Ecuador: correcta con el cambio (25), incorrecta sin él (26).
  - E2E `cartas-firmadas` (18 pruebas en verde): ANEXO_15 (versión evaluada en 19 con tipo 2; v2.0 en 21 con plazo 30 y recepción 9; protocolo en 21 apuntando a la v2.0; puente en resoluciones), requisito v2 → 201, ANEXO_16 sin v2.0 (protocolo en 18, puente tipo 3), ANEXO_13 sin v2.0, PRESIDENTE 403 en upload-url y en el registro. **ANEXO_14 no tiene caso propio: NO EJECUTADO.**
  - Unitarias `src/modules/resolutions`: 37 en verde. `npm test` completo: 76 suites, 852 pruebas en verde. `npx tsc --noEmit`: sin errores. ESLint sobre lo tocado: 0 errores.
  - Mutaciones (cada archivo restaurado y comprobado con `cmp`): sin crear la v2.0 → 2 fallos; sin puente → 2 fallos; v2.0 siempre → 3 fallos.
  - Corrige la nota de N09: `resolucion.resoluciones` ya no queda sin cambios; el registro de la carta escribe una fila puente por versión evaluada (upsert).
  - Servicios compartidos: el registro usa `ResultadoResolucionService` (versión y protocolo) y `VersionSubsanacionService` (solo ANEXO_15); se eliminó el SQL nativo de estados y `estadoProtocoloParaResultado`.
  - **Anotación (acordada con la usuaria, 26/11/2026)**: en la caracterización tipo 1 (`resolutions-legacy-v1-v3`, commit `0a19728`) se añadió una aserción nueva de fecha de Ecuador. No se cambió ninguna aserción existente, pero la regla de esa caracterización era STOP ante cualquier cambio; queda registrado aquí.
  - ANEXO_14 (EC): cubierto por el commit `d080652` (ANEXO_13 → 400; ANEXO_14 → 201, protocolo en 17 con fecha de hoy, sin v2.0, puente tipo 1).

### Task TSK-015-N14 - [x] COMPLETADO (rama feat/tsk-015-n14-n15-anexos-y-plazo)
- **ID Único**: `TSK-015-N14`
- **Requisito Relacionado**: `RF-17.2` (spec-003 v1.6.1)
- **Criterio EARS**: `EARS 5` (RF-17.2)
- **Acción**: `CREAR` (migración de datos)
- **Archivos Afectados**:
  - `src/migrations/<timestamp>-SeedTiposDocumentoAnexos13a16.ts` — CREAR: inserta en `catalogos.tipos_documento` los códigos `ANEXO_13`, `ANEXO_14`, `ANEXO_15` y `ANEXO_16`, con el patrón de `ANEXO_1`, `ANEXO_2`, `ANEXO_4`, `ANEXO_5` y `ANEXO_6` (verificado en `ceish_test_db`)
- **Dependencias**: Ninguna
- **Descripción**: Los anexos 13 a 16 no existen en el catálogo (verificado). Se siembran sus filas para la carga y el nombrado de archivos. La carta firmada se adjunta; el sistema no la genera.
- **Tests**: E2E de la migración (filas presentes, sin duplicados); `down` las elimina por `codigo_anexo`.
- **Criterio de aceptación**:
  1. Existen cuatro filas nuevas: `ANEXO_13`, `ANEXO_14`, `ANEXO_15` y `ANEXO_16`.
  2. Ninguna fila existente cambia.
  3. El `down` deja la tabla como estaba.

- **Resultados** (26/11/2026, `ceish_test_db`, rama `feat/tsk-015-n14-n15-anexos-y-plazo`):
  - Migración `2000000000003-SeedTiposDocumentoAnexos13a16` aplicada con `run` → `revert` → `run`, vía TypeORM CLI. Tras el `revert`: 0 filas `ANEXO_13..16` y 0 relaciones huérfanas. Estado final: 4 filas, una por código, con `codigo_plantilla` NULL y 0 filas en `tipo_documento_estudio`.
  - Respaldo previo de `catalogos.tipos_documento` y `tipo_documento_estudio` (datos y esquema) en el scratchpad, con sha256.
  - E2E `test/seed-anexos-13-16.e2e-spec.ts`: 5/5 en verde (filas, checklist IO/EI/EC sin ANEXO_13..16, idempotencia y `down` en transacción revertida).
  - Mutación (a), fila en `tipo_documento_estudio` para ANEXO_13 vía la migración: fallan la prueba de «sin relaciones», la del checklist de IO y la de idempotencia (clave duplicada en `tipo_documento_estudio_pkey`). Restaurada con `cmp`.
  - Mutación (b), sin `WHERE NOT EXISTS`: falla la prueba de idempotencia (duplicado). Restaurada con `cmp`.
  - Hallazgo: `catalogos.tipos_documento.codigo_anexo` es `varchar(20)` en `ceish_test_db`; la migración `1778800000000` pide `VARCHAR(50)`. No afecta a los cuatro códigos (8 caracteres).
  - Suite `protocol-thesis` (TSK-001.12), no afectada por esta tarea: 1 prueba NO VERIFICADA; aborta antes de sus aserciones por falta de `E2E_TEST_ACCOUNTS_PASSWORD` en el entorno. Las otras 34 pruebas de `seed-anexos-13-16`, `requirement-templates` y `protocol-thesis` pasan.

### Task TSK-015-N15 - [x] COMPLETADO (rama feat/tsk-015-n14-n15-anexos-y-plazo)
- **ID Único**: `TSK-015-N15`
- **Requisito Relacionado**: `RF-17.3` (spec-003 v1.6.1)
- **Criterio EARS**: `EARS 5` (RF-17.3)
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/shared/deadlines/deadline-rules.ts` — añadir `PLAZO_RESOLUCION_FIRMADA_HORAS = 96 as const` junto a `PLAZO_CONDICION_DIAS` (línea 15)
- **Dependencias**: Ninguna
- **Descripción**: Constante única del plazo de 96 horas corridas. Búsqueda previa de similares: ninguna constante de 96 h en `src/shared/deadlines` ni en `src/modules/secretaria`.
- **Tests**: unitaria del valor; la búsqueda de `96` en el proyecto no muestra otra definición.
- **Criterio de aceptación**:
  1. La constante vale `96` y está exportada en `deadline-rules.ts`.
  2. TSK-015-N10 la importa; no hay otra definición.

- **Resultados** (26/11/2026, rama `feat/tsk-015-n14-n15-anexos-y-plazo`):
  - `src/shared/deadlines/deadline-rules.ts`: `PLAZO_RESOLUCION_FIRMADA_HORAS = 96 as const`, después de `PLAZO_CONDICION_DIAS`. Diff del archivo: 3 líneas añadidas.
  - Búsqueda previa de `96`, `HORAS` y `96h` en `src/**/*.ts`: sin definiciones preexistentes.
  - Unitaria `src/shared/deadlines/deadline-rules.spec.ts`: 1/1 en verde.
  - Mutación 96 → 72: falla la unitaria (`Expected 96, Received 72`). Restaurada con `cmp`.

### Task TSK-015-N16 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N16`
- **Requisito Relacionado**: `RF-17.1` (spec-003 v1.6.2, cierre), `RF-09.1`, `RF-ALR.f.7` a)
- **Criterio EARS**: `EARS 5` (RF-17.1): **cuando** la Secretaría cierre la sesión, **el sistema debe** exigir el resultado de cada protocolo; **si** falta alguno, **el sistema debe** impedir el cierre con un mensaje en español.
- **Acción**: `CREAR` y `MODIFICAR`
- **Archivos Afectados** (tentativos, a confirmar):
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts` — MODIFICAR: `POST :id/cerrar` (ruta propuesta).
  - `src/modules/evaluations/application/use-cases/cerrar-sesion-pleno.use-case.ts` — CREAR.
  - `src/modules/evaluations/application/use-cases/cerrar-sesion-pleno.use-case.spec.ts` — CREAR.
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts` — MODIFICAR.
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` — MODIFICAR.
  - Permiso del cierre: por definir (ver preguntas). Si se crea, migración de datos separada.
- **Dependencias**: TSK-015-N08
- **Descripción**: Cierre canónico con validación de resultados: lista los protocolos de la convocatoria sin `dictamen_resultado` y, si hay alguno, responde `400` con esa lista en español. No cambia `protocolos.estado_id` (lo hace N09/N13). **No** depende del plazo de 96 h (RF-17.3 se calcula desde `fecha_reunion`). Pendiente: si el cierre pasa la convocatoria a `CONCLUIDA` (hoy solo el legacy lo hace, `calls.service.ts:472`).
- **Criterio de aceptación**:
  1. Con algún protocolo sin resultado → `400` con la lista, en español.
  2. Con todos los resultados → cierre correcto.
  3. Convocatoria ya cerrada → `409`.
  4. `calls.service.ts` no cambia.

---

### Task TSK-015-N17 - [x] COMPLETADO (rama feat/tsk-015-n17-lectura-resolucion, commit 8ceb016)
- **ID Único**: `TSK-015-N17`
- **Resultados** (25/11/2026, `ceish_test_db`):
  - `npx tsc --noEmit`: sin errores. `npm test`: 72 suites, 738 pruebas, en verde.
  - Unitarias (`resolutions.service.spec.ts`, 10 pruebas en verde): la regla `canReadResolution` y `findByProtocolIdForReader` (dueño, HISTORIAL, otro investigador, inexistente, id no numérico).
  - E2E `--runInBand` (`resolutions-permisos.e2e-spec.ts`, 11 pruebas): dueño 200, otro investigador 404, evaluador 404, SECRETARIA 200, PRESIDENTE 200, inexistente 404, id no numérico 400, sin sesión 401, y ninguna respuesta con nombre, correo ni `userId` de evaluador. Residuos: 0 usuarios, 0 protocolos `ZZ_TEST_RSP_`, `resolucion.resoluciones` sin cambios (7).
  - Mutación (a), quitar la regla de acceso del servicio: fallan 2 pruebas (otro investigador y evaluador reciben 200). Restaurada con hash verificado.
  - Mutación (b), quitar `RESOLUCION_HISTORIAL` de la regla: fallan la prueba unitaria, SECRETARIA y PRESIDENTE (404 en vez de 200), y la de datos del evaluador. Restaurada con hash verificado.
  - ESLint: sin errores en los archivos nuevos o tocados de esta tarea. `resolutions.service.ts` tiene 30 errores, todos en líneas de código previo a N17 (33 en `HEAD`).
  - Prettier: aplicado a los archivos tocados.
  - Una ejecución de la matriz de roles (`fixed-roles-matrix`, 5 pruebas de rutas de asignación con 403 donde se esperaba 200 o «no 403») falló en el orden de ejecución completo, sin cambios en esas rutas. Se repitió el mismo comando tres veces con 124 pruebas en verde y la matriz sola 82 en verde. **Causa no identificada**; queda como intermitencia a vigilar.
- **Requisito Relacionado**: `RF-17.6` (spec-003 v1.6.4), `RF-02.10` (spec-001 v3.7.7)
- **Criterio EARS**: `EARS 5` (RF-17.6): **cuando** un usuario consulte la resolución de un protocolo, **el sistema debe** devolverla solo si es el investigador principal o tiene `RESOLUCION_HISTORIAL`; **si** no, **el sistema debe** responder `404` con «Protocolo no encontrado.».
- **Acción**: `MODIFICAR` y `CREAR` (prueba unitaria)
- **Archivos Afectados**:
  - `src/modules/resolutions/infrastructure/controllers/resolutions.controller.ts` — MODIFICAR: `GET protocol/:protocolId` sin `@Permissions` (ver «Decoradores»); pasa `req.user` al servicio.
  - `src/modules/resolutions/application/services/resolutions.service.ts` — MODIFICAR: `findByProtocolIdForReader` y la función pura `canReadResolution` (sustituye a `findByProtocolId`).
  - `src/modules/resolutions/application/services/resolutions.service.spec.ts` — CREAR: pruebas unitarias de la regla y del método. Archivo nuevo no listado en el plan original; se añade aquí por la exigencia de pruebas unitarias.
  - `test/resolutions-permisos.e2e-spec.ts` — MODIFICAR: casos de lectura de N17.
- **Dependencias**: Ninguna. **Va antes de TSK-015-N22 y de TSK-015-N09.**
- **Decoradores**: la ruta no lleva `@Permissions(RESOLUCION_HISTORIAL)`, porque el investigador principal no tiene ese permiso y recibiría 403 cuando la spec pide 200. La regla va en el servicio, con el permiso leído del token (igual que RF-02.10, con un desfase de hasta 15 minutos al quitar un permiso).
- **Descripción**: `GET /resolutions/protocol/:protocolId` devolvía la resolución a cualquier autenticado. Ahora la leen el investigador principal y quien tiene `RESOLUCION_HISTORIAL`. El resto y los protocolos inexistentes reciben `404 «Protocolo no encontrado.»`. Id no numérico: `400 «ID de protocolo inválido»`. La forma de la respuesta no cambia (array). **No se recortan columnas** en esta tarea (ver hallazgo en TSK-015-N12).
- **Tests**: unitarias de la regla y del método; E2E de la matriz de acceso (dueño, otro investigador, evaluador, SECRETARIA, PRESIDENTE, inexistente, id no numérico, sin sesión, y ausencia de datos del evaluador).
- **Criterio de aceptación**:
  1. Investigador principal → `200`; SECRETARIA y PRESIDENTE → `200`; otro investigador, evaluador o protocolo inexistente → `404` «Protocolo no encontrado.».
  2. Sin sesión → `401` (lo da `JwtAuthGuard` antes que la regla).
  3. La respuesta no contiene nombre, correo ni `userId` de evaluador.
  4. `POST /resolutions` no cambia en esta tarea.
  5. La descarga de la carta **no** queda cubierta por esta tarea: ver TSK-015-N22.

### Task TSK-015-N22 - [ ] PENDIENTE (dividida en N22a, N22b, N22c; Paso 0 completado 25/11/2026)
- **ID Único**: `TSK-015-N22`
- **Requisito Relacionado**: `RF-17.4`, `RF-17.6` (spec-003 v1.6.4); hallazgos C (lectura), C (escritura), I (recepción por id) y Evaluador / tarea B7 (Anexo 9 por id) de este Paso 0.
- **Criterio EARS**: `EARS 5` (RF-17.6): **cuando** un usuario pida una URL de descarga o de subida, **el sistema debe** firmarla solo si puede leer (o escribir) el recurso al que pertenece la clave; **si** no, **el sistema debe** responder `404` en español sin revelar la existencia.
- **Decisión**: se divide en tres tareas. Orden: **N22a → N22b → N14 → N15 → N09 + N13 → … ; N22c después de N09.**
- **Dependencias**: TSK-015-N17 (hecha).
- **Regla común**: claves con `..`, prefijo desconocido o mal formadas → `400`. Reutilizar `canReadResolution` (N17), `findOneForReader` (RF-02.10) y el acceso del evaluador asignado en estados 5/6/7. No duplicar reglas.

### Task TSK-015-N22a - [x] COMPLETADO (lectura: GET y POST /storage/download-url; commit de código bb1c6dd)
- **Resultados** (25/11/2026, `ceish_test_db`):
  - Unitarias de la política (`storage-key-access.policy.spec.ts`): 37 pruebas en verde. Cubren cada prefijo, `..`, vacía, control, >1024, `draft/`, no numérico, prefijo desconocido, y reglas de resolución, requisitos, evaluación, CV, plantilla, Anexo 9 y documento de recepción.
  - E2E `test/storage-access.e2e-spec.ts` (login real, cuentas `ZZ_TEST_SA_`, doble de `IStorageService`, residuos 0): 15 pruebas en verde.
  - Mutaciones (respaldo y hash): quitar la comprobación de prefijo (1 prueba falla), quitar la de dueño del documento (2 fallan), quitar la de dueño del CV (1 falla), quitar el dueño evaluador en `/evaluations/:id/document` (2 fallan). Todas restauradas con `cmp` y hash original.
  - `npx tsc --noEmit`: sin errores. `npm test`: 73 suites, 775 pruebas, en verde. ESLint sobre lo tocado: sin errores nuevos (las 5 advertencias de `reception.controller.ts` ya estaban en `HEAD`).
  - E2E afectadas con `--runInBand`: `storage-access` 15/15, `real-db-evaluations` 61/61 (sin cambios de resultado), `resolutions-permisos` 11/11, `evaluations-contract` en verde, `swc-entities-boot` 2/2 (arranque sin `ReferenceError`).
- **Cambio de módulos**: el controlador se movió con `git mv` de `shared/storage` a `src/modules/storage-access/` (mismas rutas `/storage/*`). La política está en `src/modules/storage-access/application/`. `StorageAccessModule` importa `ProtocolsModule` y `ReceptionModule`, y se registra en `AppModule`. `shared/storage` queda con el puerto y el adaptador. `ReceptionModule` importa `StorageAccessModule` con `forwardRef` porque hay un ciclo entre ambos (no existía patrón previo para este par). No se exporta nada nuevo de `ProtocolsModule` ni de `ReceptionModule`. La comprobación de dueño del Anexo 9 vive en `EvaluationsService`, sin exportar nada de `EvaluationsModule`.
- **Hallazgo menor (CV)**: la clave del CV (`investigators/{id}/cv/…`) se guarda en el `localStorage` del navegador del investigador. El backend no la conoce ni la expone, así que el CV no tiene consumidores fuera del propio investigador.
- **Acción**: `MODIFICAR`
- **Archivos Afectados**: `src/modules/storage-access/infrastructure/controllers/storage.controller.ts` (movido desde `src/shared/storage/infrastructure/controllers/storage.controller.ts`); `src/modules/storage-access/application/storage-key-access.policy.ts` (nuevo); `src/modules/storage-access/storage-access.module.ts` (nuevo); `src/modules/reception/infrastructure/controllers/reception.controller.ts` (MODIFICAR: `view` y `download-url` por id); `src/modules/evaluations/application/services/evaluations.service.ts` y `…/controllers/evaluations.controller.ts` (MODIFICAR: `/evaluations/:id/document` y `/document/docx`); `src/shared/storage/storage.module.ts` (MODIFICAR: solo puerto y adaptador); `src/app.module.ts` (MODIFICAR: registrar `StorageAccessModule`); `src/modules/reception/reception.module.ts` (MODIFICAR: importa `StorageAccessModule`); pruebas: `src/modules/storage-access/application/storage-key-access.policy.spec.ts` (CREAR), `test/storage-access.e2e-spec.ts` (CREAR), `src/modules/evaluations/application/services/evaluations-urgency.service.spec.ts` (MODIFICAR).
- **Descripción**: hoy `GET` y `POST /storage/download-url` firman cualquier clave a cualquier usuario autenticado (hallazgo C, lectura). Reglas por prefijo (tabla de N22a):

| Prefijo / origen | Quién lee | Fuente de la regla |
|---|---|---|
| `protocols/{id}/resolutions/…` (carta, consolidado) | Investigador principal; `RESOLUCION_HISTORIAL` (SECRETARIA, PRESIDENTE) | `canReadResolution` (N17) |
| `protocols/{id}/requirements/…` (requisitos del investigador) | Lo que permita `findOneForReader`: investigador principal, `PROTOCOLOS_LISTAR` (no borrador), evaluador asignado en estados 5/6/7 | `findOneForReader` (RF-02.10) |
| `protocols/{id}/docEvaluacion/…` | Evaluador dueño de la asignación; SECRETARIA y PRESIDENTE (`EVALUACION_INFORMES`) | Acceso del evaluador (estados 5/6/7) + permiso |
| `protocols/{id}/…` (informes de evaluación) | SECRETARIA y PRESIDENTE (`EVALUACION_INFORMES`); evaluador dueño | Igual que docEvaluacion |
| `evaluations/anexo9/…` | Evaluador dueño; SECRETARIA y PRESIDENTE (`EVALUACION_INFORMES`). **No el investigador** mientras el Anexo 9 lleve el nombre del evaluador (hasta N12). | Dueño de la evaluación |
| `investigators/{id}/cv/…` | Solo el propio investigador | Id de la clave = usuario de sesión |
| Clave de carta de recepción (`recepcion.documentos`) | Según la fila: documento → versión → protocolo, aplicando la regla de ese protocolo | Fila de BD, no la clave |
| Cualquier otra clave, `..`, prefijo desconocido | `400` | — |

- **Recepción por id** (`GET reception/document/:documentId/download-url` y `…/view`, `reception.controller.ts:185-245`): **sin `@Permissions` en la ruta** (solo `JwtAuthGuard, PermissionsGuard` de clase). Cualquier autenticado obtiene la URL de cualquier documento por id (**hallazgo I**, mismo patrón que el hallazgo C). Se corrige en N22a: el dueño sale de la fila (documento → versión → protocolo) y se aplica la regla de ese protocolo. Respuesta `404 «Documento no encontrado.»` a quien no puede leer.
- **Consumidores a conservar**: `subsanacion.page.ts:1402` (carta por `letterFilePath`, investigador), `profile-cv.service.ts:78` / `profile.page.ts:1661` (CV propio), `s3-storage.service.ts:40-43` (documentos por id: subsanación, validación de protocolo, evaluación).
- **Paso 0 pendiente de confirmar**: `evaluation-consolidation.page.ts` (rol que lo usa) y la pantalla de subsanación (rol) antes de cerrar la tabla.
- **Dependencias**: TSK-015-N17. **Va antes de TSK-015-N09**, en su propia rama.
- **Tests**: unitarias de la regla por prefijo (cada prefijo, `..`, desconocido, clave vacía); E2E con `ZZ_TEST_` y residuos 0; respuesta con `ResponseInterceptor` como `main.ts:39`. Casos: investigador no dueño → `404`; dueño → `200`; SECRETARIA/PRESIDENTE → `200` según permiso; evaluador no asignado → `404`; clave con `..` → `400`.
- **Mutaciones**: quitar la comprobación de prefijo; quitar la comprobación de dueño; con respaldo y hash, como N17.
- **Criterio de aceptación**:
  1. Ninguna clave se firma para quien no puede leer el recurso al que pertenece.
  2. `reception/document/:id/download-url` y `/view` no entregan URL a quien no puede leer el protocolo del documento.
  3. Las descargas legítimas de los consumidores listados siguen funcionando.

### Task TSK-015-N22b - [x] COMPLETADO (escritura: POST /storage/upload-url, hallazgo C escritura; commit de código 67b4dec)
- **Acción**: `MODIFICAR`
- **Archivos Afectados**: `src/modules/storage-access/infrastructure/controllers/storage.controller.ts` (antes `src/shared/storage/…`, movido en N22a); `src/modules/storage-access/application/storage-key-access.policy.ts` (`assertCanWrite`, reutiliza `parseStorageKey`, `canReadResolution`, `protocolRepository.findById`, `hasEvaluatorAssignment`); pruebas: `storage-key-access.policy.spec.ts` y `test/storage-access.e2e-spec.ts` (MODIFICAR, no archivos nuevos).
- **Descripción (hallazgo C, escritura)**: `POST /storage/upload-url` firma **una URL PUT para cualquier clave**, sin dueño ni permiso. Cualquier autenticado puede sobrescribir la carta de otro protocolo (`protocols/{id}/resolutions/…`), documentos de requisitos o de evaluación, o plantillas (`templates/…`). **Además**, `create-template.use-case.ts:18` y `upload-template-file.use-case.ts:15` del frontend suben plantillas por esta vía, **evitando el permiso `CONFIG_PLANTILLAS`** que sí protege `POST /documents/templates/:code/file` (`documents.controller.ts:69-70`).
- **Reglas de escritura** (decisiones de la usuaria, Paso 0 de N22b):
  - `protocols/{id}/requirements/…` (sin versión): solo el investigador principal, y solo si el protocolo está en BORRADOR (recepción 9, versión 1) o en subsanación documental (recepción 20). Otro usuario, incluida SECRETARIA → `404`. Principal en otro estado → `409 «El protocolo no admite subir documentos en su estado actual.»`.
  - `protocols/{id}/v{n}/requirements/…` (subsanación de versión): solo el principal, con el protocolo en 19 **o** 21 (EN_CONTROL_DOCUMENTAL), `n > 1` e igual a la versión activa, y recepción de esa versión en 9 (INICIADO) o 20 (REQUIERE_SUBSANACION_DOC). Recepción en 15, 10, 11 u otra → `409`; v1 activa o `n` distinto de la activa → `409`; otro usuario → `404`. (Corregida el 26/11/2026: la regla original exigía solo 19, pero el flujo real de subsanación deja el protocolo en 21; ver hallazgo abajo.)
  - `protocols/{id}/docEvaluacion/…`: solo el evaluador con asignación en ASSIGNED (6). Estados 5 y 7 → `404`.
  - `protocols/{id}/resolutions/…`: `RESOLUCION_CREAR`; sin el permiso → `403`. El bloqueo total de esta clave llega con TSK-015-N09 (N09 tendrá su propio `upload-url`).
  - `investigators/{id}/cv/…`: solo el propio investigador → si no, `404`.
  - `templates/…`: `CONFIG_PLANTILLAS` → sin el permiso `403`.
  - Cualquier otra subruta de `protocols/{id}/`, Anexo 9 (`evaluations/anexo9/`), prefijo desconocido → `404`. `..`, `draft/` o mal formada → `400`.
  - **Tipo de contenido** (validado antes de la autorización): `protocols/*` y CV → `application/pdf`; `templates/*` → DOCX. Otro valor → `400 «Tipo de contenido no permitido para esta clave.»`.
  - **Tamaño**: fuera de esta tarea (ver hallazgos de N22b).
  - **Subsanación de versión**: `parseStorageKey` clasificaba `protocols/{id}/v{n}/requirements/…` como `PROTOCOLO_EVALUACION`. Ahora se clasifica como `REQUISITO` con `version`. Efecto en lectura: el principal puede leer sus requisitos versionados por `GET /storage/download-url` (antes solo SECRETARIA y evaluadores); quien tenga `PROTOCOLOS_LISTAR` también los leerá fuera de BORRADOR, igual que el resto de requisitos.
  - **Desviación**: `PENDIENTE_SUBSANACION` del getter `receptionStatus` no se usa como regla. Es un valor por defecto que cubre cualquier estado no listado con versión 1 (por ejemplo, EN_REVISION), así que permitiría subir en estados que no son de subsanación. La regla usa el id de recepción 20.
  - **Principal**: se compara con `principalInvestigatorId`, que el ORM marca como deprecado (`protocol.entity.orm.ts:69, 76`) pero que ya usan `findOneForReader` y `canReadResolution`. Mantenemos la misma fuente para no divergir.
- **Dependencias**: TSK-015-N22a (comparte la regla). Va **después** de N22a.
- **Tests**: E2E con `ZZ_TEST_`: investigador no dueño → `404`; evaluador no asignado → `404`; plantilla sin `CONFIG_PLANTILLAS` → `404` o `403` (decidir); clave con `..` → `400`.
- **Mutaciones**: quitar la comprobación de escritura; quitar la de `templates/`.
- **Criterio de aceptación**:
  1. Nadie puede obtener una URL PUT para una clave ajena.
  2. Las subidas legítimas del frontend siguen funcionando (listadas en N22a).
  3. Las plantillas solo se suben con `CONFIG_PLANTILLAS`, también vía `upload-url`.
- **Resultados** (25/11/2026, `ceish_test_db`; commit de código 67b4dec):
  - Unitarias `storage-key-access.policy.spec.ts`: 71 pruebas en verde (37 de N22a + 34 nuevas de `assertCanWrite` y del parseo de `v{n}`). `npm test` completo: 73 suites, 809 pruebas en verde.
  - E2E `test/storage-access.e2e-spec.ts` con `--runInBand`: 27/27 en verde (15 de N22a + 12 nuevas de `POST /api/storage/upload-url`). Cuentas `ZZ_TEST_SA_`, doble de `IStorageService`. Residuos tras la suite: protocolos 0, usuarios 0, recepciones 0, asignaciones 0.
  - `npx tsc --noEmit`: sin errores. `npx eslint` sobre lo tocado: 0 errores; 1 aviso (`Unused eslint-disable directive` en la cabecera de `storage-key-access.policy.spec.ts`) que ya existía idéntico en `dev`.
  - Mutaciones (cada archivo restaurado y comprobado con `cmp` contra copia previa):

| Mutación | Qué se rompió | Prueba que falla | Resultado |
|---|---|---|---|
| 1 | Quitar `assertCanWrite` del controlador | E2E: SECRETARIA/otro investigador → 404; estados → 409; etc. | `Tests: 10 failed, 17 passed` (de 27) |
| 2 | Quitar `CONFIG_PLANTILLAS` en la rama `templates/` | «sin CONFIG_PLANTILLAS → 403» | `Tests: 1 failed, 70 passed` |
| 3 | Quitar la comprobación de asignación ASIGNADA en `docEvaluacion/` | «evaluador con asignación ASIGNADA (6) → permitido», «SUGERIDA (5) → 404», «COMPLETADA (7) → 404», «principal y SECRETARIA → 404» | `Tests: 4 failed, 67 passed` |
| 4 | Quitar la comprobación de estado de requisitos (`requisitoAdmiteSubida` devuelve `true`) | «recepción en revisión (15) → 409», «recepción 11 → 409», «BORRADOR con versión 2 → 409», «v2 con activa v1 → 409», «protocolo fuera de 19 → 409» | `Tests: 5 failed, 66 passed` |

  - Hallazgos registrados en la tarea siguiente (TSK-015-N24) y en «Hallazgos de seguridad de storage»: la divergencia del botón de subsanación con el servidor, y el bloqueo por requisito APROBADO/VALIDADO/NO_APLICA que solo aplica el frontend.
  - **Hallazgo (26/11/2026, corrección de N22b)**: la regla original de `v{n}/requirements` exigía protocolo en 19. El flujo real de subsanación (POST /resolutions tipo 2 y, por diseño, ANEXO_15) deja el protocolo en 21 y la v2 activa con recepción 9. Con la regla original, el principal recibía 409 al subir requisitos de la v2 en el flujo real; los tests existentes pasaban solo porque usaban un fixture manual en 19. Corregido: se acepta 19 o 21, con recepción 9 o 20 en la versión activa. Tests: unitarias (21+v2+9 y 21+v2+20 → permitido; 21+v2+15, v1 activa y n distinto → 409) y e2e «dictamen tipo 2 por POST /resolutions (sin UPDATE de estados)» → 201 y «recepción 15» → 409. El caso manual de 19 se eliminó de la e2e (lo cubre la unitaria). Mutación «exigir solo 19»: el e2e de flujo real falla (1 fallo, 27 pasan).

### Task TSK-015-N22c - [ ] PENDIENTE (recepción sin prefijo, legado y `draft/`)
- **Acción**: `MODIFICAR` (y, si hace falta, migración de datos)
- **Descripción**: 216 documentos de `recepcion.documentos` tienen solo nombre de archivo (sin prefijo); 62 tienen ruta local `/uploads…`; 2 tienen `draft/…`.
  - **Antes de codificar**: conteo de solo lectura de cuántos de los 62 `/uploads` existen en el bucket (`HeadObject`, sin mostrar nombres). Lo hace la usuaria o se ejecuta con su OK.
  - **`draft/`**: denegado por HTTP (`400`) hasta resolverlo en esta tarea.
  - **Sin prefijo**: el dueño sale de la fila (documento → versión → protocolo), como en N22a. Si la clave no está en ninguna tabla conocida y no tiene prefijo válido → `404`.
- **Dependencias**: TSK-015-N22a y TSK-015-N22b. **Va después de TSK-015-N09**.
- **Criterio de aceptación**: ninguna clave sin dueño identificable se firma; `draft/` → `400`; `/uploads` no existentes → `404`.

### Hallazgos de seguridad de storage (registrados en Paso 0 de N22, 25/11/2026)
- **Hallazgo C (lectura)**: `GET` y `POST /storage/download-url` firman cualquier clave. → **N22a**.
- **Hallazgo I (recepción por id)**: `reception/document/:id/download-url` y `/view` no comprueban dueño ni permiso. → **N22a**.
- **Hallazgo C (escritura)**: `POST /storage/upload-url` firma PUT para cualquier clave, incluidas plantillas sin `CONFIG_PLANTILLAS`. → **N22b** (hecho, 67b4dec).
- **Hallazgo N22b-1 (botón de subsanación, frontend)**: `subsanacion.page.ts:283-292` muestra «Subir» según `isInvestigador()` y `!isRequirementLocked(req)` (`:1057-1068`). Esa condición mira solo el estado del requisito, no el del protocolo. El servidor ya rechaza con `409` fuera de BORRADOR / REQUIERE_SUBSANACION_DOC / REQUIERE_SUBSANACION_VERSION. → **TSK-015-N24**.
- **Hallazgo N22b-2 (co-investigadores)**: `protocol.controller.ts:196-198` admite co-investigadores en `POST /protocols/:id/upload-document`. RF-02.10 y la decisión de N22b dicen que solo sube el investigador principal. **No se cambia en N22b**; el alta de la diferencia queda para una tarea aparte (decidir si se elimina la rama de co-investigador en el registro de documentos).
- **Hallazgo N22b-3 (bloqueo por requisito, servidor)**: el bloqueo de re-subida de un requisito APROBADO / VALIDADO / NO_APLICA (`isRequirementLocked`) solo lo aplica el frontend. `POST /protocols/:id/upload-document` y `POST /storage/upload-url` no lo comprueban. Tarea futura, no en N22b.
- **Hallazgo N22b-4 (tamaño)**: el adaptador S3 no fija `ContentLength` en la URL PUT, así que el servidor no limita el tamaño. Los límites del frontend son de cliente (10 MB, 5 MB para el CV, 20 MB en algunos anexos). Fuera de N22b; requiere cambiar el adaptador.
- **Hallazgo N22b-5 (DOCX en requisitos)**: el frontend acepta DOCX en algunos anexos (`anexos-pet.constants.ts:36`, `upload-documentos.component.ts:420`), pero `POST /protocols/:id/upload-document` solo acepta PDF (`protocol.controller.ts:183`). Con N22b un DOCX de requisito falla con `400` al pedir la URL. → **TSK-015-N24** (restringir a PDF en frontend).

### Task TSK-015-N24 - [ ] PENDIENTE (frontend, repo aparte; dependencia: TSK-015-N22b)
- **ID Único**: `TSK-015-N24`
- **Requisito Relacionado**: `RF-17.6` (spec-003 v1.6.4), decisiones de N22b (Paso 0, 25/11/2026).
- **Acción**: `MODIFICAR` en `D:\Frontend-CEISH\ceish-espoch-frontend\src` (fuera de este repo; no tocar desde el backend).
- **Descripción**:
  1. Quitar la subida de requisitos en `protocol-validation-detail.page.ts:1344` (SECRETARIA no escribe en `requirements/`; la regla de N22b devuelve `404`).
  2. Restringir a PDF las subidas de requisitos: `anexos-pet.constants.ts:36` (quitar DOCX) y `upload-documentos.component.ts:420` (quitar el mapeo DOCX).
  3. Hallazgo N22b-1: el botón «Subir» de `subsanacion.page.ts:283-292` debe exigir además el estado del protocolo (BORRADOR, REQUIERE_SUBSANACION_DOC o REQUIERE_SUBSANACION_VERSION) y mostrar el mensaje del `409` («El protocolo no admite subir documentos en su estado actual.») si el servidor lo devuelve.
- **Dependencias**: TSK-015-N22b (hecha, 67b4dec).
- **Criterio de aceptación**:
  1. SECRETARIA no tiene ninguna subida de requisitos.
  2. Un DOCX no se ofrece como requisito.
  3. El botón «Subir» de subsanación no aparece fuera de los estados permitidos, y un `409` se muestra en español.
- **Hallazgo Evaluador / tarea B7 (Anexo 9 por id)**: `GET /evaluations/:id/document` y `…/document/docx` (`evaluations.controller.ts:318-338`, con `EVALUATION_VIEW_MINE` = `EVALUACION_PLENO`, que tienen EVALUADOR, SECRETARIA y PRESIDENTE) **no comprueban que la evaluación sea del usuario**: el controlador pasa solo el `id` y `getEvaluationDocumentUrl` (`evaluations.service.ts:1903-1948`) resuelve por id, comprueba solo que exista `rutaPdf`, y firma. Cualquier evaluador ve el Anexo 9 de otro. → **N22a** (regla "dueño de la evaluación").

### Task TSK-015-N23 - [ ] PENDIENTE (frontend, repo aparte)
- **ID Único**: `TSK-015-N23`
- **Requisito Relacionado**: `RF-17.6` (spec-003 v1.6.4), hallazgo de TSK-015-N17.
- **Acción**: `MODIFICAR` en `D:\Frontend-CEISH\ceish-espoch-frontend\src` (fuera de este repo).
- **Descripción**: `subsanacion.page.ts:1362-1368` hace fallback a la clave fija `protocols/{id}/resolutions/Carta_Resolucion_Consolidada.pdf` cuando falla `GET /resolutions/protocol/:id`. Con N17, un `404` de otro investigador dispara esa descarga. No debe hacer fallback: debe mostrar un mensaje en español («No se encontró la resolución de este protocolo.» o similar, a confirmar con la usuaria).
- **Dependencias**: TSK-015-N17 (y, para cerrar la descarga, TSK-015-N22).
- **Criterio de aceptación**:
  1. Un `404` de `GET /resolutions/protocol/:id` no genera ninguna descarga.
  2. El mensaje se muestra en español.

### Task TSK-015-N18 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N18`
- **Requisito Relacionado**: `RF-17.4` y `RF-17.2` (spec-003 v1.6.4, `POST /resolutions` legacy)
- **Criterio EARS**: `EARS 5` (RF-17.4): **cuando** la Secretaría suba una carta firmada, **el sistema debe** hacerlo solo por el flujo de cartas por versiones.
- **Acción**: `MODIFICAR` (eliminar el handler `POST /resolutions`)
- **Archivos Afectados**:
  - `src/modules/resolutions/infrastructure/controllers/resolutions.controller.ts` — MODIFICAR: quitar `@Post()` y `create`.
  - `src/modules/resolutions/application/services/resolutions.service.ts` — MODIFICAR: quitar `createResolution` y sus ramas de estado (líneas 139-237), si ya no tiene llamadas.
  - Frontend (repo aparte, fuera de este repo): `resolution-api.adapter.ts`, `generate-and-submit-resolution.use-case.ts` y `emit-consolidated-resolution.use-case.ts` dejan de llamar a `POST /resolutions`.
- **Dependencias**: TSK-015-N09 (flujo nuevo en producción) y el cambio de frontend correspondiente. **No se hace hasta que el frontend use el flujo nuevo.**
- **Descripción**: retiro del endpoint legacy. Riesgo abierto mientras exista: puede cambiar el estado del protocolo a partir del agregado de dictámenes.
- **Tests**: E2E: `POST /resolutions` responde `404`/`405`; el resto del módulo sigue igual.
- **Criterio de aceptación**:
  1. Ninguna ruta de estado depende del agregado de dictámenes.
  2. El frontend no llama a `POST /resolutions` (verificado con búsqueda en su repo).

### Task TSK-015-N19 - [ ] PENDIENTE (futura, no se inicia)
- **ID Único**: `TSK-015-N19`
- **Requisito Relacionado**: carta de exención, Anexo 12 (verificado en el PET, índice de anexos, pág. 84; spec-003 v1.6.1, pendiente del frontend).
- **Acción**: a definir.
- **Descripción**: los protocolos EX (exentos de revisión) no pasan por el pleno (RF-17.2). Su carta de exención (Anexo 12) queda fuera de RF-17 y necesita diseño propio: quién la sube, qué estado asigna y si usa `resolucion.cartas_firmadas`. Pendiente también el rótulo «Anexo 12» en el frontend.
- **Criterio de aceptación**: se define en su propia especificación antes de tocar código.

### Task TSK-015-N20 - [x] COMPLETADO (rama feat/tsk-015-n09-n13-carta-firmada, commit `dc69b66`)
- **Orden (aprobado 26/11/2026)**: commit aparte al final de la rama `feat/tsk-015-n09-n13-carta-firmada`, después de N13.
- **ID Único**: `TSK-015-N20`
- **Requisito Relacionado**: `RF-17.2` (EX fuera de RF-17, spec-003 v1.6.4); seguimiento de TSK-015-N08.
- **Criterio EARS**: `EARS 5` (RF-17.2): **cuando** el estudio sea EX, **el sistema debe** rechazar el registro del resultado del pleno con `409` en español.
- **Acción**: `MODIFICAR`
- **Archivos Afectados**: el caso de uso y el controlador del `PATCH .../protocolos/:convocatoriaProtocoloId/resultado` de TSK-015-N08 (ubicar con Grep antes de tocar; no fijado aquí).
- **Dependencias**: TSK-015-N08.
- **Descripción**: N08 no rechaza hoy los protocolos EX. Se añade la validación de `tipo_estudio_id` → código `EX`.
- **Tests**: unitaria y E2E: registrar resultado para EX → `409`; para otro estudio, sin cambio.
- **Criterio de aceptación**:
  1. EX → `409` con mensaje en español.
  2. Los demás estudios no cambian.
- **Resultados** (26/11/2026, `ceish_test_db`, commit `dc69b66`):
  - Unitaria `registrar-resultado-pleno.use-case.spec.ts`: 19 en verde, incluidas EX → 409 en español sin escritura y EC sin cambio.
  - E2E `meetings-resultado-pleno.e2e-spec.ts`: 12 en verde, incluido EX → 409 en español, sin historial ni dictamen.
  - Mutación (quitar la comprobación EX): 1 fallo en la unitaria y 1 en la e2e. Restaurado y verificado con `cmp`.
  - Reutiliza `esEstudioExento` de `carta-firmada-rules.ts` (la capa de evaluaciones importa una función pura de resoluciones; anotado).

### Task TSK-015-N25 - [x] COMPLETADO (commits 629fcc4 ventana, c54d80d pipe, 6c78e0a contexto)
- **Resultados (26/11/2026)**: `npx tsc --noEmit` sin errores; `npx eslint` sobre lo tocado sin errores; `npm test` 77 suites / 874 tests en verde; e2e `resolutions-contexto`, `cartas-firmadas`, `meetings-resultado-pleno`, `resolutions-permisos`: 4 suites / 56 tests en verde en total (`resolutions-contexto` 11/11 verificado por separado), con residuos 0.
- **Mutaciones** (todas detectadas): motivo visible al investigador (2 fallos en unitarias, 2 en e2e); acceso ajeno sin 404 (1 y 1); quitar la comprobación de EX (1 y 1); quitar la ventana (2 y 1); quitar el mensaje de `exceptionFactory` del pipe de UUID (2 e2e) y del `ParseIntPipe` del contexto (1 e2e).
- **Desviaciones registradas**: `ResolutionsController` inyecta `CartasFirmadasService` para la ruta nueva (mismo módulo). El id de protocolo se valida con `ParseIntPipe` + `< 1` → 400 «ID de protocolo inválido».
- **Cross-module**: `evaluations` importa `esEstudioExento` de `resolutions` (ya marcado en N20) y `resolutions` importa `evaluarVentanaResultadoPleno` de `evaluations/domain`. Dependencia bidireccional de módulos sin ciclo de imports; pendiente revisar en una tarea futura.
- **ID Único**: `TSK-015-N25`
- **Requisito Relacionado**: `RF-17.1`, `RF-17.4`, `RF-17.6` (spec-003 v1.6.7)
- **Criterio EARS**: `EARS 5` (RF-17.1, RF-17.4, RF-17.6)
- **Acción**: `CREAR` la ruta de lectura `GET /api/resolutions/protocol/:protocolId/contexto` (etapa Resolución del frontend). `MODIFICAR` los controladores de cartas y del PATCH de resultado para usar el pipe compartido.
- **Archivos Afectados**:
  - `src/shared/pipes/uuid-param.pipe.ts` — CREAR (aprobado 26/11/2026): `ParseUUIDPipe` con `exceptionFactory` que responde «Identificador inválido.». Lo usan `cartas-firmadas.controller.ts` y el PATCH de `meetings.controller.ts`.
  - `src/modules/evaluations/domain/services/ventana-resultado-pleno.ts` — CREAR (aprobado 26/11/2026): función pura de la ventana de registro (convocatoria no `CANCELADA` y `fecha_reunion` ≤ hoy en America/Guayaquil), extraída de `RegistrarResultadoPlenoUseCase` sin cambio de comportamiento.
  - `src/modules/evaluations/domain/services/ventana-resultado-pleno.spec.ts` — CREAR: pruebas de esa función.
  - `src/modules/evaluations/application/use-cases/registrar-resultado-pleno.use-case.ts` — MODIFICAR: usa la función pura; sus pruebas deben seguir verdes sin cambios.
  - `src/modules/resolutions/application/services/cartas-firmadas.service.ts` — MODIFICAR: método `contextoProtocolo(protocoloId, lector)`.
  - `src/modules/resolutions/infrastructure/controllers/resolutions.controller.ts` — MODIFICAR: ruta `GET protocol/:protocolId/contexto`.
  - `src/modules/resolutions/infrastructure/controllers/cartas-firmadas.controller.ts` — MODIFICAR: pipe compartido.
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts` — MODIFICAR: pipe compartido en el PATCH de resultado.
  - `src/modules/resolutions/application/services/cartas-firmadas.service.spec.ts` — MODIFICAR: pruebas de visibilidad y de `contextoProtocolo`.
  - `test/resolutions-contexto.e2e-spec.ts` — CREAR: e2e con login real de cuatro roles.
- **Dependencias**: TSK-015-N08 (resultado), TSK-015-N09 (`cartas_firmadas`), TSK-015-N20 (EX).
- **Respuesta**: lista de convocatorias del protocolo, ordenada por `fecha_reunion` descendente (lista completa, sin filtro). Cada elemento:
  - `convocatoriaId`, `convocatoriaProtocoloId`, `numeroConvocatoria`;
  - `fechaReunion`: ISO 8601 de `fecha_reunion` (timestamptz);
  - `versionEvaluada`: `numero_version` de `convocatoria_protocolos.version_id`;
  - `resultado`: `dictamen_resultado` o `null`;
  - `anexoEsperado`: `anexoParaResultado` de `carta-firmada-rules`; `null` si EX o sin resultado;
  - `cartaVigente`: `{ numeroVersion, anexoCodigo, subidoEn, claveArchivo }` o `null`;
  - `puedeRegistrarResultado`, `puedeSubirCarta`;
  - `motivo` y `observaciones`: solo para lectores con `RESOLUCION_HISTORIAL`.
- **Acceso** (aprobado): igual que `canReadResolution` (investigador principal o `RESOLUCION_HISTORIAL`). Cualquier otro → `404 «Protocolo no encontrado.»`. Id no entero positivo → `400 «ID de protocolo inválido»`. Protocolo inexistente → `404` con el mismo mensaje.
- **Visibilidad por rol** (aprobada):
  - Investigador principal: `resultado` y `anexoEsperado` solo si hay carta vigente para esa convocatoria. Nunca `motivo`, `observaciones`, `subidoPor`, `motivoReemplazo` ni datos de evaluadores. `cartaVigente` sin `subidoPor` ni `motivoReemplazo`.
  - `RESOLUCION_HISTORIAL` (SECRETARIA, PRESIDENTE): todo, incluidos `motivo` y `observaciones`.
- **Reglas de los botones** (aprobadas):
  - `puedeRegistrarResultado` = `PLENO_RESULTADO_REGISTRAR` && ventana (función pura) && no EX. Solo SECRETARIA tiene el permiso hoy.
  - `puedeSubirCarta` = `RESOLUCION_CREAR` && `resultado` ≠ null && `anexoEsperado` ≠ null. No aplica la ventana; el reemplazo de una carta vigente se permite (la subida exige motivo).
- **Clave del archivo** (aprobado): `claveArchivo` solo dentro de `cartaVigente`. Sirve para `/storage/download-url`, que aplica la regla `CARTA_FIRMADA`.
- **Pruebas**:
  - Unitarias: visibilidad por rol, `puedeRegistrarResultado`, `puedeSubirCarta`, proyección de `cartaVigente` y la función pura de ventana.
  - E2E `test/resolutions-contexto.e2e-spec.ts` con login real de SECRETARIA, PRESIDENTE, INVESTIGADOR principal e INVESTIGADOR ajeno (→ 404). Datos `ZZ_TEST_`, residuos 0, `ResponseInterceptor`. Casos: sin carta (principal sin `resultado` ni `anexoEsperado`); con carta (principal ve `cartaVigente` sin `subidoPor`); SECRETARIA ve `motivo` y `observaciones`; EX → `anexoEsperado` null y `puedeSubirCarta` false; id inválido → 400 «ID de protocolo inválido»; id no UUID en cartas y en el PATCH → 400 «Identificador inválido.».
- **Mutaciones**: quitar el filtro de visibilidad de `motivo` para el investigador; quitar `canReadResolution`; quitar la comprobación de EX en `puedeRegistrarResultado`; quitar la ventana; quitar el `exceptionFactory` del pipe.
- **Criterio de aceptación**:
  1. Un ajeno recibe 404 con el mensaje de acceso.
  2. El investigador nunca recibe `motivo`, `observaciones`, `subidoPor` ni `motivoReemplazo`.
  3. Los botones solo se activan según permiso, ventana y EX.
  4. `claveArchivo` solo aparece dentro de `cartaVigente`.
  5. Los ids no UUID en cartas y en el PATCH responden 400 «Identificador inválido.».

### Task TSK-015-N27 - [ ] PENDIENTE (Paso 0 aprobado 27/11/2026; spec-003 v1.6.8; sin migración)
- **ID Único**: `TSK-015-N27`
- **Requisito Relacionado**: `RF-17.1 v1.6.8` (resultado calculado e inmutable), `RF-17.2`, `RF-17.4`, `RF-17.7` (spec-003 v1.6.8). Reemplaza la decisión 3 de RF-17.1 (registro manual por la Secretaría, TSK-015-N08).
- **Criterio EARS**: `EARS 5` (RF-17.1 v1.6.8, RF-17.2, RF-17.4)
- **Decisiones aprobadas (27/11/2026)**:
  1. Mapeo de `evaluacion.evaluaciones.resultado_id`: todos 1 → `APROBADO_DEFINITIVO`; todos 3 → `NO_APROBADO`; cualquier otro caso, incluido «todos 2», → `APROBADO_CON_CONDICION`. Precondición: asignaciones activas (5, 6, 7) todas en 7, al menos una completada y todas con `resultado_id` no NULL; si no, `PENDIENTE`.
  2. Momento: sin carta vigente el resultado se calcula al leer y se muestra como `CALCULADO` (no persistido). En la **primera** carta de la convocatoria-protocolo el backend recalcula dentro de la transacción (con bloqueo), deriva el anexo y congela el resultado en `resolucion.cartas_firmadas.resultado`. Un reemplazo usa el resultado de la carta vigente anterior y no recalcula.
  3. No se escribe `cp.dictamen_resultado`, `dictamen_motivo`, `dictamen_observaciones` ni `convocatoria_protocolo_resultados` en el flujo nuevo. Quien registra = `subido_por`. Sin migración, sin usuario de sistema, sin textos generados.
  4. `PATCH …/resultado` (N08) responde `410 Gone` con mensaje en español. Tabla de historial y permiso `PLENO_RESULTADO_REGISTRAR` se conservan (limpieza en otra tarea).
  5. Bloqueo legacy: fila en `resolucion.resoluciones` para `cp.version_id` y sin carta en `cartas_firmadas` para ese cp → carta 409 y contexto expone `resolucionAnterior`.
  6. El cliente no envía `anexoCodigo` (se quita de `SolicitarSubidaCartaDto` y de `RegistrarCartaFirmadaDto`).
  7. Contexto N25: se quita `puedeRegistrarResultado`; se añaden `estadoResultado` (`PENDIENTE` | `CALCULADO` | `CONGELADO` | `RESUELTO_LEGACY`), `resultadoCalculado` y `resumenDictamenes { aprobado, conCondicion, noAprobado, pendientes }` por conteo, sin identidad (B8). Investigador: sin cambios (resultado solo con carta vigente; no ve el resumen ni los pendientes).
- **Subtareas** (orden de la propuesta G del Paso 0; sin el paso de migración):
  - **N27-0 — guard de reasignación (primer commit de código, aprobado 27/11/2026)**: `ReassignEvaluatorUseCase` responde `409` («No se puede reasignar una evaluación que ya fue enviada.») si la asignación está en estado 7. Verificado: ningún flujo de `dev` reasigna asignaciones en 7 (la UI solo ofrece `SUGGESTED`/`ASSIGNED`, `active-assignment-view.util.ts:56-57`; las e2e reasignan en `ASSIGNED`).
  - **N27-3 — regla pura**: `calcularResultadoPleno` en `src/modules/evaluations/domain/` (nombre distinto de `determineResolutionType`, que no se toca). Mover `ACTIVE_ASSIGNMENT_STATES` (hoy privada en `meeting-typeorm.repository.ts:52-56`) a dominio para reutilizarla. Pruebas unitarias de la regla y de la precondición.
  - **N27-4 — cálculo al leer y congelación**: lectura del dictamen calculado para el contexto; en `registrar` de `cartas-firmadas.service.ts` (hoy lee `cp.dictamen_resultado` en `:186-199`) recalcular bajo bloqueo y guardar `resultado` en la fila de la carta. Derivar el anexo del resultado congelado. Puente a `resoluciones` con `observaciones = null` (`cartas-firmadas.service.ts:275-283`, `:625-650`; columna nullable).
  - **N27-5 — N08 a 410**: `PATCH …/resultado` (`meetings.controller.ts:172-210`) responde 410 con mensaje en español. Retirar `RegistrarResultadoPlenoUseCase` y su DTO solo si no quedan referencias (`git grep`); la tabla de historial y el permiso se conservan.
  - **N27-6 — carta**: quitar `anexoCodigo` de los DTOs (`dtos/cartas-firmadas.dto.ts`); `solicitarSubida` y `registrar` derivan el anexo; bloqueo legacy por versión (`409`). Con `GlobalValidationPipe` (`whitelist` + `forbidNonWhitelisted`, `shared/pipes/validation.pipe.ts`), un cliente que todavía envíe `anexoCodigo` recibirá `400` (no ejecutado: verificar en e2e).
  - **N27-7 — contexto N25**: quitar `puedeRegistrarResultado` (`cartas-firmadas.service.ts:430-437`); añadir `estadoResultado`, `resultadoCalculado` y `resumenDictamenes`; el investigador no ve el resumen ni los pendientes.
  - **N27-8 — frontend (repo aparte, después de N27-5/6/7)**: `endpoints.constant.ts:84` (PATCH N08), `IResolucionContextoPort.ts:15`, `subir-carta-firmada.use-case.ts:59` (deja de enviar `anexoCodigo`), `resolution-stage.page.ts` y `mapper/resolucion-contexto.mapper.ts`. Coordinar el despliegue: el frontend actual rompe con `400` al enviar `anexoCodigo`.
- **Dependencias**: TSK-015-N25 (contexto). Sin dependencia de migración.
- **Archivos afectados**:
  - `src/modules/evaluations/domain/services/calcular-resultado-pleno.ts` — CREAR (N27-3): función pura `calcularResultadoPleno`. Buscado antes: `determineResolutionType` (legacy, no se toca), `ventana-resultado-pleno.ts` (otra regla), `EvaluatorDictamen` (reutilizado para 1/2/3).
  - `src/modules/evaluations/domain/services/calcular-resultado-pleno.spec.ts` — CREAR (N27-3): pruebas de la regla.
  - Modificados sin archivos nuevos: `reassign-evaluator.use-case.ts` y su spec (N27-0); `assignment-status.enum.ts` (exporta `ACTIVE_ASSIGNMENT_STATES`, N27-3); `meeting-typeorm.repository.ts`, `meetings.controller.ts` y sus pruebas (N27-5); `cartas-firmadas.service.ts`, `cartas-firmadas.dto.ts` y sus pruebas, `carta-firmada-rules.ts` (N27-6, N27-7); e2e `meetings-resultado-pleno`, `cartas-firmadas`, `resolutions-contexto`.
- **Lectores de `cp.dictamen_*` hoy** (Paso 0, 27/11/2026): `meeting-typeorm.repository.ts:702-779` (N08, sale de uso); `registrar-resultado-pleno.use-case.ts` (N08, sale de uso); `cartas-firmadas.service.ts:186-199` (`registrar`), `:279` (puente), `:378` y `:402-446` (contexto), `:458-477` (`cargarContexto`); `calls.service.ts:483-484` (legacy, compara con `'APROBADO_CON_CONDICIONES'` y `'25'`, nunca coincide; no se toca). Tras N27-4 y N27-7 el flujo nuevo no lee `dictamen_*`; las columnas quedan sin escritura.
- **Verificación del Paso 0 (27/11/2026)**:
  - Edición tras envío: el reenvío de una evaluación en estado 7 responde 400 (`evaluations.service.ts:342-345`); no hay otra vía que cambie `resultado_id`. El `saveEvaluation` de `evaluations.service.ts:644` repite el valor existente al guardar los PDF (no cambia el resultado).
  - `asignaciones_evaluacion.recommendation` (`src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts:120`, `evaluations.service.ts:747`) duplica el dictamen. La fuente de la regla es `evaluaciones.resultado_id`.
  - Conteos en `ceish_db` (solo lectura): 12 convocatoria-protocolos, todas con `dictamen_resultado` NULL; 0 filas en `convocatoria_protocolo_resultados`; 0 en `cartas_firmadas`; 8 en `resolucion.resoluciones`; 2 convocatoria-protocolos calculables hoy; 10 con alguna activa sin completar; 0 sin activas; 0 con estado 5.
  - Las 5 evaluaciones con `resultado_id` NULL (ids 1, 3, 4, 5, 6) pertenecen a la asignación 15-19, todas en estado 7, en la versión 118, que **no** está en ninguna convocatoria. No afectan el cálculo de hoy.
  - Protocolo legacy confirmado: **169** (cp `8848f644-02ad-4401-8f1f-faa6b83fcaf1`, resolución 8, tipo 1). Es la única convocatoria-protocolo cuya versión tiene fila en `resolucion.resoluciones`.
  - Puente: `resolucion.resoluciones.observaciones`, `tipo_resolucion_id` y `creado_por` son nullable; las columnas `dictamen_*` de `convocatoria_protocolos` también.
  - `ValidationPipe` global: `whitelist`, `forbidNonWhitelisted`, `transform` (`src/shared/pipes/validation.pipe.ts`, `main.ts:40`).
- **Hallazgos (fuera de N27)**:
  - **Reasignación sin guard de estado**: `reassign-evaluator.use-case.ts` no valida el estado actual; una asignación en 7 puede pasar a 26/27 y salir del conjunto activo. Tarea aparte; hasta resolverla, el cálculo puede cambiar antes de la primera carta.
  - **Fuga de lectura**: `GET /api/resolutions/protocol/:id` (`resolutions.controller.ts:84-94`) devuelve la entidad ORM completa con las relaciones `protocol` y `version` (`resolutions.service.ts:285-307`), sin DTO. Pendiente revisar qué campos expone y tarea aparte (gravedad no verificada).
  - **Limpieza N08** (tarea aparte): tabla `evaluacion.convocatoria_protocolo_resultados`, permiso `PLENO_RESULTADO_REGISTRAR`, columnas `dictamen_*` y sus CHECK.
  - **5 evaluaciones sin dictamen** (ids 1, 3, 4, 5, 6; versión 118 fuera de convocatoria): revisar si son datos de prueba antes de limpiar.
- **Tests afectados**: unitarias `registrar-resultado-pleno.use-case.spec.ts`, `ventana-resultado-pleno.spec.ts`, `cartas-firmadas.service.spec.ts`, `carta-firmada-rules.spec.ts`, `resolutions.service.spec.ts`, `meetings.controller.spec.ts:433-442`, `convocatoria-protocolo.orm-entity.spec.ts`. E2E: `meetings-resultado-pleno`, `cartas-firmadas`, `resolutions-contexto`, `resolutions-permisos`, `resolutions-legacy-v1-v3`, `resolutions-legacy-v2`. `storage-access` no verificado.

### Task TSK-015-N21 - [ ] PENDIENTE (frontend, repo aparte)
- **ID Único**: `TSK-015-N21`
- **Requisito Relacionado**: `RF-17.7` (spec-003 v1.6.4), tras TSK-015-N11.
- **Acción**: `MODIFICAR` en `D:\Frontend-CEISH\ceish-espoch-frontend\src` (fuera de este repo).
- **Descripción**: PRESIDENTE ya no puede crear resoluciones (403 desde N11). Ajustar lo que todavía lo ofrece:
  - `src/features/resolutions/routes.ts:26`: la ruta `generator` acepta `['SECRETARIA', 'PRESIDENTE']`; dejarla solo para SECRETARIA o mostrar el estado de solo lectura.
  - `src/features/resolutions/presentation/pages/resolution-generator/resolution-generator.page.ts:75`: botón «Emitir Dictamen» sin control de permiso.
  - `src/features/evaluations/presentation/pages/evaluation-consolidation/evaluation-consolidation.page.ts:340`: botón «Firmar y Notificar» sin control de permiso.
  - `src/features/evaluations/routes.ts:99` y `:108`: rutas de consolidación con `RESOLUCION_CREAR` en `any` (PRESIDENTE entra por `EVALUACION_INFORMES`; revisar si se quiere solo lectura).
- **Criterio de aceptación**: PRESIDENTE no ve acciones de creación de resoluciones y ve la resolución en solo lectura (`RESOLUCION_HISTORIAL`).

## Hallazgos abiertos (tareas futuras)

- **Zona horaria en `BusinessDayCalculator.calculateDeadline` (26/11/2026)**: devuelve medianoche UTC del día de calendario de Ecuador (`src/shared/services/deadline-calculator.service.ts`). TypeORM escribe las partes **locales** de un `Date` en columnas `date`, así que en un proceso con zona distinta de Ecuador guarda el día anterior. Es el mismo riesgo que se corrigió en `fecha_aprobacion` (TSK-015-N13, commit `0a19728`). Tarea futura: revisar los usos de `calculateDeadline` y de las columnas `date` que lo reciben, y decidir si se construye medianoche local con el día de Ecuador. No se toca en N13 ni en N20.

## Orden de ejecución (decisión 25/11/2026)

1. PR de docs (esta rama): spec v1.6.4 y este archivo.
2. TSK-015-N11: quitar `RESOLUCION_CREAR` a PRESIDENTE (solo datos).
3. TSK-015-N17: restringir `GET /resolutions/protocol/:id` (hecha, commit 8ceb016).
4. TSK-015-N22a: restringir lectura de `/storage/download-url` (GET y POST) y de `reception/document/:id` por la regla de prefijo y dueño (rama propia). Antes de N09.
5. TSK-015-N22b: restringir escritura de `/storage/upload-url` (hallazgo C, escritura), con la misma regla. Antes de N09.
6. TSK-015-N14: sembrar ANEXO_13 a 16 (solo datos).
7. TSK-015-N15: constante de 96 h.
8. TSK-015-N09 + TSK-015-N13: mismo PR, commits separados (N09 primero). Incluye N20 si EX se valida en el registro.
9. TSK-015-N22c: recepción sin prefijo, `/uploads` y `draft/` (después de N09).
10. TSK-015-N12: correo y Anexo 9 sin datos del evaluador (incluye la auditoría de respuestas del investigador y el hallazgo de N17 sobre columnas de `protocol`). Incluye el cierre del hallazgo Evaluador / tarea B7 si no se resuelve en N22a.
11. TSK-015-N10: fila «Subir resolución firmada».
12. TSK-015-N18: retirar `POST /resolutions` **cuando el frontend ya use el flujo nuevo**.
13. TSK-015-N19: carta de exención, en su propia especificación.

Frontend (repo aparte, fuera de esta secuencia): TSK-015-N21 (acciones de PRESIDENTE) y TSK-015-N23 (sin fallback a la clave fija en subsanaciones).

Tareas que tocan `resolutions.service.ts`: N09 (no lo modifica, pero N13 sí), N12 (correo), N13 (líneas 203-237), N18 (legacy). Hacerlas en secuencia para evitar conflictos.

## Preguntas abiertas (Paso 0 — confirmar con la usuaria)

1. ~~Registro del resultado (TSK-015-N08)~~ **Cerrada 24/11/2026**: ruta, payload, permiso `PLENO_RESULTADO_REGISTRAR`, ventana, historial y supuesto de Sección II aprobados (RF-17.1 de spec-003 v1.6.2). El frontend usa solo Meetings.
2. ~~«Aprobado con condición»~~ **Cerrada 24/11/2026**: `dictamen_resultado = APROBADO_CON_CONDICION`; el estado tras el Anexo 15 es 19 (`REQUIERE_SUBSANACION_VERSION`); el 25 queda sin uso.
3. ~~Versión de la carta (TSK-015-N09)~~ **Cerrada 25/11/2026**: tabla propia `resolucion.cartas_firmadas`; `resolucion.resoluciones` queda legacy. Clave por versión generada por el backend (spec-003 v1.6.4, RF-17.4).
4. ~~Plazo de RF-17.5~~ **Cerrada**: se usa `plazo_condicion_dias` = 30 con el cálculo actual; no se cambia (ver pregunta 9).
5. **Anexo 9 «ya sin nombre»**: la usuaria lo indicó, pero `dev` lo incluye. ¿En qué rama está esa versión?
6. **Respuestas del investigador (TSK-015-N12)**: lista de endpoints que consume el investigador, para auditar nombre, correo y `userId` del evaluador. **Se resuelve en el Paso 0 de TSK-015-N12.**
7. ~~SUSPENDIDO en la sección II~~ **Cerrada**: la fila se mantiene en RF-09.2; `SUSPENDIDO` solo aplica a la Sección III y nunca a la Sección II.
8. **Frontend**: además del rótulo «Anexo 12», ¿hay otras pantallas con rótulos de anexos por corregir?
9. **Días hábiles (TSK-015-N13)**: AGENTS.md dice que los días hábiles se calculan solo con `BusinessDayCalculator`, pero `protocol-deadline.service.ts` usa un `addBusinessDays` propio (salta fines de semana, sin feriados). Confirmar qué cálculo se usa para `plazo_condicion_dias`.
10. **Cierre canónico (TSK-015-N16)**: ¿qué permiso protege el cierre (propuesta `PLENO_CERRAR`, solo SECRETARIA) y el cierre pasa la convocatoria a `CONCLUIDA`? Hoy solo el legacy lo hace (`calls.service.ts:472`).
11. **Conteo previo a la migración de esquema (TSK-015-N08)**: la usuaria corre en `ceish_db` la consulta de conteo de `dictamen_resultado`. Si hay valores no NULL, el CHECK fallaría y se decide antes de aplicar.
