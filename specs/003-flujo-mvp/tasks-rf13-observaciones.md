# Desglose de Tareas de Implementación (TDD): RF-13 Observaciones Multilínea y Correo Consolidado

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.1.0, HU-013, RF-13)  
**Plan Técnico de Referencia:** `specs/003-flujo-mvp/plan-rf13-observaciones.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/tasks-rf13-observaciones.md`  
**Metodología:** TDD Estricto (Test Red ➔ Implementation Green ➔ Refactor), Arquitectura Hexagonal.

---

## Leyenda de Notaciones
- `[P]`: Tarea ejecutable en paralelo con otras del mismo bloque (sin dependencias cruzadas).
- `EARS 1`: Captura multilínea por requisito explicativa durante la auditoría.
- `EARS 2`: Consolidación en correo único, fecha límite a 15 días hábiles y enlace de resometimiento.

---

## Fase 1: Setup y Estructura Base

### Task T001 [P]
- **Descripción**: Crear directorios hexagonales para el manejo de observaciones en el módulo de recepción.
- **Archivos Afectados**:
  - `src/modules/reception/domain/entities/`
  - `src/modules/reception/application/dtos/`
  - `src/modules/reception/application/services/`
  - `src/modules/reception/infrastructure/controllers/`
- **Dependencias**: Ninguna
- **Cobertura Plan**: Sección 2 (Estructura de Módulos)

### Task T002 [P]
- **Descripción**: Verificar/definir los campos de observaciones multilínea y estados en `RecepcionRequisitoOrmEntity` (`recepcion.recepcion_requisitos`).
- **Archivos Afectados**: `src/modules/reception/infrastructure/database/entities/recepcion-requisito.orm-entity.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 2 (Entidades ORM Afectadas), `EARS 1`

---

## Fase 2: Tests Unitarios de Dominio (TDD Red)

### Task T003 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para el cálculo de 15 días hábiles excluyendo fines de semana y feriados.
- **Archivos Afectados**: `src/modules/reception/domain/services/business-days-calculator.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmo PASO 5), `EARS 2`

### Task T004 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para la consolidación en memoria del texto del correo único formateado con lista (Nombre del Requisito + Observación multilínea).
- **Archivos Afectados**: `src/modules/reception/application/services/build-consolidated-email.service.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmo PASO 6), `EARS 1`, `EARS 2`

### Task T005
- **Descripción**: Escribir prueba unitaria en ROJO para el caso de uso `SendConsolidatedObservationsUseCase` probando el flujo con ítems observados y el caso límite con cero observaciones (cambio directo a `VALIDADO_DOCUMENTALMENTE`).
- **Archivos Afectados**: `src/modules/reception/application/services/send-consolidated-observations.use-case.spec.ts`
- **Dependencias**: T003, T004
- **Cobertura Plan**: Sección 4 (Algoritmo completo), `EARS 1`, `EARS 2`

---

## Fase 3: Core y Lógica de Dominio (TDD Green)

### Task T006
- **Descripción**: Implementar `BusinessDaysCalculator` haciendo pasar la prueba unitaria T003 (cálculo exacto a 15 días hábiles con hora límite 23:59:59.999).
- **Archivos Afectados**: `src/modules/reception/domain/services/business-days-calculator.ts`
- **Dependencias**: T003
- **Cobertura Plan**: Sección 4 (Algoritmo PASO 5), `EARS 2`

### Task T007
- **Descripción**: Implementar `BuildConsolidatedEmailService` haciendo pasar la prueba T004 (formateo en texto plano/HTML de observaciones por requisito).
- **Archivos Afectados**: `src/modules/reception/application/services/build-consolidated-email.service.ts`
- **Dependencias**: T004
- **Cobertura Plan**: Sección 4 (Algoritmo PASO 6), `EARS 1`, `EARS 2`

### Task T008
- **Descripción**: Implementar el caso de uso `SendConsolidatedObservationsUseCase` haciendo pasar la prueba T005 (guardado de observaciones multilínea en BD, cálculo de 15 días hábiles, dispatch de correo único y cambio de estado).
- **Archivos Afectados**: `src/modules/reception/application/services/send-consolidated-observations.use-case.ts`
- **Dependencias**: T005, T006, T007
- **Cobertura Plan**: Sección 4 (Algoritmo completo), `EARS 1`, `EARS 2`

---

## Fase 4: API REST, DTOs e Integración de Notificaciones

### Task T009 [P]
- **Descripción**: Crear DTO `AuditRequirementsDto` con validaciones `class-validator` para la captura multilínea por requisito.
- **Archivos Afectados**: `src/modules/reception/application/dtos/audit-requirements.dto.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 5 (Contrato API REST), `EARS 1`

### Task T010
- **Descripción**: Crear el controlador `ReceptionObservationsController` exponiendo `POST /api/reception/protocols/:id/observations/send`.
- **Archivos Afectados**: `src/modules/reception/infrastructure/controllers/reception-observations.controller.ts`
- **Dependencias**: T008, T009
- **Cobertura Plan**: Sección 5 (Contrato API REST)

### Task T011
- **Descripción**: Integrar el controlador y caso de uso en `ReceptionModule`.
- **Archivos Afectados**: `src/modules/reception/reception.module.ts`
- **Dependencias**: T010
- **Cobertura Plan**: Sección 2 (Estructura de Módulos)

---

## Fase 5: Pruebas E2E y Verificación Obligatoria

### Task T012
- **Descripción**: Crear prueba E2E `reception-observations.e2e-spec.ts` validando el envío del payload con texto multilínea, invocación mockeada de `ResendService` y respuesta HTTP 200 con la fecha límite a 15 días hábiles.
- **Archivos Afectados**: `test/reception-observations.e2e-spec.ts`
- **Dependencias**: T011
- **Cobertura Plan**: Sección 7 (Estrategia E2E), `EARS 1`, `EARS 2`

### Task T013
- **Descripción**: Verificación obligatoria de la Constitución: `npm test`, `npm run test:e2e`, `npm run lint` y `npm run format`.
- **Archivos Afectados**: Todo el proyecto.
- **Dependencias**: T012
- **Cobertura Plan**: Sección 7 (Definition of Done), Constitución del Proyecto
