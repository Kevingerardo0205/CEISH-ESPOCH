# Plan de Tareas de Implementación (Tasks Delta Brownfield): Flujo 002 — Asignación y Evaluación Par

**Código de Especificación:** `specs/002-flujo-mvp/spec.md` (v1.1.0)  
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
  - **Reemplazada (spec v1.3.0, 17/11/2026):** la cuota de 4 deja de regir; la nueva composición (RF-12.1) la implementa TSK-002-N52.

- [x] **TSK-002-02**: Implementar el servicio de sorteo aleatorio de Anexo 10 excluyendo Sociedad Civil.
  - **Requisito relacionado:** `RF-12.2`
  - **Criterio EARS:** `EARS (RF-12.2)` (Exclusión Aleatoria en Anexo 10).
  - **Acción:** `REUTILIZAR`
  - **Archivos afectados:** `src/modules/evaluations/domain/services/random-risk-selector.service.ts`, `src/modules/evaluations/domain/services/random-risk-selector.service.spec.ts`
  - **Dependencias:** Ninguna (Lógica pura con algoritmo Fisher-Yates).
  - **Descripción:** Selecciona aleatoriamente 2 evaluadores entre Jurídico, Metodológico y Salud, excluyendo innegociablemente a Sociedad Civil.
  - **Pruebas necesarias:** `npm test -- random-risk-selector.service.spec.ts` (100 iteraciones aleatorias pasando).
  - **Hecho cuando:** `SOCIEDAD_CIVIL` nunca recibe la marca `isAssignedForAnnex10` y siempre se eligen exactamente 2 evaluadores.
  - **Reemplazada (spec v1.3.0, 17/11/2026):** sin sorteo; Anexo 10 para todos menos Sociedad civil (RF-12.2a, TSK-002-N52). El servicio se retira en TSK-002-N55.

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

- [x] **TSK-002-07**: Adaptar servicio de reasignación y entidades de dominio puras a identificadores numéricos. (REABIERTA: spec v1.1.0 RF-12.7(e), pendiente de código)
  - **Requisito relacionado:** `RF-12.3`, `RF-12.7(e)`
  - **Criterio EARS:** `EARS (RF-12.3)` (Reasignación Inmutable por Motivo y homogeneidad de perfil).
  - **Acción:** `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/domain/services/evaluator-reassignment.service.ts`, `src/modules/evaluations/domain/entities/evaluation-assignment.entity.ts`, `src/modules/evaluations/domain/entities/assignment-history.entity.ts`, `src/modules/evaluations/domain/ports/evaluation.repository.port.ts`
  - **Dependencias:** `TSK-002-06`
  - **Descripción:** Ajustar los tipos a `number` en las entidades de dominio y actualizar el servicio para aplicar RF-12.7(e): el reemplazante hereda la `fecha_entrega_evaluacion` vigente de la convocatoria (sin calcular 15 días hábiles), el traspaso determinístico de Anexo 10 y la asignación del estado numérico correspondiente (`REASIGNED_COI` o `REASIGNED_VENCIMIENTO`).
  - **Pruebas necesarias:** `npm test -- evaluator-reassignment.service.spec.ts`
  - **Hecho cuando:** Las pruebas unitarias confirmen que intentar sustituir con un perfil heterogéneo arroja error y que se genera el registro inmutable con los estados numéricos correctos y la fecha heredada.

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

- [x] **TSK-002-09**: Adaptar `AssignEvaluatorsUseCase` y DTOs de asignación con tipado numérico. (REABIERTA: spec v1.1.0 RF-12.7(a), pendiente de código)
  - **Requisito relacionado:** `RF-12.1`, `RF-12.2`, `RF-12.6`, `RF-12.7(a)`
  - **Criterio EARS:** `EARS (RF-12.1)`, `EARS (RF-12.2)`, `EARS (RF-12.6)`
  - **Acción:** `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/application/dtos/evaluator-dtos.ts`, `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts`, `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.spec.ts`
  - **Dependencias:** `TSK-002-08`
  - **Descripción:** Adaptar el caso de uso para validar cuota con `QuotaEvaluatorValidatorService`, ejecutar sorteo de Anexo 10 con `RandomRiskSelectorService`, registrar `fecha_asignacion` sin fijar plazo de entrega (tarea queda "Pendiente de convocatoria" según RF-12.7(a)), persistir en `EvaluationTypeOrmRepository` y despachar evento `evaluator.assigned`.
  - **Pruebas necesarias:** `npm test -- assign-evaluators.use-case.spec.ts`
  - **Hecho cuando:** La prueba unitaria simule la asignación completa de 4 evaluadores con estado "Pendiente de convocatoria" retornando las entidades persistidas y confirmando la emisión de los eventos.

- [x] **TSK-002-10**: Adaptar `ReassignEvaluatorUseCase` y DTOs de reasignación con tipado numérico. (REABIERTA: spec v1.1.0 RF-12.7(e), pendiente de código)
  - **Requisito relacionado:** `RF-12.3`, `RF-12.6`, `RF-12.7(e)`
  - **Criterio EARS:** `EARS (RF-12.3)`, `EARS (RF-12.6)`
  - **Acción:** `ADAPTAR`
  - **Archivos afectados:** `src/modules/evaluations/application/dtos/evaluator-dtos.ts`, `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts`, `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.spec.ts`
  - **Dependencias:** `TSK-002-08`
  - **Descripción:** Adaptar el caso de uso para recibir `currentAssignmentId: number`, buscar la asignación previa, invocar `EvaluatorReassignmentService.executeReassignment`, aplicar RF-12.7(e) (el reemplazante hereda `fecha_entrega_evaluacion` vigente de la convocatoria; si no está agendado queda "Pendiente de convocatoria"), ejecutar la transacción de persistencia y disparar la notificación por correo al nuevo evaluador.
  - **Pruebas necesarias:** `npm test -- reassign-evaluator.use-case.spec.ts`
  - **Hecho cuando:** La prueba valide la ejecución transaccional y que el reemplazante hereda la fecha de entrega vigente (sin reinicio de plazo a días hábiles fijos).

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

---

## 7. Parámetros Configurables Nuevos (RF-12.7 — Pendientes de implementación)

Los siguientes parámetros deben leerse de la configuración del sistema (no hardcodeados):

| Parámetro | Valor inicial | RF |
|---|---|---|
| `plazo_revision_oficio_dias` | 8 días laborables | RF-12.7(c): tiempo mínimo de revisión en oficio; si `fecha_reunion` queda a menos de este valor desde `fecha_asignacion`, advertencia no bloqueante |
| `dias_max_sin_convocatoria` | 8 días laborables | RF-12.7(d): alerta a Secretaría/Presidencia cuando protocolo-versión lleva más de este valor sin convocatoria |
| `dias_alerta_normativo_sin_convocatoria` | pendiente de confirmación | RF-12.7(d): alerta de proximidad al `fecha_plazo_normativo` sin convocatoria; aplica RF-ALR |

---

## 8. Nuevas Tareas Pendientes (RF-12.7)

- [x] **TSK-002-N01**: Implementar RF-12.7(a) — asignación sin plazo + "Pendiente de convocatoria".
  - **Requisito relacionado:** `RF-12.7(a)`
  - **Criterio EARS:** `EARS (RF-12.6)` (notificación indica que la fecha de entrega se informará al agendar)
  - **Descripción:** Al asignar evaluadores, registrar `fecha_asignacion` y NO fijar `fecha_entrega_evaluacion`. El estado de la tarea del evaluador debe mostrarse como "Pendiente de convocatoria". El oficio de asignación indica `plazo_revision_oficio_dias` como tiempo de referencia (no fecha límite).
  - **Hecho cuando:** Prueba unitaria y E2E confirmen que la asignación retorna `fecha_entrega_evaluacion: null` y el mensaje "Pendiente de convocatoria".

- [x] **TSK-002-N02**: Implementar RF-12.7(e) — reasignación hereda `fecha_entrega_evaluacion` vigente.
  - **Requisito relacionado:** `RF-12.7(e)`
  - **Criterio EARS:** `EARS (RF-12.3)`
  - **Descripción:** Al reasignar, el reemplazante hereda la `fecha_entrega_evaluacion` de la convocatoria activa. Si el protocolo no está agendado, queda "Pendiente de convocatoria". No hay reinicio de plazo.
  - **Hecho cuando:** Prueba unitaria confirme herencia de fecha y E2E valide la ruta de reasignación con y sin convocatoria activa.

- [x] **TSK-002-N03**: Implementar RF-12.7(d) — alerta de protocolos sin convocatoria tras `dias_max_sin_convocatoria`. Movida a PR-C5; requiere @nestjs/schedule. `dias_alerta_normativo_sin_convocatoria` = 5 (provisional, pendiente confirmar con secretaría).
  - **Requisito relacionado:** `RF-12.7(d)`
  - **Criterio EARS:** aplica RF-ALR
  - **Descripción:** Cron diario que lista protocolos-versión con pares asignados y sin convocatoria. Alerta a Secretaría/Presidencia cuando transcurran `dias_max_sin_convocatoria` (inicial 8) días laborables desde la `fecha_asignacion` activa más antigua, o cuando `fecha_plazo_normativo` esté a `dias_alerta_normativo_sin_convocatoria` o menos. La reasignación NO reinicia la antigüedad.
  - **Semántica "agendado":** Una versión se considera agendada cuando existe al menos una `convocatoria_protocolos` cuya convocatoria tiene `estado <> CANCELADA` (es decir, PROGRAMADA, EN_CURSO o CONCLUIDA). Una convocatoria CANCELADA no cuenta: la versión sigue apareciendo en la alerta aunque haya estado en una convocatoria que luego se canceló. Razón: `EN_CURSO` y `CANCELADA` nunca se asignan hoy (solo PROGRAMADA y CONCLUIDA), pero la semántica debe ser correcta para cuando se implementen esas transiciones.
  - **Hecho cuando:** Prueba unitaria del cron valide las dos condiciones de alerta; alerta deja de emitirse al agendar.

- [x] **TSK-002-N04**: Exponer `assignedAt` y estado semántico de convocatoria en el response de asignaciones.
  - **Requisito relacionado:** `RF-12.7(a)`, `RF-12.7(b)`
  - **PR:** PR-B2 (`feat/assignment-without-deadline`)
  - **Criterio EARS:** `EARS (RF-12.6)` (el oficio informa estado de convocatoria al evaluador)
  - **Descripción:** El objeto literal de respuesta en `evaluations.service.ts:1453-1464` actualmente omite `assignedAt` y no indica si el evaluador está "Pendiente de convocatoria". Añadir `assignedAt` (fecha de asignación, ya disponible en `asignaciones_evaluacion.fecha_asignacion`) y `estadoConvocatoria: 'Pendiente de convocatoria' | 'Con plazo asignado'` derivado de si `deadline === null`. No se necesita migración: `fecha_asignacion` ya existe como `@CreateDateColumn` y `fecha_limite` ya es `nullable: true` (verificado en Paso 1 (a) y (g)).
  - **Hecho cuando:** La respuesta del endpoint de asignaciones incluya `assignedAt` y `estadoConvocatoria` para cada asignación; prueba unitaria verifica ambos campos.

- [x] **TSK-002-N05**: Implementar aviso suave no bloqueante RF-12.7(c) al crear convocatoria — `fecha_reunion` a menos de `PLAZO_REVISION_OFICIO_DIAS` de la `fecha_asignacion` activa más antigua.
  - **Requisito relacionado:** `RF-12.7(c)`
  - **PR:** PR-B1 (`feat/meeting-delivery-after-session`)
  - **Criterio EARS:** `EARS (RF-12.6)`
  - **Archivos afectados:**
    - `src/modules/evaluations/application/services/calculate-meeting-dates.service.ts` (método `evaluateSoftWarnings` — nuevo o existente)
    - `src/modules/evaluations/application/use-cases/create-meeting.use-case.ts`
  - **Dependencias:** `TSK-009-N01`
  - **Descripción:** Al crear la convocatoria, por cada protocolo-versión incluido, si el número de días hábiles entre la **fecha de asignación activa más antigua** de ese protocolo y `fecha_reunion` es menor que `PLAZO_REVISION_OFICIO_DIAS` (= 8, de `deadline-rules.ts`), la respuesta incluye una advertencia no bloqueante. La convocatoria se crea igualmente (HTTP 201); no se modifica ningún valor en BD. La advertencia se genera en `calculate-meeting-dates.service.ts` (método `evaluateSoftWarnings`) y se propaga en el response como `advertencias: [{ protocolVersionId, mensaje }]`.
  - **Hecho cuando:** Prueba unitaria verifica: (a) si `diasHabilesEntre(fechaAsignacionMasAntigua, fechaReunion) < PLAZO_REVISION_OFICIO_DIAS`, el response del create-meeting incluye la advertencia para ese protocolo; (b) si `>= PLAZO_REVISION_OFICIO_DIAS`, sin advertencia; (c) la convocatoria se crea con HTTP 201 en ambos casos.

- [x] **TSK-002-N06**: PR-B3 — `EVALUADOR_URGENTE_UMBRAL_DIAS` aplicable solo cuando existe `fecha_limite`.
  - **Requisito relacionado:** `RF-09.1`
  - **PR:** PR-B3 (`fix/documental-subsanation-30d`)
  - **Criterio EARS:** aplica RF-09.1
  - **Descripción:** **Verificado (`evaluations.service.ts:226-228`)**: el código ya tolera `deadline === null` — `const deadline = a.deadline ? endOfDayGuayaquil(a.deadline) : null` + `let isUrgent = false` (default), sobreescrito solo dentro del `if (deadline) { ... }`. No se necesita cambio adicional para el null check. En PR-B3 confirmar con Secretaría el valor del umbral `EVALUADOR_URGENTE_UMBRAL_DIAS = 2` y eliminar el `TODO PR-B` del código.
  - **Hecho cuando:** Prueba unitaria verifica: (a) `deadline = null` → `isUrgent = false`; (b) `deadline = mañana` → `isUrgent = true`; (c) `deadline = en 5 días` → `isUrgent = false`.

- [x] **TSK-002-N07**: PR-B2 — actualizar tests E2E que asertan `fecha_limite` legado al asignar (sin convocatoria).
  - **Requisito relacionado:** `RF-12.7(a)`
  - **PR:** PR-B2 (`feat/assignment-without-deadline`)
  - **Criterio EARS:** aplica RF-12.7(a)
  - **Descripción:** Cuatro aserciones hardcodean valores de `fecha_limite` basados en la regla LEGACY de 8/15 días desde asignación:
    - `test/real-db-evaluations.e2e-spec.ts:363`: aserta `'2026-03-12'` (EXPEDITA, 8 días). Después de PR-B2, valor esperado: `null` (sin convocatoria aún).
    - `test/real-db-evaluations.e2e-spec.ts:372`: aserta `'2026-03-23'` (PLENO, 15 días). Después de PR-B2, valor esperado: `null`.
    - `test/real-db-evaluations.e2e-spec.ts:616`: test de **reasignación COI** — verifica `fecha_limite` de la nueva asignación (evaluador 905, version 992) después de `POST /api/evaluations/reassign`. El test no crea convocatoria activa; valor LEGACY `'2026-03-23'` (15 días). Después de PR-B2 (sin convocatoria activa), valor esperado: `null`.
    - `test/peer-risk-concurrency.e2e-spec.ts:202,215,236`: asertan `deadlineDate` absoluto basado en cálculo de 8/15 días. Después de PR-B2, `deadlineDate` = `null` en el response.
  - **Hecho cuando:** Las cuatro aserciones pasan en verde con `deadline = null` para contextos sin convocatoria activa y sin referencias al valor LEGACY.

- [x] **TSK-002-N08**: Eliminar `calculateEvaluatorDeadline` y `PLAZO_REVISION_OFICIO_PLENO_LEGACY_DIAS` (código muerto tras PR-B2).
  - **Requisito relacionado:** `RF-12.7(a)` — la asignación no calcula `fecha_limite`; el método contradice la spec.
  - **PR:** PR de limpieza independiente (`chore/remove-dead-evaluator-deadline`).
  - **Grep de callers (ejecutado):**
    - `calculateEvaluatorDeadline`: definición en `src/modules/protocols/application/services/protocol-deadline.service.ts:62`. Sin callers de producción. Mock muerto en `src/modules/evaluations/application/services/submit-peer-risk.spec.ts:47,101`.
    - `PLAZO_REVISION_OFICIO_PLENO_LEGACY_DIAS`: definición en `src/shared/deadlines/deadline-rules.ts:25`. Importado y usado solo en `src/modules/protocols/application/services/protocol-deadline.service.ts:7,70` (dentro de `calculateEvaluatorDeadline`).
  - **Acción**: ELIMINAR (no hay callers de producción; la función y la constante son código muerto).
  - **Archivos afectados:**
    - `src/modules/protocols/application/services/protocol-deadline.service.ts` — eliminar el método `calculateEvaluatorDeadline` y el import de `PLAZO_REVISION_OFICIO_PLENO_LEGACY_DIAS`.
    - `src/shared/deadlines/deadline-rules.ts` — eliminar `PLAZO_REVISION_OFICIO_PLENO_LEGACY_DIAS`.
    - `src/modules/evaluations/application/services/submit-peer-risk.spec.ts` — eliminar el mock muerto `calculateEvaluatorDeadline`.
  - **Tests:** `npm test` verde tras las eliminaciones; `npx tsc --noEmit` sin errores.
  - **Hecho cuando:** `calculateEvaluatorDeadline` y `PLAZO_REVISION_OFICIO_PLENO_LEGACY_DIAS` no aparecen en `git grep` de `src/`; todos los tests pasan.

- [x] **TSK-002-N09**: Rediseñar el puente de correos de asignación en `evaluations.module.ts` (~línea 131).
  - **Requisito relacionado:** `RF-12.7` — notificación al evaluador al ser asignado.
  - **PR:** `fix/correo-asignacion-deeplink` (junto con TSK-002-N19 y TSK-002-N22).
  - **Descripción:** El puente actual enviaba nombre fijo `"Evaluador"`, usaba `protocolCode` como asunto y descartaba el HTML de la plantilla. **Solución implementada (2026-10-22):** se añadió `sendHtml(email, subject, html)` a `IEmailServicePort` y sus dos implementaciones (`ResendEmailAdapter`, `NodemailerEmailAdapter`). El factory de `MailerNotificationAdapter` en `evaluations.module.ts` ahora inyecta `ConfigService`, pasa `FRONTEND_URL` como `baseUrl` al adaptador, y el bridge llama `emailService.sendHtml(options.to, options.subject, options.html)` — preservando el HTML rico construido por `MailerNotificationAdapter` (nombre real del evaluador, protocolo real, deeplink correcto). **Fecha límite nula (2026-10-22):** `deadlineDate` cambia a `string | null | undefined`; cuando el valor es nulo, vacío o inválido el correo muestra "La fecha límite de entrega será comunicada por la Secretaría." en lugar de "Invalid Date" o epoch — necesario mientras TSK-002-N37 esté pendiente (sin convocatoria activa, `deadlineDate` llega null).
  - **Archivos afectados:**
    - `src/modules/notifications/domain/ports/email.service.port.ts` — MODIFICAR: añadir `sendHtml`.
    - `src/modules/notifications/infrastructure/adapters/resend-email.adapter.ts` — MODIFICAR: implementar `sendHtml`; tests N09 (describe `N09 — sendHtml`) en `resend-email.adapter.spec.ts`.
    - `src/modules/notifications/infrastructure/adapters/nodemailer-email.adapter.ts` — MODIFICAR: implementar `sendHtml`.
    - `src/modules/evaluations/evaluations.module.ts` — MODIFICAR: inyectar `ConfigService`, pasar `frontendUrl`, bridge usa `sendHtml`.
    - `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts` — MODIFICAR: `deadlineDate` opcional, lógica null-safe con `deadlineSection`.
    - `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.spec.ts` — MODIFICAR: tests N09-U-01 (nombre real), N09-U-02 (null), N09-U-03 (undefined), N09-U-04 (vacío), N19-U-01 (deeplink), N19-U-02 (fallback).
    - `test/real-db-evaluations.e2e-spec.ts` — MODIFICAR: `sendHtmlMock` en `IEmailServicePort` mock; tests 12a y 12b ejercitan el puente real (`handleEvaluatorAssignedEvent` → `sendMail` del factory → `emailService.sendHtml` = `sendHtmlMock`) sin override de `MailerNotificationAdapter`; afirman deeplink `/dashboard/evaluations/evaluate/:id` en el HTML.
  - **Hecho cuando:** tsc limpio; 403 tests verdes (56 suites); 149 E2E verdes (13 suites × 2 pasadas); ESLint sin errores.

- [x] **TSK-002-N10**: Implementar `GET /api/evaluations/protocol/:protocolId/reassignment-history`.
  - **Requisito relacionado:** `RF-12.3` — historial inmutable de reasignaciones de evaluadores.
  - **PR:** PR-D (`feat/reassignment-history-endpoint`).
  - **Descripción:** Endpoint de solo lectura que devuelve el historial de reasignaciones de evaluadores para un protocolo, ordenado de más reciente a más antiguo. Acceso restringido a roles `SECRETARIA` y `PRESIDENTE` con permiso `EVALUATORS_ASSIGN`. Responde 200+array vacío si el protocolo existe sin historial; 404 si el protocolo no existe; 400 si `:protocolId` no es entero.
  - **Archivos afectados:**
    - `src/modules/evaluations/application/use-cases/get-reassignment-history.use-case.ts` — CREAR caso de uso con interfaz `IHistoryQueryRepository` y mapeo de perfil por normalización NFD.
    - `src/modules/evaluations/application/use-cases/get-reassignment-history.use-case.spec.ts` — CREAR 10 unit tests.
    - `test/reassignment-history.e2e-spec.ts` — CREAR suite E2E con 7 casos (RH-01…RH-07) contra `ceish_test_db`.
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` — MODIFICAR añadir `ReassignmentHistoryRawRow`, `findReassignmentHistoryByProtocolId`, `protocolExists`.
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR implementar métodos con un único JOIN (sin N+1).
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR añadir endpoint `GET protocol/:protocolId/reassignment-history`.
    - `src/modules/evaluations/evaluations.module.ts` — MODIFICAR registrar y exportar `GetReassignmentHistoryUseCase`.
    - `test/evaluations-contract.e2e-spec.ts` — MODIFICAR añadir mock de `GetReassignmentHistoryUseCase`.
    - `test/peer-risk-concurrency.e2e-spec.ts` — MODIFICAR añadir mock de `GetReassignmentHistoryUseCase`.
  - **Tests:** `npm test` → 328 passed; `npx jest --config ./test/jest-e2e.json --forceExit --runInBand` → 117 passed; `npx tsc --noEmit` limpio.
  - **Cobertura E2E (RH-01…RH-07):** RH-01 campos + orden DESC; RH-02 vacío 200; RH-03 404 español; RH-04 400 no-numérico; RH-05 metadata Reflector (roles+permiso; demostrado en rojo sin `@Roles`); RH-06 403 vía header simulado; RH-07 aislamiento por protocolo. Los guards `JwtAuthGuard` y `RolesGuard` están sobreescritos en el módulo de prueba (401/403 con guards reales pendiente TSK-002-N13).
  - **Nota (producción):** En producción el `ResponseInterceptor` envuelve el arreglo como `{ data: [...], statusCode, message: 'Success' }` (una capa); los E2E no registran el interceptor.
  - **Hecho cuando:** tsc limpio; 328 unit tests y 117 E2E verdes; ESLint sin errores nuevos sobre archivos tocados; endpoint devuelve JSON con campos `id`, `assignmentId`, `previousEvaluatorId`, `previousEvaluatorName`, `newEvaluatorId`, `newEvaluatorName`, `evaluatorProfile`, `reassignmentReason`, `reasonDescription`, `executedByUserId`, `executedByUserName`, `executedAt` en orden DESC.

- [x] **TSK-002-N11**: Corregir fallback `adminUserId ?? 1` en `EvaluationsController.reassignEvaluator`.
  - **Requisito relacionado:** Integridad de auditoría — `RF-12.3` registra `ejecutado_por`.
  - **PR:** posterior a PR-D.
  - **Descripción:** En `evaluations.controller.ts` (línea 191), cuando `req.user` es `undefined`, el controlador usa `adminUserId = 1` y persiste `ejecutado_por = 1` en `evaluacion.asignacion_historial`, falsificando la auditoría. La causa raíz: el fallback `req.user?.id ? Number(req.user.id) : 1` no lanza error cuando el guard falla o cuando se llama sin token. **Investigado:** `JwtAuthGuard` está activo a nivel de clase; en los tests E2E existentes se sobreescribe; en producción nunca debería llegar con `req.user` falsy, pero el fallback permite silenciarlo. Fix: validar que `rawId` sea number puro o string `/^\d+$/`, exigir `Number.isInteger(n) && n > 0`, y lanzar `UnauthorizedException` si no pasa. Segundo fallback detectado en `reassign-evaluator.use-case.ts:277–279` (`|| 1`); queda inalcanzable con el controlador validando entero positivo — reportado, no modificado (fuera de scope de la tarea, que solo lista el controlador).
  - **Archivos afectados:**
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` (línea 191) — MODIFICAR: eliminar el fallback `?? 1` y lanzar `UnauthorizedException` si `req.user` es falsy o su `id` no es numérico.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.spec.ts` — CREAR: unit tests N11-U-01…N11-U-03 para `reassignEvaluator`.
  - **Hecho cuando:** `req.user` undefined/id inválido en `POST /evaluations/reassign` devuelve 401; el caso de uso no es invocado; tsc limpio; tests verdes.
  - **Resultado:** tsc limpio; 394 unit tests verdes (+13: N11-U-01…N11-U-03, N11-U-Neg×9, N11-U-Pos); 149 E2E verdes; ESLint sin errores sobre archivos tocados.

- [ ] **TSK-002-N12** (PENDIENTE): Consolidar enum `AssignmentStatus` duplicado.
  - **Requisito relacionado:** Limpieza de deuda técnica; sin RF directo.
  - **PR:** posterior a PR-D, puede ir junto a TSK-002-N11.
  - **Descripción:** Existe duplicación del enum `AssignmentStatus` (verificado con `git grep -n "AssignmentStatus" -- src test`):
    - `src/shared/enums/evaluator-enums.ts` — define valores **string** (`ASSIGNED='ASSIGNED'`, `SUBMITTED='SUBMITTED'`, `REASIGNED_VENCIMIENTO='REASIGNED_VENCIMIENTO'`, `REASIGNED_COI='REASIGNED_COI'`). **Solo lo importa su propio test `src/shared/enums/evaluator-enums.spec.ts`; ningún archivo de producción lo usa.**
    - `src/modules/evaluations/domain/enums/assignment-status.enum.ts` — define valores **numéricos** (`SUGGESTED=5`, `ASSIGNED=6`, `COMPLETED=7`, `ARCHIVED=8`, `REASIGNED_VENCIMIENTO=26`, `REASIGNED_COI=27`). **Es el único utilizado** en todos los repositorios, use cases, services y tests funcionales.
    Nota ortográfica: ambos enums usan `REASIGNED_*` (una sola S), no `REASSIGNED_*`.
    Acción: evaluar si `evaluator-enums.ts:AssignmentStatus` puede eliminarse o debe alinearse; si se elimina, eliminar también `evaluator-enums.spec.ts` o redirigirlo al enum numérico.
  - **Archivos afectados:**
    - `src/shared/enums/evaluator-enums.ts` — MODIFICAR (eliminar o consolidar `AssignmentStatus` string).
    - `src/shared/enums/evaluator-enums.spec.ts` — MODIFICAR o ELIMINAR según decisión anterior.
  - **Hecho cuando:** `git grep 'AssignmentStatus'` en `src/` muestra solo el enum numérico en `domain/enums/`; tsc limpio; tests verdes.

- [x] **TSK-002-N13**: Cobertura E2E de 401/403 con guards reales para los endpoints de solo lectura de evaluaciones.
  - **Requisito relacionado:** Seguridad — `RF-12.3` (historial) y `RF-12.4` (asignaciones activas).
  - **PR:** posterior a PR-D, PR-E y TSK-002-N11.
  - **Descripción:** Las suites `reassignment-history.e2e-spec.ts` y `active-assignments.e2e-spec.ts` verifican decoradores de seguridad vía metadatos Reflector y 403/permisos con guards simulados, pero `JwtAuthGuard` y `RolesGuard` están sobreescritos en el módulo de prueba. Para verificar que sin token real se obtiene 401 y con rol incorrecto se obtiene 403 usando los guards de producción, se crea una suite separada que levanta el módulo SIN `.overrideGuard(JwtAuthGuard)` ni `.overrideGuard(RolesGuard)`. Los use cases de lectura y el `PermissionsGuard` sí son sobreescritos para aislar el foco del test. Los JWTs se firman en runtime con `JwtService` del módulo de la app. Incluye también cobertura E2E de N11: `POST /evaluations/reassign` sin token → 401.
  - **Endpoints a cubrir:**
    - `GET /api/evaluations/protocol/:protocolId/reassignment-history`
    - `GET /api/evaluations/protocol/:protocolId/active-assignments`
    - `POST /api/evaluations/reassign` (cobertura N11, 401 sin token)
  - **Archivos afectados:**
    - `test/reassignment-read-auth.e2e-spec.ts` — CREAR suite E2E con guards reales (N13-A-01…N13-A-05, N13-B-01…N13-B-05, N13-C-01 para POST).
  - **Hecho cuando:** sin token devuelve 401 real (JwtAuthGuard activo); con JWT de rol `EVALUADOR` devuelve 403 real (RolesGuard activo); token con rol `SECRETARIA` o `PRESIDENTE` llega al use case y devuelve 200; `POST /reassign` sin token devuelve 401 y el caso de uso no es invocado; tsc limpio; tests verdes.
  - **Resultado:** tsc limpio; 394 unit tests verdes; 149 E2E verdes (+11: N13-A-01…N13-A-05, N13-B-01…N13-B-05, N13-C-01); ESLint sin errores sobre archivos tocados.

- [x] **TSK-002-N14**: Implementar `GET /api/evaluations/protocol/:protocolId/active-assignments`.
  - **Requisito relacionado:** `RF-12.4` — lista de asignaciones activas de un protocolo.
  - **PR:** PR-E (`feat/active-assignments-endpoint`).
  - **Descripción:** Endpoint de solo lectura que devuelve las asignaciones activas (estados SUGGESTED/ASSIGNED/COMPLETED = 5/6/7) de la versión 1 de un protocolo, ordenadas por `assignedAt` ASC (desempate por `id`). Acceso restringido a roles `SECRETARIA` y `PRESIDENTE` con permiso `EVALUATORS_ASSIGN`.
    - 200 con `assignments: []` si el protocolo existe pero no tiene versión 1, o si la versión 1 no tiene asignaciones activas.
    - 404 en español si el protocolo no existe.
    - 400 si `:protocolId` no es entero.
    - **Decisión de versión (Opción C):** Se añade el método nuevo `findProtocolWithVersion1(protocolId)` al puerto `IEvaluationRepository`: realiza un LEFT JOIN `public.protocolos p LEFT JOIN public.versiones_protocolo vp ON vp.protocolo_id = p.id AND vp.numero_version = 1` para obtener `ceishCode` y `versionId` en una sola consulta con `numero_version = 1` **explícito** en la condición JOIN. **Nota:** `findVersionByProtocolId` **no es llamado** por este caso de uso. **Deuda técnica:** toda la asignación (`assign-evaluators.use-case.ts:127-143`, `evaluations.service.ts:856-858`, `EvaluatorAssignmentAdapterService`) está fijada a `numero_version=1`. Si se habilitan evaluaciones de versiones posteriores, escritor y lector deben cambiarse juntos.
    - **Contrato de `deadlineDate`:** se devuelve como `YYYY-MM-DD` (fecha de calendario sin hora); el cliente debe interpretarla como fecha local. `assignedAt` y `submittedAt` van en ISO-8601 completo.
    - **Helper extraído:** `resolveProfile` de `get-reassignment-history.use-case.ts` movido a `src/shared/helpers/evaluator-profile.helper.ts` como `resolveEvaluatorProfile`, con test dedicado.
  - **Archivos afectados:**
    - `src/shared/helpers/evaluator-profile.helper.ts` — CREAR helper exportado.
    - `src/shared/helpers/evaluator-profile.helper.spec.ts` — CREAR 9 unit tests.
    - `src/modules/evaluations/application/use-cases/get-active-assignments.use-case.ts` — CREAR caso de uso con interfaz `IActiveAssignmentsQueryRepository`.
    - `src/modules/evaluations/application/use-cases/get-active-assignments.use-case.spec.ts` — CREAR 9 unit tests.
    - `src/modules/evaluations/application/use-cases/get-reassignment-history.use-case.ts` — MODIFICAR para importar `resolveEvaluatorProfile` del helper compartido.
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` — MODIFICAR añadir `ActiveVersionRow` y método abstracto `findProtocolWithVersion1`.
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR implementar `findProtocolWithVersion1` con LEFT JOIN SQL (sin N+1).
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR añadir endpoint `GET protocol/:protocolId/active-assignments`.
    - `src/modules/evaluations/evaluations.module.ts` — MODIFICAR registrar y exportar `GetActiveAssignmentsUseCase`.
    - `test/active-assignments.e2e-spec.ts` — CREAR suite E2E con 10 casos (AA-01…AA-10) contra `ceish_test_db`.
    - `test/evaluations-contract.e2e-spec.ts` — MODIFICAR añadir mock de `GetActiveAssignmentsUseCase`; corregir `require()` por imports ESM.
    - `test/peer-risk-concurrency.e2e-spec.ts` — MODIFICAR añadir mock de `GetActiveAssignmentsUseCase`.
  - **Tests:** `npm test` → 346 passed (+18 nuevos); `npx jest --config ./test/jest-e2e.json --forceExit --runInBand` → 127 passed (+10 nuevos); `npx tsc --noEmit` limpio; ESLint sin errores sobre archivos tocados.
  - **Cobertura E2E (AA-01…AA-10):** AA-01 400 no-numérico; AA-02 404 protocolo inexistente; AA-03 200 sin versión 1; AA-04 200 sin asignaciones; AA-05 shape completo DTO; AA-06 ARCHIVED/REASIGNED excluidos; AA-07 `isAssignedForAnnex10`; AA-08 orden determinista; AA-09 versión 2 no aparece (fija deuda de versión); AA-10 metadata Reflector roles+permiso. Guards `JwtAuthGuard` y `RolesGuard` sobreescritos (401/403 reales pendiente TSK-002-N13).
  - **Hecho cuando:** tsc limpio; 346 unit tests y 127 E2E verdes; ESLint sin errores nuevos sobre archivos tocados; endpoint devuelve JSON con campos `protocolId`, `ceishCode`, `versionId`, `versionNumber`, `assignments[]` en orden `assignedAt ASC`.

- [ ] **TSK-002-N15** (PENDIENTE): `ReassignEvaluatorUseCase` no valida el estado de la asignación saliente.
  - **Requisito relacionado:** Sin regla documentada en los specs. RF-12.3 (`specs/002-flujo-mvp/spec.md:56`) — texto exacto verificado: «Si un evaluador es desasignado por vencimiento del plazo o Conflicto de Interés (`CONFLICTO_INTERES`), el sistema debe conservar inmutable el registro saliente (marcando estado `REASIGNADO_VENCIMIENTO` o `REASIGNADO_COI` con timestamp y motivo) y filtrar obligatoriamente al evaluador reemplazante dentro del mismo perfil estricto (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO` o `SALUD`), aplicando RF-12.7(e) para la fecha de entrega.» La regla describe qué hacer al reasignar; no establece como precondición que el estado previo deba ser SUGGESTED o ASSIGNED.
  - **Actualización 21/10/2026:** La reunión no abordó explícitamente si se puede reasignar un estado COMPLETED o ya REASIGNED_*. Decisión de negocio sigue PENDIENTE.
  - **PR:** posterior a PR-E.
  - **Descripción:** En `reassign-evaluator.use-case.ts`, después de `findAssignmentById` (línea ~100), el caso de uso no verifica el `statusId` de la asignación saliente. Permite reasignar asignaciones ya en estado `COMPLETED` (7) o en estados `REASIGNED_VENCIMIENTO` (26) / `REASIGNED_COI` (27). **DECISIÓN DE NEGOCIO PENDIENTE:** confirmar con el Presidente o la Secretaría si una asignación en estado COMPLETED o ya REASIGNED_* puede volver a reasignarse. Solo tras esa confirmación se implementa (o descarta) la validación de estado.
  - **Archivos afectados:**
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts` — MODIFICAR según decisión de negocio.
  - **Hecho cuando:** La decisión de negocio está documentada; si se decide bloquear, el endpoint devuelve error en español al intentar reasignar un estado no permitido; tests verdes.

- [x] **TSK-002-N16**: `ReassignEvaluatorDto` exige `replacementEvaluatorProfile`; el contrato del cliente actual no lo envía.
  - **Requisito relacionado:** RF-12.3 (`specs/002-flujo-mvp/spec.md:84`) — «filtrar obligatoriamente al evaluador reemplazante dentro del mismo perfil estricto (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO` o `SALUD`)». La regla exige que el reemplazante sea del mismo perfil que el saliente, pero no determina si ese perfil debe viajar en el body del cliente o derivarse del registro saliente.
  - **PR:** posterior a PR-E.
  - **Descripción:** `ReassignEvaluatorDto` (`evaluator-dtos.ts:84-87` — `replacementEvaluatorProfile: EvaluatorProfile;` con `@IsEnum` sin `@IsOptional`) declara el campo como obligatorio. El caso de uso consume `dto.replacementEvaluatorProfile` en tres puntos — líneas verificadas: `reassign-evaluator.use-case.ts:213` (`replacementEvaluatorProfile: dto.replacementEvaluatorProfile`), `reassign-evaluator.use-case.ts:301` (`evaluatorProfile: dto.replacementEvaluatorProfile`) y `reassign-evaluator.use-case.ts:213` (en la llamada a `executeReassignment`). Opciones evaluadas: (a) derivarlo del evaluador saliente y eliminar el campo del DTO; (b) que el cliente lo envíe con el perfil del saliente. **Decisión: opción (b).** El contrato mantiene `replacementEvaluatorProfile` como campo obligatorio; el frontend ya lo envía con el valor del perfil del saliente.
  - **Resultado:** Decisión (b). El campo `replacementEvaluatorProfile` permanece obligatorio en `ReassignEvaluatorDto` sin cambios de código. El frontend (repo FRONTEND-CEISH) ya envía el campo con el perfil del evaluador saliente: `modal-reasignacion.component.ts:136` y `evaluation-api.adapter.ts:287`. El backend valida la coincidencia de perfiles en `evaluator-reassignment.service.ts:37` (`replacementEvaluatorProfile !== currentAssignment.evaluatorProfile → Error`). Sin cambios de código en backend.
  - **Archivos afectados:**
    - Ninguno — sin cambios de código.
  - **Hecho cuando:** Decisión documentada; contrato verificado como coherente entre frontend y backend; sin cambios de código requeridos.

- [x] **TSK-002-N17**: Enriquecer el evento `evaluator.assigned` con `evaluatorEmail`, `evaluatorFullName` y `protocolCode`.
  - **Requisito relacionado:** RF-12.6 — notificación al evaluador por correo con deep-link.
  - **PR:** PR-F (`feat/n17-enriquecer-evento-evaluador`).
  - **Descripción:** El `MailerNotificationAdapter` tiene un fallback `evaluador@espoch.edu.ec` (línea 38) porque los eventos emitidos por `AssignEvaluatorsUseCase` (línea 195) y `ReassignEvaluatorUseCase` (línea 324) no incluyen `evaluatorEmail`, `evaluatorFullName` ni `protocolCode`. Se añade el método `findEnrichmentInfo(evaluatorId: number, protocolId: number)` a `IEvaluationRepository` (puerto abstracto) y a las mini-interfaces locales de ambos use cases. La consulta SQL une `catalogos.usuarios` y `public.protocolos` por sus IDs. La llamada es *best-effort*: si falla o devuelve `null`, el evento se emite igual sin los campos de enriquecimiento. Se elimina el fallback `evaluador@espoch.edu.ec` en `handleEvaluatorAssignedEvent`; si `evaluatorEmail` es `undefined`, la función retorna sin enviar.
  - **Archivos afectados:**
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` — MODIFICAR: añadir `EvaluatorEnrichmentInfo` y método abstracto `findEnrichmentInfo`.
    - `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts` — MODIFICAR: añadir `findEnrichmentInfo?` a la mini-interfaz local; enriquecer el payload del evento.
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts` — MODIFICAR: añadir `findEnrichmentInfo?` a la mini-interfaz local; enriquecer el payload del evento.
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: implementar `findEnrichmentInfo` con consulta SQL.
    - `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts` — MODIFICAR: eliminar fallback; retornar si `evaluatorEmail` es `undefined`.
    - `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.spec.ts` — MODIFICAR: añadir test de enriquecimiento.
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.spec.ts` — MODIFICAR: añadir `findEnrichmentInfo` al mock; actualizar aserción del evento.
    - `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.spec.ts` — MODIFICAR: añadir test de skip cuando `evaluatorEmail` es `undefined`.
  - **Tests:** `npm test` → todos los tests existentes verdes más nuevos; `npx tsc --noEmit` limpio; ESLint sin errores sobre archivos tocados.
  - **Hecho cuando:** `grep -r 'evaluador@espoch.edu.ec'` no aparece en código fuente; `findEnrichmentInfo` es el único punto donde se consulta el email del evaluador para notificaciones; tsc limpio; tests unitarios y E2E verdes; catch registra warning con `evaluadorId` y `protocolId`; logger presente en los tres archivos modificados.

- [x] **TSK-002-N18**: El SDK de Resend no lanza excepción ante respuesta `{ data, error }` — `"Email de asignación enviado"` se loguea aunque la petición falle con 401.
  - **Requisito relacionado:** RF-12.6 — notificación fiable al evaluador.
  - **PR:** posterior a PR-F.
  - **Descripción:** En `resend-email.adapter.ts`, `this.resend.emails.send(...)` devuelve `{ data, error }` en lugar de lanzar. El adaptador solo hace `await` sobre la llamada pero no inspecciona `error`. Si la clave `RESEND_API_KEY` es inválida o el dominio no está verificado, la respuesta contiene `error != null` pero el código no lo detecta y el log dice "Email enviado" igualmente. Es necesario comprobar `if (result.error) throw new Error(...)` para que los fallos sean observables.
  - **Archivos afectados:**
    - `src/modules/notifications/infrastructure/adapters/resend-email.adapter.ts` — MODIFICAR: inspeccionar `result.error`.
  - **Hecho cuando:** cuando Resend devuelve `error`, el adaptador lanza excepción (capturada en `.catch(()=>{})`) y el log refleja el fallo en lugar del éxito; tsc limpio.

- [x] **TSK-002-N19**: el deep-link del correo de asignación apunta a login genérico en lugar de al panel del evaluador.
  - **Requisito relacionado:** RF-12.6 — deep-link correcto al panel de evaluación en producción.
  - **PR:** `fix/correo-asignacion-deeplink` (junto con TSK-002-N09 y TSK-002-N22).
  - **Descripción:** **Solución implementada (2026-10-22):** `MailerNotificationAdapter` construye el deep-link a partir de `baseUrl` (inyectado desde `FRONTEND_URL`). La ruta correcta confirmada con el frontend (TSK-002-N22) es `/dashboard/evaluations/evaluate/${assignmentId}` con fallback `/dashboard/evaluations/list` cuando no hay `assignmentId`. El bridge ahora preserva el HTML completo del adaptador (ver TSK-002-N09). **Ruta verificada:** `${FRONTEND_URL}/dashboard/evaluations/evaluate/${assignmentId}`.
  - **Archivos afectados:**
    - `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts` — MODIFICAR: deeplink corregido a `/dashboard/evaluations/evaluate/${assignmentId}` con fallback a `/dashboard/evaluations/list`.
  - **Hecho cuando:** tsc limpio; 397 tests verdes; N19-U-01 y N19-U-02 pasan en verde.

- [x] **TSK-002-N20**: No existe bandera para deshabilitar el envío de correos en desarrollo.
  - **Requisito relacionado:** Calidad del entorno de desarrollo.
  - **PR:** posterior a PR-F.
  - **Descripción:** En entorno local o de pruebas, cada ejecución de tests o cada asignación de prueba intenta enviar un correo real a través del SDK de Resend (aunque falle silenciosamente). No hay variable `EMAIL_ENABLED=false` ni modo "dry-run". Se debe añadir soporte para `EMAIL_ENABLED` en `AppConfig` y respetarlo en `ResendEmailAdapter` antes de llamar al SDK.
  - **Archivos afectados:**
    - `src/config/app.config.ts` — MODIFICAR: añadir `emailEnabled: process.env.EMAIL_ENABLED !== 'false'`.
    - `src/modules/notifications/infrastructure/adapters/resend-email.adapter.ts` — MODIFICAR: retornar `void` sin llamar al SDK si `!emailEnabled`.
  - **Hecho cuando:** con `EMAIL_ENABLED=false` en `.env`, los tests E2E no intentan contactar Resend; tsc limpio.

- [ ] **TSK-002-N21** (PENDIENTE): Cuando falla el envío de correo de recuperación de contraseña o de confirmación de cuenta, el usuario recibe HTTP 200 sin saber que el correo no llegó.
  - **Requisito relacionado:** RF-12.6 — notificación fiable; UX de flujos de auth.
  - **Descripción:** `N18` hace que `sendPasswordReset` y `sendEmailConfirmation` registren `Logger.error` en lugar de lanzar excepción (para no romper flujos de auth sin manejo de error local). Consecuencia: si Resend falla, `auth.service.ts` devuelve HTTP 200 y el usuario ve un mensaje de éxito, pero el correo nunca llega. Es necesario decidir la UX correcta: ¿devolver 500/502 y que el usuario reintente? ¿Devolver 200 pero mostrar un aviso de "correo pendiente, revisa en unos minutos"? ¿Reintentos internos? La decisión requiere alineación con producto antes de implementar.
  - **Archivos afectados (cuando se implemente):**
    - `src/modules/auth/application/services/auth.service.ts` — MODIFICAR: según decisión de UX, propagar error o cambiar el mensaje de respuesta cuando el correo falla.
    - `src/modules/notifications/infrastructure/adapters/resend-email.adapter.ts` — MODIFICAR: según decisión, puede relanzar en métodos de auth o devolver `boolean` indicando éxito.
  - **Hecho cuando:** el comportamiento ante fallo de correo en flujos de auth está documentado y aceptado por producto; la implementación elegida tiene pruebas unitarias verdes; tsc limpio.

- [x] **TSK-002-N22**: Verificar que la ruta del deep-link del panel de evaluador exista en el frontend.
  - **Requisito relacionado:** RF-12.6 — deep-link correcto al panel de evaluación.
  - **Descripción:** **Verificado (2026-10-22):** La ruta frontend real es `/dashboard/evaluations/evaluate/:assignmentId` (no `/evaluations/:assignmentId/panel`, que no existe). Fallback: `/dashboard/evaluations/list`. Implementado en `mailer-notification.adapter.ts` como parte del PR `fix/correo-asignacion-deeplink`. La ruta `/evaluations/:assignmentId/panel` listada en la descripción original era incorrecta — corregida en este PR.
  - **Hecho cuando:** URL corregida documentada en `mailer-notification.adapter.ts`; pruebas N19-U-01 y N19-U-02 pasan en verde.

- [x] **TSK-002-N23**: Diagnosticar causa raíz aparente en protocolo 169 — no era un bug de código.
  - **Requisito relacionado:** RF-12.2d — designación automática por acuerdo.
  - **PR:** PR-H (`feat/risk-level-designation`).
  - **Requisito relacionado:** RF-12.2d — designación automática por acuerdo.
  - **PR:** PR-H (`feat/risk-level-designation`).
  - **Descripción:** **No había bug de código.** Diagnóstico ejecutado en `ceish_db` (2026-10-20):

    **Hallazgos confirmados:**
    - Asignación 83 (Verónica Cando) → `nivel_riesgo_id = 5` (RIESGO_MINIMO), ronda 1, `es_vigente = false`.
    - Asignación 84 (Gabriel Tamayo) → `nivel_riesgo_id = 7` (RIESGO_MAYOR), ronda 1, `es_vigente = false`.
    - Protocolo 169 → `status_id = 16` (DISCREPANCIA_RIESGO), `nivel_riesgo_id = null`, `nivel_riesgo_confirmado = false`.
    - La lógica de discrepancia funcionó correctamente: los IDs diferían → se archivaron propuestas → estado 16.
    - El "mismo nivel" observado en la prueba fue un error de selección del usuario durante el experimento.

    **Catálogo `catalogos.niveles_riesgo`** (verificado):
    | id | código | activo | tipo_revision |
    |---|---|---|---|
    | 4 | SIN_RIESG *(typo)* | true | — |
    | 5 | RIESGO_MINIMO | true | — |
    | 6 | RIESGO_MODERADO | true | — |
    | 7 | RIESGO_MAYOR | true | — |
    | 8 | ENSAYO_CLINICO | false | — |

    **Consecuencias para tareas siguientes:**
    - N24: no hay bug a corregir en la comparación; el foco es auditoría + notificaciones + enum + quitar reset legacy.
    - N25: protocolo 169 (en DISCREPANCIA_RIESGO con convocatoria 010-2026) es un caso real para probar el endpoint de pleno.
    - N26: la migración debe apuntar solo a `RIESGO_MODERADO` (id=6); no a `RIESGO_MAYOR` ni a `SIN_RIESG`.
    - Pendiente de confirmar en BD: `SELECT id, nombre FROM catalogos.estados WHERE id IN (13, 16)` y conteo de referencias a nivel_riesgo_id=6.

  - **Archivos afectados:** Ninguno (solo lectura de BD).
  - **Pruebas necesarias:** Ninguna (diagnóstico).
  - **Hecho cuando:** ✅ Causa raíz documentada.

- [x] **TSK-002-N24**: Refactorizar `submitPeerRiskLevel()` — usar enum de estados, añadir auditoría y notificaciones (RF-12.2c/d/e).
  - **Requisito relacionado:** RF-12.2c, RF-12.2d, RF-12.2e, RF-12.2g.
  - **PR:** PR-H (`feat/risk-level-designation`).
  - **Dependencias:** TSK-002-N23 (causa raíz conocida).
  - **Descripción:** Refactorizar el método `submitPeerRiskLevel` en `evaluations.service.ts` (líneas 1067–1331) para cumplir la spec. La lógica de comparación ya funciona correctamente (confirmado N23); los cambios son aditivos.

    **1 — Estados por enum (líneas 1202, 1207, 1302, 1311):**
    Reemplazar los magic numbers `protocol.statusId = 13` y `protocol.statusId = 16` por `ProtocolStatus.EN_EVALUACION` y `ProtocolStatus.DISCREPANCIA_RIESGO` del enum ya importado en `protocol-status.enum.ts`. (Pendiente confirmar nombres en BD: `SELECT id, nombre FROM catalogos.estados WHERE id IN (13, 16)`.)

    **2 — Auditoría de cada propuesta individual (RF-12.2c):**
    Inmediatamente después de guardar la propuesta con `riskProposalRepo.save(proposal)` (y el equivalente en la ruta legacy), registrar en `sistema.audit_log` dentro de la misma transacción usando `manager.getRepository(AuditLogOrmEntity)`:
    ```ts
    { action: 'RISK_PROPOSAL_SUBMITTED', table: 'evaluacion.propuestas_riesgo',
      recordId: protocolId, userId: evaluatorId,
      newData: { riskLevelId: dto.riskLevelId, round: currentRound, assignmentId } }
    ```
    Requiere importar `AuditLogOrmEntity` en `evaluations.service.ts` (ya existe en la BD). Requiere añadir `AuditLogOrmEntity` a `TypeOrmModule.forFeature` en `evaluations.module.ts`.

    **3 — Designación automática (RF-12.2d) — ruta canonical:**
    Dentro del bloque `if (p1Proposal.riskLevelId === p2Proposal.riskLevelId)` (línea 1185):
    - Mantener la lógica de derivar `reviewType` desde `finalRiskLevel.reviewType` (ya existente).
    - Añadir registro de auditoría en la misma transacción: `action = 'RISK_LEVEL_AUTO_DESIGNATED'`, `userId = null` (SISTEMA), `newData = { riskLevelId, reviewType, round, versionId }`.
    - Tras commit de la transacción, notificar best-effort a los 4 evaluadores (NO dentro de la transacción): llamar a `IEmailServicePort.sendRiskLevelDesignated(email, name, protocolCode, reviewType)` para cada asignación activa de la versión. Si falla, `Logger.error` sin relanzar.
    - **Nota:** `sendRiskLevelDesignated` es un método **nuevo** que debe añadirse a `IEmailServicePort` (puerto) y a `ResendEmailAdapter` (adaptador) con dry-run guard y `result.error` check (misma pauta que N18/N20).

    **4 — Discrepancia (RF-12.2e) — ruta canonical:**
    Dentro del bloque `else` (línea 1205):
    - Ya archiva propuestas con `isCurrent = false` — mantener.
    - Añadir auditoría: `action = 'RISK_LEVEL_DISCREPANCY'`, `userId = null`, `newData = { p1: { riskLevelId, evaluatorId }, p2: { riskLevelId, evaluatorId }, round }`.
    - Tras commit, notificar best-effort a la Secretaría: `IEmailServicePort.sendRiskDiscrepancyAlert(emailSecretaria, protocolCode, codesProposed)`. Método **nuevo** con misma pauta.

    **5 — Corrección ruta legacy (RF-12.2e, anti-destrucción de datos — alcance mínimo):**
    En el bloque `else` de discrepancia legacy (líneas 1315–1322), eliminar el reset destructivo:
    ```ts
    pa.proposedRiskLevelId = undefined;
    pa.observations = undefined;
    pa.reportPath = undefined;
    pa.submittedAt = undefined;
    ```
    **Acción correcta:** no modificar los campos; agregar únicamente un `TODO` que señale la rama `refactor/remove-legacy-evaluations` donde se retira el flujo completo. El flujo legacy (`evaluacion.asignaciones_pares_riesgo`) está siendo retirado y no vale la pena rediseñarlo en este PR. La corrección mínima es quitar el reset para que los datos históricos no se destruyan si la ruta legacy aún se ejecuta.

    **6 — Prueba de regresión (verificación del flujo completo):**
    En `test/risk-designation.e2e-spec.ts` (nuevo archivo), dos casos E2E con protocolos de prueba en `ceish_test_db`:
    - **RD-01 (acuerdo):** Dos propuestas con el mismo `riskLevelId` → el protocolo queda con `isRiskLevelDesignated = true`, `riskLevelId` asignado, `statusId = ProtocolStatus.EN_EVALUACION`; 2 entradas `RISK_PROPOSAL_SUBMITTED` y 1 `RISK_LEVEL_AUTO_DESIGNATED` en `sistema.audit_log`.
    - **RD-02 (discrepancia):** Dos propuestas con `riskLevelId` distinto → `statusId = ProtocolStatus.DISCREPANCIA_RIESGO`, propuestas archivadas (`es_vigente = false`), 2 entradas `RISK_PROPOSAL_SUBMITTED` y 1 `RISK_LEVEL_DISCREPANCY`; datos de propuestas NO reseteados a null.
    El protocolo 169 (ya en `DISCREPANCIA_RIESGO` con convocatoria 010-2026 en `ceish_db`) es un caso real validado pero NO se usa en el E2E automatizado (apunta a `ceish_test_db`).

  - **Archivos afectados:**
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR (líneas 1067–1331).
    - `src/modules/evaluations/evaluations.module.ts` — MODIFICAR: añadir `AuditLogOrmEntity` a `TypeOrmModule.forFeature`.
    - `src/modules/notifications/domain/ports/email.service.port.ts` — MODIFICAR: añadir métodos `sendRiskLevelDesignated` y `sendRiskDiscrepancyAlert`.
    - `src/modules/notifications/infrastructure/adapters/resend-email.adapter.ts` — MODIFICAR: implementar los 2 métodos nuevos con dry-run guard y `result.error` check.
    - `src/modules/notifications/infrastructure/adapters/resend-email.adapter.spec.ts` — MODIFICAR: añadir tests para los 2 métodos nuevos.
    - `test/risk-designation.e2e-spec.ts` — CREAR suite E2E (o ampliar `real-db-evaluations.e2e-spec.ts`).
    - `src/modules/evaluations/application/services/submit-peer-risk.spec.ts` — MODIFICAR: añadir pruebas unitarias del flujo refactorizado.
  - **Pruebas necesarias:** `npm test` verde; `npx jest --config ./test/jest-e2e.json --forceExit --runInBand` verde; `npx tsc --noEmit` limpio.
  - **Hecho cuando:** Dos propuestas iguales → `isRiskLevelDesignated = true` + `statusId = EN_EVALUACION` + 3 entradas de auditoría; dos propuestas distintas → `statusId = DISCREPANCIA_RIESGO` + propuestas archivadas + 2 entradas auditoría (sin resetear datos legacy); tsc y ESLint limpios.

- [x] **TSK-002-N25**: Nuevo endpoint `PATCH /evaluations/protocols/:protocolId/risk-level` para designación en pleno (RF-12.2f).
  - **Requisito relacionado:** RF-12.2f — designación en pleno por Secretaría.
  - **PR:** PR-H (`feat/risk-level-designation`).
  - **Dependencias:** TSK-002-N24 (lógica de designación reutilizada).
  - **Descripción:** Endpoint que permite a un usuario con rol `SECRETARIA` registrar el nivel de riesgo acordado en sesión de pleno sobre un protocolo en estado `DISCREPANCIA_RIESGO`.

    **DTO** (`DesignatePlenumRiskDto`) — tipos verificados contra ORM:
    ```ts
    { riskLevelId: number;  // @IsInt @IsPositive  (catalogos.niveles_riesgo.id → integer)
      meetingId: string;    // @IsUUID             (evaluacion.convocatorias.id → uuid, confirmado en ConvocatoriaOrmEntity:29)
    }
    ```

    **Caso real de prueba manual (N23):** protocolo 169 está en `DISCREPANCIA_RIESGO` con convocatoria 010-2026 en `ceish_db`. Usar para validar el endpoint manualmente antes de que `ceish_test_db` tenga datos equivalentes.

    **Validaciones** (responden antes de abrir la transacción):
    1. `protocolId` es entero positivo → 400 si no.
    2. Protocolo existe en `public.protocolos` → 404 en español si no.
    3. `protocol.statusId === ProtocolStatus.DISCREPANCIA_RIESGO` → 409 `"El protocolo no está en estado de discrepancia de riesgo"` si no.
    4. `riskLevel` existe en `catalogos.niveles_riesgo` con `isActive = true` → 404 si no.
    5. Existe fila en `evaluacion.convocatoria_protocolos` con `convocatoria_id = meetingId` Y `protocolo_id = protocolId` → 409 `"La convocatoria indicada no incluye este protocolo"` si no.

    **Acción** (en una única transacción):
    - Aplica pasos 1–4 de RF-12.2d: fijar `riskLevelId`, `isRiskLevelDesignated = true`, derivar `reviewType` de `tipo_revision`, avanzar estado a `EN_EVALUACION`.
    - Registrar en auditoría: `action = 'RISK_LEVEL_PLENO_DESIGNATED'`, `userId = req.user.id`, `newData = { riskLevelId, meetingId, round: 'pleno' }`.
    - Tras commit, notificar best-effort a los 4 evaluadores con `sendRiskLevelDesignated` (misma función de N24).

    **Seguridad:** `@JwtAuthGuard`, `@Roles('SECRETARIA')`, `@Permissions(Permission.EVALUATORS_ASSIGN)`.
    **Respuesta:** 200 `{ message: 'Nivel de riesgo designado en pleno exitosamente.', riskLevelId, reviewType, statusId }`.

  - **Archivos afectados:**
    - `src/modules/evaluations/application/dtos/evaluator-dtos.ts` — MODIFICAR: añadir `DesignatePlenumRiskDto`.
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: añadir método `designatePlenumRiskLevel(protocolId, dto, userId)`.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR: añadir `@Patch('protocols/:protocolId/risk-level')`.
    - `test/risk-designation.e2e-spec.ts` — MODIFICAR/CREAR: añadir casos E2E para el endpoint (409 no-DISCREPANCIA, 409 convocatoria incorrecta, 200 designación exitosa, 400 no-entero, 404 protocolo inexistente).
  - **Pruebas necesarias:** `npm test` verde; E2E con casos PL-01…PL-05; `npx tsc --noEmit` limpio.
  - **Hecho cuando:** ✅ Con protocolo en `DISCREPANCIA_RIESGO` y `meetingId` válido, el endpoint responde 200 y el protocolo queda con `isRiskLevelDesignated = true`, `statusId = EN_EVALUACION`; 409 en los casos de protocolo sin discrepancia o convocatoria incorrecta; tsc y ESLint limpios.
  - **Evidencia prueba manual (ceish_db, 2026-10-20, sesión Secretaría):**
    - `PATCH /api/evaluations/protocols/169/risk-level` con `{ riskLevelId: 5, meetingId: "7fe0e1c1-67db-455c-ae85-e1853467e57b" }` → 200, protocolo 169 en EN_EVALUACION (13), reviewType EXPEDITA.
    - Segunda llamada al mismo endpoint → 409 (protocolo ya no está en DISCREPANCIA_RIESGO).
    - Auditoría `RISK_LEVEL_PLENO_DESIGNATED` visible en la bitácora del protocolo.
    - Evaluadora ya ve el formulario de dictamen (Anexo 9, revisión expedita).

- [ ] **TSK-002-N26** (PENDIENTE): RF-12.2b — verificar niveles no-PET en `catalogos.niveles_riesgo` y marcarlos `activo = false`.
  - **Requisito relacionado:** RF-12.2b — solo los 3 niveles PET son válidos.
  - **PR:** PR-H (`feat/risk-level-designation`).
  - **Descripción:** Los únicos niveles de riesgo válidos según el PET del CEISH-ESPOCH son **Sin riesgo** (`SIN_RIESG`, id=4), **Riesgo mínimo** (`RIESGO_MINIMO`, id=5) y **Riesgo mayor al mínimo** (`RIESGO_MAYOR`, id=7). El nivel `RIESGO_MODERADO` (id=6) está activo pero no pertenece al PET. El nivel `ENSAYO_CLINICO` (id=8) ya está inactivo.

    **Catálogo confirmado en N23 (ceish_db):**
    | id | código | activo | notas |
    |---|---|---|---|
    | 4 | SIN_RIESG | true | PET (typo en código, ver nota al pie) |
    | 5 | RIESGO_MINIMO | true | PET |
    | 6 | RIESGO_MODERADO | true | NO PET — desactivar |
    | 7 | RIESGO_MAYOR | true | PET (ver nota al pie) |
    | 8 | ENSAYO_CLINICO | false | ya inactivo |

    **Paso 1 (referencias a nivel 6 — confirmado en ceish_db 2026-10-20):**
    - `evaluacion.propuestas_riesgo` con `nivel_riesgo_id = 6`: **0 filas**.
    - `public.protocolos` con `nivel_riesgo_id = 6`: **15 filas** (ids 6–104, borradores de prueba sin `codigo_ceish`, `estado_id = NULL`, creados entre 6 y 22 de mayo de 2026; el formulario de creación tenía selector de riesgo). No se modifican (son datos de prueba).
    La migración puede ejecutarse sin riesgo de romper propuestas ni protocolos activos.

    **Paso 2 (migración):**
    Crear `src/migrations/<timestamp>-MarkRiesgoModeradoInactive.ts` que apunta exclusivamente al nivel 6 por su código exacto:
    ```sql
    -- up
    UPDATE catalogos.niveles_riesgo
    SET activo = false
    WHERE codigo = 'RIESGO_MODERADO';

    -- down
    UPDATE catalogos.niveles_riesgo
    SET activo = true
    WHERE codigo = 'RIESGO_MODERADO';
    ```
    **No usar `NOT IN`** — la lista de PET tiene un typo en el código (`SIN_RIESG`) y un nombre que difiere del PET (`RIESGO_MAYOR`); una lista `NOT IN` podría desactivarlos por error si los códigos cambian.

    **Paso 3 (validación ya existente):**
    La validación `riskLevelRepo.findOne({ where: { id: dto.riskLevelId, isActive: true } })` ya existe en `submitPeerRiskLevel` (línea 1138) — no requiere cambio de código adicional.

    **Nota — limpieza de catálogo propuesta para tarea futura (NO implementar aquí):**
    - `SIN_RIESG` (id=4): el código tiene un typo (falta la 'O'). Corregir a `SIN_RIESGO` requiere una migración `UPDATE ... SET codigo = 'SIN_RIESGO' WHERE id = 4` y actualizar cualquier lógica que compare por código string.
    - `RIESGO_MAYOR` (id=7): el PET llama a este nivel "Investigación con riesgo mayor al mínimo". Renombrar el `nombre` del catálogo (no el código) en otra migración.
    Ambas son mejoras cosméticas con bajo riesgo técnico; proponer al equipo antes de ejecutar.

  - **Archivos afectados:**
    - `src/migrations/<timestamp>-MarkRiesgoModeradoInactive.ts` — CREAR.
  - **Pruebas necesarias:** `npx tsc --noEmit` limpio; migración ejecutable y reversible; `riskLevelId = 6` en endpoint devuelve 404.
  - **Hecho cuando:** `RIESGO_MODERADO` tiene `activo = false` en `ceish_db`; los 3 niveles PET siguen activos; tsc limpio; validación `isActive` rechaza id=6 con 404.

- [ ] **TSK-002-N27** (PENDIENTE): RF-12.2 — eliminar `riskLevelId` del DTO de creación de protocolo (camino 1 no autorizado).
  - **Requisito relacionado:** RF-12.2 — solo los caminos RF-12.2d y RF-12.2f pueden fijar `nivel_riesgo_id` en un protocolo.
  - **PR:** PR-H (`feat/risk-level-designation`).
  - **Descripción:** El campo `riskLevelId?: number` en `CreateProtocolDto` permitía que el cliente enviara directamente un nivel de riesgo al crear el protocolo, omitiendo el proceso de Anexo 10. Origen confirmado de los 15 protocolos con `nivel_riesgo_id = 6` (borradores de prueba, N26).

    **Verificación previa (ya ejecutada):**
    - Solo `protocols.service.ts:140` usa `cleanData.riskLevelId` al crear. No hay endpoint PUT/PATCH de protocolo ni ningún otro servicio que pase `riskLevelId` en creación.
    - Ningún test E2E de `test/` envía `riskLevelId` al crear un protocolo — confirmado con `grep`.
    - `ValidationPipe` tiene `whitelist: true` en `main.ts`: si el campo permaneciera en el DTO pero se eliminara del servicio, el pipe lo strip igualmente en peticiones futuras.

    **Cambios:**
    1. `src/modules/protocols/application/dtos/create-protocol.dto.ts` — MODIFICAR: eliminar las tres líneas del campo `riskLevelId` (`@ApiProperty`, `@IsOptional`, `@IsNumber`, `riskLevelId?: number`).
    2. `src/modules/protocols/application/services/protocols.service.ts:140` — MODIFICAR: eliminar la línea `riskLevelId: cleanData.riskLevelId,` del objeto pasado a `this.protocolsRepository.save(...)`.

    **Sin migración:** la columna `nivel_riesgo_id` permanece `nullable` (correcto; solo los caminos RF-12.2d/f la rellenan). Los 15 protocolos de prueba no se modifican.

  - **Archivos afectados:**
    - `src/modules/protocols/application/dtos/create-protocol.dto.ts` — MODIFICAR.
    - `src/modules/protocols/application/services/protocols.service.ts` — MODIFICAR (línea 140).
  - **Pruebas necesarias:** `npx tsc --noEmit` limpio; `npm test` verde; `POST /api/protocols` con `riskLevelId` en el body no falla (campo ignorado por `whitelist: true`) y el protocolo creado tiene `riskLevelId = null`.
  - **Hecho cuando:** `grep -n riskLevelId src/modules/protocols/application/dtos/create-protocol.dto.ts` no devuelve resultados; tsc limpio; tests verdes.

- [ ] **TSK-002-N28** — absorbida por N29. Ver TSK-002-N29.

- [ ] **TSK-002-N29** (PENDIENTE — fuera de PR-H): Modelo de estados — fuente de verdad única para bandejas, contadores y flujo.
  - **Requisito relacionado:** Integridad de datos y coherencia de UI — sin RF directo; afecta todos los flujos y pantallas de bandeja, inicio y Validación Documental.
  - **PR:** separado, a aprobar antes de implementar.
  - **Descripción:** Existen tres tracks de estado en paralelo sin una fuente de verdad documentada ni acordada:

    | Track | Tabla / columna | Semántica actual |
    |---|---|---|
    | Flujo del proceso | `public.protocolos.estado_id` | Estado vivo del protocolo (9–21, `ProtocolStatus`). Cambia en cada transición. |
    | Disposición de la versión | `versiones_protocolo.estado_id` | Estado final de cada versión (APROBADO/RECHAZADO/REQUIERE_SUBSANACION/EN_CONTROL_DOCUMENTAL). Solo lo escribe `calls.service.ts` y `resolutions.service.ts`. |
    | Checklist documental | `recepcion.estado_id` | Progreso de recepción. Es la fuente actual de bandejas de Secretaría (`ProtocolOrmEntity.receptionStatus` getter). |

    **Síntoma observado:** En prueba real, los contadores no coincidían entre pantallas (inicio mostraba 3/110, Validación Documental mostraba 0/0 con 3 tarjetas visibles). Hay confusión real en producción, no solo de nomenclatura.

    **Brecha conocida:** `reports/` y `follow-up/` no existen en el backend, pero el frontend tiene pantallas de Reportes (estadísticas, MSP, custom) y Seguimiento activas. Cualquier propuesta de modelo de estados debe anticipar qué campo leerán esos módulos cuando se implementen.

    **Problemas concretos a resolver:**
    1. **`versiones_protocolo.estado_id = 1` en 117 registros:** La migración `1783000000000` insertó `1 as estado_id` (hardcoded), que corresponde a `catalogos.estados.id = 1` = `'APROBADO'` categoría `'DOCUMENTO'` — un estado del catálogo documental, no del flujo de protocolo (el enum `ProtocolStatus` empieza en 9). Ningún código actual lee este campo en rutas críticas (solo `ai-assistant/context.service.ts`), pero queda inconsistente.
    2. **`public.protocolos.estado_id` nullable:** 117 protocolos con `estado_id = NULL` (confirmado ceish_db, 2026-10-20). `protocols.service.ts` no asigna estado al crear. Todos son borradores de prueba, pero el patrón se repite en cada `POST /protocols`.
    3. **Estado BORRADOR inexistente:** No hay estado explícito para protocolo recién creado. `NULL` actúa de facto como BORRADOR pero rompe guards y consultas que filtran por `estado_id`.
    4. **`REQUIERE_SUBSANACION_VERSION` / `EN_CONTROL_DOCUMENTAL` en `calls.service.ts`:** Estos estados de versión los escribe el legacy (`calls.service.ts`), que está en retirada. Antes de retirar ese módulo, la escritura debe migrarse al flujo de Meetings.

    **Propuestas a analizar (requieren aprobación antes de implementar):**
    - **(a)** Definir `public.protocolos.estado_id` como fuente única del estado del flujo para bandejas y contadores; `versiones_protocolo.estado_id` solo para historial archival de cada versión.
    - **(b)** Añadir `BORRADOR` explícito en `catalogos.estados` (nuevo id, categoría `'PROTOCOLO'`) y asignarlo en `protocols.service.ts` al crear; hacer la columna `NOT NULL DEFAULT <id_borrador>` en migración posterior.
    - **(c)** Migración para corregir las 117 versiones con `estado_id = 1`: mapear a `EN_CONTROL_DOCUMENTAL` (21) si su protocolo está en flujo activo, o al estado que corresponda según `protocolos.estado_id`.
    - **(d)** Plan de transición para mover la escritura de `versiones_protocolo.estado_id` desde `calls.service.ts` al flujo de Meetings antes del retiro del legacy.
    - **(e)** Definir qué leerán `reports/` y `follow-up/` cuando se implementen, para no acoplarlos a `recepcion.estado_id` de forma implícita.

  - **Archivos afectados (cuando se apruebe e implemente):**
    - `src/modules/protocols/application/services/protocols.service.ts` — MODIFICAR: añadir `statusId: ProtocolStatus.BORRADOR` (o el ID que se decida) en `save()`.
    - `src/migrations/<timestamp>-AddBorradorEstado.ts` — CREAR: insertar fila en `catalogos.estados`.
    - `src/migrations/<timestamp>-FixVersionStatusBackfill.ts` — CREAR: corregir `versiones_protocolo.estado_id = 1`.
    - `src/migrations/<timestamp>-ProtocolStatusNotNull.ts` — CREAR (último paso, tras limpiar nulls).
    - `src/modules/protocols/domain/enums/protocol-status.enum.ts` — MODIFICAR: añadir `BORRADOR`.
  - **Pruebas necesarias:** `npm test` verde; contadores coinciden entre pantallas de inicio y Validación Documental; `POST /api/protocols` devuelve protocolo con `statusId = BORRADOR`; migración ejecutable y reversible.
  - **Hecho cuando:** `SELECT COUNT(*) FROM public.protocolos WHERE estado_id IS NULL` = 0; `SELECT COUNT(*) FROM versiones_protocolo WHERE estado_id = 1` = 0; tsc limpio; tests verdes; contadores de bandejas coherentes.
  - **No implementar hasta aprobación explícita.**

- [ ] **TSK-002-N30** (PENDIENTE — no implementar, solo registrado): Deuda de esquema en `evaluacion.convocatoria_protocolos` y `evaluacion.convocatorias`.
  - **Requisito relacionado:** RF-09 (convocatorias y numeración correlativa).
  - **PR:** separado, a investigar antes de implementar.
  - **Descripción:** Hallazgos observados en ceish_db que requieren análisis y decisión antes de cualquier migración:

    **Columnas duplicadas:**
    - `version_protocolo_id` (varchar, vacío) y `version_id` (int, el que usa el código) coexisten en `evaluacion.convocatoria_protocolos`. Proponer cuál se queda y migrar.
    - `creado_en`/`actualizado_en` y `created_at`/`updated_at` coexisten. Decidir columna canónica y migrar.

    **FKs sin confirmar:**
    - `version_id` y `protocolo_id` podrían carecer de FK formal a `versiones_protocolo` y `protocolos`. Verificar con `\d evaluacion.convocatoria_protocolos` y agregar FK si falta.

    **Datos vacíos:**
    - `fecha_reunion` y `fecha_entrega_evaluacion` vacías en la fila de prueba. Confirmar de dónde las toma la pantalla del frontend.

    **Numeración correlativa:**
    - `convocatorias.codigo` vacío en convocatorias recientes aunque el frontend muestra "010-2026". Averiguar de dónde sale ese código mostrado y si la numeración correlativa (RF-09) se está guardando correctamente.

    **Otros varchar _id:**
    - Revisar si hay otras columnas `*_id` en varchar en el esquema `evaluacion` que deberían ser entero o uuid.

  - **Archivos afectados (cuando se implemente):** migraciones TypeORM a definir tras el análisis.
  - **Pruebas necesarias:** verificación manual de esquema; luego tsc limpio y migración ejecutable/reversible.
  - **Hecho cuando:** columnas duplicadas eliminadas o consolidadas; FKs confirmadas o añadidas; columna de código canónica identificada; documentado en spec o ADR antes de implementar.

- [ ] **TSK-002-N31** (PENDIENTE — no implementar, solo registrado): Zona horaria en bitácora — hora 5 horas adelantada respecto a Ecuador.
  - **Requisito relacionado:** UX de auditoría — sin RF directo; afecta la lectura de la bitácora por Secretaría y Presidenta.
  - **PR:** separado, a analizar antes de implementar.
  - **Descripción:** Una acción realizada a las 09:05 hora de Ecuador (America/Guayaquil, UTC-5) se muestra en la bitácora como 14:05. La huella almacenada es 19:05Z. Síntoma: la columna `creado_en` / `created_at` de `sistema.audit_log` (u otras tablas de auditoría) se guarda en UTC pero se muestra sin conversión.

    **Puntos a investigar:**
    - Tipo de la columna en BD: `TIMESTAMP WITHOUT TIME ZONE` (no guarda zona) vs `TIMESTAMP WITH TIME ZONE` (guarda UTC).
    - Si es `WITHOUT TIME ZONE`: el valor guardado (e.g. `2026-10-20 09:05:00`) puede interpretarse como UTC o local según la configuración de sesión de PostgreSQL.
    - Si es `WITH TIME ZONE`: el ORM guarda correctamente en UTC (19:05Z) pero la UI muestra el valor raw en lugar de convertir a `America/Guayaquil`.
    - Revisar `AuditLogOrmEntity` y `BaseOrmEntity`: si usan `@CreateDateColumn()` sin `timezone: true` / `{ type: 'timestamptz' }`.

    **Regla a implementar (una sola):** guardar en UTC (`timestamptz` o valor UTC explícito) y convertir a `America/Guayaquil` en la capa de presentación (o en una vista SQL) antes de mostrar. No guardar hora local en la columna.

  - **Archivos afectados (cuando se implemente):** `AuditLogOrmEntity`, `BaseOrmEntity`, posible migración de tipo de columna, capa de presentación o vista SQL.
  - **Pruebas necesarias:** tras el fix, una acción a las 09:05 ECT se muestra como 09:05 en la bitácora; tsc limpio; migración ejecutable/reversible.
  - **Hecho cuando:** la bitácora muestra hora correcta en America/Guayaquil; la regla de zona horaria está documentada en un ADR o en la spec antes de implementar.

- [x] **TSK-002-N33**: RF-12.4 — corregir `GET /evaluations/completion-status/:protocolId` (devolvía siempre `false`).
  - **Requisito relacionado:** `RF-12.4`
  - **PR:** `fix/completion-status` contra `dev`.
  - **Descripción:** Tres bugs encadenados impedían que el endpoint devolviera `true`:
    1. `@Param('protocolId')` sin `ParseIntPipe` → el parámetro llegaba como `string '169'`; las dos ramas `typeof === 'number'` se saltaban.
    2. Incluso con el tipo correcto, se habría pasado el `protocolId` donde el repositorio espera un `versionId`; `findActiveAssignmentsByVersionId(169)` devolvería 0 filas porque las asignaciones están bajo `versionId = 141`.
    3. El método `findAssignmentsByProtocolId` no existe en `IEvaluationRepository` — la tercera rama siempre falsa.
    Fix: nuevo método `isCompletion100PercentByProtocolId(protocolId)` en `SubmitEvaluationUseCase` que resuelve `versionActualId` y verifica `isRiskLevelDesignated`; el método obsoleto eliminado; controlador solo agrega `ParseIntPipe`.
  - **Archivos afectados:**
    - MODIFICAR `src/modules/evaluations/application/use-cases/submit-evaluation.use-case.ts`
    - MODIFICAR `src/modules/evaluations/application/use-cases/submit-evaluation.use-case.spec.ts`
    - MODIFICAR `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts`
    - MODIFICAR `src/modules/evaluations/evaluations.module.ts`
    - MODIFICAR `specs/002-flujo-mvp/spec.md` (RF-12.4 y criterio EARS 4)
  - **Tests:**
    - `CS-U-01`: protocolo 169 (versión 141; asignaciones 81,83,84,85 COMPLETED; asignación COI REASIGNADO_COI; nivel designado) → `true`.
    - `CS-U-02`: 4 asignaciones COMPLETED pero `isRiskLevelDesignated = false` → `false`.
    - `CS-U-03`: solo 3 asignaciones activas COMPLETED → `false`.
    - `CS-U-04`: más de 4 asignaciones activas → `false`.
  - **Hecho cuando:** `GET /api/evaluations/completion-status/169` devuelve `isCompletion100Percent: true`; tsc limpio; todos los tests de regresión en verde; eslint limpio sobre archivos tocados.

- [x] **TSK-E2E-01**: Aislamiento y limpieza de datos E2E — eliminar residuos entre ejecuciones consecutivas.
  - **Requisito relacionado:** Calidad de pruebas (RNF — suites idempotentes).
  - **Archivos afectados:**
    - MODIFICAR `test/real-db-evaluations.e2e-spec.ts`
    - MODIFICAR `test/meeting-pdf-real.e2e-spec.ts`
    - MODIFICAR `test/jest-e2e.json`
  - **Descripción:** Las suites E2E dejan residuos en `ceish_test_db` porque (a) los IDs 993 y 994 están ausentes de las listas de limpieza global de `real-db-evaluations`; (b) el afterAll interno de N17 no limpia `propuestas_riesgo` ni usa `asignacion_nueva_id` en el historial; (c) `meeting-pdf-real` comparte el ID de protocolo/versión 993 con `real-db-evaluations` y su pre-clean no cubre las FKs de asignaciones; (d) ningún cleanup global incluye `recepcion.recepciones` antes de borrar `versiones_protocolo`; (e) sin `maxWorkers: 1`, las suites corren en paralelo contra la misma BD, lo que provoca fallos de cuenta global de convocatorias y errores `duplicate key uq_convocatoria_protocolos_version`.
  - **Subobjetivos:**
    - A. Script SQL de limpieza puntual (scratchpad, no repo): eliminación segura en FK-safe order, dentro de una transacción.
    - B. `real-db-evaluations`: agregar 993, 994 a los IN-lists del beforeAll y afterAll globales; agregar `DELETE FROM recepcion.recepciones` antes de `DELETE FROM versiones_protocolo`; pre-clean en beforeAll de N17; arreglar afterAll de N17 (propuestas_riesgo + asignacion_nueva_id).
    - C. `meeting-pdf-real`: renombrar protocolo/versión 993 → 988 para eliminar el solapamiento; agregar limpieza FK-safe de asignaciones antes de borrar versiones en beforeAll y afterAll.
    - D. `test/jest-e2e.json`: agregar `"maxWorkers": 1` (serializa suites) y `"forceExit": true` (Jest 29 queda colgado tras app.close() por handles internos de TypeORM/NestJS) — las suites comparten una única BD (`ceish_test_db`); la ejecución paralela (workers > 1) produce interferencia de datos entre suites y falla el guardia global de convocatorias de `real-db-evaluations` (recibe 66 vs baseline 65 cuando `meeting-pdf-real` corre en simultáneo).
  - **Tests:**
    - Dos ejecuciones consecutivas de `npm run test:e2e` (sin flags extra): ambas deben pasar con "Test Suites: 12 passed, 12 total" y 138 tests.
    - Residuos en los rangos 985-999 y usuarios 900-915: 0 filas tras cada ejecución.
  - **Hecho cuando:** tsc limpio; 138 E2E pasan en dos runs seguidos con `npm run test:e2e`; 0 residuos verificados con query manual.

- [ ] **TSK-002-N32** (PENDIENTE — no implementar, solo registrado): Latencia de ~15 s en `POST /api/evaluations/submit`.
  - **Requisito relacionado:** RF-12 (rendimiento del flujo de evaluación).
  - **PR:** separado, a diseñar antes de implementar.
  - **Descripción:** Los 3 bloques secuenciales sincrónicos de `submitEvaluation` (ruta EXPEDITA) acumulan ~15 s de latencia:
    1. `await Promise.all([generateAnnex9Pdf, generateAnnex9Docx])` — generación CPU-bound del PDF y DOCX en paralelo.
    2. `await Promise.all([uploadFile(pdf), uploadFile(docx)])` — subida a Cloudflare R2 en paralelo.
    3. `await emailService.sendEvaluationSubmitted(...)` — envío síncrono de correo a Secretaría.
    Los tres bloques deben completarse antes de que el endpoint responda 200.
    **Regla de negocio:** el PDF y el DOCX del Anexo 9 son el documento oficial del dictamen (valor legal); su generación y subida a R2 NO pueden moverse a segundo plano. Solo el correo (paso 3) puede hacerse fire-and-forget después del commit en BD.
    Los documentos se generan una sola vez por envío (los endpoints `GET /:id/document` y `GET /:id/document/docx` solo generan URLs firmadas de R2, no regeneran).
    **Fix propuesto (para aprobación):** mover únicamente `emailService.sendEvaluationSubmitted` a IIFE fire-and-forget post-commit; el resto (generación + upload) permanece síncrono.
  - **Archivos afectados (cuando se implemente):** `evaluations.service.ts` (~línea 694).
  - **Pruebas necesarias:** `submitEvaluation` responde < 2 s en entorno de prueba; el correo se despacha tras el retorno 200; tsc limpio; tests E2E verdes.
  - **Hecho cuando:** latencia < 2 s; correo enviado de forma asíncrona sin bloquear la respuesta; documentos PDF/DOCX subidos antes de retornar 200.

- [x] **TSK-002-N34**: Bug en `submitEvaluation` — protocolo no avanza a estado `EVALUADO=14` cuando hubo reasignación COI. Añade endpoint de reparación para protocolos ya completados.
  - **Requisito relacionado:** RF-12.3, RF-12.4.
  - **PR:** `fix/completion-status`.
  - **Descripción:** En `evaluations.service.ts` ~línea 706, `findAssignmentsByVersionId` devuelve TODAS las asignaciones de la versión, incluyendo `REASIGNADO_COI=27`. La condición `pending = all.filter(a => statusId !== COMPLETED)` incluye a la asignación COI como "pendiente", por lo que `pending.length > 0` y el protocolo nunca recibe `statusId = 14 (EVALUADO)`. El frontend (Bandeja de Resoluciones) llama `getProtocolsByStatusId(14)`, por lo que el protocolo nunca aparece allí. El endpoint `completion-status` es independiente de la bandeja; la bandeja filtra por `statusId=14`, no por `completion-status`.
    **Fix:** `findActiveAssignmentsByVersionId` (statusId ∈ {5,6,7}) en el paso 6 de `submitEvaluation`. Para protocolos ya completados (p. ej. 169): nuevo endpoint `PATCH /evaluations/protocols/:protocolId/recalculate-status` que llama `finalizeIfComplete(protocolId)` en `SubmitEvaluationUseCase`.
  - **Archivos afectados (MODIFICAR):**
    - `evaluations.service.ts` (~línea 706)
    - `src/modules/evaluations/application/use-cases/submit-evaluation.use-case.ts` (nuevo método `finalizeIfComplete`)
    - `src/modules/evaluations/application/use-cases/submit-evaluation.use-case.spec.ts` (CS-F-01, CS-F-02)
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` (nuevo endpoint PATCH)
    - `test/evaluations-assignment.e2e-spec.ts` (test N34)
  - **Pruebas necesarias:**
    - `CS-F-01`: protocolo 169 (4 COMPLETED + `isRiskLevelDesignated=true`) → `finalizeIfComplete` → `{ advanced: true }`.
    - `CS-F-02`: protocolo sin nivel designado → `finalizeIfComplete` → `{ advanced: false }`.
    - N34-E2E: `findActiveAssignmentsByVersionId` con 4 COMPLETED + 1 REASIGNED_COI → `pending = []`.
  - **Hecho cuando:** `PATCH /evaluations/protocols/169/recalculate-status` responde `{ advanced: true }`; tsc limpio; tests verdes; eslint limpio.

- [ ] **TSK-002-N35** (PENDIENTE — registrado, no implementar): `getSubmitProtocolInfo` incluye asignaciones `REASIGNADO_COI` en el campo `status: 'PENDING'` de la respuesta, lo que podría confundir al frontend al mostrar evaluadores ya reasignados como pendientes. No afecta flujo de completitud ni resolución. Archivo: `evaluations.service.ts` ~línea 1675. Fix: usar `findActiveAssignmentsByVersionId` en ese método.

- [x] **TSK-002-N36** (COMPLETADA): Rechazar al mismo evaluador como reemplazante por CONFLICTO_INTERES y demostrar con pruebas que VENCIMIENTO lo permite.
  - **Requisito relacionado:** RF-12.3 (`specs/002-flujo-mvp/spec.md`) — Decisión reunión 21/10/2026.
  - **Criterio EARS:** Criterio EARS RF-12.3 — Reasignación por VENCIMIENTO y por CONFLICTO_INTERES.
  - **PR:** posterior a PR-E.
  - **Descripción:** En `reassign-evaluator.use-case.ts`, la **Validación 1** (líneas 154-172) comprueba que el reemplazante no esté ya asignado activamente a esta versión; la condición clave es `a.evaluatorId === numReplacementId && a.id !== currentAsgNumId` (línea 165). El `a.id !== currentAsgNumId` **excluye la asignación saliente** de la comprobación: si el reemplazante es el mismo evaluador del saliente, la única asignación activa con ese `evaluatorId` es precisamente la que se reemplaza, que queda excluida, por lo que `isAlreadyAssigned` es `false`. La Validación 1 **no rechaza al mismo evaluador** en ningún motivo. Por lo tanto, se espera que el caso VENCIMIENTO con el mismo evaluador ya pase sin cambios de código en el use case. El `EvaluatorReassignmentService` (dominio, `evaluator-reassignment.service.ts:37`) solo compara perfiles, no IDs; tampoco rechaza al mismo evaluador. Sin restricción UNIQUE `(version_id, evaluador_id)` en `evaluacion.asignaciones_evaluacion` (verificado en src/migrations; la UNIQUE existente, `(protocolo_id, evaluador_id)`, pertenece a `evaluacion.asignaciones_pares_riesgo`, migración 1779). El caso **CONFLICTO_INTERES con el mismo evaluador** sí debe rechazarse: hay que añadir en el caso de uso, antes de las validaciones y de persistir, un guard explícito que lance `ConflictException` (409) si `dto.reason === CONFLICTO_INTERES` y el `numReplacementId === currentAssignment.evaluatorId`.
  - **Observación sobre el Error del perfil:** `EvaluatorReassignmentService` lanza un `Error` genérico cuando los perfiles no coinciden (`evaluator-reassignment.service.ts:38`). Ese error es capturado en `reassign-evaluator.use-case.ts:221-226` y relanzado como `BadRequestException` (400). Si escapara sin capturarse, `HttpExceptionFilter` (`http-exception.filter.ts:37`) lo trataría como 500. La cadena actual produce 400, no 409. El guard de CONFLICTO_INTERES para el mismo evaluador debe lanzar `ConflictException` directamente, sin pasar por el `catch` del servicio de dominio.
  - **Efecto en frontend (repo FRONTEND-CEISH):** el modal de reasignación debe incluir al evaluador saliente en la lista de candidatos reemplazantes cuando el motivo es `VENCIMIENTO`, y excluirlo cuando es `CONFLICTO_INTERES`. Verificado en FRONTEND-CEISH: filterEligibleCandidates (src/features/evaluations/presentation/utils/reassignment-candidates.util.ts:92-96) excluye siempre al evaluador saliente (c.id !== outgoing.evaluatorId) y a todos los de activeEvaluatorIds, que incluye al saliente; el modal (modal-reasignacion.component.ts:76-77) no considera el motivo. Hoy no se puede elegir al mismo evaluador en ningún motivo. El filtro debe recibir el motivo y, en VENCIMIENTO, no excluir al saliente.
  - **Archivos afectados:**
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts` — MODIFICAR: añadir guard al inicio del método `execute`, antes de Validación 1, que lance `ConflictException` si `reason === CONFLICTO_INTERES` y `numReplacementId === currentAssignment.evaluatorId`.
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.spec.ts` — MODIFICAR: añadir caso N36-U-01 (VENCIMIENTO mismo evaluador → resultado exitoso, sin excepción) y N36-U-02 (COI mismo evaluador → `ConflictException`). No existe ningún test actual con el mismo evaluador (verificado: todos usan `replacementEvaluatorId: 25` con saliente `evaluatorId: 15`).
  - **Hecho cuando:** tsc limpio; unit tests N36-U-01 y N36-U-02 verdes; el endpoint COI con mismo evaluador devuelve 409; eslint limpio sobre archivos tocados.
  - **Resultado:** tsc limpio; 406 unit tests (56 suites); 151 E2E (13 suites) × 2 pasadas estables. Tests añadidos: N36-U-01, N36-U-02, N36-U-03 (unit); 13a (409 COI mismo evaluador), 13b (201 VENCIMIENTO mismo evaluador) (E2E). Pendiente: parte frontend (FRONTEND-CEISH).
  - **Nota de rediseño frontend:** El frontend entrará en un rediseño completo; este ítem se incorporará a ese rediseño.

- [x] **TSK-002-N37** (COMPLETADA — decisión: columna `fecha_limite_ts timestamptz NULL` paralela, opción (a)): Fijar plazo del reemplazante a +24 horas corridas cuando el motivo es `VENCIMIENTO`.
  - **Requisito relacionado:** RF-12.7(e) — Decisión reunión 21/10/2026.
  - **Criterio EARS:** Criterio EARS RF-12.3 — Reasignación por VENCIMIENTO.
  - **PR:** posterior a TSK-002-N36.
  - **Descripción:** Decisión tomada: opción (a) — se añade una columna `fecha_limite_ts timestamptz NULL` paralela; `fecha_limite` (`date`, string `'YYYY-MM-DD'`) se sigue escribiendo, derivada con `toCalendarDateString` en `America/Guayaquil`. Lógica implementada: si `dto.reason === 'VENCIMIENTO'`, `newDeadlineTs = new Date(Date.now() + 24 * 60 * 60 * 1000)` (24 horas corridas desde ahora, independiente de la convocatoria); otros motivos heredan `fecha_entrega_evaluacion` de la convocatoria activa o `null` si no hay convocatoria agendada. `findActiveConvocatoriaDeadline` devuelve `Promise<Date | null>` y no se llama para VENCIMIENTO. Ningún lector (urgencia, alertas, correos) usa aún `fecha_limite_ts`; ver TSK-002-N45.
  - **Archivos afectados:**
    - `src/migrations/1870000000000-AddFechaLimiteTsToAsignaciones.ts` — CREAR: `ALTER TABLE evaluacion.asignaciones_evaluacion ADD COLUMN fecha_limite_ts timestamptz NULL`.
    - `src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts` — MODIFICAR: añadir `@Column({ name: 'fecha_limite_ts', type: 'timestamptz', nullable: true }) deadlineTimestamp?: Date | null`.
    - `src/modules/evaluations/domain/entities/evaluation-assignment.entity.ts` — MODIFICAR: añadir `deadlineTimestamp?: Date | null` a `EvaluationAssignmentProps` y como campo `readonly` en la clase.
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: `findActiveConvocatoriaDeadline` devuelve `Promise<Date | null>` (antes `Promise<string | null>`).
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts` — MODIFICAR: rama `if (reason === 'VENCIMIENTO')` para +24h; pasa `deadlineTimestamp` a `executeReassignmentTransaction`.
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.spec.ts` — MODIFICAR: 18 unit tests totales; N37-U-01..N37-U-04 añadidos; mock de `findActiveConvocatoriaDeadline` devuelve `Date | null`.
    - `test/real-db-evaluations.e2e-spec.ts` — MODIFICAR: suite 13 — 13b extendido (VENCIMIENTO: verifica `fecha_limite_ts` en BD en `[t0+24h, t1+24h]` y `fecha_limite` = fecha ECT); 13c nuevo (COI con convocatoria: verifica `fecha_limite_ts === fecha_entrega_evaluacion`).
  - **Hecho cuando:** ✓ decisión de esquema (opción a); migración `1870000000000` aplicada en `ceish_test_db`; tsc limpio; 410 unit (56 suites) y 152 E2E (13 suites) verdes; eslint limpio.

- [ ] **TSK-002-N38** (PENDIENTE): Aceptar evidencia PDF opcional en el formulario de reasignación.
  - **Requisito relacionado:** RF-12.3 — Decisión reunión 21/10/2026 (formulario incluye evidencia PDF opcional).
  - **PR:** posterior a TSK-002-N36.
  - **Descripción:** El endpoint `POST /evaluations/reassign` debe aceptar opcionalmente un archivo PDF de evidencia. Mecanismo elegido (coherente con el patrón de `documents.service.ts`): el controlador recibe el archivo vía `FileInterceptor('evidencia')` (`@nestjs/platform-express`, ya disponible en `ai-assistant`), extrae el `Buffer` y lo pasa al use case, que invoca `IStorageService.uploadFile(key, buffer, 'application/pdf')` y guarda la `storageKey` resultante en la columna `evidencia_url` de `evaluacion.asignacion_historial`. Si no se adjunta archivo, `evidencia_url` queda `null`. El campo de texto `justification` (columna `justificacion` en la entidad ORM — verificado: `assignment-history.orm-entity.ts:42`) es independiente del PDF. **No agregar la columna ni la migración sin aprobación.** La migración debe añadir `evidencia_url TEXT NULL` a `evaluacion.asignacion_historial`.
  - **Archivos afectados (pendiente aprobación de migración):**
    - `src/migrations/<timestamp>-AddEvidenciaUrlToAsignacionHistorial.ts` — CREAR.
    - `src/modules/evaluations/infrastructure/database/entities/assignment-history.orm-entity.ts` — MODIFICAR: añadir `@Column({ name: 'evidencia_url', type: 'text', nullable: true }) evidenciaUrl?: string | null`.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR: añadir `@UseInterceptors(FileInterceptor('evidencia'))` y `@UploadedFile() file?: Express.Multer.File` en el endpoint `POST reassign`.
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts` — MODIFICAR: aceptar `evidenciaBuffer?: Buffer` y llamar a `IStorageService.uploadFile` si se recibe; pasar `evidenciaUrl` al repositorio.
  - **Hecho cuando:** migración aprobada y ejecutada; endpoint acepta archivo PDF opcional; `evidencia_url` guardada como `storageKey` en `asignacion_historial`; tsc limpio; tests verdes.

- [ ] **TSK-002-N39** (PENDIENTE): Implementar informe global de reasignaciones por evaluador (RF-12.8).
  - **Requisito relacionado:** RF-12.8 (`specs/002-flujo-mvp/spec.md`) — Decisión reunión 21/10/2026.
  - **Criterio EARS:** Criterio EARS RF-12.8 — Informe de reasignaciones.
  - **PR:** posterior a TSK-002-N36.
  - **Descripción:** Crear un endpoint `GET /evaluations/reassignment-report` accesible para `SECRETARIA` y `PRESIDENTE` que acepte parámetros opcionales `desde` y `hasta` (fechas ISO-8601). Consulta la tabla `evaluacion.asignacion_historial` (columna `motivo` = `reason`, columna `creado_en` = `executedAt` — verificadas en `assignment-history.orm-entity.ts`). Devuelve un arreglo con un objeto por evaluador que incluya: `evaluadorId` (columna `evaluador_anterior_id`), `nombreCompleto` (por verificar: JOIN con `catalogos.usuarios`), `totalVencimiento` (conteo de filas con `reason = 'VENCIMIENTO'` en el período), y `alerta: boolean` (`true` si `totalVencimiento >= 3`). La ventana de conteo para el umbral ≥3 está **pendiente de definición** (ver pendiente iv en sección 10); por ahora filtra estrictamente por el rango `desde`/`hasta` recibido. Sin sanción, sin bloqueo, sin notificación automática.
  - **Archivos afectados:**
    - `src/modules/evaluations/application/use-cases/get-reassignment-report.use-case.ts` — CREAR (no existe aún — verificado).
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` — MODIFICAR: añadir método `getReassignmentReport(desde?: Date, hasta?: Date): Promise<ReassignmentReportItem[]>`.
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: implementar la consulta SQL sobre `asignacion_historial`.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR: añadir endpoint `GET reassignment-report` con `@Roles('SECRETARIA', 'PRESIDENTE')`.
    - `src/modules/evaluations/evaluations.module.ts` — MODIFICAR: registrar el nuevo use case.
    - `src/modules/evaluations/application/use-cases/get-reassignment-report.use-case.spec.ts` — CREAR (no existe aún — verificado).
  - **Hecho cuando:** endpoint devuelve JSON con `alerta: true` para evaluadores con ≥3 `VENCIMIENTO`; tsc limpio; unit tests verdes; eslint limpio sobre archivos tocados.

- [ ] **TSK-002-N40** (PENDIENTE — NO IMPLEMENTAR): El frontend no preserva el `returnUrl` del deep-link al redirigir al login.
  - **Requisito relacionado:** RF-12.6 — deep-link funcional al panel de evaluación (el enlace del correo debe sobrevivir al flujo de autenticación).
  - **Descripción:** El correo de asignación ya incluye el enlace directo `${FRONTEND_URL}/dashboard/evaluations/evaluate/${assignmentId}`. Si el evaluador no tiene sesión activa, `AuthGuard` del frontend lo redirige a `/auth/login` sin pasar `?returnUrl=...`. Tras autenticarse, el evaluador llega al dashboard genérico y pierde el enlace de la asignación. **Esta tarea es del repositorio FRONTEND-CEISH**, no del backend. No implementar aquí.
  - **Archivos afectados:**
    - Frontend (FRONTEND-CEISH): el `AuthGuard` debe capturar la URL actual y redirigir a `/auth/login?returnUrl=%2Fdashboard%2Fevaluations%2Fevaluate%2F${assignmentId}`; tras el login exitoso, redirigir a `returnUrl` en lugar de al dashboard genérico.
  - **Hecho cuando:** el evaluador que accede al enlace del correo sin sesión activa es llevado directamente al panel de su asignación tras autenticarse; documentado en el PR del frontend.
  - **Nota de rediseño frontend:** El frontend entrará en un rediseño completo; este ítem se incorporará a ese rediseño.

- [x] **TSK-002-N41** (CUMPLIDA — 23/10/2026): Disparar la notificación al evaluador cuando el protocolo entra en una convocatoria, en lugar de al asignar; la asignación inicial sin convocatoria no emite correo; si el protocolo ya está en convocatoria al asignar o reasignar, el correo se envía en ese momento.
  - **Requisito relacionado:** RF-12.7 — APROBADO (23/10/2026), ver `specs/002-flujo-mvp/spec.md`.
  - **PR:** posterior a TSK-002-N44.
  - **Depende de:** TSK-002-N44 (cumplida).
  - **Orden de ejecución recomendado:** TSK-002-N44 → TSK-002-N41 → TSK-002-N42 → TSK-002-N43 → TSK-002-N46 → TSK-002-N45; N47 independiente.
  - **Descripción:** Hoy `AssignEvaluatorsUseCase` (`src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts`) emite el evento `evaluator.assigned` inmediatamente al crear las asignaciones (`deadlineDate: null` en línea 88). La propuesta consiste en suprimir ese emit en `assign-evaluators.use-case.ts` y, en su lugar, emitirlo en `CreateMeetingUseCase` (`src/modules/evaluations/application/services/create-meeting.use-case.ts`) tras la llamada a `saveMeetingWithAtomicNumber` (`meeting-typeorm.repository.ts`), iterando sobre las asignaciones activas de cada `version_id` añadido. **Puntos reales de escritura de `convocatoria_protocolos`:** (1) `meeting-typeorm.repository.ts:saveMeetingWithAtomicNumber` (ruta canónica, llamada desde `CreateMeetingUseCase`) — líneas 163-170 (Sección II, protocolos) y 177-182 (Sección III, seguimiento); (2) `calls.service.ts:createCall` (ruta legacy, `@ApiTags('calls (deprecated)')`) — líneas 279-293; la ruta legacy está deprecada (reconciliation.md 6.1.1) y no se modifica en N41; ver N44 para la verificación operativa. **Nota sobre `sendCallNotification`:** el método existente en `create-meeting.use-case.ts:195-218` envía un correo masivo a **todos** los usuarios con rol `EVALUADOR`/`PRESIDENTE` al crear la convocatoria; N41 añade una notificación individual adicional con deep link dirigida a cada evaluador asignado a los protocolos de esa convocatoria (propuesta por defecto, pendiente de confirmar con Secretaría/Presidencia; ver spec.md sección 10 (vi)(c)). La reasignación (`reassign-evaluator.use-case.ts`) ya notifica de inmediato y **no se modifica**. **Caso 3 — protocolo ya en convocatoria al asignar o reasignar:** si al momento de asignar (asignación inicial) o reasignar ya existe una fila en `evaluacion.convocatoria_protocolos` para esa `version_id`, el correo se emite de inmediato (sin diferir). **Orden de operaciones:** la emisión de `evaluator.assigned` debe realizarse **después** del commit de `saveMeetingWithAtomicNumber`, de modo que `fecha_limite` ya esté propagada en BD y el correo enviado al evaluador pueda incluir la fecha de entrega.
  - **Archivos afectados:**
    - `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts` — MODIFICAR: suprimir el emit de `evaluator.assigned`.
    - `src/modules/evaluations/application/services/create-meeting.use-case.ts` — MODIFICAR: añadir lógica de emisión de `evaluator.assigned` para los `version_id` recién añadidos a la convocatoria.
    - `src/modules/evaluations/application/services/create-meeting.use-case.spec.ts` — MODIFICAR: añadir casos para el nuevo emit.
    - `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.spec.ts` (por verificar si existe) — MODIFICAR: actualizar caso del emit.
  - **Hecho cuando:**
    - Comportamiento: el evaluador no recibe correo de la asignación inicial si el protocolo no está en convocatoria; al entrar en convocatoria recibe correo individual con fecha límite (emisión DESPUÉS del commit de `saveMeetingWithAtomicNumber`, guard N41-U-05 (deferred promise)+12c); si ya está en convocatoria al asignar o reasignar, el correo se envía en ese momento (guard N41-U-01+12a para el caso negativo; guard N41-U-02+12d para el positivo); cuando la versión entra en una segunda convocatoria los evaluadores ya asignados reciben un nuevo correo con el nuevo plazo.
    - Archivos modificados y justificación: `assign-evaluators.use-case.ts` (B.2 `findActiveConvocatoriaDeadline` requerido; B.3 `isInConvocatoria` del resultado real), `assign-evaluators.use-case.spec.ts` (B.2 mocks en 10 tests; N41-U-01/U-02), `create-meeting.use-case.ts` (N41 `notifyAssignedEvaluatorsAsync`; B.1 payload `Record<string,unknown>`), `create-meeting.use-case.spec.ts` (B.5 N41-U-05/06/07; guard ORDEN_DEL_DIA_VACIO de U-07 reside en el mismo `CreateMeetingUseCase` línea ~88), `evaluations.module.ts` (B.1 helper `buildEvaluatorAssignedBridge` unifica lambdas de `CreateMeetingUseCase`, `AssignEvaluatorsUseCase` y `ReassignEvaluatorUseCase`, sin cambio de comportamiento), `test/evaluations-assignment.e2e-spec.ts` (B.4 test N41-B4), `test/real-db-evaluations.e2e-spec.ts` (B.6 suite 12c polling; 12d SQL parametrizado (::text cast) + tipo string + aserciones de igualdad de instante con `fecha_entrega_evaluacion` de la convocatoria; ausencia de huérfanas nuevas medida una vez (57→57) sin instrumentación permanente; residuos version_id 990-999 verificados en 0 (expect en afterAll)).
    - DosDefense: mock elevado únicamente en `test/real-db-evaluations.e2e-spec.ts` (93 peticiones HTTP en ~60 s); el middleware `src/shared/middleware/` no se modifica en esta tarea (cambio de límites productivos referenciado en PR-S1 de specs/003).
    - Mutation checks: (a) quitar `if (!isInConvocatoria) continue` en `assign-evaluators.use-case.ts` → fallan N41-U-01 y 12a; (b1) mover `void this.notifyAssignedEvaluatorsAsync(...)` antes de `await saveMeetingWithAtomicNumber` → falla N41-U-05 (único detector del orden; 12c no lo detecta); (b2) eliminar la llamada → fallan N41-U-03, U-04, U-05, U-06 y 12c.
    - Tests: `npm test` 420/420 (corrida 1), 420/420 (corrida 2); `npm run test:e2e` 155/155 (corrida 1), 155/155 (corrida 2). `npx tsc --noEmit` limpio. `npx eslint` limpio sobre los 7 archivos.

- [x] **TSK-002-N42** (CUMPLIDA — 27/10/2026): Filtrar `GET /evaluations/my-assignments` y `GET /evaluations/peer-assignments/my-pending` a asignaciones cuyo protocolo está en convocatoria.
  - **Requisito relacionado:** RF-12.7 — APROBADO (23/10/2026), ver `specs/002-flujo-mvp/spec.md`.
  - **PR:** posterior a TSK-002-N41.
  - **Depende de:** TSK-002-N44 (cumplida).
  - **Descripción:** Hoy `getMyAssignments` (`evaluations.service.ts:219`) llama a `findAssignmentsByEvaluatorId` (repo), filtra por `statusId === ASSIGNED`, y no hace JOIN con `evaluacion.convocatoria_protocolos`. `getMyPendingPeerAssignments` (`evaluations.service.ts:1005`) usa `TypeORM.find` con `evaluatorId`, `isAssignedForAnnex10: true`, `statusId: In([ASSIGNED, SUGGESTED])`, sin join con convocatorias. La propuesta añade a ambas consultas un JOIN (o subquery) con `evaluacion.convocatoria_protocolos` filtrando `version_id = asignacion.version_id`. La Secretaría usa `GET /evaluations/protocol/:protocolId/active-assignments` (`GetActiveAssignmentsUseCase`) para ver todas las asignaciones — ese endpoint **no se modifica**. (d) DECISIÓN POR DEFECTO 23/10/2026: predicado canónico 'versión en convocatoria vigente' = fila en `evaluacion.convocatoria_protocolos` con estado `PROGRAMADA` o `EN_CURSO` (no `CONCLUIDA` ni `CANCELADA`), el mismo de `findActiveConvocatoriaDeadline` (ver spec.md sección 10 (vi)(d)); (e) N43 implementa `403 Forbidden` como decisión por defecto (ver spec.md sección 10 (vi)(e)). Usar el mismo predicado que `findActiveConvocatoriaDeadline` (`PROGRAMADA`/`EN_CURSO`).
  - **Archivos tocados:**
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` — MODIFICAR: añadidos `filterVersionIdsInActiveConvocatoria(versionIds)` y `filterProtocolIdsInActiveConvocatoria(protocolIds)`.
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: implementación SQL de ambos métodos con `ANY($1::int[])` + JOIN a `convocatorias` filtrando `estado IN (PROGRAMADA, EN_CURSO)`.
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: `getMyAssignments` y camino canónico de `getMyPendingPeerAssignments` filtran por `filterVersionIdsInActiveConvocatoria`; camino legacy filtra por `filterProtocolIdsInActiveConvocatoria`.
    - `src/modules/evaluations/application/services/evaluations-urgency.service.spec.ts` — MODIFICAR: mocks actualizados; tests N42-U-01..U-06 añadidos.
    - `test/real-db-evaluations.e2e-spec.ts` — MODIFICAR: test 1g con try/finally para convocatoria TEST-N42-1G; describe 14 con N42-E2E-01..03 y verificación de pre-existencia de IDs 9901/9902.
  - **Camino legacy (`asignaciones_pares_riesgo`):** `PeerRiskAssignmentOrmEntity` no tiene `version_id`; el predicado se aplica por `protocolo_id` vía `filterProtocolIdsInActiveConvocatoria`. Sin E2E dedicado al legacy porque esa tabla tiene 0 registros activos en ceish_test_db (fase de retiro, ver TODO LEGACY-RETIREMENT en el servicio).
  - **Mutation checks:**
    - (a) Quitar filtro en `getMyAssignments` → falla N42-U-01 (unit) y N42-E2E-01 (E2E).
    - (b) Quitar filtro en camino canónico de `getMyPendingPeerAssignments` → falla N42-U-03 (unit) y N42-E2E-01 (E2E).
    - (c) Quitar `AND c.estado IN ($2, $3)` de `filterVersionIdsInActiveConvocatoria` → falla N42-E2E-03 (convocatoria CONCLUIDA deja de filtrarse).
  - **Hecho cuando:** `my-assignments` y `peer-assignments/my-pending` solo devuelven asignaciones cuyo protocolo-versión (o protocolo, para legacy) está en convocatoria con estado `PROGRAMADA` o `EN_CURSO`; `active-assignments` (Secretaría) no se ve afectado; `filterVersionIdsInActiveConvocatoria` reutilizable por N43 para guardia single-id; `filterProtocolIdsInActiveConvocatoria` cubre el camino legacy; tsc limpio; `eslint` limpio sobre los 5 archivos tocados; unit: 426/426 (56 suites) × 2 corridas; E2E: 158/158 (13 suites) × 2 corridas consecutivas.

- [x] **TSK-002-N43** (CUMPLIDA — decisión aprobada 23/10/2026): Comprobar que el protocolo de la asignación está en convocatoria en los endpoints donde el evaluador abre, evalúa o entrega.
  - **Requisito relacionado:** RF-12.7 — APROBADO (23/10/2026), ver `specs/002-flujo-mvp/spec.md`.
  - **PR:** posterior a TSK-002-N42.
  - **Descripción:** Hoy los endpoints de entrega e inspección de una asignación solo validan propiedad (`assignment.evaluatorId !== evaluatorId`) y estado (`statusId`). La propuesta añade una comprobación de convocatoria en: `POST /evaluations/submit` (`submitEvaluation`, `evaluations.service.ts:269`); `GET /evaluations/:id/checklist-details` (`getEvaluationChecklistDetails`, `evaluations.service.ts`); `GET /evaluations/:id/document` (`getEvaluationDocumentUrl`); `GET /evaluations/:id/document/docx` (`getEvaluationDocxUrl`). El código de respuesta por defecto es **403 Forbidden** con el mensaje "el protocolo aún no está en una convocatoria" — decisión por defecto 23/10/2026, pendiente de confirmar con Secretaría (ver spec.md sección 10 (vi)(e)). Usar el mismo predicado que `findActiveConvocatoriaDeadline` (`PROGRAMADA`/`EN_CURSO`).
  - **Archivos afectados:**
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICADO: helpers privados `assertAssignmentInActiveConvocatoria` (reutiliza `IEvaluationRepository.filterVersionIdsInActiveConvocatoria`, no se creó método nuevo en repositorio ni puerto) y `resolveEvaluationAndAssignment`; guard aplicado en `submitEvaluation`, `getEvaluationChecklistDetails`, `getEvaluationDocumentUrl` y `getEvaluationDocxUrl`.
    - `src/modules/evaluations/application/services/evaluations-urgency.service.spec.ts` — MODIFICADO: tests N43-U-01 a N43-U-09 cubriendo los 4 endpoints (sin convocatoria → 403, con convocatoria activa → pasa, no-dueño → error de propiedad 400).
    - `test/real-db-evaluations.e2e-spec.ts` — MODIFICADO: helpers `seedConvocatoriaForVersion` y `cleanupConvocatoria`, adaptación de suite 1b, y describe 15 con tests 15a (403 sin convocatoria en los 4 endpoints + no-dueño), 15b (pasan el guard con convocatoria PROGRAMADA) y 15c (403 con convocatoria CANCELADA; Secretaría sigue viendo en active-assignments).
  - **Hecho cuando:**
    - Orden de validaciones canónico respetado en los 4 métodos: existencia → propiedad (error del no-dueño `400 Bad Request` inalterado) → guard de convocatoria (`403 Forbidden` con mensaje exacto "el protocolo aún no está en una convocatoria") → validaciones de estado (`400 Bad Request`).
    - Secretaría (`GET /evaluations/protocol/:protocolId/active-assignments`) sigue viendo todas las asignaciones sin importar estado de convocatoria.
    - Reutilización estricta de `IEvaluationRepository.filterVersionIdsInActiveConvocatoria([versionId])` sin métodos adicionales de BD ni cambios de esquema.
    - 5 mutation checks verificados: (1) quitar guard de `submitEvaluation` → falla unit N43-U-01 y E2E 15a; (2) quitar guard de `getEvaluationChecklistDetails` → falla unit N43-U-04 y E2E 15a; (3) quitar guard de `getEvaluationDocumentUrl` → falla unit N43-U-06 y E2E 15a; (4) quitar guard de `getEvaluationDocxUrl` → falla unit N43-U-08 y E2E 15a; (5) invertir orden en `submitEvaluation` (guard antes de propiedad) → falla unit N43-U-03 y E2E 15a.
    - Salidas de verificación: `npx tsc --noEmit` limpio; `npx eslint` limpio sobre los 3 archivos tocados; unit: 56 suites / 435 tests pasados en 2 corridas consecutivas; E2E: 13 suites / 161 tests pasados en 2 corridas consecutivas; cero residuos en `ceish_test_db`; conteo de convocatorias huérfanas estable en 57 (delta = 0).

- [x] **TSK-002-N48** (CUMPLIDA — decisión por defecto 28/10/2026, pendiente de confirmar con Secretaría): Exigir convocatoria vigente en `POST /evaluations/peer-assignments/:id/submit-risk` (cierra el hueco de RF-12.7(4) que dejó N43).
  - **Requisito relacionado:** RF-12.7 punto 4, extensión (ver `specs/002-flujo-mvp/spec.md`, frase 4b).
  - **Depende de:** N43 (cumplida).
  - **Descripción:** N43 cubrió `submit`, `checklist-details`, `document` y `document/docx`, pero `POST /api/evaluations/peer-assignments/:id/submit-risk` (`submitPeerRiskLevel`, `evaluations.service.ts`) seguía respondiendo al dueño de la asignación aunque su protocolo-versión no estuviera en convocatoria vigente (N42 solo lo ocultaba de `peer-assignments/my-pending`). Se añade el guard de convocatoria en ambos caminos: (a) camino canónico (`evaluacion.asignaciones_evaluacion`) reutilizando el helper `assertAssignmentInActiveConvocatoria(versionId)` de N43 (a su vez sobre `IEvaluationRepository.filterVersionIdsInActiveConvocatoria`, sin métodos nuevos de repositorio); (b) camino legacy (`asignaciones_pares_iesgo`/`asignaciones_pares_riesgo`) reutilizando `filterProtocolIdsInActiveConvocatoria(protocolo_id)`, mismo patrón que N42. Orden por defecto: existencia → propiedad (error del no-dueño inalterado, `400 Bad Request`) → guard de convocatoria (`403 Forbidden` con el mensaje exacto "el protocolo aún no está en una convocatoria") → validaciones de estado. Ningún otro endpoint se modificó.
  - **Archivos tocados:**
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICADO: guard convocatoria en camino canónico de `submitPeerRiskLevel` (tras propiedad, antes de REASIGNED/Anexo 10) y en camino legacy (tras propiedad, antes de `submittedAt`); reutiliza `filterProtocolIdsInActiveConvocatoria` para legacy.
    - `src/modules/evaluations/application/services/submit-peer-risk.spec.ts` — MODIFICADO: mocks `filterVersionIdsInActiveConvocatoria`/`filterProtocolIdsInActiveConvocatoria` en el proveedor `IEvaluationRepository`; tests N48-U-01 a N48-U-06 (canónico sin/con convocatoria, no-dueño canónico; legacy sin/con convocatoria, no-dueño legacy).
    - `test/real-db-evaluations.e2e-spec.ts` — MODIFICADO: describe 16 ("16. N48") con tests 16a (sin convocatoria → 403 mensaje exacto; no-dueño → 400), 16b (PROGRAMADA → 201 y propuesta persistida) y 16c (CANCELADA → 403), IDs libres 970/971/asignaciones 9701-9702 (rango 970–979 verificado libre y sin residuos); test 1c de concurrencia (versión 998) ahora siembra convocatoria PROGRAMADA con try/finally (era necesario: el guard la exige); listas de limpieza global ampliadas con 970/971.
  - **Auditoría de rutas de `EvaluationsController` no modificadas (propuesta solo, no implementada):**
    - `GET /evaluations/evaluators/dashboard` (permiso `EVALUATORS_WORKLOAD_VIEW`) → **C**: datos globales de carga para Presidencia por diseño; sin riesgo de convocatoria.
    - `GET /evaluations/submit/protocol/:protocolId` → **B**: sin `@Permissions`/`@Roles`; `getSubmitProtocolInfo` ignora `_userId` (`evaluations.service.ts` "async getSubmitProtocolInfo(protocolId, _userId)") y devuelve TODAS las asignaciones de la versión (con `evaluatorId`) sin filtro de convocatoria; cualquier autenticado puede consultar cualquier protocolo. Propuesto para filtrado en N49.
    - `GET /evaluations/protocol/:protocolId/observations` → **D**: valida propiedad (propietario/codirector) o permisos oficiales antes de datos; solo evidencias de evaluaciones ya completadas; sin riesgo observado.
    - `GET /evaluations/completion-status/:protocolId` → **B**: `@Roles(SECRETARIA|PRESIDENTE|EVALUADOR)` con permisos mixtos; un evaluador puede consultar el boolean de completitud de cualquier protocolo. Propuesto para acotar a sus asignaciones en N49.
    - `GET /evaluations/consolidate/:protocolId` (permiso `EVALUACION_INFORMES`) → **C** (uso oficial Anexo 12); nota N49: `EVALUADOR` también tiene este permiso en `OFFICIAL_ROLE_PRESETS`, proponer `@Roles` explícitos.
    - `GET /evaluations/protocols/pending-peer-assignment` (permiso `EVALUATORS_ASSIGN`) → **C**: listado de Secretaría de protocolos pendientes de asignación, previo al flujo de convocatoria.
    - `GET /evaluations/evaluators/active` (permisos `EVALUATORS_ASSIGN|EVALUATORS_SUGGEST`) → **C**: catálogo para el modal de asignación, no datos de asignaciones.
  - **Mutation checks verificados (fallo observado; restauración con `git checkout -- evaluations.service.ts` seguida de `git diff --stat` vacío):**
    - (a) Quitar `await this.assertAssignmentInActiveConvocatoria(...)` del camino canónico → falla unit **N48-U-01** (1 failed / 19 passed); E2E con `--testNamePattern="16"`: **16a (combinado), 16b, 16c** (3 failed / 157 skipped / 4 passed); `git checkout --` → `git diff --stat` sin salida.
    - (b) Mover el guard antes del chequeo de propiedad (existencia → guard → propiedad) → falla unit **N48-U-03** (1 failed / 19 passed); E2E **16a2** (1 failed / 157 skipped / 7 passed; el test 16a2 fue separado de 16a en este mismo paso para que la mutación fuera identificable); `git checkout --` → `git diff --stat` sin salida.
    - (c) Quitar solo el if/throw del camino legacy sin alterar el filtro → falla unit **N48-U-04** (1 failed / 19 passed); N48-U-04 no era vacuo — al quitar solo el if/throw el filtro sigue ejecutándose pero el resultado se ignora, por lo que N48-U-04 falla correctamente; `git checkout --` → `git diff --stat` sin salida.
    - **Incidente de sesión anterior:** en la primera ronda de mutaciones un `git checkout -- evaluations.service.ts` descartó cambios de la tarea sin commitear que se reaplicaron desde copia y se verificaron por hash.
  - **Hecho cuando (real):** `submit-risk` exige convocatoria vigente en ambos caminos del mismo endpoint (`403` con el mensaje exacto en los dos); orden en canónico: existencia → propiedad → guard → validaciones; orden en legacy: existencia → propiedad → guard → `submittedAt`; el E2E 1g (versión 999, paso 6) sigue respondiendo `400`: el evaluador 901 es el DUEÑO de la asignación saliente 9991 (estado REASIGNED_COI tras reasignar a 905) y llama a `submit-risk` con la convocatoria PROGRAMADA de la versión 999 ya sembrada; propiedad y guard de convocatoria pasan y el `400` lo produce la validación de estado REASIGNED_COI; test 16a desglosado en 16a1 (dueño → 403) + 16a2 (no-dueño → 400) para identificar la mutación (b); 16c añade `expect(convN48Id).toBeDefined()` y verificación `SELECT COUNT(*) WHERE estado='CANCELADA'` para confirmar exactamente 1 fila afectada; `npx tsc --noEmit` limpio; `npx eslint` limpio sobre los 3 archivos tocados; unit: 56 suites / 441 tests pasados en 2 corridas consecutivas; E2E: 13 suites / 165 tests pasados en 2 corridas consecutivas; residuos de los IDs 970/971/9701/9702 en `ceish_test_db` = 0; convocatorias huérfanas estable en 57 (delta = 0).
  - **Propuestas pendientes de decisión (N49):**
    - Rutas clasificadas B: `GET /evaluations/submit/protocol/:protocolId` (filtrar al usuario autenticado y/o a convocatoria; evidencia: `getSubmitProtocolInfo` ignora `userId`, devuelve todas las asignaciones con `evaluatorId`) y `GET /evaluations/completion-status/:protocolId` (acotar la consulta de completitud a las asignaciones del evaluador; evidencia: roles mixtos `SECRETARIA|PRESIDENTE|EVALUADOR` sobre cualquier protocolo).
    - Ruta C con nota: `GET /evaluations/consolidate/:protocolId` — `EVALUACION_INFORMES` está en el preset de `EVALUADOR` (`role-presets.constant.ts`); proponer restringir a roles oficiales si Secretaría confirma que el Anexo 12 no es de uso evaluador.

- [x] **TSK-002-N44** (COMPLETADA — commit 664bee7, rama feat/n44-fecha-limite-ts-agendar): Corregir la propagación de `fecha_entrega_evaluacion` a las asignaciones activas cuando el protocolo entra en la convocatoria (brecha de tipo `date` vs `timestamptz`).
  - **Requisito relacionado:** RF-12.7(b) — requisito preexistente; no depende de N41–N43; N41 y N42 dependen de esta tarea.
  - **PR:** posterior a TSK-002-N37.
  - **PASO PREVIO obligatorio (verificación de uso de la ruta legacy):** Ejecutar en el backend: `git grep -n "POST.*evaluations/calls\|createCall\|/api/evaluations/calls" -- src/`. Adicionalmente, el usuario debe verificar en el repositorio **FRONTEND-CEISH** (no está en este repo) que ningún componente ni servicio llame a `POST /api/evaluations/calls`. Reportar el resultado antes de implementar; si algún cliente activo usa la ruta, escalar antes de continuar. Referencia: `specs/003-flujo-mvp/reconciliation.md` sección 6.1.1 (`CallsController` deprecado); `specs/003-flujo-mvp/plan.md` PR-B1.
  - **Descripción:** RF-12.7(b) **ya está parcialmente implementado** (plan.md PR-B1, ✅ Mergeado): `meeting-typeorm.repository.ts:186-196` ejecuta un `UPDATE evaluacion.asignaciones_evaluacion SET fecha_limite = $1 WHERE version_id = ANY($2) AND estado_id = $3` que propaga el plazo a las asignaciones `ASSIGNED` al añadir protocolos-versión a la convocatoria (ruta canónica, `saveMeetingWithAtomicNumber`). N37 ya creó la columna `fecha_limite_ts timestamptz`; N44 debe escribir `fecha_limite_ts` además de `fecha_limite` en ese UPDATE, conservando la hora de `fecha_entrega_evaluacion`. **La ruta legacy (`calls.service.ts:295-309`) no se modifica:** `CallsController`/`CallsService` están deprecados (reconciliation.md 6.1.1); la ruta canónica es la única vía de agendamiento. **N44 es un requisito preexistente que no depende de N41–N43; en cambio, N41 y N42 dependen de esta tarea** para disponer del `fecha_limite_ts` correcto al notificar al evaluador. Relación con N41: una vez N44 corrija la propagación del plazo, la notificación individual de N41 ya dispondrá de la fecha con hora.
  - **Archivos afectados:**
    - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` — MODIFICADO: líneas 186-202, UPDATE escribe `fecha_limite_ts = $2` junto a `fecha_limite = $1` (ruta canónica, solo asignaciones `ASSIGNED`).
    - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.spec.ts` — MODIFICADO: 3 tests unitarios N44-U-01 (param[1] === Date), N44-U-02 (SQL contiene `fecha_limite_ts`), N44-U-03 (sin UPDATE con versiones vacías).
    - `test/real-db-evaluations.e2e-spec.ts` — MODIFICADO: suites 6a y 6b aseveran `fecha_limite_ts`; 6b inserta SUGGESTED antes de crear la reunión para probar que el UPDATE la excluye.
  - **Hecho cuando (real):** al agendar un protocolo con asignaciones `ASSIGNED`, tanto `fecha_limite` (date) como `fecha_limite_ts` (timestamptz) reflejan `evalSubmissionDeadline` sin perder la hora; asignaciones con otro estado (SUGGESTED) no se modifican. Verificación: PASO PREVIO completado (ningún llamador activo en `src/`); tsc limpio; eslint limpio; unit 56 suites / 413 tests (2 corridas); E2E 13 suites / 152 tests (2 corridas). Mutation check: quitar `AND estado_id = $4` del UPDATE → suite 6b FALLA (`fecha_limite_ts` de SUGGESTED ≠ null); restaurar → PASA.

- [ ] **TSK-002-N45** (PENDIENTE — NO IMPLEMENTAR): Migrar los lectores de plazo de `fecha_limite` (`date`) a `fecha_limite_ts` (`timestamptz`) y mostrar la hora en el correo de asignación cuando el plazo es +24 h por VENCIMIENTO.
  - **Requisito relacionado:** RF-12.7(e) — extensión de TSK-002-N37; los lectores de plazo deben usar el instante exacto.
  - **PR:** posterior a TSK-002-N44.
  - **Descripción:** N37 añadió la columna `fecha_limite_ts timestamptz` y la escribe en el flujo de reasignación, pero ningún lector (servicio de urgencia, alertas, correos de asignación) la consume aún. N44 extiende la escritura a los flujos de agendamiento. N45 migra la lectura: (1) `evaluations-urgency.service.ts` y cualquier otro lector que calcule proximidad o vencimiento de plazo deben leer `fecha_limite_ts` cuando no sea `null`, con fallback a `fecha_limite` para asignaciones sin `fecha_limite_ts`. (2) El correo de asignación enviado por `MailerNotificationAdapter.handleEvaluatorAssignedEvent` debe mostrar la hora del plazo cuando sea +24 h por VENCIMIENTO (identificable porque el evento ya incluye `reassignmentReason: 'VENCIMIENTO'`). Antes de implementar, confirmar el formato de hora en el correo (`HH:mm ECT` o `HH:mm UTC`).
  - **Archivos afectados:**
    - `src/modules/evaluations/application/services/evaluations-urgency.service.ts` — MODIFICAR: usar `fecha_limite_ts` cuando esté disponible; fallback a `fecha_limite`.
    - `src/modules/notifications/infrastructure/adapters/mailer-notification.adapter.ts` — MODIFICAR: incluir hora en el correo cuando `reassignmentReason === 'VENCIMIENTO'`.
    - Archivos de tests de los servicios afectados — MODIFICAR: actualizar mocks y aserciones.
  - **Hecho cuando:** los lectores de plazo usan `fecha_limite_ts`; el correo de VENCIMIENTO muestra la hora; tsc limpio; unit tests y E2E verdes; eslint limpio.

- [ ] **TSK-002-N46** (PENDIENTE — NO IMPLEMENTAR): Al retirar un protocolo de una convocatoria, restablecer `fecha_limite` y `fecha_limite_ts` a `null` en las asignaciones activas (003 spec.md RF-09.1).
  - **Requisito relacionado:** RF-09.1 (`specs/003-flujo-mvp/spec.md`) — «Si lo retira, las asignaciones vuelven a "Pendiente de convocatoria"».
  - **PR:** posterior a TSK-002-N44.
  - **Descripción:** `specs/003-flujo-mvp/spec.md` RF-09.1 exige que, si la Secretaría retira un protocolo-versión de una convocatoria, las asignaciones activas de esa versión vuelvan a "Pendiente de convocatoria": `fecha_limite` y `fecha_limite_ts` pasan a `null`. **PASO PREVIO:** verificar si existe ya un endpoint o método que retira un protocolo de la convocatoria; si no existe, la tarea incluye definirlo en `MeetingsController` (`src/modules/evaluations/infrastructure/controllers/meetings.controller.ts`, prefijo `evaluations/meetings`), por ejemplo `DELETE /api/evaluations/meetings/:meetingId/protocols/:versionId` (la ruta exacta se define al implementar). **No debe añadirse en `CallsController`**, que está deprecado (reconciliation.md 6.1.1). **Nota:** el correo ya enviado al evaluador no se retracta; las acciones de N42/N43 ocultan la asignación automáticamente una vez que deja de estar en convocatoria.
  - **Archivos afectados:**
    - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` — MODIFICAR: añadir método para el UPDATE `fecha_limite = null, fecha_limite_ts = null` sobre asignaciones activas de la versión retirada.
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` — MODIFICAR: declarar el método.
    - `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts` (o equivalente) — MODIFICAR: exponer el endpoint de retiro si no existe.
    - Archivos de test del repositorio y del controlador — MODIFICAR: añadir casos.
  - **Hecho cuando:** al retirar un protocolo de la convocatoria, `fecha_limite` y `fecha_limite_ts` quedan `null` en las asignaciones activas de esa versión; el correo previo no se retracta; las asignaciones quedan ocultas vía N42/N43; tsc limpio; tests verdes; eslint limpio.

- [ ] **TSK-002-N47** (PENDIENTE — NO IMPLEMENTAR): Retirar `CallsController`/`CallsService` (ruta legacy deprecada) una vez confirmado que ningún cliente la usa.
  - **Requisito relacionado:** Arquitectura — `specs/003-flujo-mvp/reconciliation.md` sección 6.1.1 (Sprint 003): `CallsController` queda deprecado; `MeetingsController` es el bounded context canónico.
  - **PR:** independiente; posterior a la verificación operativa de N44.
  - **Depende de:** verificación del PASO PREVIO de N44 (ningún cliente activo llama `POST /api/evaluations/calls`).
  - **Descripción:** Una vez que la verificación del PASO PREVIO de N44 confirme que ningún cliente (backend ni FRONTEND-CEISH) usa `POST /api/evaluations/calls`, se puede retirar `CallsController` y `CallsService`. La tarea incluye: (1) eliminar el registro de `CallsController` y `CallsService` en `src/modules/evaluations/evaluations.module.ts`; (2) mover o eliminar cualquier lógica de negocio residual no cubierta por `CreateMeetingUseCase`; (3) actualizar los tests que mockean o referencian `CallsService`.
  - **Archivos afectados:**
    - `src/modules/evaluations/application/services/calls.service.ts` — ELIMINAR (solo si la lógica está completamente migrada a `CreateMeetingUseCase`).
    - `src/modules/evaluations/infrastructure/controllers/calls.controller.ts` — ELIMINAR.
    - `src/modules/evaluations/evaluations.module.ts` — MODIFICAR: quitar importaciones y providers de `CallsController`/`CallsService`.
    - Archivos de test que referencien `CallsService` o `CallsController` — MODIFICAR: eliminar mocks y referencias.
    - `test/evaluations-contract.e2e-spec.ts` — MODIFICAR: usa `POST /api/evaluations/calls` (ruta legacy); debe migrar a `POST /api/evaluations/meetings` o eliminarse el test si la ruta desaparece.
    - `test/real-db-evaluations.e2e-spec.ts` — VERIFICAR: línea ~1604 usa `POST /api/evaluations/calls`; evaluar si el test puede migrar a la ruta canónica.
  - **Hecho cuando:** `git grep CallsController CallsService -- src/` no devuelve resultados en código de producción; tsc limpio; tests verdes; eslint limpio; `evaluations.module.ts` no importa ni provee `CallsController`/`CallsService`.

---

## 9. Asignación por la Presidencia (spec v1.3.0 — reunión 06/11/2026, decisiones 17/11/2026)

> Numeración: se parte de **N50**. N49 no es tarea, sino la etiqueta de las «propuestas pendientes de decisión (N49)» de TSK-002-N48; por eso se deja libre.
> Orden: **N50 → N51 → N52 → N57 → N58 → N53 → N56 → N54 → N55**. N53, N54, N57 y N58 dependen de N52; N58 va después de N57 (reutiliza su predicado «plazo de evaluación vencido»); N56 depende de N53 (reutiliza su comprobación de convocatoria y fecha); N55 va al final. N59 (conflicto de interés del PET) queda para más adelante, sin orden.
> Actualizado el 18/11/2026 con las respuestas de la usuaria a §11 de la spec (n.º 3, 4, 5, 6, 7 y 9) y, el mismo día, con la spec v1.3.1 (PET): N50 reescrita (Ético se renombra a Bioético), N52 guarda la fecha límite del plazo de evaluación, N57, N58 y N59 nuevas.
> Reglas de siempre: una tarea por rama y por PR; Paso 0 (solo lectura) antes de cada una; migraciones solo en `ceish_test_db` (en `ceish_db` las aplica la usuaria con `MIGRATION_CONFIRM_DB`); E2E con `--runInBand`; mutaciones revertidas editando; residuos de prueba = 0 y convocatorias huérfanas sin cambio.
> Línea base (Paso 0 del 17/11/2026, `dev` en `f5920c1`): `tsc` 0; unitarias 71 suites / 654 tests; `eslint` sobre los archivos candidatos: 1 error previo (`random-risk-selector.service.ts:2:10`, `EvaluatorCandidateInput` sin uso).

- [x] **TSK-002-N50** (B — Hecha 18/11/2026, `c63e2b8`; reescrita 18/11/2026, spec v1.3.1): el perfil «Ético» (id 7) **se renombra** a «Bioético»; no se crea un perfil nuevo; el código reconoce Bioético.
  - **Requisitos:** RF-12.1 a y f; EARS 1c.
  - **EARS:** **Cuando** se aplique la migración, **el sistema debe** tener el perfil id 7 con el nombre «Bioético» y la descripción nueva, con los mismos miembros (`catalogos.evaluadores_perfil`) y las mismas asignaciones (`perfil_id` = 7), y ningún otro perfil Bioético ni Ético. **Si** el perfil id 7 no se llama «Ético» (ni ya «Bioético»), o existe otra fila cuyo nombre normalizado (sin tildes, en mayúsculas) empiece por «BIOETIC», **la migración debe** abortar con un error en español sin cambiar nada. **Cuando** se revierta, **el sistema debe** devolver el id 7 a «Ético» con su descripción anterior. **Cuando** un miembro tenga el perfil Bioético, **el sistema debe** resolverlo a `EvaluatorProfile.BIOETICO` con una sola función de conversión.
  - **Estado previo (Paso 0, 18/11/2026; `ceish_test_db`, solo lectura, `current_database()` = `ceish_test_db`):**
    - `catalogos.perfiles_evaluador` tiene solo los ids 6 «Metodológico», 7 «Ético» (descripción «Analiza principios éticos, consentimiento informado y protección de participantes», `orden_prioridad` 2, activo), 8 «Jurídico», 9 «Salud» y 10 «Sociedad Civil»; filas en `evaluadores_perfil`: 3/4/1/3/2; 1 asignación con `perfil_id` = 7. Restricción `perfiles_evaluador_nombre_key` (nombre único).
    - **Duplicados: no hay ninguna fila «BIOETICA», «BIOÉTICA» ni otro duplicado en el catálogo.** Sí hubo antes: `1778539000000-SeedEvaluatorProfilesPET51.ts:16` insertó «BIOÉTICA», `1778784132273-NormalizeEvaluatorProfileNames.ts:16` la renombró a «BIOETICA» y `1778920000000-EnsureEvaluatorProfileFKAndSeeds.ts:24` hace upsert de «BIOETICA»; `1780000000000-SeedRealEvaluators.ts:35-46` borró esos duplicados (ids 11–15). `ceish_db` no se consultó (prohibido): por eso la migración comprueba y aborta en vez de suponer.
    - Enum `EvaluatorProfile` (`src/shared/enums/evaluator-enums.ts:1-6`): JURIDICO, SOCIEDAD_CIVIL, METODOLOGICO, SALUD. La conversión de nombre a enum está repetida en `evaluator-assignment-adapter.service.ts:148-180`, `inherit-evaluators.use-case.ts:25-37` y `reassign-evaluator.use-case.ts:59-71` (y en el código muerto `evaluations.service.ts:1003-1012`). `inherit-evaluators.use-case.ts:96-103` y `reassign-evaluator.use-case.ts:84-88` lanzan un error explícito «perfil Ético» si el nombre normalizado **contiene** «ETIC»: tras el renombre, «BIOETICO» también lo contiene.
    - El fixture `test/real-db-evaluations.e2e-spec.ts:262` crea un perfil «EVALUACION ETICA» (no debe resolverse como Bioético). TSK-001.16 (POST/PATCH `/evaluations/profiles` sin 500) ya está hecha (`6ee0fdb`).
    - **Paso 0 de la implementación (18/11/2026):** hay un **quinto sitio** de conversión que esta tarea no listaba: `src/shared/helpers/evaluator-profile.helper.ts:3-17` (`resolveEvaluatorProfile`, TSK-002-N14, `ebc631e`), usado por `get-active-assignments.use-case.ts:81` y `get-reassignment-history.use-case.ts:49`, con su spec `evaluator-profile.helper.spec.ts`. `src/shared/enums/evaluator-enums.spec.ts` **ya existe** (3 pruebas de los enums): se modifica, no se crea. En `ceish_test_db`: id 7 «Ético» con 4 miembros, 1 asignación y 0 filas de `asignacion_historial` con `perfil_id` = 7; ningún nombre normalizado empieza por «BIOETIC».
    - **Diferencias medidas hoy entre `resolveEvaluatorProfile` (helper) y `mapProfileNameToEnum` (adaptador)** (ejecutando las dos funciones reales; en todos los demás nombres probados, incluidos los 5 del catálogo, con espacios, vacío, «Ético», «Etico», «EVALUACION ETICA», «Bioético» y «BIOÉTICA», dan lo mismo):

      | Nombre | helper | adaptador |
      |---|---|---|
      | Legal, Asesoría Legal, Medicina Legal | null | JURIDICO |
      | Civil, Comunidad | null | SOCIEDAD_CIVIL |
      | Investigación | null | METODOLOGICO |
      | Médico, Clínico | null | SALUD |
      | Metodol | METODOLOGICO | null |
      | Investigación en Salud | SALUD | METODOLOGICO |

      **Ninguno de estos nombres existe hoy en `ceish_test_db`** (el catálogo solo tiene Metodológico, Ético, Jurídico, Salud y Sociedad Civil). `ceish_db` no se consultó.
    - **Regla decidida por la usuaria (18/11/2026):** una sola función `toEvaluatorProfile` que combina las dos, en el orden del adaptador: (1) prefijo «BIOETIC» → `BIOETICO`; (2) contiene JURIDIC o LEGAL → `JURIDICO`; (3) SOCIEDAD, CIVIL o COMUNIDAD → `SOCIEDAD_CIVIL`; (4) METODOL o INVESTIGACION → `METODOLOGICO`; (5) SALUD, MEDIC o CLINIC → `SALUD`; si no, `null`. «Investigación en Salud» → `METODOLOGICO`. Cambios de resultado permitidos (y solo estos): los sinónimos de las filas Legal/Civil/Comunidad/Investigación/Médico/Clínico/Medicina Legal en los usuarios del helper; «Metodol» en el adaptador; «Investigación en Salud» en el helper; Bioético → `BIOETICO` en todos. Ningún sinónimo atrapa «Bioético» ni «Ético» («Ético» → `null`).
  - **Archivos afectados:**
    - `src/migrations/1960000000000-RenameEticoToBioeticoEvaluatorProfile.ts` — CREAR (reemplaza al `1960000000000-AddBioeticoEvaluatorProfile` de v1.3.0, que ya no se crea): `up()` lee la fila id 7 y los nombres de todo el catálogo; si id 7 ya se llama «Bioético», no hace nada; si no se llama «Ético», o si otra fila tiene un nombre normalizado que empiece por «BIOETIC», lanza un `Error` en español con la fila que lo impide; si no, `UPDATE catalogos.perfiles_evaluador SET nombre = 'Bioético', descripcion = 'Profesional con conocimientos en bioética' WHERE id = 7 AND nombre = 'Ético'` y comprueba que cambió 1 fila. `down()`: `UPDATE … SET nombre = 'Ético', descripcion = 'Analiza principios éticos, consentimiento informado y protección de participantes' WHERE id = 7 AND nombre = 'Bioético'`. No toca miembros, asignaciones, historial ni `orden_prioridad`.
    - `src/shared/enums/evaluator-enums.ts` — MODIFICAR: añadir `BIOETICO` (no `ETICO`: ya no hay perfil Ético); exportar una sola función `toEvaluatorProfile(name?: string): EvaluatorProfile | null` (normaliza tildes, mayúsculas y espacios). «Bioético», «Bioetico», «BIOÉTICA» y «BIOETICA» → `BIOETICO` (por el **prefijo** «BIOETIC», no por contener «ETIC»); «Ético», «Etico», «EVALUACION ETICA», vacío o desconocido → `null`. Sigue la regla combinada del Paso 0 de la implementación.
    - `src/shared/helpers/evaluator-profile.helper.ts` y `src/shared/helpers/evaluator-profile.helper.spec.ts` — BORRAR (duplicado de `toEvaluatorProfile`), en el mismo commit que sus dos usuarios; `git grep resolveEvaluatorProfile` debe quedar vacío.
    - `src/modules/evaluations/application/use-cases/get-active-assignments.use-case.ts`, `src/modules/evaluations/application/use-cases/get-reassignment-history.use-case.ts` — MODIFICAR: usar `toEvaluatorProfile` en lugar de `resolveEvaluatorProfile`.
    - `src/modules/evaluations/application/services/evaluator-assignment-adapter.service.ts`, `src/modules/evaluations/application/use-cases/inherit-evaluators.use-case.ts` — MODIFICAR: usar `toEvaluatorProfile` en lugar de su copia local; en la herencia, quitar el error explícito «perfil Ético» (Bioético se hereda como cualquier otro perfil; un nombre desconocido sigue dando el error genérico).
    - `src/modules/evaluations/application/use-cases/inherit-evaluators.use-case.spec.ts` — MODIFICAR: el caso de `:188-213` («perfil Ético id=7 → error») pasa a «perfil Bioético id=7 → se hereda» y se añade «nombre desconocido → error genérico».
    - `src/modules/evaluations/application/use-cases/reassign-evaluator.use-case.ts` — **NO MODIFICAR** en esta tarea (la reasignación no cambia en esta etapa). **Riesgo anotado:** tras el renombre, reasignar a un miembro con perfil Bioético responde `400` con el mensaje «perfil Ético… no soportado» (`:84-88`), como hoy con Ético; se corrige en la tarea futura de reasignación (RF-12.3).
    - `src/shared/enums/evaluator-enums.spec.ts` — MODIFICAR (ya existe; se conservan sus 3 pruebas): unitarias de `toEvaluatorProfile` (Bioético, Bioetico, BIOÉTICA, BIOETICA, Ético → null, Etico → null, EVALUACION ETICA → null, Metodológico, Salud, Jurídico, Sociedad Civil, vacío, desconocido) y **tabla de equivalencia** con todos los nombres que hoy aceptan `resolveEvaluatorProfile` y `mapProfileNameToEnum` (sinónimos incluidos y con espacios para el `.trim()`): `toEvaluatorProfile` da lo mismo que cada función salvo los cambios permitidos de la regla combinada.
    - `test/evaluator-profiles.e2e-spec.ts` — MODIFICAR: `GET /evaluations/profiles` devuelve el id 7 como «Bioético» activo y ningún «Ético»; los miembros del id 7 no cambian.
  - **E2E:** `GET /evaluations/profiles` (SECRETARIA) → id 7 «Bioético», sin «Ético» ni otro Bioético; el número de filas de `evaluadores_perfil` con `perfil_id` = 7 es el mismo que antes de la migración (4 en `ceish_test_db`); `migration:revert` y `migration:run` en `ceish_test_db` → vuelve a «Ético» y luego a «Bioético», sin duplicados.
  - **Mutaciones:** (M1) quitar BIOETICO de `toEvaluatorProfile` → falla la unitaria de Bioético; (M2) reconocer por «contiene ETIC» en vez del prefijo «BIOETIC» → «Ético» y «EVALUACION ETICA» se resuelven como BIOETICO y fallan sus unitarias; (M3) migración sin el UPDATE → falla la E2E «id 7 Bioético»; (M4) quitar la comprobación del nombre previo → no hay pruebas automáticas de migraciones en el repo: se comprueba a mano en `ceish_test_db` dentro de `BEGIN … ROLLBACK` (id 7 renombrado temporalmente → `up()` debe abortar); si no se logra, se anota «no detectable» con la razón.
  - **Hecho cuando:** la migración está aplicada en `ceish_test_db`; el id 7 se lista como Bioético con sus 4 miembros; unitarias y E2E pasan; reasignación sin cambios (riesgo anotado).
  - **Nota:** en `ceish_db` la aplica la usuaria con `MIGRATION_CONFIRM_DB`; si aborta, el error dice qué fila lo impide. El frontend (tipo `'BIOETICA'` en `tasks-frontend-asignacion.md`) se ajusta en su repo.
  - **Resultados (18/11/2026, rama `feat/tsk-002-n50-perfil-bioetico`, commit `c63e2b8`):**
    - **Migración en `ceish_test_db`** (la aplicó la usuaria con la CLI: `migration:run` → `migration:revert` → `migration:run`, 1 fila cambiada; `ceish_db` sigue con «Ético» y sin la 1960). Comprobado con `current_database()` = `ceish_test_db`: id 7 «Bioético», descripción «Profesional con conocimientos en bioética», `orden_prioridad` 2, activo; ningún otro nombre normalizado empieza por «BIOETIC» ni es «ETICO»; 4 miembros, 1 asignación y 0 filas de historial con `perfil_id` = 7 (iguales que antes); `public.migrations` id 88 `RenameEticoToBioeticoEvaluatorProfile1960000000000`. `up()` repetido sobre la base ya migrada (en `BEGIN READ ONLY … ROLLBACK`, por `docker exec psql`): solo emite el `SELECT` y termina sin cambios.
    - **Unitarias:** `npm test` → `Test Suites: 70 passed, 70 total` / `Tests: 697 passed, 697 total`. La tabla de equivalencia (32 filas) se comprobó antes de borrar el helper contra las dos funciones reales (`Tests: 86 passed, 86 total`).
    - **E2E** (`--runInBand`): `evaluator-profiles` antes de la migración `1 failed, 7 passed, 8 total` (Expected «Bioético», Received «Ético»); después, dos corridas `0 failed, 8 passed, 8 total`. También en verde: `active-assignments` 10/10, `reassignment-history` 7/7, `evaluations-assignment` 4/4, `real-db-evaluations` 61/61. Residuos `ZZ_TEST_` en perfiles y `audit_log` = 0; convocatorias huérfanas = 57 (esta tarea no crea convocatorias).
    - **Mutaciones:**

      | Mutación | Qué se rompió | Pruebas que fallan | Resultado |
      |---|---|---|---|
      | M1 | sin la línea BIOETIC en `toEvaluatorProfile` | `"Bioético"`/`"Bioetico"`/`"BIOÉTICA"`/`"BIOETICA"`/`"  Bioético  "` → BIOETICO, equivalencia Bioético y BIOÉTICA, «ningún sinónimo atrapa…», herencia «Bioético (id=7) se hereda…» | `Tests: 9 failed, 50 passed, 59 total` |
      | M2 | `startsWith('BIOETIC')` → `includes('ETIC')` (código anterior) | `"Ético"`/`"Etico"`/`"ÉTICO"`/`"EVALUACION ETICA"` → null, equivalencia Ético, Etico y EVALUACION ETICA, «ningún sinónimo…», herencia «nombre desconocido da el error genérico…» | `Tests: 9 failed, 50 passed, 59 total` |
      | M3 | migración sin el `UPDATE` (id 7 queda «Ético») | E2E «lista el id 7 como «Bioético»…» (medido con la base sin migrar) | `Tests: 1 failed, 7 passed, 8 total` |
      | M4 | sin la comprobación del nombre previo | a mano, en `BEGIN … ROLLBACK` con id 7 renombrado a `ZZ_TEST_N50_TMP`: con el código real `up()` aborta «el perfil id 7 se llama 'ZZ_TEST_N50_TMP', no 'Ético'»; con la mutación también aborta, por la comprobación de 1 fila («se esperaba renombrar 1 fila (id 7) y se renombraron 0»). **No detectable** como cambio de resultado: la comprobación de 1 fila cubre el caso; solo cambia el mensaje. | — |

      Duplicado comprobado igual (id 7 «Ético» + fila «BIOÉTICA ZZ_TEST_N50» en `BEGIN … ROLLBACK`): `up()` aborta «ya existe otro perfil Bioético (id 198 'BIOÉTICA ZZ_TEST_N50')». El `INSERT` revertido avanzó la secuencia de `perfiles_evaluador`.
    - **Respuestas con el valor nuevo (aviso al frontend):** `GET /api/evaluations/protocol/:protocolId/active-assignments` → `evaluatorProfile` puede ser `'BIOETICO'` (antes `null` para el id 7); `GET /api/evaluations/protocol/:protocolId/reassignment-history` → `evaluatorProfile` puede ser `'BIOETICO'` (antes `404` «Perfil de evaluador no reconocido»); `GET /api/evaluations/profiles` → id 7 con `name` «Bioético». `POST /api/evaluations/assign` (cuota de 4, la reemplaza N52): un miembro solo Bioético sigue con `400`, ahora con el mensaje de la cuota en vez de «no es reconocido como un perfil canónico válido».

- [x] **TSK-002-N51** (C — Hecha 18/11/2026, `257d0b2`): la **PRESIDENTE** recibe `EVALUACION_ASIGNAR`. El paso a «solo la PRESIDENTE asigna» (`@Roles('PRESIDENTE')` y el `403` a la SECRETARIA) **se movió a TSK-002-N52** (decisión de la usuaria 18/11/2026, Paso 0 de N51).
  - **Requisitos:** RF-12.1 (primer párrafo), solo la parte del permiso de la PRESIDENTE. El `403` a la SECRETARIA (EARS 1) lo cumple N52.
  - **EARS:** **Cuando** la PRESIDENTE llame a `POST /evaluations/protocols/:id/assign-peer-evaluators`, `POST /evaluations/assign`, `GET /evaluations/protocols/pending-peer-assignment` o `GET /evaluations/evaluators/active`, **el sistema no debe** responder 403 por rol ni permiso. **Mientras** N52 no se fusione, la SECRETARIA sigue sin `403` en esas cuatro rutas y conserva `EVALUACION_ASIGNAR` para historial, asignaciones activas, `completion-status`, `risk-level`, `recalculate-status` y reasignación.
  - **Por qué se movió el 403 (Paso 0, 18/11/2026; frontend leído sin modificar, rama `feat/ep1b-encabezado-desde-backend`, `444c49f`):** el frontend asigna solo como SECRETARIA y la Presidenta no tiene pantalla ni botón para asignar. Con el `403` en N51, nadie podría asignar desde la interfaz. Los sitios del frontend que dejarían de funcionar:
    - `AssignPeersModalComponent` (`src/features/dashboard/presentation/components/assign-peers-modal/assign-peers-modal.component.ts:670`), que llama a `POST /evaluations/protocols/:id/assign-peer-evaluators` (`evaluation-api.adapter.ts:273-281`, `endpoints.constant.ts:54`); el frontend no usa `POST /evaluations/assign`.
    - `PeerRiskPendingTableComponent` (`peer-risk-pending-table.component.ts:250`, abre el modal) dentro de `dashboard-secretaria.page.ts:91`.
    - El botón «Asignar Pares» del espacio del protocolo (`protocol-workspace.component.ts:418-422` y `:506-525`), limitado a `ASSIGN_EVALUATORS: ['SECRETARIA']` en `src/features/protocols/domain/workspace-tab-roles.ts:35`.
    - La acción rápida «Oficializar Asignaciones» del inicio (`dashboard-home.page.ts:726-728`, enlace a `/dashboard/evaluations/assignment`).
  - **Estado previo:** la matriz `1880000000000-FixedRolesMatrix.ts:99` da `EVALUACION_ASIGNAR` solo a SECRETARIA (en `ceish_test_db` lo mismo). `@Roles('SECRETARIA', 'PRESIDENTE')` en `evaluations.controller.ts:154` y `:169`; `PermissionsGuard` (`permissions.guard.ts:88-96`) devuelve hoy 403 a la PRESIDENTE. Matriz actual: 75 filas (`test/fixed-roles-matrix.e2e-spec.ts:311`), PRESIDENTE 22.
  - **Archivos afectados:**
    - `src/migrations/1970000000000-GrantEvaluacionAsignarToPresidente.ts` — CREAR: inserción idempotente por códigos (patrón de `1900000000000-AddProtocolosListarPermission.ts`); `down()` borra solo esa fila. Matriz resultante: 76 filas, PRESIDENTE 23.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — **NO MODIFICAR** en N51: `assign-peer-evaluators` (`:154`) y `assign` (`:169`) siguen con `@Roles('SECRETARIA', 'PRESIDENTE')` y sus `summary` de Swagger no cambian. El cambio pasa a N52.
    - `test/fixed-roles-matrix.e2e-spec.ts` — MODIFICAR: 76 filas; PRESIDENTE con 23 permisos, entre ellos `EVALUACION_ASIGNAR`; PRESIDENTE ≠ 403 en `assign-peer-evaluators`, `assign`, `pending-peer-assignment` y `evaluators/active`; SECRETARIA ≠ 403 en esas cuatro rutas y 200 en `GET /evaluations/protocol/:protocolId/active-assignments`.
  - **Riesgo aceptado (18/11/2026):** con el permiso, la PRESIDENTE también pasa los guardias de `POST /evaluations/reassign` (`:181`, roles SECRETARIA y PRESIDENTE). La reasignación no cambia en esta etapa; queda anotado como riesgo y no se toca. También pasa los de `pending-peer-assignment` (`:143-144`) y `evaluators/active` (`:274-275`), que no tienen `@Roles` (solo el permiso); los necesita la pantalla de la Presidenta (N54).
  - **E2E:** las del archivo anterior, con tokens de login real (no fabricados); la caché de 5 min de `PermissionsGuard` no afecta porque cada usuario de prueba entra después de la migración. En `ceish_db`, la PRESIDENTE pasa `PermissionsGuard` hasta 5 minutos después de aplicar la migración si ya hizo una petición protegida antes (caché por usuario en memoria del proceso, `permissions.guard.ts:21-25,56-85`; ningún código la invalida, ni el login), o al reiniciar el backend. Volver a iniciar sesión solo actualiza la lista `permissions` del login para el frontend.
  - **Mutaciones:** (M1) migración sin el INSERT → fallan el conteo de 76, los 23 permisos y «PRESIDENTE ≠ 403» en las cuatro rutas; (M2) quitar `EVALUACION_ASIGNAR` a SECRETARIA → fallan «SECRETARIA ≠ 403» y «SECRETARIA 200 en active-assignments»; (M3) `@Roles('SECRETARIA')` en las dos rutas de asignar (quitar a la PRESIDENTE) → falla «PRESIDENTE ≠ 403» en `assign-peer-evaluators` y `assign`.
  - **Hecho cuando:** la migración existe en `ceish_test_db`; las E2E pasan; ninguna ruta cambia de roles.
  - **Resultados (18/11/2026, rama `feat/tsk-002-n51-permiso-presidente`, commit `257d0b2`):**
    - **Migración en `ceish_test_db`** (la aplicó la usuaria con la CLI: `migration:run` → `migration:revert` → `migration:run`; `ceish_db` sigue solo con SECRETARIA y sin la 1970). Comprobado con `current_database()` = `ceish_test_db`: `EVALUACION_ASIGNAR` en PRESIDENTE y SECRETARIA; matriz 76 filas (SECRETARIA 36, PRESIDENTE 23, EVALUADOR 9, INVESTIGADOR 8); `public.migrations` id 90 `GrantEvaluacionAsignarToPresidente1970000000000`. El SQL de `up()` repetido sobre la base ya migrada (en `BEGIN … ROLLBACK`, por `docker exec psql`): `INSERT 0 0`, 76 filas.
    - **E2E** `fixed-roles-matrix` (`--runInBand`): antes de la migración `8 failed, 74 passed, 82 total` (conteo 76, 23 permisos, login con `EVALUACION_ASIGNAR`, `rol_permisos` y PRESIDENTE ≠ 403 en las cuatro rutas); después, dos corridas `82 passed, 82 total`. Suite E2E completa: `Test Suites: 28 passed, 28 total` / `Tests: 452 passed, 452 total`.
    - **Unitarias:** `Test Suites: 70 passed, 70 total` / `Tests: 697 passed, 697 total`. `tsc` 0; `eslint` 0 en los 2 archivos; CRLF conservado. Residuos: usuarios `@e2e-frm.test` 0, roles `ZZ_TEST_` 0; convocatorias huérfanas 57 (sin cambio).
    - **Mutaciones:**

      | Mutación | Qué se rompió | Pruebas que fallan | Resultado |
      |---|---|---|---|
      | M1 | migración sin el `INSERT` (`up()` solo hace los `SELECT`; la base queda como sin migrar) | «76 filas…», «PRESIDENTE: token contiene exactamente 23 permisos», «PRESIDENTE: el login incluye EVALUACION_ASIGNAR», «rol_permisos: PRESIDENTE y SECRETARIA…», PRESIDENTE en `assign-peer-evaluators`, `assign`, `pending-peer-assignment` y `evaluators/active` (medido con la base sin migrar) | `Tests: 8 failed, 74 passed, 82 total` |
      | M2 | quitar `EVALUACION_ASIGNAR` a SECRETARIA | **NO EJECUTADA**: exige borrar la fila de `rol_permisos` a mano (prohibido) o una migración mutada que solo aplica la usuaria | — |
      | M3 | `@Roles('SECRETARIA')` en `assign-peer-evaluators` y `assign` | «PRESIDENTE: POST /evaluations/assign → no 403…», «PRESIDENTE: POST /evaluations/protocols/:id/assign-peer-evaluators → no 403…» | `Tests: 2 failed, 80 passed, 82 total` |

- [ ] **TSK-002-N52** (D — Por hacer; depende de N50 y N51): asignación por la PRESIDENTE con tipo de revisión, composición, comprobaciones, estado, fecha límite del plazo de evaluación y oficio al asignar; el evaluador ve su asignación desde que se asigna.
  - **Requisitos:** RF-12.1 a–e y g; RF-12.2a; RF-12.REV; RF-12.6; RF-12.7 a, c.1, c.4 y «DEROGADO 17/11/2026» (incluido (4b), decisión 18/11/2026); EARS 1, 1c, 2, 2g (último párrafo), 6 y 7 (primera frase).
  - **EARS:** los de RF-12.1 (EARS 1 y 1c), RF-12.2a (EARS 2) y RF-12.6 (EARS 6) de la spec v1.3.0. Además: **Cuando** dos peticiones de asignación lleguen a la vez para el mismo protocolo, **el sistema debe** aceptar una y responder `409` a la otra (bloqueo de la fila del protocolo en la transacción). **Mientras** el protocolo no esté en una convocatoria, **el sistema debe** mostrar la asignación al evaluador y dejarle trabajarla (sin el `403` «el protocolo aún no está en una convocatoria»). **Cuando** se acepte la asignación, **el sistema debe** guardar en cada asignación `fecha_limite_revision` = día de la asignación en America/Guayaquil + `plazo_revision_oficio_dias` días laborables, 23:59:59.999 de Ecuador (spec v1.3.1, RF-12.7 c.1).
  - **Estado previo (Paso 0, 17/11/2026):**
    - DTO con exactamente 4 (`evaluator-dtos.ts:48-57`); validador de cuota de 4 que lanza `Error` → 500 (`quota-evaluator-validator.service.ts:14-41`, `http-exception.filter.ts:37-41`); sorteo de 2 (`assign-evaluators.use-case.ts:71-73`).
    - Sin comprobaciones de recepción, tiempos ni asignaciones previas (6d/6f): el adaptador solo lee `reviewType` (`evaluator-assignment-adapter.service.ts:38-41`); hay 3 versiones con 5 asignaciones activas en `ceish_test_db` (datos de prueba viejos: se dejan tal cual).
    - Versión 1 fija en lugar de la activa (`evaluation.typeorm.repository.ts:404-411`, llamado desde `assign-evaluators.use-case.ts:147-150`).
    - `reviewType` llega al caso de uso y no se guarda; `asignado_por` no se graba.
    - Correo solo si ya hay convocatoria (`assign-evaluators.use-case.ts:222-223`); la plantilla no menciona los 8 días (`mailer-notification.adapter.ts:53-58`).
    - El cuerpo de `assign-peer-evaluators` está tipado como unión (`evaluations.controller.ts:163`): el `ValidationPipe` no valida un tipo unión (verificar en el Paso 0 con una petición inválida).
    - Plazo de evaluación (búsqueda del 18/11/2026): `evaluacion.asignaciones_evaluacion` no tiene columna para su fecha límite; `fecha_limite` (`date`) y `fecha_limite_ts` (`timestamptz`) guardan la fecha de entrega de la convocatoria (RF-12.7 b, N44) y no se reutilizan. `fecha_asignacion` es `timestamp without time zone` con `DEFAULT now()` y la base está en `UTC` (`SHOW timezone`). No hay fuente de feriados: `calculate-meeting-dates.service.ts:31,46,67` usa `holidays: []` (TSK-015-N04, diferida en `specs/003-flujo-mvp/plan.md:476`): días laborables de lunes a viernes. `BusinessDayCalculator.calculateDetailedDeadline` (`src/shared/services/deadline-calculator.service.ts:52-101`) no cuenta el día de inicio y devuelve `deadlineInstant` a las 23:59:59.999 de Ecuador.
    - Accesos del evaluador condicionados a convocatoria: `evaluations.service.ts:234` (my-assignments), `:295-311` (`assertAssignmentInActiveConvocatoria`), `:352` (submit), `:1132` y `:1190` (my-pending), `:1238` (submit-risk, N48), `:1537`, `:1863` (checklist-details), `:1955` y `:2007` (documentos).
  - **Contrato (cambios aprobados el 17/11/2026):** las dos rutas aceptan `{ reviewType: 'EXPEDITA' | 'PLENO', evaluators: [{ evaluatorId, profile }] }`, con al menos 2 elementos; en `assign-peer-evaluators` el `protocolId` es el de la ruta (si el cuerpo trae otro, 400). El formato antiguo `{ evaluatorIds }` deja de aceptarse (400) y su DTO se borra en N55. El frontend debe ajustarse (repo FRONTEND-CEISH, fuera de este repo).
  - **Cambio de esquema aditivo (spec v1.3.1; regla del repo: necesita el visto bueno de la usuaria en el Paso 0 antes de implementarlo):** columna nueva `evaluacion.asignaciones_evaluacion.fecha_limite_revision timestamptz NULL`. Se calcula en el caso de uso con `BusinessDayCalculator.calculateDetailedDeadline({ startDate: <instante de la asignación>, businessDaysToAdd: plazo_revision_oficio_dias, holidays: [] }).deadlineInstant`, con el mismo instante que se graba como `fecha_asignacion` (en el Paso 0 se decide si se lee `NOW()` de la base dentro de la transacción). No se expone en las respuestas en esta tarea (mostrarla en el panel del evaluador sería un campo aditivo aparte).
  - **Regla decidida (Paso 0 de N52, decisión de la usuaria 18/11/2026; spec v1.3.2, §11 n.º 5) — persona con Sociedad civil y otro perfil:** cada asignación tiene un solo perfil (`perfil_id`), elegido por la Presidente entre los perfiles activos de esa persona; una persona aparece una sola vez. Si va como Sociedad civil, no define el riesgo; si va por su otro perfil, define el riesgo y Sociedad civil debe cubrirlo otra persona. En pleno, si la persona tiene varios perfiles, la Presidente elige con cuál entra (sin valor por defecto).
  - **Paso 0 de la implementación (18/11/2026, `dev` en `9d9da8c`; decisiones de la usuaria):**
    - Línea base: `tsc` 0; unitarias 697/697; E2E `evaluations-assignment` 4/4, `fixed-roles-matrix` 82/82, `real-db-evaluations` 61/61, `peer-risk-concurrency` 3/3; eslint sin errores en los archivos del plan; residuos `ZZ_TEST_` 0; convocatorias huérfanas 57.
    - Migración 1980 aprobada con dos cambios: el día de la asignación se toma con `fecha_asignacion AT TIME ZONE 'America/Guayaquil'`, y los días laborables se calculan **en SQL** (la migración no importa código de `src/`). Una E2E compara ese SQL con `BusinessDayCalculator` en varias fechas (incluidas una asignación de viernes y una después de las 19:00 de Ecuador). Relleno de los estados 5, 6 y 7 con `fecha_limite_revision` NULL (en `ceish_test_db`: 0, 46 y 29 filas; 75 en total). Una fila sin `fecha_asignacion` queda en NULL y se cuenta aparte, sin abortar. `up()` imprime en la consola las filas rellenadas por estado. Sin el parámetro `plazo_revision_oficio_dias`, aborta en español.
    - Formato antiguo: `AssignEvaluatorsDto.evaluatorIds` con `@IsEmpty` y el mensaje «El formato { evaluatorIds } ya no se acepta; envíe { reviewType, evaluators: [{ evaluatorId, profile }] }.» (con `forbidNonWhitelisted` el 400 sería en inglés). `reviewType` solo `EXPEDITA` o `PLENO` (`ENSAYO_CLINICO` excluido, RF-12.REV).
    - `protocolId`: obligatorio en `POST /evaluations/assign` (400 en español); en `assign-peer-evaluators`, si el cuerpo trae uno distinto al de la ruta, 400.
    - Error de composición: siempre 400 en español, nunca 500.
    - `perfil_id`: hoy la rama canónica del adaptador (`evaluator-assignment-adapter.service.ts:47-52`) y `/assign` lo dejan en NULL; N52 lo busca en el catálogo por perfil y evaluador, y la E2E lo comprueba.
    - Oficio: código y título del protocolo. El resumen queda **pendiente**: el protocolo no tiene un campo de resumen (en `ceish_test_db` solo `actas.resumen_agenda` y `convocatorias.resumen_agenda`).
    - Se retira también el bloqueo de `submit-risk` legacy (`evaluations.service.ts:1537-1545`), por la misma derogación de (4b).
    - Mutaciones: M1 a M13 (incluida M13).
    - Lectura sin modificar: `src/modules/protocols/infrastructure/database/protocol.entity.orm.ts`; el repositorio de evaluaciones lee `recepcion.recepciones` (estado de la recepción de la versión activa).
  - **Archivos afectados:**
    - `src/migrations/1980000000000-AddFechaLimiteRevisionToAssignments.ts` — CREAR: `ADD COLUMN IF NOT EXISTS fecha_limite_revision timestamptz NULL`; rellena en SQL las asignaciones `SUGGESTED`, `ASSIGNED` y `COMPLETED` con `fecha_limite_revision` NULL: día de `fecha_asignacion AT TIME ZONE 'America/Guayaquil'` + `plazo_revision_oficio_dias` días laborables (lunes a viernes, sin contar el día de inicio), 23:59:59.999 de Ecuador; sin `fecha_asignacion` queda NULL y se cuenta aparte; imprime los conteos por estado; `down()` borra la columna (decisión 18/11/2026).
    - `src/modules/evaluations/infrastructure/database/evaluation-assignment.entity.orm.ts` — MODIFICAR: columna `fecha_limite_revision` (`timestamptz`, nullable).
    - `src/modules/evaluations/application/dtos/evaluator-dtos.ts` — MODIFICAR: `AssignEvaluatorsDto` con `reviewType` obligatorio (`EXPEDITA`|`PLENO`), `ArrayMinSize(2)` sin máximo, `protocolId` opcional; mensajes en español.
    - `src/modules/evaluations/domain/services/quota-evaluator-validator.service.ts` — MODIFICAR: reglas de RF-12.1 a–c por tipo de revisión (perfiles permitidos en expedita, una persona por perfil en expedita, al menos una persona de Sociedad civil —en pleno las demás de Sociedad civil se pueden quitar—, ≥ 2, ≥ 1 no Sociedad civil, sin personas repetidas). Sigue siendo dominio puro: lanza un error de dominio que el caso de uso convierte en `BadRequestException`.
    - `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts` — MODIFICAR: comprobaciones de RF-12.1 d (protocolo, recepción `COMPLETO` de la versión activa, tiempos aceptados, sin asignaciones `SUGGESTED`/`ASSIGNED` en la versión activa → `409`; evaluador activo, con rol `EVALUADOR` y con el perfil enviado, con `hasActiveProfile` de `evaluation.typeorm.repository.ts:352`); usar `versionActualId`; `isAssignedForAnnex10 = profile !== SOCIEDAD_CIVIL`; guardar `reviewType` en el protocolo, `asignado_por` y `fecha_limite_revision` en una sola transacción con bloqueo de la fila del protocolo; no cambiar el estado; emitir `evaluator.assigned` siempre (con `plazo_revision_oficio_dias` y la fecha límite).
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` y `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: método(s) de lectura del protocolo para asignar (versión activa, estado de recepción, tiempos aceptados, asignaciones activas, rol del evaluador) y la transacción de guardado con bloqueo; buscar equivalentes antes de crear (p. ej. `findVersionById`, `hasActiveProfile`).
    - `src/modules/evaluations/application/services/evaluator-assignment-adapter.service.ts` — MODIFICAR: quitar la rama `{ evaluatorIds }` y el emparejamiento de 4 perfiles; solo delega al caso de uso.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR: `:153-178`, `@Roles('PRESIDENTE')` en `assign-peer-evaluators` (`:154`) y `assign` (`:169`) (movido desde N51, decisión 18/11/2026), cuerpo `AssignEvaluatorsDto` (no unión), pasar `req.user.id` como `asignado_por`, descripciones de Swagger.
    - `test/fixed-roles-matrix.e2e-spec.ts` — MODIFICAR: SECRETARIA → `403` en `assign-peer-evaluators` y `assign` (en N51 se probaba ≠ 403); PRESIDENTE sigue ≠ 403; SECRETARIA sigue ≠ 403 en `pending-peer-assignment` y `evaluators/active` y con 200 en `active-assignments`.
    - `src/modules/evaluations/infrastructure/adapters/mailer-notification.adapter.ts` — MODIFICAR: texto del oficio (perfil, plazo de `plazo_revision_oficio_dias` días laborables con su fecha límite en dd/mm/aaaa de America/Guayaquil con `toCalendarDateString`, fecha de entrega del informe de la convocatoria o esa fecha si ya existe, Anexo 10 sí/no, enlace).
    - `src/modules/evaluations/evaluations.module.ts` — MODIFICAR: inyectar `SystemParamsService` (exportado por `src/modules/sistema/sistema.module.ts:10`) en la fábrica de `AssignEvaluatorsUseCase` (`:204-214`).
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: retirar el condicionamiento a convocatoria en las líneas del «Estado previo» (derogación de RF-12.7 (4) y (4b): también `submit-risk`, decisión 18/11/2026).
    - `src/modules/evaluations/application/services/create-meeting.use-case.ts` — **NO MODIFICAR**: el aviso de la fecha de entrega al agendar (`:198`) se mantiene (decisión 18/11/2026, §11 n.º 9); solo se comprueba que sigue en verde.
    - Pruebas unitarias — MODIFICAR: `quota-evaluator-validator.service.spec.ts`, `assign-evaluators.use-case.spec.ts`, `evaluator-assignment-adapter.service.spec.ts`, `mailer-notification.adapter.spec.ts`, `evaluator-dtos.spec.ts`, `submit-peer-risk.spec.ts` (casos N48-U-01 a U-06) y los de N42/N43.
    - `test/presidente-assignment.e2e-spec.ts` — CREAR: E2E con base real (prefijo `ZZ_TEST_`, limpieza en `beforeAll`/`afterAll`).
    - `test/evaluations-assignment.e2e-spec.ts`, `test/real-db-evaluations.e2e-spec.ts` (describe 1, 12, 14, 15 y 16), `test/peer-risk-concurrency.e2e-spec.ts` — MODIFICAR: dejan de asignar 4 con SECRETARIA y de esperar el `403` por convocatoria.
  - **E2E (`presidente-assignment`):** expedita válida (5 filas) → 201, Anexo 10 en todas menos Sociedad civil, `reviewType` y `asignado_por` guardados, estado sin cambio, versión activa; expedita con 2 (Sociedad civil + otro) → 201; pleno con varias personas del mismo perfil → 201; pleno con 2 personas de Sociedad civil y una quitada → 201; pleno sin ninguna de Sociedad civil → 400; sin `reviewType` → 400; sin Sociedad civil → 400; solo Sociedad civil → 400; persona repetida → 400; dos personas del mismo perfil en expedita → 400; fila Bioético (id 7) en expedita → 201 con `perfil_id` = 7; evaluador sin el perfil enviado → 400; recepción no `COMPLETO` → 409; tiempos no aceptados → 409; ya asignado → 409; dos peticiones a la vez → una 201 y otra 409; SECRETARIA → 403; `fecha_limite_revision` de cada asignación = `BusinessDayCalculator` (8 días laborables) desde su `fecha_asignacion`; correo `evaluator.assigned` emitido sin convocatoria (modo sin envío real) con el plazo de 8 días laborables y su fecha límite; el evaluador ve la asignación en `my-assignments` sin convocatoria; el evaluador envía `submit-risk` sin convocatoria → 201; al agendar la convocatoria, cada evaluador ya asignado recibe el correo con la fecha de entrega (regresión de `create-meeting.use-case.ts:198`); `perfil_id` de cada asignación = el del catálogo para su perfil (antes NULL); `{ evaluatorIds }` → 400 con el mensaje en español; `/assign` sin `protocolId` → 400; `protocolId` del cuerpo distinto al de la ruta → 400; el SQL de la migración 1980 da lo mismo que `BusinessDayCalculator` para varias fechas (viernes, después de las 19:00 de Ecuador, fin de mes).
  - **Mutaciones (reproducen el código anterior o la regla quitada):** (M1) volver a la cuota de 4 → fallan expedita con 2 y pleno; (M2) quitar cada comprobación de RF-12.1 d (recepción, tiempos, ya asignado) → falla su 409; (M3) volver a `findVersionByProtocolId(protocolId)` con versión 1 → falla «versión activa»; (M4) volver al sorteo → falla «Anexo 10 en todas menos Sociedad civil»; (M5) volver a emitir el correo solo con convocatoria → falla «correo sin convocatoria»; (M6) quitar el bloqueo del protocolo → falla la de concurrencia (si no falla de forma estable: «no detectable» con la razón); (M7) volver a lanzar `Error` en el validador → la respuesta es 500 y falla el 400; (M8) restaurar `assertAssignmentInActiveConvocatoria` en `my-assignments` → falla «ve la asignación sin convocatoria»; (M9) restaurar el guard de convocatoria en `submit-risk` (`evaluations.service.ts:1238`, N48) → falla «`submit-risk` sin convocatoria»; (M10) volver a la regla del 17/11 «en pleno no se puede quitar a nadie de Sociedad civil» → falla «pleno con 2 personas de Sociedad civil y una quitada»; (M11) no guardar `fecha_limite_revision` → falla la E2E de la fecha límite; (M12) contar el día de la asignación o sumar días corridos → falla la unitaria con asignación en viernes (fecha límite que cruza el fin de semana); (M13) volver a `@Roles('SECRETARIA', 'PRESIDENTE')` en las dos rutas de asignar → fallan «SECRETARIA → 403» de `presidente-assignment` y de `fixed-roles-matrix`.
  - **Condición de fusión (decisión de la usuaria 18/11/2026):** N52 se fusiona **solo** cuando el frontend (repo FRONTEND-CEISH) tenga la pantalla de asignación de la Presidenta y haya quitado a la Secretaría las acciones de asignar: el modal `AssignPeersModalComponent` abierto desde `PeerRiskPendingTableComponent` en `dashboard-secretaria.page.ts:91`, el botón «Asignar Pares» del espacio del protocolo (`ASSIGN_EVALUATORS: ['SECRETARIA']` en `workspace-tab-roles.ts:35`) y la acción rápida «Oficializar Asignaciones» de `dashboard-home.page.ts:726-728` (detalle en N51).
  - **Hecho cuando:** todo lo anterior pasa dos veces; `tsc` 0; eslint sin empeorar; residuos 0; convocatorias huérfanas sin cambio; la condición de fusión se cumple.
  - **Resultados (18/11/2026, rama `feat/tsk-002-n52-asignacion-presidente`):** implementada y verificada; **no se marca [x]** porque falta la condición de fusión (pantalla de la Presidenta en FRONTEND-CEISH).
    - **Migración 1980** aplicada en `ceish_test_db` (75 filas rellenadas: estado 5 = 0, 6 = 46, 7 = 29). Después de las E2E: asignaciones en estado 5, 6 o 7 sin `fecha_limite_revision` = 0.
    - **E2E nueva `presidente-assignment`** (base real; `RolesGuard` y `PermissionsGuard` reales, permisos leídos de `usuarios_roles` → `rol_permisos`; datos `ZZ_TEST_PRES_*` y `@e2e-pres.test`): `Tests: 30 passed, 30 total`. Cubre todos los casos de la lista E2E de arriba, y además: persona con Sociedad civil y Salud que entra por Salud, la Presidente elegida como evaluadora (rol EVALUADOR y perfil Jurídico), evaluador inactivo, un solo evaluador, `ENSAYO_CLINICO`, y un fallo del correo que no deshace la asignación. La comparación de la migración 1980 corre `up()` dentro de una transacción que se revierte (no toca otras filas).
    - **Suite E2E completa** (`--runInBand`), tres corridas (dos antes y una después de prettier y eslint): `Test Suites: 29 passed, 29 total` / `Tests: 480 passed, 480 total`. **Unitarias:** `Test Suites: 70 passed, 70 total` / `Tests: 704 passed, 704 total`. `tsc` 0. `eslint` 0 en los archivos tocados. Residuos `ZZ_TEST_` 0; convocatorias huérfanas 57 (sin cambio).
    - **Pruebas borradas** en `test/real-db-evaluations.e2e-spec.ts` (61 → 59): **16b** («Con convocatoria PROGRAMADA → submit-risk pasa el guard (201)») y **16c** («Con convocatoria CANCELADA → submit-risk 403»). Motivo: las dos probaban el guard de convocatoria de N48 en `submit-risk`, que N52 retira (derogación de RF-12.7 (4b), decisión 18/11/2026). La 16c pedía un `403` que ya no existe, y la 16b queda cubierta por la 16a1 reescrita («Sin convocatoria, dueño → submit-risk 201 y persiste la propuesta»), que pasa por el mismo camino. Las demás pruebas del guard (N42-E2E-01/03, 15a–c, 16a1, 16a2, 12a) se reescribieron con el comportamiento de N52, no se borraron.
    - **Mutaciones** (aplicadas una a una sobre una copia y restauradas con comprobación de hash; cada una se corrió con `presidente-assignment` y las unitarias de `src/modules/evaluations`, y M13 además con `fixed-roles-matrix`):

      | Mutación | Pruebas que fallan | Resultado |
      |---|---|---|
      | M1 cuota de 4 | A1–A6, A8, A9 y otras (E2E); N52-U-01 a U-06 y otras (unitarias) | E2E `20 failed`; unit `27 failed` |
      | M2 sin recepción | D1 | E2E `1 failed` |
      | M2 sin tiempos | D2 | E2E `1 failed` |
      | M2 sin «ya asignado» | A4, A5, D3 | E2E `3 failed` |
      | M3 versión 1 en lugar de la activa | A1–A8 (falla «versión activa») | E2E `12 failed` |
      | M4 sorteo de 2 para el Anexo 10 | A1, A5, A7; N52-U-01 | E2E `3 failed`; unit `1 failed` |
      | M5 correo solo con convocatoria | A1, A10; N52-U-07, U-11, U-12 | E2E `2 failed`; unit `3 failed` |
      | M6 sin `FOR UPDATE` | D3 (3 de 3 corridas) | E2E `1 failed` ×3 (estable) |
      | M7 el validador lanza `Error` | B1, B3–B6 (500 en vez de 400); N52-U-03, N52-V-10 | E2E `5 failed`; unit `2 failed` |
      | M8 my-assignments con convocatoria | A2; N52-U-14 | E2E `1 failed`; unit `1 failed` |
      | M9 submit-risk con convocatoria | A3; N52-U-21 | E2E `1 failed`; unit `1 failed` |
      | M10 en pleno no se quita a nadie de Sociedad civil | A7, A8 | E2E `2 failed` |
      | M11 sin `fecha_limite_revision` | A1, A5 | E2E `2 failed` |
      | M12 cuenta el día de la asignación | A1, A5; N52-U-07, U-08 (viernes), U-09 | E2E `2 failed`; unit `3 failed` |
      | M12 días corridos | A1, A5; N52-U-07, U-08, U-09 | E2E `2 failed`; unit `3 failed` |
      | M13 `@Roles('SECRETARIA', 'PRESIDENTE')` | E1, E2 (y E3–E5, porque la asignación de la SECRETARIA crea filas y falla el `afterEach`); `fixed-roles-matrix`: «SECRETARIA → 403» en las dos rutas | E2E `5 failed`; matriz `2 failed, 80 passed, 82 total` |

    - **Búsqueda de equivalentes (19/11/2026, `git grep` por nombre y por propósito en `src` y `test`)** de los 11 símbolos exportados nuevos: `LEGACY_EVALUATOR_IDS_MESSAGE`, `AssignEvaluatorsRepository` (reemplaza la interfaz local `IEvaluationRepository` del caso de uso por un `Pick` del puerto), `EvaluatorCandidateRow`, `AssignmentPreconditionFailure`, `CreateAssignmentsForActiveVersionParams`, `CreateAssignmentsResult`, `AssignableReviewType`, `EvaluatorCompositionError`, `EXPEDITED_REVIEW_PROFILES` y `MIN_ASSIGNED_EVALUATORS`, sin equivalentes. **Duplicado retirado:** `AssignEvaluatorItem` (`assign-evaluators.use-case.ts`) tenía la misma forma que `EvaluatorCandidateInput` (`quota-evaluator-validator.service.ts:4`, ya existía); se borró, y `AssignEvaluatorsCommand.evaluators` usa `EvaluatorCandidateInput[]`. Después: `tsc` 0; unitarias 704/704; E2E `presidente-assignment`, `real-db-evaluations` y `fixed-roles-matrix` `Tests: 171 passed, 171 total`; `eslint` 0; residuos 0; convocatorias huérfanas 57.
    - **Resumen del protocolo en el oficio:** sigue **pendiente** (el protocolo no tiene ese campo); el oficio lleva perfil, plazo con su fecha límite, código y título.

- [ ] **TSK-002-N53** (E — Por hacer; depende de N52): riesgo por **N pares** (todos menos Sociedad civil) y discrepancia resuelta por la SECRETARIA.
  - **Requisitos:** RF-12.2 (nota «Falta implementar»), RF-12.2a, d, e, f y g; EARS 2d, 2e, 2f y 2g.
  - **EARS:** los de RF-12.2d, e, f y g (EARS 2d, 2e, 2f, 2g). En particular (decisión 18/11/2026): **Si** la SECRETARIA registra el riesgo en discrepancia y `NOW()` de la base es anterior al inicio del día de la `fecha_reunion` de la convocatoria indicada (America/Guayaquil), **el sistema debe** responder `409` con un mensaje en español; al designar el riesgo (acuerdo o pleno), **el sistema no debe** cambiar el `reviewType`. Además: **Si** un evaluador asignado como Sociedad civil intenta enviar Anexo 10, **el sistema debe** responder `400` (hoy ya lo hace la comprobación `isAssignedForAnnex10` de `evaluations.service.ts:1251`; se deja cubierto por prueba).
  - **Estado previo:** `submitPeerRiskLevel` bloquea las asignaciones de Anexo 10 activas (`evaluations.service.ts:1257-1273`) y solo compara si hay **exactamente 2** (`:1327-1329`); en acuerdo pone `EN_EVALUACION` y deriva `reviewType` del nivel (`:1354-1362`); en discrepancia archiva `p1Proposal` y `p2Proposal` (`:1431-1432`). El camino antiguo (tabla `asignaciones_pares_riesgo`) también deriva `reviewType` (`:1596-1605`). La designación en pleno **ya existe**: `PATCH /evaluations/protocols/:protocolId/risk-level` (`evaluations.controller.ts:255-272`, rol SECRETARIA, `EVALUACION_ASIGNAR`; `evaluations.service.ts:1647+`): exige `DISCREPANCIA_RIESGO` y una convocatoria que incluya el protocolo, y deriva `reviewType` (`:1697-1715`); no comprueba la fecha de la reunión. El Anexo 9 en pleno exige `annex10` (`evaluations.service.ts:473-476`): revisar contra RF-12.2g.
  - **Decidido (18/11/2026, §11 n.º 6):** `designatePlenumRiskLevel` exige, además de la convocatoria que incluya el protocolo, `NOW()` de la base ≥ inicio del día de `fecha_reunion` en America/Guayaquil (`409` en español si es antes). La comprobación «protocolo en la convocatoria y desde el día de la reunión» se escribe una sola vez (en la consulta, con `NOW()` de la base; sin `toISOString().split('T')[0]` ni `.slice(0,10)`) y la reutiliza TSK-002-N56.
  - **Archivos afectados:**
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: `submitPeerRiskLevel` para N asignaciones (esperar a todas las vigentes; si todas coinciden, designar; si alguna difiere, `DISCREPANCIA_RIESGO` y archivar todas); con N = 1, designar con la única propuesta; no cambiar `reviewType` en el acuerdo (`:1354-1362`), en el camino antiguo (`:1596-1605`) ni en `designatePlenumRiskLevel` (`:1697-1715`) (decisión 18/11/2026, §11 n.º 3); comprobación de la fecha de la reunión en `designatePlenumRiskLevel`; desbloqueo del Anexo 9 según RF-12.2g; texto de las notificaciones.
    - `src/modules/evaluations/application/services/submit-peer-risk.spec.ts` — MODIFICAR: N = 1, 2 y 3 (coinciden, difieren, falta una).
    - `test/peer-risk-n-pares.e2e-spec.ts` — CREAR: base real.
    - `test/risk-designation.e2e-spec.ts` — MODIFICAR si sus datos asumen 2 propuestas.
  - **E2E (`peer-risk-n-pares`):** 3 pares coinciden → designado, `EN_EVALUACION`, `reviewType` sin cambio; 3 pares con uno distinto → `DISCREPANCIA_RIESGO`, las 3 archivadas; 2 de 3 enviadas → sin cambios; 1 solo par → su propuesta fija el nivel; Sociedad civil envía Anexo 10 → 400; SECRETARIA registra el nivel en discrepancia con la convocatoria el día de la reunión → 200 y `reviewType` sin cambio; con la reunión en el futuro → 409 con el mensaje en español; con una convocatoria que no incluye el protocolo → 409; PRESIDENTE en `risk-level` → 403 (sin cambios de roles).
  - **Mutaciones:** (M1) volver a `annex10Assignments.length === 2` → fallan N = 1 y N = 3; (M2) comparar solo las dos primeras propuestas → falla «uno distinto entre 3»; (M3) archivar solo dos → falla «las 3 archivadas»; (M4) volver a derivar `reviewType` del nivel (acuerdo y pleno) → falla «`reviewType` sin cambio»; (M5) quitar la comprobación de la fecha de la reunión → falla «reunión en el futuro → 409»; (M6) comparar la fecha en UTC en vez de America/Guayaquil → solo es detectable con una `fecha_reunion` que caiga en otro día según la zona; como «ahora» sale de la base, se fija `fecha_reunion` relativa a `NOW()`; si no se logra un caso estable, se anota «no detectable» con la razón.
  - **Hecho cuando:** todo lo anterior pasa dos veces; `tsc` 0; eslint sin empeorar; residuos 0.

- [ ] **TSK-002-N56** (Por hacer; nueva 18/11/2026; depende de N53): la SECRETARIA cambia el **tipo de revisión** según la reunión.
  - **Requisitos:** RF-12.REV b; RF-12.2d paso 2; EARS 2h.
  - **EARS:** los de EARS 2h.
  - **Estado previo (búsqueda del 18/11/2026):** no existe ninguna operación para cambiar el tipo de revisión. `AssignReviewDto` (`src/modules/protocols/application/dtos/assign-review.dto.ts`, solo `reviewType` con `@IsEnum(ReviewType)`) no tiene usos (`git grep AssignReviewDto`); `VerifyReceptionDto.reviewType` (`src/modules/reception/application/dtos/verify-reception.dto.ts:15`) se descarta en `reception.controller.ts:93-97`. Hoy `protocolos.tipo_revision` solo se escribe al designar el riesgo (`evaluations.service.ts:1362`, `:1605`, `:1715`; lo retira N53) y al asignar (N52). El `reviewType` decide qué anexo exige `submitEvaluation` (`evaluations.service.ts:525`, `:680-693`): cambiarlo con dictámenes en curso cambia el anexo exigido a quienes aún no envían.
  - **Diseño:** `PATCH /evaluations/protocols/:protocolId/review-type` en `EvaluationsController` (junto a `risk-level`), `@Roles('SECRETARIA')`, `@Permissions(Permission.EVALUATORS_ASSIGN)`, `@Audit('PROTOCOL_REVIEW_TYPE_CHANGED')`; cuerpo `{ reviewType: 'EXPEDITA' | 'PLENO', meetingId: uuid }`. Reutiliza la comprobación de N53 (convocatoria que incluye la versión activa y desde el día de la reunión). Bitácora en la misma transacción: tipo anterior, tipo nuevo, `meetingId`, `userId`. Sin cambios en las asignaciones. Si el tipo nuevo es igual al actual: `200` sin cambio (a confirmar en el Paso 0).
  - **Archivos afectados:**
    - `src/modules/protocols/application/dtos/assign-review.dto.ts` — MODIFICAR y reutilizar (en lugar de crear un DTO nuevo): limitar a `EXPEDITA`|`PLENO` y añadir `meetingId` (`@IsUUID`, como `DesignatePlenumRiskDto`, `evaluator-dtos.ts:60-71`); mensajes en español. Si en el Paso 0 se ve que pertenece mejor a `evaluations`, se reporta antes de moverlo.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR: nueva ruta.
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: método `changeReviewType` (transacción, bitácora, comprobación compartida con N53).
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.spec.ts` y la unitaria del servicio que corresponda — MODIFICAR.
    - `test/review-type-change.e2e-spec.ts` — CREAR: base real.
  - **E2E (`review-type-change`):** SECRETARIA, protocolo en la convocatoria, día de la reunión → 200, `tipo_revision` cambiado, fila de bitácora con anterior/nuevo/`meetingId`/`userId`, asignaciones sin cambio; reunión en el futuro → 409 en español; convocatoria que no incluye el protocolo → 409; `ENSAYO_CLINICO` o valor inválido → 400; PRESIDENTE o EVALUADOR → 403; protocolo inexistente → 404.
  - **Mutaciones:** (M1) quitar la comprobación de convocatoria → falla «no incluye el protocolo → 409»; (M2) quitar la comprobación de fecha → falla «reunión en el futuro → 409»; (M3) no escribir la bitácora → falla la fila de bitácora; (M4) `@Roles('SECRETARIA', 'PRESIDENTE')` → falla «PRESIDENTE → 403».
  - **Hecho cuando:** todo lo anterior pasa dos veces; `tsc` 0; eslint sin empeorar; residuos 0.

- [ ] **TSK-002-N54** (F — Por hacer; depende de N51 y N52): pendientes por asignar y miembros con carga para la PRESIDENTE, reutilizando consultas.
  - **Requisitos:** RF-12.1 h; EARS 1b.
  - **EARS:** los de EARS 1b.
  - **Estado previo:** `GET /evaluations/protocols/pending-peer-assignment` (`evaluations.controller.ts:143-151`, `evaluations.service.ts:866-890`) no excluye los protocolos con asignaciones y devuelve la entidad ORM con relaciones. La regla correcta ya está en la fila `asignar` de `PENDING_ITEMS_SQL` (`src/modules/secretaria/infrastructure/repositories/pending-items.typeorm.repository.ts:68-80`), expuesta solo a SECRETARIA en `GET /secretaria/pendientes`. `GET /evaluations/evaluators/dashboard` (`REPORTES_CARGA`, que la PRESIDENTE tiene) devuelve los miembros con perfiles y `currentLoad` (`evaluation.typeorm.repository.ts:258-350`), que cuenta solo `ASSIGNED` (`:279-280`) y no filtra usuarios inactivos; su `pendingProtocols` (`evaluations.service.ts:175-215`) es la bandeja de resoluciones (spec §RF-12.4) y **no se cambia**.
  - **Archivos afectados:**
    - `src/modules/secretaria/infrastructure/repositories/pending-items.typeorm.repository.ts` — MODIFICAR: separar las CTE `base` y `asignar` en un fragmento reutilizable y exponer un método de solo lectura «protocolos por asignar», sin duplicar el SQL. En el Paso 0, comprobar dependencias entre módulos (evitar ciclo `secretaria` ↔ `evaluations`) y si el puerto del repositorio puede exportarse.
    - `src/modules/secretaria/domain/ports/` (puerto del repositorio) y `src/modules/secretaria/secretaria.module.ts` — MODIFICAR si hace falta exportarlo.
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: `getProtocolsPendingPeerAssignment` usa ese método.
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` — MODIFICAR: `:143` con `@Roles('PRESIDENTE', 'SECRETARIA')` (solo lectura; la SECRETARIA conserva la consulta).
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: `findEvaluatorsWithWorkload` cuenta `SUGGESTED` y `ASSIGNED` sin entrega y solo usuarios activos.
    - Unitarias del repositorio y del servicio afectados — MODIFICAR.
    - `test/presidente-pendientes.e2e-spec.ts` — CREAR; `test/secretaria-pendientes.e2e-spec.ts` — MODIFICAR solo si cambia su fixture (la vista de la Secretaría no cambia).
  - **E2E:** protocolo listo → aparece; con asignaciones activas → no aparece; recepción no `COMPLETO` o sin tiempos aceptados → no aparece; misma lista que la fila «Asignar» de `/secretaria/pendientes`; miembros con carga que cuenta una `SUGGESTED` y una `ASSIGNED`; usuario inactivo no aparece; filtro por perfil (Bioético devuelve los miembros del id 7); PRESIDENTE 200 en ambas.
  - **Mutaciones:** (M1) volver al `find` anterior de `getProtocolsPendingPeerAssignment` → falla «con asignaciones → no aparece»; (M2) quitar `SUGGESTED` de la carga → falla el conteo; (M3) quitar el filtro de activos → falla «inactivo no aparece».
  - **Hecho cuando:** todo lo anterior pasa dos veces; `/secretaria/pendientes` sin cambios (su E2E en verde); `tsc` 0; eslint sin empeorar.

- [ ] **TSK-002-N55** (G — Por hacer; al final): retirar el código muerto y el sorteo.
  - **Requisitos:** RF-12.2a (retiro del sorteo, de `asignaciones_pares_riesgo` como fuente y de `assignPeerEvaluators`).
  - **Estado previo:** `evaluationsService.assignPeerEvaluators` (`evaluations.service.ts:895-1103`) no tiene llamadores (`git grep`); `RandomRiskSelectorService` (`random-risk-selector.service.ts`) solo lo usan el caso de uso (hasta N52) y ese código muerto; `AssignPeerEvaluatorsDto` (`assign-peer-evaluators.dto.ts`) queda sin uso tras N52; el camino antiguo de `submitPeerRiskLevel` sobre `asignaciones_pares_riesgo` (`evaluations.service.ts:1520-1640` aprox., con los `TODO` de retiro en `:1521` y `:1618`).
  - **Archivos afectados:**
    - `src/modules/evaluations/domain/services/random-risk-selector.service.ts` y `random-risk-selector.service.spec.ts` — ELIMINAR (quita también el error de eslint previo).
    - `src/modules/evaluations/application/dtos/assign-peer-evaluators.dto.ts` — ELIMINAR.
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: borrar `assignPeerEvaluators` y, si la usuaria lo confirma en el Paso 0, el camino antiguo de `submitPeerRiskLevel`.
    - `src/modules/evaluations/evaluations.module.ts` y `evaluations.controller.ts` — MODIFICAR: quitar importaciones sin uso.
    - La tabla `asignaciones_pares_riesgo` y su entidad ORM **no se borran** en esta tarea (no se modifica el esquema sin consulta).
  - **E2E:** la suite completa sigue en verde (la corre la usuaria); `git grep -n "RandomRiskSelectorService\|AssignPeerEvaluatorsDto\|assignPeerEvaluators(" -- src test` sin resultados en producción.
  - **Mutaciones:** no aplican (retiro sin cambio de comportamiento); se demuestra con `git grep` antes y después.
  - **Hecho cuando:** archivos borrados con la prueba de que nadie los usaba; `tsc` 0; unitarias y E2E en verde; eslint sin empeorar.

- [ ] **TSK-002-N57** (Por hacer; nueva 18/11/2026, spec v1.3.1; depende de N52): el protocolo solo es **candidato para una convocatoria**, y solo puede agendarse, cuando vence su plazo de evaluación.
  - **Requisitos:** RF-12.7 c.2; EARS 7 (segunda y tercera frases).
  - **EARS:** los de EARS 7: **Mientras** `NOW()` de la base no supere la fecha límite del plazo de evaluación de la versión activa, **el sistema no debe** listarla en `GET /evaluations/meetings/pending-protocols`, aunque todos los evaluadores hayan entregado; **si** la Secretaría la envía en `POST /evaluations/meetings`, **el sistema debe** responder `409` con un mensaje en español que indique la fecha límite; **cuando** el plazo haya vencido, **el sistema debe** listarla y aceptar agendarla.
  - **Estado previo (Paso 0, 18/11/2026):** `GET /evaluations/meetings/pending-protocols` (`meetings.controller.ts:211-225`, SECRETARIA y PRESIDENTE) usa `findPendingProtocols` (`meeting-typeorm.repository.ts:501-547`): versiones activas con recepción `COMPLETO` (estado 10) y protocolo no APROBADO ni RECHAZADO; no mira asignaciones ni plazo. `CreateMeetingUseCase.execute` (`create-meeting.use-case.ts:53-176`) no comprueba que las versiones sean candidatas; usa `getOldestAssignedDates` (`meeting-typeorm.repository.ts:291-317`; solo lo llama este caso de uso) para la advertencia `ADVERTENCIA_PLAZO_REVISION` (`calculate-meeting-dates.service.ts:86-118`). Las E2E `test/meetings.e2e-spec.ts:135`, `test/meetings-concurrency.e2e-spec.ts:51` y `test/meetings-pdf.e2e-spec.ts:71` simulan `getOldestAssignedDates`; `test/evaluations-contract.e2e-spec.ts:238` simula `findPendingProtocols`. La ruta legacy `POST /evaluations/calls` (`calls.service.ts`) **no se toca** (regla del repo): queda sin este bloqueo hasta su retiro (TSK-002-N47).
  - **Diseño:** un solo predicado SQL «plazo de evaluación vencido», escrito una vez en el repositorio de convocatorias: la versión tiene al menos una asignación activa (`SUGGESTED`, `ASSIGNED` o `COMPLETED`; las `REASIGNADO_*` no cuentan) y `NOW()` de la base es posterior al `MAX(fecha_limite_revision)` de esas asignaciones. Lo usan la lista y la comprobación previa al guardado. Mensaje del 409: `PLAZO_EVALUACION_NO_VENCIDO: El protocolo <código> (versión <id>) no puede agendarse hasta que venza su plazo de evaluación (<dd/mm/aaaa>).` (fecha con `toCalendarDateString`); para una versión sin asignaciones activas: `… no tiene evaluadores asignados.` En el Paso 0 se decide si la comprobación va dentro de la transacción de `saveMeetingWithAtomicNumber`.
  - **Archivos afectados:**
    - `src/modules/evaluations/domain/ports/meeting-repository.port.ts` — MODIFICAR: método de lectura para las versiones enviadas que aún no cumplen el predicado (con su fecha límite); quitar `getOldestAssignedDates` si queda sin uso.
    - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` — MODIFICAR: `findPendingProtocols` con el predicado; el método nuevo; retirar `getOldestAssignedDates`.
    - `src/modules/evaluations/application/services/create-meeting.use-case.ts` — MODIFICAR: `409` si alguna versión enviada no cumple; quitar `assignmentSnapshots`.
    - `src/modules/evaluations/application/services/calculate-meeting-dates.service.ts` — MODIFICAR: retirar `ADVERTENCIA_PLAZO_REVISION` (la advertencia del plazo normativo sigue). En el Paso 0 se comprueba si `meetingDate` puede ser anterior a hoy; si puede, se reporta antes de retirarla.
    - `src/shared/deadlines/deadline-rules.ts` — MODIFICAR solo el comentario de `PLAZO_REVISION_OFICIO_DIAS` (`:17`): «plazo de evaluación desde la asignación (RF-12.7 c, PET)» en vez de «mínimo… advertencia no bloqueante». El valor no cambia.
    - Unitarias — MODIFICAR: `create-meeting.use-case.spec.ts`, `calculate-meeting-dates.service.spec.ts` (`:358`).
    - `test/meetings.e2e-spec.ts`, `test/meetings-concurrency.e2e-spec.ts`, `test/meetings-pdf.e2e-spec.ts`, `test/evaluations-contract.e2e-spec.ts` — MODIFICAR: sus mocks del repositorio; `test/real-db-evaluations.e2e-spec.ts` — MODIFICAR si sus fixtures agendan versiones sin asignaciones o con el plazo sin vencer (se verifica en el Paso 0).
    - `test/meeting-candidates-deadline.e2e-spec.ts` — CREAR: base real (prefijo `ZZ_TEST_`, limpieza en `beforeAll`/`afterAll`).
  - **E2E (`meeting-candidates-deadline`):** plazo vencido (`fecha_limite_revision` = `NOW()` − 1 día) → aparece y `POST /evaluations/meetings` → 201; plazo no vencido con **todas** las asignaciones `COMPLETED` → no aparece y 409 con la fecha en el mensaje; plazo vencido con todas `COMPLETED` → aparece; dos asignaciones con fechas límite distintas, una vencida y otra no → no aparece; versión sin asignaciones activas (solo `REASIGNADO_*` o ninguna) → no aparece y 409; `warnings` ya no trae `ADVERTENCIA_PLAZO_REVISION`; PRESIDENTE sigue con 200 en la lista.
  - **Mutaciones:** (M1) quitar el predicado de la lista → falla «no vencido → no aparece»; (M2) quitar la comprobación del caso de uso → falla el 409; (M3) usar `MIN` en vez de `MAX` → falla «una vencida y otra no»; (M4) contar solo `ASSIGNED` → falla «vencido con todas `COMPLETED` → aparece»; (M5) comparar con `CURRENT_DATE` en vez del instante → solo es detectable con una fecha límite de hoy; si no se logra un caso estable, «no detectable» con la razón.
  - **Hecho cuando:** todo lo anterior pasa dos veces; `tsc` 0; eslint sin empeorar; residuos 0; convocatorias huérfanas sin cambio.

- [ ] **TSK-002-N58** (Por hacer; nueva 18/11/2026, spec v1.3.1; depende de N52; después de N57): la alerta por falta de convocatoria cuenta desde el vencimiento del plazo de evaluación.
  - **Requisitos:** RF-12.7 d; EARS 7b.
  - **EARS:** los de EARS 7b.
  - **Conciliación (18/11/2026):** con el plazo de RF-12.7 c el protocolo solo puede agendarse desde que vence ese plazo (8 días laborables); si la antigüedad siguiera contando desde la `fecha_asignacion` con `dias_max_sin_convocatoria` = 8, la alerta saltaría justo cuando el protocolo recién puede agendarse. Por eso la antigüedad cuenta desde el vencimiento del plazo de evaluación. La condición del plazo normativo (`dias_alerta_normativo_sin_convocatoria`) no cambia.
  - **Estado previo (Paso 0, 18/11/2026):** `UnscheduledProtocolsAlertService.checkAndNotify` (`unscheduled-protocols-alert.service.ts:48+`) cuenta días laborables con `BusinessDayCalculator.countBusinessDays` desde `oldestAssignmentDate` (`:120`, `:153-160`), que devuelve `findAssignedVersionsWithoutScheduledMeeting` (`meeting-typeorm.repository.ts:338`). La descripción del parámetro `dias_max_sin_convocatoria` (`1850000000000-SeedUnscheduledAlertParams.ts:20`) dice «desde la asignación activa más antigua».
  - **Archivos afectados:**
    - `src/modules/evaluations/domain/ports/meeting-repository.port.ts` y `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` — MODIFICAR: `findAssignedVersionsWithoutScheduledMeeting` devuelve también el `MAX(fecha_limite_revision)` de las asignaciones activas (mismo criterio que el predicado de N57).
    - `src/modules/evaluations/application/services/unscheduled-protocols-alert.service.ts` — MODIFICAR: antigüedad desde esa fecha; sin alerta por antigüedad mientras no haya vencido.
    - `src/modules/evaluations/application/services/unscheduled-protocols-alert.service.spec.ts` — MODIFICAR.
    - La descripción del parámetro en `sistema` queda desactualizada; se corrige con una migración de datos solo si la usuaria lo pide.
  - **Pruebas:** no hay E2E del proceso diario (confirmar en el Paso 0); se cubre con unitarias: asignado hace 10 días laborables con el plazo vencido hace 2 → sin alerta por antigüedad; plazo vencido hace `dias_max_sin_convocatoria` días laborables → alerta; plazo sin vencer y plazo normativo cerca → alerta normativa (sin cambio).
  - **Mutaciones:** (M1) volver a contar desde `oldestAssignmentDate` → falla «vencido hace 2 → sin alerta»; (M2) quitar la condición normativa → falla su unitaria.
  - **Hecho cuando:** unitarias en verde dos veces; `tsc` 0; eslint sin empeorar.

- [ ] **TSK-002-N59** (Por hacer — **más adelante**; nueva 18/11/2026): **conflicto de interés del PET** al asignar.
  - **Regla del PET:** no asignar como evaluador a colaboradores del promotor o del investigador principal, ni a quien trabaje en su misma unidad administrativa. Aún no es un RF de la spec (anotado en §10); se redacta cuando se retome.
  - **Estado previo (Paso 0, 18/11/2026; `ceish_test_db`, solo lectura):** **hoy no existe el dato de la unidad administrativa de cada miembro**: ninguna columna de unidad, facultad, carrera o departamento en `catalogos.usuarios` ni en otra tabla. Sí existen: `protocolos.investigador_principal_id`; `public.protocolo_investigadores` (equipo del protocolo: `usuario_id`, `identificacion`, `institucion`, `rol`); datos del patrocinador en `protocolos.patrocinador_*` (RUC y órgano ejecutor; no hay personas del promotor); `catalogos.perfiles_investigador.institucion_pertenece` (institución, no unidad); `sistema.declaracion_conflicto_interes` (por `investigador_id`). La reasignación por `CONFLICTO_INTERES` (RF-12.3) ya existe y es otro proceso.
  - **Por decidir al retomarla:** de dónde sale la unidad administrativa de cada miembro (dato nuevo → cambio de esquema con consulta previa); qué cuenta como «colaborador del promotor» con los datos de hoy; si se bloquea (`400`) o solo se advierte a la Presidente; si aplica igual en expedita y en pleno; y si se usa una declaración de conflicto del evaluador.
  - **Archivos afectados, E2E y mutaciones:** se definen al retomarla.

### Migraciones de esta sección (solo `ceish_test_db`; la usuaria las aplica en `ceish_db`)

| Tarea | Migración | Qué hace |
|---|---|---|
| N50 | `1960000000000-RenameEticoToBioeticoEvaluatorProfile` | Renombra el perfil id 7 de «Ético» a «Bioético» (y su descripción); aborta si id 7 no se llama «Ético» o si ya hay otro Bioético. `down()` lo devuelve a «Ético». |
| N51 | `1970000000000-GrantEvaluacionAsignarToPresidente` | Añade PRESIDENTE → `EVALUACION_ASIGNAR` (matriz 76 filas). Sin cambios de `@Roles` (el `403` a la SECRETARIA va en N52). |
| N52 | `1980000000000-AddFechaLimiteRevisionToAssignments` | **Esquema (aditivo, con visto bueno previo):** columna `asignaciones_evaluacion.fecha_limite_revision timestamptz NULL` y relleno en SQL de los estados 5, 6 y 7 (día en America/Guayaquil + días laborables, 23:59:59.999 de Ecuador); imprime los conteos por estado. |

Único cambio de esquema: la columna aditiva `fecha_limite_revision` de N52 (spec v1.3.1). `protocolos.tipo_revision`, `asignaciones_evaluacion.es_asignado_anexo_10`, `perfil_id` y `asignado_por` ya existen.
