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
  - **Hecho cuando:** el evaluador no recibe correo de la asignación inicial si el protocolo no está en convocatoria; al entrar en convocatoria recibe correo individual con fecha límite (emisión DESPUÉS del commit de `saveMeetingWithAtomicNumber`); si ya está en convocatoria al asignar o reasignar, el correo se envía en ese momento; tsc limpio; unit tests y E2E verdes; eslint limpio.

- [ ] **TSK-002-N42** (PENDIENTE — decisión aprobada 23/10/2026): Filtrar `GET /evaluations/my-assignments` y `GET /evaluations/peer-assignments/my-pending` a asignaciones cuyo protocolo está en convocatoria.
  - **Requisito relacionado:** RF-12.7 — APROBADO (23/10/2026), ver `specs/002-flujo-mvp/spec.md`.
  - **PR:** posterior a TSK-002-N41.
  - **Depende de:** TSK-002-N44 (cumplida).
  - **Descripción:** Hoy `getMyAssignments` (`evaluations.service.ts:219`) llama a `findAssignmentsByEvaluatorId` (repo), filtra por `statusId === ASSIGNED`, y no hace JOIN con `evaluacion.convocatoria_protocolos`. `getMyPendingPeerAssignments` (`evaluations.service.ts:1005`) usa `TypeORM.find` con `evaluatorId`, `isAssignedForAnnex10: true`, `statusId: In([ASSIGNED, SUGGESTED])`, sin join con convocatorias. La propuesta añade a ambas consultas un JOIN (o subquery) con `evaluacion.convocatoria_protocolos` filtrando `version_id = asignacion.version_id`. La Secretaría usa `GET /evaluations/protocol/:protocolId/active-assignments` (`GetActiveAssignmentsUseCase`) para ver todas las asignaciones — ese endpoint **no se modifica**. (d) propuesta por defecto, pendiente de confirmar (ver spec.md sección 10 (vi)): basta cualquier fila en `convocatoria_protocolos` sin filtrar por estado; (e) N43 implementa `403 Forbidden` como decisión por defecto (ver spec.md sección 10 (vi)(e)).
  - **Pruebas afectadas:**
    - `src/modules/evaluations/application/services/evaluations-urgency.service.spec.ts` líneas 109, 122, 134, 148, 234 (unit — `getMyAssignments`): los mocks del repositorio necesitarán incluir el join de convocatoria.
    - `test/real-db-evaluations.e2e-spec.ts` líneas 764, 776 (E2E — `GET /api/evaluations/peer-assignments/my-pending`): los protocolos sembrados en esos tests deberán estar en una convocatoria para que aparezcan, o los tests deben adaptarse.
    - `test/evaluations-contract.e2e-spec.ts` líneas 837–845 (E2E — `peer-assignments/my-pending`, solo comprueba autenticación; probablemente no se ve afectado).
  - **Archivos afectados:**
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: `findAssignmentsByEvaluatorId` para añadir JOIN con `convocatoria_protocolos`.
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: `getMyPendingPeerAssignments` para añadir filtro de convocatoria.
    - `src/modules/evaluations/application/services/evaluations-urgency.service.spec.ts` — MODIFICAR: actualizar mocks.
    - `test/real-db-evaluations.e2e-spec.ts` — MODIFICAR: adaptar tests de `peer-assignments/my-pending`.
  - **Hecho cuando:** `my-assignments` y `peer-assignments/my-pending` solo devuelven asignaciones cuyo protocolo-versión está en convocatoria (cualquier estado); `active-assignments` no se ve afectado; tsc limpio; tests verdes; eslint limpio.

- [ ] **TSK-002-N43** (PENDIENTE — decisión aprobada 23/10/2026): Comprobar que el protocolo de la asignación está en convocatoria en los endpoints donde el evaluador abre, evalúa o entrega.
  - **Requisito relacionado:** RF-12.7 — APROBADO (23/10/2026), ver `specs/002-flujo-mvp/spec.md`.
  - **PR:** posterior a TSK-002-N42.
  - **Descripción:** Hoy los endpoints de entrega e inspección de una asignación solo validan propiedad (`assignment.evaluatorId !== evaluatorId`) y estado (`statusId`). La propuesta añade una comprobación de convocatoria en: `POST /evaluations/submit` (`submitEvaluation`, `evaluations.service.ts:269`); `GET /evaluations/:id/checklist-details` (`getEvaluationChecklistDetails`, `evaluations.service.ts`); `GET /evaluations/:id/document` (`getEvaluationDocumentUrl`); `GET /evaluations/:id/document/docx` (`getEvaluationDocxUrl`). El código de respuesta por defecto es **403 Forbidden** con el mensaje "el protocolo aún no está en una convocatoria" — decisión por defecto 23/10/2026, pendiente de confirmar con Secretaría (ver spec.md sección 10 (vi)(e)).
  - **Archivos afectados:**
    - `src/modules/evaluations/application/services/evaluations.service.ts` — MODIFICAR: añadir guard en los métodos listados.
    - `src/modules/evaluations/infrastructure/repositories/evaluation.typeorm.repository.ts` — MODIFICAR: añadir método que compruebe si una asignación está en convocatoria.
    - `src/modules/evaluations/domain/ports/evaluation.repository.port.ts` — MODIFICAR: declarar el método nuevo.
    - Archivos de test unitarios de los use cases afectados — MODIFICAR: añadir casos.
  - **Hecho cuando:** endpoints rechazan con `403 Forbidden` y mensaje "el protocolo aún no está en una convocatoria" el acceso a asignaciones cuyo protocolo no está en convocatoria; tsc limpio; tests verdes; eslint limpio.

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
