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

- [ ] **TSK-002-N09**: Rediseñar el puente de correos de asignación en `evaluations.module.ts` (~línea 131).
  - **Requisito relacionado:** `RF-12.7` — notificación al evaluador al ser asignado.
  - **PR:** PR-C3 o posterior (después de TSK-009-N04).
  - **Descripción:** El puente actual envía nombre fijo `"Evaluador"`, usa `protocolCode` como asunto y descarta el HTML de la plantilla. Criterios de aceptación: (a) nombre real del evaluador en el campo `name`; (b) asunto tomado de la plantilla `getEvaluationAssignmentTemplate`; (c) cuerpo HTML generado por la plantilla, no texto plano; (d) prueba unitaria que verifique los tres puntos anteriores mockeando `IEmailServicePort`.
  - **Archivos afectados:**
    - `src/modules/evaluations/evaluations.module.ts` (~línea 131) — MODIFICAR el bridge de correos.
    - Test nuevo a definir (ubicación: junto al servicio que llame al bridge).
  - **Hecho cuando:** El correo de asignación incluye nombre real, asunto de plantilla y cuerpo HTML; la prueba pasa en verde.

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

- [ ] **TSK-002-N11** (PENDIENTE): Corregir fallback `adminUserId ?? 1` en `EvaluationsController.reassignEvaluator`.
  - **Requisito relacionado:** Integridad de auditoría — `RF-12.3` registra `ejecutado_por`.
  - **PR:** posterior a PR-D.
  - **Descripción:** En `evaluations.controller.ts` (~línea 188), cuando `req.user` es `undefined`, el controlador usa `adminUserId = 1` y persiste `ejecutado_por = 1` en `evaluacion.asignacion_historial`, falsificando la auditoría. La causa de que `req.user` pueda faltar está **SIN INVESTIGAR**. **No modificar en TSK-002-N10; investigar y corregir aquí.**
  - **Archivos afectados:**
    - `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts` (~línea 188) — eliminar el fallback `?? 1` y lanzar `UnauthorizedException` si `req.user` es falsy.
  - **Hecho cuando:** `req.user` undefined en `POST /evaluations/reassign` devuelve 401; ningún registro de historial queda con `ejecutado_por = 1` por falta de autenticación.

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

- [ ] **TSK-002-N13** (PENDIENTE): Cobertura E2E de 401/403 con guards reales para los endpoints de solo lectura de evaluaciones.
  - **Requisito relacionado:** Seguridad — `RF-12.3` (historial) y `RF-12.4` (asignaciones activas).
  - **PR:** posterior a PR-D y PR-E.
  - **Descripción:** Las suites `reassignment-history.e2e-spec.ts` y `active-assignments.e2e-spec.ts` verifican decoradores de seguridad vía metadatos Reflector y 403/permisos con guards simulados, pero `JwtAuthGuard` y `RolesGuard` están sobreescritos en el módulo de prueba. Para verificar que sin token real se obtiene 401 y con rol incorrecto se obtiene 403 usando los guards de producción, se necesita un segundo módulo de prueba sin overrides de guards (`Test.createTestingModule` sin `.overrideGuard(JwtAuthGuard)`). Esto implica infraestructura adicional (generar un JWT real o usar el helper de auth existente en los tests de `evaluations-contract`).
  - **Endpoints a cubrir:**
    - `GET /api/evaluations/protocol/:protocolId/reassignment-history`
    - `GET /api/evaluations/protocol/:protocolId/active-assignments`
  - **Archivos afectados:**
    - `test/reassignment-history.e2e-spec.ts` — MODIFICAR añadir bloque `describe` con módulo sin overrides de guard y token JWT real.
    - `test/active-assignments.e2e-spec.ts` — MODIFICAR añadir bloque `describe` con módulo sin overrides de guard y token JWT real.
  - **Hecho cuando:** sin token devuelve 401 real; con JWT de rol `EVALUADOR` devuelve 403 real; tests verdes en ambas suites.

- [x] **TSK-002-N14**: Implementar `GET /api/evaluations/protocol/:protocolId/active-assignments`.
  - **Requisito relacionado:** `RF-12.4` — lista de asignaciones activas de un protocolo.
  - **PR:** PR-E (`feat/active-assignments-endpoint`).
  - **Descripción:** Endpoint de solo lectura que devuelve las asignaciones activas (estados SUGGESTED/ASSIGNED/COMPLETED = 5/6/7) de la versión 1 de un protocolo, ordenadas por `assignedAt` ASC (desempate por `id`). Acceso restringido a roles `SECRETARIA` y `PRESIDENTE` con permiso `EVALUATORS_ASSIGN`.
    - 200 con `assignments: []` si el protocolo existe pero no tiene versión 1, o si la versión 1 no tiene asignaciones activas.
    - 404 en español si el protocolo no existe.
    - 400 si `:protocolId` no es entero.
    - **Decisión de versión (Opción C):** Se usa `findVersionByProtocolId(protocolId, 1)` (pasando el 1 **explícito**), igual que todos los paths de escritura `/assign`. **Deuda técnica:** toda la asignación (`assign-evaluators.use-case.ts:127-143`, `evaluations.service.ts:856-858`, `EvaluatorAssignmentAdapterService`) está fijada a `numero_version=1`. Si se habilitan evaluaciones de versiones posteriores, escritor y lector deben cambiarse juntos.
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
