# Informe de Reconciliación Arquitectónica Brownfield (SDD)

**Código de Especificación:** `specs/002-flujo-mvp/spec.md` (v1.0.0 — Flujo 002: Asignación y Evaluación Par)  
**Ubicación del Documento:** `specs/002-flujo-mvp/reconciliation.md`  
**Fecha:** 2026-09-28  
**Documentos de Referencia:** `docs/doc_base/constitution_v2.md`, `specs/002-flujo-mvp/spec.md`, `specs/002-flujo-mvp/plan.md`, `specs/002-flujo-mvp/tasks.md`, `specs/002-flujo-mvp/informe-brecha-evaluacion.md`  
**Marco Metodológico:** Desarrollo Brownfield, Clean/Hexagonal Architecture, DDD, SDD.

---

## 1. Inventario de Componentes Relacionados

### 1.1 Entidades y Persistencia (ORM & DB)
* **Entidades ORM Principales (Canónicas):**
  * `EvaluationAssignmentOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts`): Mapeada a la tabla física real PostgreSQL `evaluacion.asignaciones_evaluacion` con claves enteras (`id`, `version_id`, `evaluador_id`, `estado_id` con restricción FK a `catalogos.estados`, `fecha_limite`).
  * `PeerRiskAssignmentOrmEntity` (`src/modules/evaluations/infrastructure/database/peer-assignment.entity.orm.ts`): Mapeada a `evaluacion.asignaciones_pares_riesgo` para asignaciones del Anexo 10 / Estratificación de Riesgo.
  * `EvaluatorProfileOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluator-profile.entity.orm.ts`): Mapeada a `catalogos.perfiles_evaluador`.
  * `EvaluatorProfileUserOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluator-profile-user.entity.orm.ts`): Mapeada a `catalogos.perfil_evaluador_usuario`.
  * `EvaluationOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluation.entity.orm.ts`): Mapeada a `evaluacion.evaluaciones`.
  * `EvaluationResponseDetailOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluation-response-detail.entity.orm.ts`): Mapeada a `evaluacion.evaluacion_respuestas_detalle`.
* **Entidades ORM Paralelas / Prototipo:**
  * `EvaluationAssignmentOrmEntity (entities/)` (`src/modules/evaluations/infrastructure/database/entities/evaluation-assignment.orm-entity.ts`): Entidad independiente con UUIDs y tipos enum string (`evaluation_assignments`).
  * `AssignmentHistoryOrmEntity (entities/)` (`src/modules/evaluations/infrastructure/database/entities/assignment-history.orm-entity.ts`): Entidad para bitácora inmutable de sustituciones (`assignment_history`).

### 1.2 Dominio Puro (Entities, Enums, Value Objects, Services & Ports)
* **Entidades de Dominio:**
  * `EvaluationAssignmentEntity` (`src/modules/evaluations/domain/entities/evaluation-assignment.entity.ts`): Entidad pura con estado, banderas de Anexo 10 y método `markAsReassigned()`.
  * `AssignmentHistoryEntity` (`src/modules/evaluations/domain/entities/assignment-history.entity.ts`): Entidad pura de historial de reasignaciones.
* **Enums de Dominio:**
  * `AssignmentStatus (domain)` (`src/modules/evaluations/domain/enums/assignment-status.enum.ts`): Enums numéricos oficiales (`SUGGESTED=5, ASSIGNED=6, COMPLETED=7, ARCHIVED=8`).
  * `evaluator-enums.ts (shared)` (`src/shared/enums/evaluator-enums.ts`): `EvaluatorProfile` (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO`, `SALUD`), `AssignmentStatus` (textual), `ReassignmentReason` (`VENCIMIENTO`, `CONFLICTO_INTERES`).
* **Servicios de Dominio:**
  * `QuotaEvaluatorValidatorService` (`src/modules/evaluations/domain/services/quota-evaluator-validator.service.ts`): Validador estricto de cuota de 4 perfiles.
  * `RandomRiskSelectorService` (`src/modules/evaluations/domain/services/random-risk-selector.service.ts`): Sorteo aleatorio Fisher-Yates de 2 evaluadores para Anexo 10 excluyendo `SOCIEDAD_CIVIL`.
  * `EvaluatorReassignmentService` (`src/modules/evaluations/domain/services/evaluator-reassignment.service.ts`): Lógica pura de reasignación inmutable y reinicio de plazos.
* **Puertos de Dominio:**
  * `IEvaluationRepository` (`src/modules/evaluations/domain/ports/evaluation.repository.port.ts`).

### 1.3 Capa de Aplicación (Casos de Uso, Servicios, DTOs)
* **Casos de Uso Existentes:**
  * `AssignEvaluatorsUseCase` (`src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts`): Orquestador de asignación atómica y sorteo.
  * `ReassignEvaluatorUseCase` (`src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts`): Orquestador de sustitución inmutable con reinicio de plazo.
  * `SubmitEvaluationUseCase` (`src/modules/evaluations/application/use-cases/submit-evaluation.use-case.ts`): Validador de porcentaje de completitud 100%.
  * `InheritEvaluatorsUseCase` (`src/modules/evaluations/application/use-cases/inherit-evaluators.use-case.ts`): Herencia de evaluadores para versiones mayores v2.0.
* **Servicios de Aplicación Existentes:**
  * `EvaluationsService` (`src/modules/evaluations/application/services/evaluations.service.ts`): Servicio principal masivo (1404 líneas) con endpoints operativos brownfield (`assignPeerEvaluators`, `submitEvaluation`, `getMyAssignments`, `getEvaluatorsDashboard`).
  * `ConflictOfInterestService` (`src/modules/evaluations/application/services/conflict-of-interest.service.ts`): Detección automática de COI.
  * `EvaluationConsolidationService` (`src/modules/evaluations/application/services/evaluation-consolidation.service.ts`): Consolidación de dictámenes.
* **DTOs Existentes:**
  * `evaluator-dtos.ts` (`src/modules/evaluations/application/dtos/evaluator-dtos.ts`): `AssignEvaluatorsDto`, `ReassignEvaluatorDto`.
  * `assign-peer-evaluators.dto.ts` (`src/modules/evaluations/application/dtos/assign-peer-evaluators.dto.ts`): DTO legacy numérico (`evaluatorIds: number[]`).
  * `submit-evaluation.dto.ts` (`src/modules/evaluations/application/dtos/submit-evaluation.dto.ts`): DTO estructurado con Anexos 9, 10 y 11.

### 1.4 Capa de Infraestructura (Controllers, Repositories, Adapters & Module)
* **Controladores:**
  * `EvaluationsController` (`src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts`): Registrado en `EvaluationsModule` bajo ruta `/evaluations`.
  * `EvaluationAssignmentController` (`src/modules/evaluations/infrastructure/controllers/evaluation-assignment.controller.ts`): Controlador con endpoints específicos de SDD (`POST /api/evaluations/assign`, `POST /api/evaluations/reassign`, `GET /api/evaluations/completion-status/:protocolId`), no importado aún en el módulo NestJS principal.
* **Repositorios y Adaptadores:**
  * `EvaluationTypeOrmRepository` (`src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts`): Repositorio conectado a la BD real.
  * `MailerNotificationAdapter` (`src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts`): Adaptador de correo con soporte de deep-linking.
* **Módulo:**
  * `EvaluationsModule` (`src/modules/evaluations/evaluations.module.ts`).

### 1.5 Pruebas Unitarias y E2E Existentes
* 31 suites de pruebas unitarias pasando al 100% (81 tests en verde), incluyendo `quota-evaluator-validator.service.spec.ts`, `random-risk-selector.service.spec.ts`, `evaluator-reassignment.service.spec.ts`, `assign-evaluators.use-case.spec.ts`, `reassign-evaluator.use-case.spec.ts`, `submit-evaluation.use-case.spec.ts`, `inherit-evaluators.use-case.spec.ts`, `audit-evaluators.cli.spec.ts`.

---

## 2. Matriz de Reconciliación

| Requisito | Implementación existente | Ubicación | Estado | Acción | Justificación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-12.1 (Cuota Estricta de 4 Evaluadores con Perfiles Únicos)** | `QuotaEvaluatorValidatorService` + `AssignEvaluatorsUseCase` + `AssignEvaluatorsDto` | `src/modules/evaluations/domain/services/quota-evaluator-validator.service.ts`, `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts` | Completo y probado (100% unit tests) | **ADAPTAR** | La lógica de validación de cuota está perfecta. Requiere adaptarla al esquema relacional de la BD (`asignaciones_evaluacion` con IDs numéricos e inyección en `EvaluationsService` / `EvaluationsModule`). |
| **RF-12.2 (Selección Aleatoria Anexo 10 sin Sociedad Civil)** | `RandomRiskSelectorService` (Fisher-Yates) | `src/modules/evaluations/domain/services/random-risk-selector.service.ts` | Completo y probado (100% unit tests) | **REUTILIZAR** | El algoritmo de selección aleatoria cumple estrictamente la exclusión de `SOCIEDAD_CIVIL` y no requiere modificaciones lógicas. |
| **RF-12.3 (Reasignación Inmutable por Vencimiento / COI y Plazo)** | `EvaluatorReassignmentService` + `ReassignEvaluatorUseCase` + `AssignmentHistoryEntity` | `src/modules/evaluations/domain/services/evaluator-reassignment.service.ts`, `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts` | Completo en dominio, mockeado en repo | **ADAPTAR** | La lógica de homogeneidad de perfiles, cálculo de 15 días con `BusinessDayCalculator` y generación de bitácora está lista; debe adaptarse para persistir contra `catalogos.estados` (IDs numéricos) y la tabla de historial relacional. |
| **RF-12.4 (Completitud del 100% y Bloqueo de Dictamen Final)** | `SubmitEvaluationUseCase.isCompletion100Percent()` + `EvaluationsService.submitEvaluation()` | `src/modules/evaluations/application/use-cases/submit-evaluation.use-case.ts`, `src/modules/evaluations/application/services/evaluations.service.ts` | Implementado en dos capas | **MODIFICAR** | Unificar la comprobación de completitud para que valide las 4 asignaciones activas en `asignaciones_evaluacion` excluyendo los estados `REASIGNED_*` o `ARCHIVED`. |
| **RF-12.5 (Continuidad en Versiones Mayores v2.0)** | `InheritEvaluatorsUseCase` | `src/modules/evaluations/application/use-cases/inherit-evaluators.use-case.ts` | Implementado y probado | **ADAPTAR** | Adaptar el caso de uso para consultar la versión previa mediante `ProtocolVersionOrmEntity` y clonar las asignaciones activas de la versión 1 a la versión 2. |
| **RF-12.6 (Notificaciones con Deep-Linking)** | `MailerNotificationAdapter` + `mailer-notification.adapter.spec.ts` | `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts` | Implementado y probado | **REUTILIZAR** | Genera la URL con `/evaluations/:assignmentId/panel` y despacha el correo desacoplado mediante eventos. |
| **Persistencia de Asignaciones (BD PostgreSQL)** | `EvaluationAssignmentOrmEntity` (`evaluacion.asignaciones_evaluacion`) | `src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts` | Operativa en producción | **MODIFICAR** | Añadir la columna booleana `is_assigned_for_annex_10` (`es_asignado_anexo_10`) a la tabla real si no existe, o sincronizarla con `PeerRiskAssignmentOrmEntity`. |
| **Catálogo de Estados de Asignación** | `catalogos.estados` + `assignment-status.enum.ts` | `src/migrations/1778900000000-SeedEstadosCatalog.ts`, `src/modules/evaluations/domain/enums/assignment-status.enum.ts` | Estados base 5,6,7,8 | **MODIFICAR** | Registrar la migración incremental que añada los IDs de estado `REASIGNED_VENCIMIENTO` y `REASIGNED_COI` a `catalogos.estados` bajo categoría `'EVALUACION'` (Opción A confirmada). |
| **Endpoints y Controladores HTTP** | `EvaluationsController` vs `EvaluationAssignmentController` | `src/modules/evaluations/infrastructure/controllers/` | Coexistencia no unificada | **ADAPTAR** | Integrar los use cases de asignación y reasignación (`AssignEvaluatorsUseCase`, `ReassignEvaluatorUseCase`) dentro de `EvaluationsModule` y habilitar las rutas unificadas con seguridad `@Roles` y `@Audit`. |

---

## 3. Duplicaciones Detectadas

1. **Entidades ORM de Asignación Paralelas:**
   * `src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts` $\rightarrow$ Entidad real conectada al esquema `evaluacion.asignaciones_evaluacion` (IDs numéricos).
   * `src/modules/evaluations/infrastructure/database/entities/evaluation-assignment.orm-entity.ts` $\rightarrow$ Entidad sintética creada con tabla `evaluation_assignments` (UUIDs).
2. **Enums de Estado de Asignación Duplicados:**
   * `src/modules/evaluations/domain/enums/assignment-status.enum.ts` $\rightarrow$ `SUGGESTED = 5, ASSIGNED = 6, COMPLETED = 7, ARCHIVED = 8`.
   * `src/shared/enums/evaluator-enums.ts` $\rightarrow$ `ASSIGNED = 'ASSIGNED', SUBMITTED = 'SUBMITTED', REASIGNED_VENCIMIENTO = 'REASIGNED_VENCIMIENTO'`.
3. **Flujos de Asignación Paralelos en Aplicación:**
   * `EvaluationsService.assignPeerEvaluators` (enfoque procedural previo con `evaluacion.asignaciones_pares_riesgo`).
   * `AssignEvaluatorsUseCase.execute` (enfoque DDD puro con `QuotaEvaluatorValidatorService` y `RandomRiskSelectorService`).

---

## 4. Incompatibilidades Detectadas

1. **Tipado de Identificadores (UUID vs INTEGER):**
   * Los casos de uso prototipo (`AssignEvaluatorsUseCase`, `ReassignEvaluatorUseCase`) utilizaban `string` (UUIDs). La base de datos real de PostgreSQL opera con `INTEGER` autoincremental para `protocol_id`, `evaluador_id`, `version_id`, `estado_id`.
2. **Restricción de Clave Foránea en `estado_id`:**
   * `evaluacion.asignaciones_evaluacion.estado_id` exige FK estricta a `catalogos.estados(id)`. No admite enums tipo string directos en PostgreSQL.
3. **Registro en Módulos NestJS:**
   * `EvaluationAssignmentController` y los casos de uso (`AssignEvaluatorsUseCase`, `ReassignEvaluatorUseCase`, `SubmitEvaluationUseCase`, `InheritEvaluatorsUseCase`) no están provistos ni exportados formalmente en `EvaluationsModule`.

---

## 5. Componentes Reutilizables (Sin Cambios Relevantes)

1. `QuotaEvaluatorValidatorService` (`src/modules/evaluations/domain/services/quota-evaluator-validator.service.ts`): Lógica de validación de cuota de 4 perfiles únicos.
2. `RandomRiskSelectorService` (`src/modules/evaluations/domain/services/random-risk-selector.service.ts`): Algoritmo Fisher-Yates con exclusión de Sociedad Civil.
3. `BusinessDayCalculator` (`src/shared/services/deadline-calculator.service.ts`): Cálculo de días hábiles laborables.
4. `ConflictOfInterestService` (`src/modules/evaluations/application/services/conflict-of-interest.service.ts`): Validación de conflictos éticos con el investigador.
5. `MailerNotificationAdapter` (`src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts`): Plantilla y despacho de correos con deep-linking.
6. `EvaluatorProfileOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluator-profile.entity.orm.ts`) y `EvaluatorProfileUserOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluator-profile-user.entity.orm.ts`): Catálogo y asociación de perfiles de evaluadores.

---

## 6. Componentes que Requieren Modificación

1. `AssignmentStatus` (`src/modules/evaluations/domain/enums/assignment-status.enum.ts`): Extender el enum con los valores numéricos acordados en `catalogos.estados` para `REASIGNED_VENCIMIENTO` y `REASIGNED_COI`.
2. `EvaluationAssignmentOrmEntity` (`src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts`): Asegurar mapeo de la columna `isAssignedForAnnex10` (`es_asignado_anexo_10`) para almacenar directamente la marca del Anexo 10.
3. `EvaluationsService` (`src/modules/evaluations/application/services/evaluations.service.ts`): Delegar el flujo de asignación de evaluadores a los domain services y use cases estandarizados.

---

## 7. Componentes que Requieren Adaptación

1. `AssignEvaluatorsUseCase` y `ReassignEvaluatorUseCase` (`src/modules/evaluations/application/use-cases/`): Adaptar sus DTOs y parámetros para operar con `number` (IDs numéricos de protocolo y evaluador) contra `EvaluationTypeOrmRepository`.
2. `EvaluationTypeOrmRepository` (`src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts`): Implementar formalmente los métodos de persistencia transaccional requeridos por los casos de uso (`saveAssignments`, `executeReassignmentTransaction`).
3. `EvaluationsModule` (`src/modules/evaluations/evaluations.module.ts`): Registrar y proveer los use cases e inyectores de dependencia correspondientes.

---

## 8. Componentes que Realmente Deben Crearse

Conforme al principio **Brownfield First**:
1. **Migración TypeORM incremental (Opción A):**
   * Inserción de estados específicos en `catalogos.estados` para la categoría `'EVALUACION'` (`REASIGNADO_VENCIMIENTO`, `REASIGNADO_COI`).
   * Creación de la tabla `evaluacion.asignacion_historial` con FK a `asignaciones_evaluacion`.
2. **Entidad ORM formal para el Historial:**
   * `AssignmentHistoryOrmEntity` mapeada formalmente al esquema `evaluacion.asignacion_historial`.

---

## 9. Riesgos Técnicos

1. **Desalineación de Claves Foráneas en Base de Datos:** Si se intentara persistir estados como strings en `estado_id`, PostgreSQL abortará la transacción por violación de FK contra `catalogos.estados`.
2. **Duplicación de Rutas en Controladores:** Tener endpoints duplicados en `/evaluations` y `/api/evaluations` puede causar confusión en el frontend Angular.
3. **Pérdida de Plazos en Reasignaciones Consecutivas:** Si la transacción de reasignación no es atómica (`QueryRunner` con aislamiento `READ COMMITTED` / `SERIALIZABLE`), fallos concurrentes podrían desasignar un evaluador sin registrar el nuevo.

---

## 10. Recomendación de Alcance para el PLAN

El siguiente paso en el flujo SDD es estructurar el **PLAN** y **TASKS** focalizándose en:
1. **Paso 1 (Persistencia y Migración):** Crear la migración TypeORM incremental para los estados en `catalogos.estados` y la tabla `evaluacion.asignacion_historial`.
2. **Paso 2 (Adaptación de Repositorio y Entidades):** Adaptar `EvaluationAssignmentOrmEntity` y `EvaluationTypeOrmRepository` para conectar con la base de datos real con tipado numérico.
3. **Paso 3 (Adaptación de Use Cases y Servicios):** Adaptar `AssignEvaluatorsUseCase`, `ReassignEvaluatorUseCase` e `InheritEvaluatorsUseCase` al repositorio real.
4. **Paso 4 (Integración en Módulo y Controlador):** Registrar proveedores en `EvaluationsModule` y conectar los endpoints con sus guards de autorización y auditoría.
5. **Paso 5 (Verificación Integral):** Ejecutar `npm test`, `npm run test:e2e` y `npm run lint` para garantizar cero regresiones y 100% de cumplimiento del Definition of Done.
