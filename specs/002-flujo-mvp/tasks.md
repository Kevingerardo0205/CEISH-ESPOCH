# Plan de Tareas de Implementación (Tasks Delta Brownfield): Flujo 002 — Asignación y Evaluación Par

**Código de Especificación:** `specs/002-flujo-mvp/spec.md` (v1.0.0)  
**Ubicación del Plan:** `specs/002-flujo-mvp/plan.md`  
**Ubicación de Tareas:** `specs/002-flujo-mvp/tasks.md`  
**Documentos de Referencia:** `docs/doc_base/constitution_v2.md`, `specs/002-flujo-mvp/reconciliation.md`  
**Marco de Trabajo:** Spec-Driven Development (SDD), Brownfield Incremental, Test-First.

---

## 📋 Estado General del Flujo y Trazabilidad de Tareas

Las tareas marcadas con `[x]` certifican componentes previamente implementados y verificados con pruebas unitarias en verde. Las tareas marcadas con `[ ]` representan el delta exacto necesario para integrar el flujo con la persistencia relacional real de PostgreSQL (`evaluacion.asignaciones_evaluacion`).

```text
[x] Dominio Base (Validador de Cuota 4 Perfiles, Sorteo Fisher-Yates Anexo 10, Notificaciones Deep-Link, CLI)
[ ] Fase 1: Persistencia y Migración de Base de Datos (Estados Extendidos e Historial Relacional)
[ ] Fase 2: Dominio y Métodos Transaccionales de Repositorio
[ ] Fase 3: Casos de Uso y Orquestación de Aplicación
[ ] Fase 4: Integración en Módulo NestJS y Controladores HTTP
[ ] Fase 5: Validación Integral E2E y Calidad (Definition of Done)
```

---

## 1. Tareas de Dominio y Componentes Base (Previamente Verificados)

- [x] **TSK-002-01**: Implementar el servicio de validación de cuota de 4 perfiles obligatorios.
  - **Requisito relacionado:** `RF-12.1`
  - **Criterio EARS:** `EARS (RF-12.1)` (Validación de Cuota Exacta: 1 Jurídico, 1 Sociedad Civil, 1 Metodológico, 1 Salud).
  - **Acción:** `REUTILIZAR`
  - **Archivos afectados:** `src/modules/evaluations/domain/services/quota-evaluator-validator.service.ts`, `src/modules/evaluations/domain/services/quota-evaluator-validator.service.spec.ts`
  - **Dependencias:** Ninguna (Lógica pura de dominio).
  - **Descripción:** Valida que la lista contenga exactamente 4 candidatos con la combinación única de perfiles requeridos.
  - **Pruebas necesarias:** `npm test -- quota-evaluator-validator.service.spec.ts` (100% pasando).
  - **Hecho cuando:** La suite unitaria valida asignaciones correctas y rechaza duplicados o incompletos con mensaje en español.

- [x] **TSK-002-02**: Implementar el servicio de sorteo aleatorio de Anexo 10 excluyendo Sociedad Civil.
  - **Requisito relacionado:** `RF-12.2`
  - **Criterio EARS:** `EARS (RF-12.2)` (Exclusión Aleatoria en Anexo 10).
  - **Acción:** `REUTILIZAR`
  - **Archivos afectados:** `src/modules/evaluations/domain/services/random-risk-selector.service.ts`, `src/modules/evaluations/domain/services/random-risk-selector.service.spec.ts`
  - **Dependencias:** Ninguna (Lógica pura con algoritmo Fisher-Yates).
  - **Descripción:** Selecciona aleatoriamente 2 evaluadores entre Jurídico, Metodológico y Salud, excluyendo innegociablemente a Sociedad Civil.
  - **Pruebas necesarias:** `npm test -- random-risk-selector.service.spec.ts` (100 iteraciones aleatorias pasando).
  - **Hecho cuando:** `SOCIEDAD_CIVIL` nunca recibe la marca `isAssignedForAnnex10` y siempre se eligen exactamente 2 evaluadores.

- [x] **TSK-002-03**: Implementar el adaptador de despacho de notificaciones con formato Deep-Linking.
  - **Requisito relacionado:** `RF-12.6`
  - **Criterio EARS:** `EARS (RF-12.6)` (Notificación con Deep-Linking).
  - **Acción:** `REUTILIZAR`
  - **Archivos afectados:** `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts`, `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.spec.ts`
  - **Dependencias:** `IEmailServicePort`
  - **Descripción:** Da formato al cuerpo del correo con enlace `/evaluations/:assignmentId/panel` y advertencia clara sobre Anexo 10.
  - **Pruebas necesarias:** `npm test -- mailer-notification.adapter.spec.ts` (100% pasando).
  - **Hecho cuando:** El mock de correo comprueba la estructura del template y el enlace directo.

- [x] **TSK-002-04**: Implementar comando CLI de auditoría e inspección de asignaciones.
  - **Requisito relacionado:** `RF-12.1`, `RF-12.3`
  - **Criterio EARS:** Auditoría e Inmutabilidad (RNF-5.2).
  - **Acción:** `REUTILIZAR`
  - **Archivos afectados:** `src/cli/audit-evaluators.cli.ts`, `src/cli/audit-evaluators.cli.spec.ts`
  - **Dependencias:** Servicios de evaluación.
  - **Descripción:** Inspecciona cuotas de evaluadores y bitácoras históricas con salida formateada en JSON.
  - **Pruebas necesarias:** `npm test -- audit-evaluators.cli.spec.ts` (100% pasando).
  - **Hecho cuando:** La ejecución con `--protocolId` retorna código de salida 0 e imprime el desglose de cuotas.

---

## 2. Fase 1: Persistencia y Migración de Base de Datos (Delta)

- [x] **TSK-002-05**: Crear migración TypeORM para estados de reasignación y tabla de historial.
  - **Requisito relacionado:** `RF-12.3`, `RF-12.2`
  - **Criterio EARS:** `EARS (RF-12.3)` (Reasignación Trazable por Motivo).
  - **Acción:** `CREAR`
  - **Archivos afectados:** `src/migrations/1799000000000-AddReassignmentStatesAndHistoryTable.ts`
  - **Dependencias:** `catalogos.estados`, `evaluacion.asignaciones_evaluacion`.
  - **Descripción:** Insertar los estados `REASIGNADO_VENCIMIENTO` y `REASIGNADO_COI` en `catalogos.estados` (categoría `'EVALUACION'`), añadir la columna `es_asignado_anexo_10` en `evaluacion.asignaciones_evaluacion` y crear la tabla física `evaluacion.asignacion_historial`.
  - **Pruebas necesarias:** Verificación de ejecución limpia de migración y reversibilidad (`up` / `down`).
  - **Hecho cuando:** La base de datos PostgreSQL contenga los nuevos estados con IDs numéricos y la tabla de auditoría relacional exista con sus claves foráneas.

- [x] **TSK-002-06**: Actualizar `AssignmentStatus` y entidades ORM de evaluación e historial.
  - **Requisito relacionado:** `RF-12.3`, `RF-12.2`
  - **Criterio EARS:** `EARS (RF-12.3)`
  - **Acción:** `MODIFICAR` / `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/domain/enums/assignment-status.enum.ts`, `src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts`, `src/modules/evaluations/infrastructure/database/entities/assignment-history.orm-entity.ts`
  - **Dependencias:** `TSK-002-05`
  - **Descripción:** Sincronizar el enum numérico `AssignmentStatus` con los IDs de `catalogos.estados` y mapear `@Column({ name: 'es_asignado_anexo_10' })` en `EvaluationAssignmentOrmEntity` y `AssignmentHistoryOrmEntity` a la tabla `evaluacion.asignacion_historial`.
  - **Pruebas necesarias:** `npm test -- evaluation-orm-entities.spec.ts`
  - **Hecho cuando:** Las entidades ORM compilen sin errores y mapeen fielmente las columnas y esquemas reales de PostgreSQL.

---

## 3. Fase 2: Dominio y Métodos Transaccionales de Repositorio (Delta)

- [x] **TSK-002-07**: Adaptar servicio de reasignación y entidades de dominio puras a identificadores numéricos.
  - **Requisito relacionado:** `RF-12.3`
  - **Criterio EARS:** `EARS (RF-12.3)` (Reasignación Inmutable por Motivo y homogeneidad de perfil).
  - **Acción:** `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/domain/services/evaluator-reassignment.service.ts`, `src/modules/evaluations/domain/entities/evaluation-assignment.entity.ts`, `src/modules/evaluations/domain/entities/assignment-history.entity.ts`, `src/modules/evaluations/domain/ports/evaluation.repository.port.ts`
  - **Dependencias:** `TSK-002-06`
  - **Descripción:** Ajustar los tipos a `number` en las entidades de dominio y actualizar el servicio para aplicar el cálculo de 15 días hábiles (`BusinessDayCalculator`), el traspaso determinístico de Anexo 10 y la asignación del estado numérico correspondiente (`REASIGNED_COI` o `REASIGNED_VENCIMIENTO`).
  - **Pruebas necesarias:** `npm test -- evaluator-reassignment.service.spec.ts`
  - **Hecho cuando:** Las pruebas unitarias confirmen que intentar sustituir con un perfil heterogéneo arroja error y que se genera el registro inmutable con los estados numéricos correctos.

- [x] **TSK-002-08**: Implementar métodos transaccionales en `EvaluationTypeOrmRepository`.
  - **Requisito relacionado:** `RF-12.1`, `RF-12.3`, `RF-12.4`
  - **Criterio EARS:** `EARS (RF-12.1)`, `EARS (RF-12.3)`
  - **Acción:** `MODIFICAR`
  - **Archivos afectados:** `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts`
  - **Dependencias:** `TSK-002-07`
  - **Descripción:** Implementar con `QueryRunner` (`SERIALIZABLE` / `READ COMMITTED`) la persistencia atómica de las 4 asignaciones (`saveAssignmentsTransaction`), la reasignación en 3 pasos (actualizar saliente, insertar entrante, insertar historial) y la búsqueda de asignaciones activas (`findActiveAssignmentsByVersionId`).
  - **Pruebas necesarias:** `npm test -- evaluation.typeorm.repository.spec.ts`
  - **Hecho cuando:** Las operaciones persistan atómicamente en PostgreSQL y hagan rollback ante cualquier error intermedio sin dejar estados huérfanos.

---

## 4. Fase 3: Casos de Uso y Orquestación de Aplicación (Delta)

- [x] **TSK-002-09**: Adaptar `AssignEvaluatorsUseCase` y DTOs de asignación con tipado numérico.
  - **Requisito relacionado:** `RF-12.1`, `RF-12.2`, `RF-12.6`
  - **Criterio EARS:** `EARS (RF-12.1)`, `EARS (RF-12.2)`, `EARS (RF-12.6)`
  - **Acción:** `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/application/dtos/evaluator-dtos.ts`, `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts`, `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.spec.ts`
  - **Dependencias:** `TSK-002-08`
  - **Descripción:** Adaptar el caso de uso para validar cuota con `QuotaEvaluatorValidatorService`, ejecutar sorteo de Anexo 10 con `RandomRiskSelectorService`, computar plazo de 15 días hábiles, persistir en `EvaluationTypeOrmRepository` y despachar evento `evaluator.assigned`.
  - **Pruebas necesarias:** `npm test -- assign-evaluators.use-case.spec.ts`
  - **Hecho cuando:** La prueba unitaria simule la asignación completa de 4 evaluadores retornando las entidades persistidas y confirmando la emisión de los eventos.

- [x] **TSK-002-10**: Adaptar `ReassignEvaluatorUseCase` y DTOs de reasignación con tipado numérico.
  - **Requisito relacionado:** `RF-12.3`, `RF-12.6`
  - **Criterio EARS:** `EARS (RF-12.3)`, `EARS (RF-12.6)`
  - **Acción:** `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/application/dtos/evaluator-dtos.ts`, `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts`, `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.spec.ts`
  - **Dependencias:** `TSK-002-08`
  - **Descripción:** Adaptar el caso de uso para recibir `currentAssignmentId: number`, buscar la asignación previa, invocar `EvaluatorReassignmentService.executeReassignment`, ejecutar la transacción de persistencia y disparar la notificación por correo al nuevo evaluador.
  - **Pruebas necesarias:** `npm test -- reassign-evaluator.use-case.spec.ts`
  - **Hecho cuando:** La prueba valide la ejecución transaccional y el reinicio de plazo a 15 días hábiles.

- [x] **TSK-002-11**: Adaptar `SubmitEvaluationUseCase` (100% Completitud) e `InheritEvaluatorsUseCase` (Multiversiones v2.0).
  - **Requisito relacionado:** `RF-12.4`, `RF-12.5`
  - **Criterio EARS:** `EARS (RF-12.4)`, `EARS (RF-12.5)`
  - **Acción:** `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/application/use-cases/submit-evaluation.use-case.ts`, `src/modules/evaluations/application/use-cases/inherit-evaluators.use-case.ts`
  - **Dependencias:** `TSK-002-08`
  - **Descripción:** Ajustar `isCompletion100Percent()` para verificar que existan exactamente 4 asignaciones activas en estado `COMPLETED (7)` excluyendo reasignadas, y ajustar `InheritEvaluatorsUseCase` para clonar las 4 asignaciones activas de la versión previa al resometer un protocolo v2.0.
  - **Pruebas necesarias:** `npm test -- submit-evaluation.use-case.spec.ts`, `npm test -- inherit-evaluators.use-case.spec.ts`
  - **Hecho cuando:** `isCompletion100Percent` retorne `true` solo con el 100% de entregas activas y la herencia clone fielmente los revisores activos previos.

---

## 5. Fase 4: Integración en Módulo NestJS y Controladores HTTP (Delta)

- [x] **TSK-002-12**: Registrar y proveer use cases y entidades en `EvaluationsModule`.
  - **Requisito relacionado:** Arquitectura Hexagonal y DI NestJS.
  - **Criterio EARS:** Principios de Constitución v2 (Inversión de Dependencias).
  - **Acción:** `MODIFICAR`
  - **Archivos afectados:** `src/modules/evaluations/evaluations.module.ts`
  - **Dependencias:** `TSK-002-09`, `TSK-002-10`, `TSK-002-11`
  - **Descripción:** Importar `AssignmentHistoryOrmEntity` en `TypeOrmModule.forFeature`, registrar como `providers` y `exports` los casos de uso `AssignEvaluatorsUseCase`, `ReassignEvaluatorUseCase`, `SubmitEvaluationUseCase`, `InheritEvaluatorsUseCase` y vincular el adapter `MailerNotificationAdapter`.
  - **Pruebas necesarias:** Compilación limpia del módulo en NestJS.
  - **Hecho cuando:** La aplicación inicie sin errores de inyección de dependencias (`Nest can't resolve dependencies`).

- [x] **TSK-002-13**: Exponer endpoints de asignación, reasignación y completitud en `EvaluationsController`.
  - **Requisito relacionado:** `RF-12.1`, `RF-12.3`, `RF-12.4`
  - **Criterio EARS:** `EARS (RF-12.1)`, `EARS (RF-12.3)`, `EARS (RF-12.4)`
  - **Acción:** `ADAPTAR` / `MODIFICAR`
  - **Archivos afectados:** `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts`, `src/modules/evaluations/infrastructure/controllers/evaluation-assignment.controller.spec.ts`
  - **Dependencias:** `TSK-002-12`
  - **Descripción:** Conectar las rutas `POST /evaluations/protocols/:id/assign-peer-evaluators`, `POST /evaluations/reassign` y `GET /evaluations/completion-status/:protocolId` protegidas con `JwtAuthGuard`, `RolesGuard`, `@Roles('SECRETARIA', 'PRESIDENTE')`, `@Permissions(Permission.EVALUATORS_ASSIGN)` y `@Audit()`.
  - **Pruebas necesarias:** `npm test -- evaluation-assignment.controller.spec.ts`
  - **Hecho cuando:** Los endpoints respondan con códigos HTTP 201/200, validen los DTOs y apliquen la seguridad RBAC.

---

## 6. Fase 5: Validación Integral E2E y Calidad (Definition of Done)

- [x] **TSK-002-14**: Suite de pruebas End-to-End (`test/evaluations-assignment.e2e-spec.ts`).
  - **Requisito relacionado:** `RF-12.1` a `RF-12.6`
  - **Criterio EARS:** Todos los criterios EARS del Flujo 002.
  - **Acción:** `ADAPTAR` / `MODIFICAR`
  - **Archivos afectados:** `test/evaluations-assignment.e2e-spec.ts` (o archivo E2E correspondiente).
  - **Dependencias:** `TSK-002-13`
  - **Descripción:** Ejecutar el ciclo completo E2E: Asignación de 4 evaluadores $\rightarrow$ Verificación de 2 Anexo 10 (sin Sociedad Civil) $\rightarrow$ Reasignación por Conflicto de Interés $\rightarrow$ Validación de bitácora $\rightarrow$ Verificación de porcentaje de completitud 100%.
  - **Pruebas necesarias:** `npm run test:e2e`
  - **Hecho cuando:** La suite E2E pase al 100% en verde sobre el entorno de pruebas.

- [x] **TSK-002-15**: Verificación final de calidad y formateo (`npm run lint`, `npm run format`).
  - **Requisito relacionado:** Principios de Calidad de la Constitución v2.
  - **Criterio EARS:** Definition of Done.
  - **Acción:** `VERIFICAR`
  - **Archivos afectados:** Todo el codebase del módulo `evaluations`.
  - **Dependencias:** `TSK-002-14`
  - **Descripción:** Ejecutar análisis estático de código y formateo para asegurar cero advertencias de ESLint, cero usos indebidos de `any` y formateo homogéneo con Prettier.
  - **Pruebas necesarias:** `npm run lint` y `npm test`.
  - **Hecho cuando:** `npm run lint` y `npm test` retornen código de salida 0 sin advertencias.
