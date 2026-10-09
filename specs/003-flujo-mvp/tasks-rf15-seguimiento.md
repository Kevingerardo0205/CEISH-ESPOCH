# Desglose de Tareas de Implementación (TDD): RF-15 Seguimiento Post-Aprobación, Anexo 18 y Anexo 8

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.1.0, HU-015, RF-15.1, RF-15.2)  
**Plan Técnico de Referencia:** `specs/003-flujo-mvp/plan-rf15-seguimiento.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/tasks-rf15-seguimiento.md`  
**Metodología:** TDD Estricto (Test Red ➔ Implementation Green ➔ Refactor), Arquitectura Hexagonal.

---

## Leyenda de Notaciones
- `[P]`: Tarea ejecutable en paralelo con otras del mismo bloque (sin dependencias cruzadas).
- `EARS 1`: Pre-llenado de agenda (Inicio 30 días, Avances, Renovación 60 días antes, Cierre 60 días) y edición libre por Presidencia.
- `EARS 2`: Recepción de Anexo 18 (Avances) y Anexo 8 (Cierre Final).
- `EARS 3`: Alertas preventivas parametrizadas (7/1 día para inicio, 90/60/15 para renovación) y cambio a `VENCIDO`/`SUSPENDIDO` con 30 días de gracia.

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
- **Descripción**: Escribir prueba unitaria en ROJO para la auditoría de alertas preventivas por hito (`7/1` para inicio; `90/60/15` para renovación) y el paso a `VENCIDO`/`SUSPENDIDO` con activación del contador de 30 días de gracia.
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
