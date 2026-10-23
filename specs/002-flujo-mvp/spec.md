# Especificación de Requisitos de Software: Flujo de Asignación y Evaluación CEISH-ESPOCH

**Código de Especificación:** `specs/002-flujo-mvp/spec.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Versión:** 1.1.0  
**Estado:** Aprobado  
**Historial:** 2026-10-10 — alineado con decisiones de Secretaría/Tutor (ver Pendientes por confirmar)

---

## 1. Contexto y Objetivo

### 1.1 Contexto
En el flujo del Comité de Ética en Investigación en Seres Humanos de la ESPOCH (CEISH-ESPOCH), la etapa de evaluación par de protocolos requiere un estricto control de cuotas por perfil profesional, selección aleatoria de evaluadores de riesgo, mecanismos inmutables de reasignación por conflictos de interés o vencimiento, y notificaciones automatizadas con deep-linking.

### 1.2 Objetivo
Definir la especificación completa del módulo de Asignación, Restricción de Cuotas, Reasignación Trazable y Notificación de Evaluadores Pares para garantizar que cada protocolo cuente con 4 evaluadores calificados (uno por perfil) sin alterar la integridad histórica ni los tiempos operativos del proceso.

---

## 2. Usuarios y Roles

| Rol | Descripción | Acciones Principales |
|---|---|---|
| **Secretaria / Presidente CEISH** | Autoridad administrativa y de supervisión operativa. La Secretaría asigna a los 4 evaluadores pares; la Presidencia puede asignar y supervisar. | Asignar la cuota exacta de 4 evaluadores, ejecutar reasignaciones por vencimiento/COI indicando el catálogo de motivo, agendar convocatorias. |
| **Evaluador Par** | Miembro del CEISH pertenecientes a uno de los 4 perfiles (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO`, `SALUD/ETICA`). | Recibir notificaciones con deep-linking, acceder a su panel, descargar expediente, diligenciar el Anexo 9 e Informe Narrativo (y el Anexo 10 si fue seleccionado aleatoriamente). |

---

## 3. Historias de Usuario

### HU-012: Asignación Estricta, Reasignación Inmutable y Evaluación Par
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Matriz de Asignación Estricta de 4 Evaluadores, Seleccionador Aleatorio de Anexo 10 y Reasignación Trazable |
| **ID** | HU-012 |
| **Descripción** | Permite a la Secretaría/Presidente asignar exactamente 4 evaluadores (uno por perfil), selecciona aleatoriamente a 2 (excluyendo a Sociedad Civil) para la Estratificación del Riesgo, gestiona la sustitución de evaluadores sin borrar el historial y garantiza notificaciones por correo con enlaces de acceso directo. |
| **Prioridad** | CRÍTICA |
| **Requisitos origen** | RF-12.1, RF-12.2, RF-12.3, RF-12.4, RF-12.5, RF-12.6 |

#### 2. Pruebas de Aceptación (EARS)
1. **Validación de Cuota Exacta**: **Cuando** la Secretaría asigna evaluadores, **el sistema debe** verificar que la lista contenga exactamente 4 evaluadores con un representante por perfil (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO`, `SALUD`), impidiendo guardar combinaciones duplicadas o incompletas.
2. **Exclusión Aleatoria en Anexo 10**: **Cuando** se confirma la cuota de 4 evaluadores, **el sistema debe** escoger aleatoriamente a 2 evaluadores pertenecientes a `JURIDICO`, `METODOLOGICO` o `SALUD` para llenar el Anexo 10, excluyendo explícitamente a `SOCIEDAD_CIVIL`.
3. **Reasignación Trazable por Motivo**: **Si** un evaluador es sustituido por `VENCIMIENTO` o `CONFLICTO_INTERES`, **el sistema debe** actualizar su estado histórico (`REASIGNADO_VENCIMIENTO` / `REASIGNADO_COI`), filtrar a los candidatos de reemplazo estrictamente por el mismo perfil saliente y aplicar RF-12.7(e) para la fecha de entrega.
4. **Notificación con Deep-Linking**: **Cuando** se formaliza una asignación o reasignación, **el sistema debe** enviar un correo electrónico al evaluador con el código del protocolo, el tiempo mínimo de revisión (`plazo_revision_oficio_dias`) y la indicación de que la fecha de entrega se informará cuando el protocolo se agende en una convocatoria, la indicación explícita de si debe llenar el Anexo 10 y un enlace directo a su panel de evaluación.
5. **Designación de Nivel de Riesgo**: **Cuando** los 2 evaluadores de Anexo 10 envíen propuestas coincidentes, **el sistema debe** designar automáticamente el nivel en el protocolo y liberar los dictámenes de los 4 evaluadores en la misma transacción. **Si** hay discrepancia, el protocolo debe pasar al estado `DISCREPANCIA_RIESGO` y la Secretaría debe poder registrar el nivel acordado en pleno (indicando la convocatoria que incluye este protocolo) para liberar los dictámenes.

---

## 4. Requisitos Funcionales

### RF-12: Matriz de Asignación, Restricción de Cuotas y Reasignación de Evaluadores Pares

- **RF-12.1 (Composición Estricta de Cuota)**: El sistema debe exigir la asignación de exactamente 4 evaluadores pares por protocolo, asignando obligatoriamente 1 miembro por cada uno de los 4 perfiles requeridos: `JURIDICO` (1), `SOCIEDAD_CIVIL` (1), `METODOLOGICO` (1) y `SALUD` / `ETICA` (1).
- **RF-12.2 (Estratificación del Riesgo: Selección Aleatoria, Propuesta y Designación del Nivel)**:

  - **RF-12.2a (Selección aleatoria para Anexo 10)**: Al confirmar la asignación de los 4 evaluadores, el sistema selecciona aleatoriamente 2 (únicamente entre los perfiles `JURIDICO`, `METODOLOGICO` y `SALUD/ETICA`, excluyendo de forma estricta e innegociable a `SOCIEDAD_CIVIL`) para diligenciar el Anexo 10 (Estratificación del Riesgo). *Sin cambio respecto a la versión anterior.*

  - **RF-12.2b (Niveles de riesgo válidos del PET)**: Los únicos niveles de riesgo válidos para la estratificación son los tres definidos en el PET del CEISH-ESPOCH: **Sin riesgo**, **Riesgo mínimo** y **Riesgo mayor al mínimo**. Cualquier otro nivel presente en `catalogos.niveles_riesgo` que no corresponda al PET debe marcarse `activo = false` para que no aparezca en formularios ni sea aceptado por las validaciones del sistema. Los registros inactivos no se borran si tienen filas que los referencian.

  - **RF-12.2c (Auditoría de cada propuesta individual)**: **Cuando** un evaluador de Anexo 10 envíe su propuesta de nivel de riesgo, **el sistema debe** registrar inmediatamente en la bitácora de auditoría del protocolo: identificador del evaluador (userId), nivel propuesto (riskLevelId), número de ronda, timestamp. Este registro es independiente del resultado (acuerdo o discrepancia).

  - **RF-12.2d (Designación automática por acuerdo)**: **Cuando** los 2 evaluadores de Anexo 10 de una misma versión de protocolo hayan enviado sus propuestas vigentes (`isCurrent = true`) y ambas coincidan en el mismo nivel de riesgo, **el sistema debe** en una única transacción atómica:
    1. Fijar `riskLevelId` e `isRiskLevelDesignated = true` en el protocolo.
    2. Derivar y fijar `reviewType` del protocolo a partir del campo `tipo_revision` del nivel designado en `catalogos.niveles_riesgo` (columna confirmada en ORM: `RiskLevelOrmEntity.reviewType` → `tipo_revision`, nullable).
    3. Avanzar el estado del protocolo al código `EN_EVALUACION` (buscado por código, nunca por ID numérico).
    4. Registrar en la bitácora de auditoría del protocolo: origen `SISTEMA`, nivel designado, ronda, timestamp.
    5. Notificar por correo a los 4 evaluadores pares del protocolo que su dictamen ha sido liberado e indicar el tipo de revisión asignado (RF-12.6).

  - **RF-12.2e (Estado de discrepancia)**: **Si** los 2 evaluadores enviaron propuestas vigentes con niveles distintos, **el sistema debe** en una única transacción atómica:
    1. Avanzar el estado del protocolo al código `DISCREPANCIA_RIESGO` (buscado por código, nunca por ID numérico). No modificar `riskLevelId` ni `isRiskLevelDesignated`.
    2. Archivar ambas propuestas de la ronda actual marcando `isCurrent = false` para dejar el historial intacto.
    3. Registrar en la bitácora de auditoría del protocolo: origen `SISTEMA`, niveles propuestos por cada evaluador, ronda, timestamp.
    4. Mantener bloqueado el envío de dictámenes de los 4 evaluadores hasta que la Secretaría registre el nivel acordado en pleno (RF-12.2f).
    5. Notificar por correo a la Secretaría que el protocolo ha entrado en `DISCREPANCIA_RIESGO` y requiere su intervención en pleno (RF-12.6).

  - **RF-12.2f (Designación en pleno por Secretaría)**: **Cuando** el estado del protocolo sea `DISCREPANCIA_RIESGO`, **el sistema debe** permitir a un usuario con rol `SECRETARIA` registrar el nivel de riesgo acordado en la sesión del pleno, aportando obligatoriamente:
    - `riskLevelId`: nivel elegido (debe estar activo en el catálogo).
    - `meetingId`: identificador de la convocatoria que incluya este protocolo. **Si** el protocolo no está asociado a ninguna convocatoria, el sistema responde `409 Conflict`. **Si** la convocatoria indicada no incluye este protocolo, el sistema responde `409 Conflict`.
    Al registrarlo, el sistema aplica los mismos pasos 1–5 de RF-12.2d (designación, reviewType, estado `EN_EVALUACION`, bitácora, notificación a evaluadores), añadiendo el `meetingId` y el `userId` de la Secretaría. **Si** el protocolo no está en `DISCREPANCIA_RIESGO`, el sistema responde `409 Conflict`.

  - **RF-12.2g (Espera de segunda propuesta)**: Mientras solo uno de los 2 evaluadores de Anexo 10 ha enviado su propuesta vigente, el protocolo permanece en su estado actual sin cambios de estado, `riskLevelId` ni `isRiskLevelDesignated`. Los dictámenes de los 4 evaluadores siguen bloqueados.
- **RF-12.3 (Reasignación Inmutable por Vencimiento o COI)**: Si un evaluador es desasignado por vencimiento del plazo (`VENCIMIENTO`) o Conflicto de Interés (`CONFLICTO_INTERES`), el sistema debe conservar inmutable el registro saliente (marcando estado `REASIGNADO_VENCIMIENTO` o `REASIGNADO_COI` con timestamp y motivo) y filtrar obligatoriamente al evaluador reemplazante dentro del mismo perfil estricto (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO` o `SALUD`), aplicando RF-12.7(e) para la fecha de entrega. **Por `VENCIMIENTO`:** se permite proponer al mismo evaluador saliente como reemplazante (tiene prioridad de selección); el cliente puede enviar el mismo `replacementEvaluatorId` que `currentAssignmentId` apunta. **Por `CONFLICTO_INTERES`:** el evaluador saliente queda excluido de la lista de candidatos reemplazantes. — Decisión: reunión 21/10/2026.
- **RF-12.4 (Requisito de Completitud del 100%)**: El sistema debe impedir la emisión de la resolución final si no se cumplen **ambas** condiciones simultáneamente en la versión actual del protocolo (`versionActualId`):

  a. **Nivel designado** (`isRiskLevelDesignated = true`): acuerdo automático (RF-12.2d) o designación en pleno (RF-12.2f). Este campo es la evidencia de que el Anexo 10 fue procesado. Propuestas individuales archivadas (`isCurrent = false`) no invalidan el requisito una vez que el nivel está designado.

  b. **Cuatro dictámenes entregados**: `findActiveAssignmentsByVersionId(versionActualId)` devuelve exactamente 4 asignaciones con `statusId ∈ {SUGGESTED=5, ASSIGNED=6, COMPLETED=7}` y todas en estado `COMPLETED` (statusId=7). Asignaciones con `statusId = REASIGNADO_COI=27` o `REASIGNADO_VENCIMIENTO=26` no cuentan para el cuórum.

  #### Contrato del endpoint `GET /evaluations/completion-status/:protocolId`

  - `protocolId` se recibe como entero vía `ParseIntPipe` en el controlador.
  - El controlador delega a `isCompletion100PercentByProtocolId(protocolId: number)` en `SubmitEvaluationUseCase`. El use case:
    1. Busca el protocolo con `IProtocolRepository.findById(protocolId)`; devuelve `false` si no existe.
    2. Verifica `protocol.isRiskLevelDesignated === true`; devuelve `false` si no.
    3. Verifica `protocol.versionActualId` definido; devuelve `false` si no.
    4. Llama a `evaluationRepository.findActiveAssignmentsByVersionId(protocol.versionActualId)`.
    5. Verifica `length === 4` y `every(a => statusId === COMPLETED)`.
  - `ISubmitEvaluationRepository` expone solo `findActiveAssignmentsByVersionId(versionId: number)`.
  - `IProtocolRepository` se inyecta directamente (ya exportado por `ProtocolsModule`, disponible en `EvaluationsModule` via `forwardRef`).

  #### Llamadores identificados

  | Llamador | Archivo | Línea | Problema | Acción |
  |---|---|---|---|---|
  | `getCompletionStatus` | `evaluations.controller.ts` | 202 | Sin `ParseIntPipe`; pasa `string`; pasaba `protocolId` donde va `versionId` | Corregir: `ParseIntPipe` + `isCompletion100PercentByProtocolId` |
  | Tests de `isCompletion100Percent` | `submit-evaluation.use-case.spec.ts` | 65, 89, 131 | Prueban el método obsoleto | Reescribir con el nuevo método |
  | Pending check en `submitEvaluation` | `evaluations.service.ts` | ~710 | `findAssignmentsByVersionId` incluye `REASIGNADO_COI=27` en `pending`; protocolo nunca avanza a `EVALUADO=14` si hubo COI | Registrado como TSK-002-N34 (no implementar en este PR) |

  #### Bandeja de Resoluciones (`GET /evaluations/evaluators/dashboard`)

  La consulta filtra `isRiskLevelDesignated = true`; esto satisface la condición (a) para listar protocolos candidatos. El frontend habilita el botón de generación de resolución llamando `GET /evaluations/completion-status/:protocolId`; esa respuesta retorna `true` para el protocolo 169 después de implementar TSK-002-N33.
- **RF-12.5 (Continuidad Evaluadora en Versiones Mayores v2.0/v3.0)**: Al resometer una versión mayor tras dictamen de subsanación (`v2.0`), el sistema debe heredar automáticamente la asignación de los 4 evaluadores originales de la versión previa.
- **RF-12.6 (Notificaciones Automatizadas con Deep-Linking)**: El sistema debe notificar inmediatamente por correo al evaluador asignado/reasignado incluyendo el resumen del protocolo, el tiempo mínimo de revisión (`plazo_revision_oficio_dias`) y la indicación de que la fecha de entrega se informará cuando el protocolo se agende en una convocatoria, la indicación explícita sobre el Anexo 10 y enlace directo (deep-linking) a su formulario de evaluación.
- **RF-12.7 (Plazos del Evaluador):**
  - a) Al asignar a un par, el sistema debe registrar la `fecha_asignacion` y NO fijar plazo de entrega al evaluador. La tarea se muestra como "Pendiente de convocatoria" y, como referencia, el `fecha_plazo_normativo` de la versión.
  - b) El plazo del evaluador comienza cuando la Secretaría agrega el protocolo a una convocatoria. En ese momento el sistema debe registrar la `fecha_reunion` y la `fecha_entrega_evaluacion` de esa convocatoria (specs/003 RF-09.1) y usarla como el plazo del evaluador.
  - c) El oficio de asignación informa un tiempo de revisión de `plazo_revision_oficio_dias` días laborables (inicial 8), igual para revisión expedita y en pleno. Es un tiempo mínimo, no una fecha límite. Si la `fecha_reunion` queda a menos de ese número de días laborables de la `fecha_asignacion`, mostrar una advertencia no bloqueante. Fuente: Secretaría (oct 2026).
  - d) Control de protocolos pendientes de convocatoria: el sistema debe listar los protocolos-versión con pares asignados y sin convocatoria, y alertar a la Secretaría (con copia a la Presidencia) cuando: transcurran `dias_max_sin_convocatoria` días laborables (inicial 8) desde la `fecha_asignacion` activa más antigua de esa versión, o el `fecha_plazo_normativo` esté a `dias_alerta_normativo_sin_convocatoria` días o menos. Aplica specs/003 RF-ALR; deja de emitirse al agendar. La reasignación (RF-12.3) no reinicia la antigüedad.
  - e) En una reasignación (RF-12.3): si el motivo es `VENCIMIENTO`, la `fecha_entrega_evaluacion` del reemplazante se fija a `fecha_reasignacion + 24 horas corridas` (independientemente de si el protocolo está o no agendado en convocatoria). Si el motivo es `CONFLICTO_INTERES` u otro, el reemplazante hereda la `fecha_entrega_evaluacion` vigente de la convocatoria; si el protocolo no está agendado, queda "Pendiente de convocatoria". — Decisión: reunión 21/10/2026.
  - **PROPUESTA (22/10/2026) — pendiente de confirmar con Secretaría y Presidencia:** El evaluador solo VE y es NOTIFICADO de los protocolos que le asignaron cuando dichos protocolos ya están incluidos en una convocatoria (fila en `evaluacion.convocatoria_protocolos` con `version_id = versionActualId`). Hasta ese momento la asignación existe en BD pero no es visible ni notificada al evaluador. La Secretaría sigue viendo todas las asignaciones sin ese filtro. La reasignación (`RF-12.3`) notifica de inmediato al evaluador entrante: en `VENCIMIENTO` ya hay fecha (`+24h`); en `CONFLICTO_INTERES`, herencia de convocatoria o "Pendiente de convocatoria". Ver TSK-002-N41..N44.

- **RF-12.8 (Informe Global de Reasignaciones)**: El sistema debe exponer un informe global de reasignaciones que muestre, por evaluador, el conteo de reasignaciones recibidas por motivo `VENCIMIENTO`, filtrable por rango de fechas. El informe debe marcar visualmente (sin sanción, sin bloqueo y sin notificación automática) a los evaluadores que acumulen 3 o más reasignaciones por `VENCIMIENTO`. El informe es accesible para los roles `SECRETARIA` y `PRESIDENTE`. — Decisión: reunión 21/10/2026.

#### Criterios de Aceptación EARS (RF-12)
1. **Criterio EARS (RF-12.1)**: **Cuando** la Secretaría o Presidente asignen evaluadores a un protocolo, **el sistema debe** validar que la lista contenga exactamente 4 evaluadores con la combinación única de perfiles (`1 Jurídico`, `1 Sociedad Civil`, `1 Metodológico`, `1 Salud`), rechazando cualquier duplicidad o asignación incompleta.
2. **Criterio EARS (RF-12.2a — Selección)**: **Cuando** se confirme la asignación de los 4 evaluadores, **el sistema debe** elegir aleatoriamente a 2 evaluadores pertenecientes a los perfiles `JURIDICO`, `METODOLOGICO` o `SALUD` para responder el Anexo 10, excluyendo de forma estricta e innegociable al evaluador con perfil `SOCIEDAD_CIVIL` de dicha estratificación.
2b. **Criterio EARS (RF-12.2b — Niveles válidos)**: **Cuando** un evaluador de Anexo 10 intente enviar su propuesta con un `riskLevelId` cuyo registro en `catalogos.niveles_riesgo` tenga `activo = false`, **el sistema debe** rechazar la solicitud con `400 Bad Request`. Los niveles inactivos no deben aparecer en la lista de opciones ofrecida al evaluador por la API.
2c. **Criterio EARS (RF-12.2c — Auditoría individual)**: **Cuando** un evaluador de Anexo 10 envíe su propuesta de nivel de riesgo, **el sistema debe** crear un registro en la bitácora de auditoría del protocolo con userId, riskLevelId, ronda y timestamp, independientemente del resultado posterior.
2d. **Criterio EARS (RF-12.2d — Designación automática)**: **Cuando** los 2 evaluadores de Anexo 10 envíen propuestas vigentes con el mismo `riskLevelId`, **el sistema debe** en una transacción: fijar `riskLevelId` e `isRiskLevelDesignated = true`, derivar `reviewType` desde `tipo_revision`, avanzar estado a `EN_EVALUACION` (por código), registrar en bitácora con origen `SISTEMA`, y notificar por correo a los 4 evaluadores. El nivel designado debe coincidir exactamente con el propuesto por ambos.
2e. **Criterio EARS (RF-12.2e — Discrepancia)**: **Cuando** los 2 evaluadores de Anexo 10 envíen propuestas vigentes con `riskLevelId` distinto, **el sistema debe** avanzar el estado del protocolo a `DISCREPANCIA_RIESGO` (por código), archivar ambas propuestas (`isCurrent = false`), registrar en la bitácora, notificar a la Secretaría, y no modificar `riskLevelId` ni `isRiskLevelDesignated`. Los dictámenes de los 4 evaluadores quedan bloqueados.
2f. **Criterio EARS (RF-12.2f — Designación en pleno)**: **Cuando** la Secretaría llame al endpoint de designación en pleno sobre un protocolo en estado `DISCREPANCIA_RIESGO` con un `riskLevelId` activo y un `meetingId` que incluya este protocolo, **el sistema debe** responder `200 OK`, aplicar la designación, derivar `reviewType`, avanzar estado a `EN_EVALUACION` (por código), registrar en bitácora con userId y meetingId, y notificar a los 4 evaluadores. **Si** el protocolo no está en `DISCREPANCIA_RIESGO` o la convocatoria no incluye este protocolo, **el sistema debe** responder `409 Conflict`.
2g. **Criterio EARS (RF-12.2g — Espera)**: **Mientras** solo uno de los 2 evaluadores de Anexo 10 haya enviado su propuesta vigente, **el sistema no debe** modificar `riskLevelId`, `isRiskLevelDesignated`, ni el estado del protocolo.
3. **Criterio EARS (RF-12.3 — Reasignación por VENCIMIENTO)**: **Si** se ejecuta la reasignación por `VENCIMIENTO`, **el sistema debe** permitir proponer al mismo evaluador saliente como reemplazante, fijar `fecha_entrega_evaluacion = fecha_reasignacion + 24 horas corridas`, registrar el evento en la bitácora de auditoría sin borrar el registro histórico, y limitar la lista de selección al mismo perfil del evaluador saliente.
3b. **Criterio EARS (RF-12.3 — Reasignación por CONFLICTO_INTERES)**: **Si** se ejecuta la reasignación por `CONFLICTO_INTERES`, **el sistema debe** excluir al evaluador saliente de los candidatos reemplazantes, aplicar la herencia de convocatoria de RF-12.7(e) para la fecha de entrega, registrar el evento en la bitácora de auditoría sin borrar el registro histórico, y limitar la lista de selección al mismo perfil del evaluador saliente.
3c. **Criterio EARS (RF-12.8 — Informe de reasignaciones)**: **Cuando** `SECRETARIA` o `PRESIDENTE` consulten el informe global de reasignaciones con filtro de rango de fechas, **el sistema debe** devolver por evaluador el conteo de reasignaciones recibidas por motivo `VENCIMIENTO`, marcando con indicador visual a los que acumulen ≥ 3, sin aplicar sanción, bloqueo ni notificación automática.
4. **Criterio EARS (RF-12.4)**: **Mientras** `protocol.isRiskLevelDesignated` sea `false` **o** las 4 asignaciones activas de `versionActualId` no estén todas en estado `COMPLETED` (excluyendo `REASIGNADO_COI=27` y `REASIGNADO_VENCIMIENTO=26`), **el sistema debe** retornar `isCompletion100Percent: false` desde `GET /evaluations/completion-status/:protocolId` e impedir la emisión de la resolución final.
5. **Criterio EARS (RF-12.5)**: **Cuando** un protocolo resometido en versión v2.0 ingrese a control, **el sistema debe** vincular automáticamente a los mismos 4 evaluadores asignados en v1.0.
6. **Criterio EARS (RF-12.6)**: **Cuando** un evaluador sea asignado o reasignado, **el sistema debe** despachar un correo con el resumen, la indicación explícita del Anexo 10 y la URL con deep-linking al panel del evaluador.

---

## 5. Requisitos No Funcionales

1. **Usabilidad**: Formulario de asignación intuitivo con indicadores visuales por cada uno de los 4 perfiles obligatorios y mensajes de validación 100% en **Español**.
2. **Auditabilidad e Inmutabilidad**: Registro histórico inalterable de sustituciones con fecha, hora, usuario administrativo y motivo normativo (`VENCIMIENTO` o `CONFLICTO_INTERES`).
3. **Seguridad**: Autenticación RBAC estricta (solo evaluadores asignados pueden ver expedientes confidenciales y subir dictámenes).

---

## 6. Casos Límite y Manejo de Excepciones

- **Evaluadores Insuficientes en un Perfil**: Si la base de datos no cuenta con miembros disponibles en un perfil específico (ej. `JURIDICO`), el sistema rechazará la asignación mostrando una alerta descriptiva a la Secretaría.
- **Resolicitud de Reasignación Concurrente**: Si dos usuarios administrativos intentan reasignar al mismo evaluador simultáneamente, se bloqueará mediante transacción atómica.
- **Propuesta corregida antes de que llegue la segunda (reasignación del par)**: Si uno de los 2 evaluadores de Anexo 10 es reasignado (RF-12.3) después de haber enviado su propuesta vigente pero antes de que el otro par envíe la suya, la propuesta del evaluador saliente queda histórica (`isCurrent = false`). El nuevo evaluador designado para Anexo 10 inicia desde cero. El conteo de "ambos enviaron" aplica exclusivamente sobre las propuestas vigentes actuales (`isCurrent = true`).
- **Reasignación de un evaluador de Anexo 10 cuando el protocolo está en DISCREPANCIA_RIESGO o ya designado**: Si el protocolo ya tiene `isRiskLevelDesignated = true`, una reasignación posterior de uno de los pares de riesgo no revierte la designación. Si el protocolo está en `DISCREPANCIA_RIESGO`, la reasignación no abre una ronda nueva ni cambia el estado: el nivel sigue pendiente de ser decidido en el pleno por la Secretaría (RF-12.2f). RF-12.3 no se modifica en esta tarea.

---

## 7. Fuera de Alcance

1. Firma digital con certificado electrónico en los Informes Narrativos de Evaluadores.
2. Votación automatizada en tiempo real mediante interfaz de videoconferencia.

---

## 8. Criterios de Finalización (Definition of Done)

1. Validación funcional de la cuota exacta de 4 evaluadores (1 Jurídico, 1 Sociedad Civil, 1 Metodológico, 1 Salud).
2. Selección aleatoria de Anexo 10 excluyendo de forma estricta e innegociable al evaluador con perfil SOCIEDAD_CIVIL.
3. Trazabilidad inmutable de reasignaciones por `VENCIMIENTO` o `CONFLICTO_INTERES` aplicando RF-12.7(e) para la fecha de entrega.
4. Notificaciones por correo comprobables con deep-linking directo al panel.
5. Designación automática del nivel de riesgo al recibir las 2 propuestas coincidentes: `isRiskLevelDesignated = true`, `reviewType` derivado del campo `tipo_revision` del catálogo y estado `EN_EVALUACION`. Registro en bitácora con origen `SISTEMA` y notificación por correo a los 4 evaluadores.
6. Endpoint `PATCH /evaluations/protocols/:protocolId/risk-level` (rol `SECRETARIA`) para registrar el nivel acordado en pleno sobre protocolos en estado `DISCREPANCIA_RIESGO`, con `meetingId` obligatorio que incluya el protocolo.
7. Nivel(es) del catálogo que no correspondan al PET marcados `activo = false`. Auditoría de cada propuesta individual (RF-12.2c): userId, riskLevelId, ronda, timestamp — independientemente del resultado.

---

## 9. Dudas Abiertas

- Ver sección Pendientes por confirmar.

---

## 10. Pendientes por confirmar

> **Decisiones tomadas — reunión 21/10/2026 (reasignación):** (1) Motivos admitidos hoy: `VENCIMIENTO` (plazo vencido) y `CONFLICTO_INTERES`; la reasignación por renuncia o salida del comité **no está modelada aún** (pendiente de definición). (2) Por `VENCIMIENTO`, se puede proponer al mismo evaluador saliente; por `CONFLICTO_INTERES`, queda excluido. (3) Plazo del reemplazante por `VENCIMIENTO`: 24 horas corridas desde la reasignación. (4) Formulario: selección de evaluador, motivo, observación libre (`justification`), evidencia PDF opcional; sin botón "recordar" en perfil Secretaría. (5) Informe: por evaluador, conteo `VENCIMIENTO`, filtrable por rango de fechas (ventana de conteo sin definir aún), marca ≥3 (sin sanción, sin bloqueo, sin notificación). (6) Evaluador con plazo vencido: no puede enviar; queda "plazo vencido"; actúa Secretaría. — Modelado en RF-12.3, RF-12.7(e), RF-12.8 y TSK-002-N36..N39.

Pendientes abiertos identificados en la reunión:

- **(i)** Estados de la asignación saliente que permiten reasignar: ¿se puede reasignar una asignación en estado `COMPLETED` (7) o ya `REASIGNADO_VENCIMIENTO` (26) / `REASIGNADO_COI` (27)? Ver TSK-002-N15.
- **(ii)** Motivo para la reasignación por renuncia o salida del comité: no definido; podría ser un tercer motivo diferente a `VENCIMIENTO` y `CONFLICTO_INTERES`.
- **(iii)** Plazo del reemplazante en `CONFLICTO_INTERES` y en el futuro motivo de salida del comité: ¿herencia de convocatoria, un plazo fijo diferente a las 24h, u otro?
- **(iv)** Ventana de conteo para el informe RF-12.8: el filtro es por rango de fechas libre, pero no está definido si hay una ventana rodante implícita (semestral, anual) para decidir si un evaluador tiene ≥3.
- **(v)** Divergencias de RF-12.1 con lo discutido en la reunión (3 evaluadores por protocolo con mínimo parametrizable, revisión en pleno con todos los perfiles, riesgo solo por `METODOLOGICO` y `SALUD`): a tratar en un PR aparte; **no modificar RF-12.1, RF-12.2 ni RF-12.4 hasta ese PR**.

- Entrega del informe: miércoles 12:00 posterior a la sesión (presidenta).
- Documentos faltantes: 30 días, ¿laborables o calendario?
- Tiempo mínimo del oficio: 8 días para expedita y pleno (el SRS v3.2 decía 15).
- `dias_max_sin_convocatoria` (8) y `dias_alerta_normativo_sin_convocatoria`.
- Receso académico: no modelado; ¿suspende el plazo normativo? ¿quién lo cargaría?
- ¿El informe al Ministerio de Salud mide el cumplimiento del plazo normativo al día? De ser así, ¿se requiere precisión exacta?
- Valores de aviso por hito y si la Secretaría quiere resumen diario por correo o solo la vista dentro del sistema.
- Riesgo: lo estratifican 2 de los 4 pares (sociedad civil excluida).
- Riesgo mayor al mínimo: ¿se requieren más de 4 pares (bioética)?
- Prórroga de hasta 30 días del plazo normativo (PET): ¿se modela?
- Informe de inicio: ¿desde la aprobación (Secretaría) o desde el inicio de la ejecución (PET y carta)?
- Situación de un protocolo "No aprobado" (qué pasa después).
- **(vi) [PROPUESTA 22/10/2026 — notificación diferida hasta convocatoria]:** (a) ¿Qué ve el evaluador y qué hace la Secretaría con un protocolo asignado que nunca entra en una convocatoria (por ejemplo, baja del investigador)? (b) La reasignación notifica de inmediato al evaluador entrante; confirmado en RF-12.7(e): en `VENCIMIENTO` hay fecha (`+24h`); en `CONFLICTO_INTERES`, herencia de convocatoria o "Pendiente". (c) ¿Se elimina, conserva o fusiona el correo masivo que `create-meeting.use-case.ts` envía hoy a todos los usuarios con rol `EVALUADOR`/`PRESIDENTE` al crear una convocatoria (`sendCallNotification`)? (d) Definición exacta de "estar en una convocatoria": existe una fila en `evaluacion.convocatoria_protocolos` con `version_id = versionActualId`; ¿basta cualquier `estado` de la convocatoria (`PROGRAMADA`, `EN_CURSO`), o solo `PROGRAMADA`? (e) Si el evaluador accede por URL directa a una asignación cuyo protocolo no está en convocatoria, ¿la API devuelve 403, 404, u oculta solo en la lista sin bloquear el acceso? (f) ¿Las asignaciones ya existentes al activar el cambio se notifican retroactivamente, o solo las nuevas desde la activación?
