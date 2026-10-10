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

### Task TSK-015-N03 - [ ] PENDIENTE
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
- **Criterio "Hecho cuando:"**: `SystemParamsService.get(key)` retorna el valor sembrado, la tabla `sistema.parametros_sistema` existe en PostgreSQL con al menos los 5 parámetros iniciales, y `TSK-015-N01` puede consumir los offsets sin hardcodeo.

### Task TSK-015-N04 - [ ] PENDIENTE
- **ID Único**: `TSK-015-N04`
- **Requisito Relacionado**: `RF-CAL`
- **PR**: PR-C (`feat/deadline-alerts`)
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
