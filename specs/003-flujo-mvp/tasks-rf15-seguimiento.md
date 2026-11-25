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

### Task TSK-015-N09 - [ ] PENDIENTE
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
  - `src/shared/storage/domain/ports/storage.service.port.ts` y `src/shared/storage/infrastructure/adapters/s3-storage.adapter.ts` — **sin cambios**: se reutilizan `generateUploadUrl` y `getMetadata` (HeadObject).
  - Pruebas: `src/modules/resolutions/application/services/carta-firmada-rules.spec.ts` y `cartas-firmadas.service.spec.ts` (CREAR); `test/cartas-firmadas.e2e-spec.ts` (CREAR).
  - **No se modifica** `resolution.entity.orm.ts`, `determineResolutionType` ni `calls.service.ts`. Tampoco `resolutions.service.ts`: la lógica nueva vive en el servicio nuevo. El tipo calculado por dictámenes queda como referencia (RF-17.1).
- **Dependencias**: TSK-015-N08 (resultado del pleno), TSK-015-N11 (quitar `RESOLUCION_CREAR` a PRESIDENTE), TSK-015-N14 (anexos ANEXO_13 a 16 sembrados), TSK-015-N17 (lectura restringida del legado). Se entrega **junto con TSK-015-N13** (misma rama y PR, commits separados; N09 primero).
- **Descripción**: Cada carta firmada se guarda como versión nueva en `resolucion.cartas_firmadas`. `numero_version` es un entero (1, 2, 3…) independiente por protocolo y convocatoria, distinto de la versión del protocolo de RF-14. Reemplazar exige `motivoReemplazo`, marca la anterior como no vigente y la conserva. La clave del archivo la genera el backend (`protocols/{protocolId}/resolutions/{convocatoriaProtocoloId}/v{n}/{uuid}.pdf`). El investigador ve solo la versión vigente, sin datos del evaluador.
- **Flujo**:
  1. `POST …/cartas/upload-url` → valida `RESOLUCION_CREAR`, resultado del pleno (N08), anexo ↔ resultado y tipo de estudio, y que el estudio no sea EX; devuelve `{ uploadUrl, claveArchivo }`. No registra nada.
  2. `POST …/cartas` con `{ claveArchivo, anexoCodigo, motivoReemplazo? }` → verifica prefijo exacto, `HeadObject` (existe, `application/pdf`, ≤ 10 MB), anexo, y motivo si hay vigente; crea la versión y cambia el estado en la misma transacción.
- **Estado del protocolo** (misma transacción): `APROBADO_DEFINITIVO` → 17; `APROBADO_CON_CONDICION` → **19** (`REQUIERE_SUBSANACION_VERSION`), con la v2.0 de TSK-015-N13; `NO_APROBADO` → 18. El estado 25 queda sin uso.
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

### Task TSK-015-N10 - [ ] PENDIENTE
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

### Task TSK-015-N11 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N11`
- **Requisito Relacionado**: `RF-17.7` (spec-003 v1.6.1), `HU-001`
- **Criterio EARS**: `EARS 5` (RF-17.7)
- **Acción**: `CREAR` (migración)
- **Archivos Afectados**:
  - `src/migrations/<timestamp>-QuitarResolucionCrearPresidente.ts` — CREAR: quita la asignación de `RESOLUCION_CREAR` a PRESIDENTE sembrada en `src/migrations/1880000000000-FixedRolesMatrix.ts:133`. Solo cambio de datos; sin cambios de esquema.
- **Dependencias**: Ninguna
- **Descripción**: Solo `SECRETARIA` crea o sube resoluciones. `PRESIDENTE` conserva `RESOLUCION_HISTORIAL` (lectura). La matriz fija de specs/001 ya está actualizada (v3.7.9).
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
- **Dependencias**: TSK-015-N08, TSK-015-N11
- **Descripción**: El investigador nunca recibe nombre, correo ni identificador del evaluador, ni en la API, ni en el Anexo 9, ni en adjuntos ni en el correo. Ve el perfil y el dictamen de cada par.
- **Paso 0**: resuelve la pregunta 6 (lista de endpoints del investigador a auditar) antes de fijar los archivos de la API.
- **Tests**: unitarias de la generación del Anexo 9 (texto sin nombre); E2E del correo (sin adjuntos de informe) y de las respuestas del investigador.
- **Criterio de aceptación**:
  1. El PDF y el DOCX del Anexo 9 no contienen el nombre del revisor.
  2. El correo de la resolución no adjunta informes individuales.
  3. Las respuestas del investigador no contienen nombre, correo ni `userId` del evaluador.

### Task TSK-015-N13 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N13`
- **Requisito Relacionado**: `RF-17.5` (spec-003 v1.6.1), `RF-14.1`
- **Criterio EARS**: `EARS 5` (RF-17.5)
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/resolutions/application/services/resolutions.service.ts:203-237` — MODIFICAR: la creación de la versión v2.0 deja de dispararse por el tipo 2 y pasa a dispararse solo al subir el Anexo 15 con resultado `APROBADO_CON_CONDICION`
  - `src/shared/deadlines/deadline-rules.ts:15` — usa `PLAZO_CONDICION_DIAS` (ya existe, 30)
- **Dependencias**: TSK-015-N08, TSK-015-N09 (se entrega en el mismo PR, commit posterior a N09)
- **Descripción**: Al subir el Anexo 15, en la misma transacción: se congelan los requisitos aprobados, se crea la v2.0 y se asigna `plazo_condicion_dias` = 30, con el cálculo actual de `protocol-deadline.service.ts` (no se cambia en esta tarea; ver pregunta 9). El estado del protocolo pasa a 19 (`REQUIERE_SUBSANACION_VERSION`). No se toca `calls.service.ts`.
- **Tests**: E2E: con Anexo 15 crea v2.0; con Anexo 13, 14 o 16 no la crea.
- **Criterio de aceptación**:
  1. Subir el Anexo 15 con resultado `APROBADO_CON_CONDICION` crea la v2.0 en la misma transacción.
  2. El plazo de subsanación es `plazo_condicion_dias` = 30, con el cálculo actual.
  3. El estado del protocolo queda en 19 (`REQUIERE_SUBSANACION_VERSION`).
  3. Con resultado `APROBADO_DEFINITIVO` o `NO_APROBADO` no se crea la v2.0.
  4. `calls.service.ts` no cambia.

### Task TSK-015-N14 - [ ] PENDIENTE
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

### Task TSK-015-N15 - [ ] PENDIENTE
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

### Task TSK-015-N17 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N17`
- **Requisito Relacionado**: `RF-17.6` (spec-003 v1.6.4), `RF-02.10` (spec-001 v3.7.7)
- **Criterio EARS**: `EARS 5` (RF-17.6): **cuando** un usuario consulte la resolución de un protocolo, **el sistema debe** devolverla solo si es el investigador principal o tiene `RESOLUCION_HISTORIAL`; **si** no, **el sistema debe** responder `404` con «Protocolo no encontrado.».
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/resolutions/infrastructure/controllers/resolutions.controller.ts` — MODIFICAR: `GET protocol/:protocolId` con `@Permissions(RESOLUCION_HISTORIAL)` y comprobación de investigador principal.
  - `src/modules/resolutions/application/services/resolutions.service.ts` — MODIFICAR: `findByProtocolId` aplica la comprobación y no devuelve datos del evaluador.
  - Pruebas: unitaria y E2E.
- **Dependencias**: Ninguna. **Va antes de TSK-015-N09.**
- **Descripción**: hoy `GET /resolutions/protocol/:protocolId` no tiene `@Permissions` ni `@Roles` (cualquier autenticado lee la clave de la carta y las observaciones de cualquier protocolo). Se restringe como RF-02.10. Verificar antes de codificar el campo del investigador principal en `ProtocolOrmEntity` (por confirmar, no asumido).
- **Tests**: E2E: investigador principal → `200`; otro investigador → `404` «Protocolo no encontrado.»; SECRETARIA y PRESIDENTE con `RESOLUCION_HISTORIAL` → `200`; respuesta sin datos del evaluador.
- **Criterio de aceptación**:
  1. Sin sesión o sin permiso no se revela la existencia del protocolo (`404`).
  2. La respuesta no contiene nombre, correo ni `userId` de evaluador.
  3. `POST /resolutions` no cambia en esta tarea.

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

### Task TSK-015-N20 - [ ] PENDIENTE
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

## Orden de ejecución (decisión 25/11/2026)

1. PR de docs (esta rama): spec v1.6.4 y este archivo.
2. TSK-015-N11: quitar `RESOLUCION_CREAR` a PRESIDENTE (solo datos).
3. TSK-015-N17: restringir `GET /resolutions/protocol/:id`.
4. TSK-015-N14: sembrar ANEXO_13 a 16 (solo datos).
5. TSK-015-N15: constante de 96 h.
6. TSK-015-N09 + TSK-015-N13: mismo PR, commits separados (N09 primero). Incluye N20 si EX se valida en el registro.
7. TSK-015-N12: correo y Anexo 9 sin datos del evaluador.
8. TSK-015-N10: fila «Subir resolución firmada».
9. TSK-015-N18: retirar `POST /resolutions` **cuando el frontend ya use el flujo nuevo**.
10. TSK-015-N19: carta de exención, en su propia especificación.

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
