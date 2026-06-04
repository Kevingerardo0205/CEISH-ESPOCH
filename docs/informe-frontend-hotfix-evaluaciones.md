# 📋 Informe Backend → Frontend: Hotfix Evaluaciones

**Fecha:** 2026-06-01  
**Módulo:** Evaluaciones (`/api/evaluations`)  
**Severidad:** 🔴 Crítica — Rompe la cadena completa de evaluación ética  
**Estado:** ✅ Corregido y compilado exitosamente  
**Archivos modificados:**
- `src/modules/evaluations/application/services/evaluations.service.ts`
- `src/modules/evaluations/infrastructure/controllers/evaluations.controller.ts`

---

## 1. ¿Qué se rompió y por qué?

El endpoint `POST /api/evaluations/protocols/:id/assign-peer-evaluators` (usado por **Secretaría** para asignar evaluadores a un protocolo) tenía un bug crítico:

> **Solo creaba registros en la tabla `asignaciones_pares_riesgo` (los 2 evaluadores aleatorios para estratificación de riesgo), pero NUNCA creaba registros en `asignaciones_evaluacion` para los 4+ evaluadores que deben hacer la evaluación ética completa.**

### 1.1 Consecuencias directas en el Frontend

| Componente Frontend afectado | Síntoma visible |
|------------------------------|-----------------|
| Panel evaluador → "Mis Asignaciones" | `GET /my-assignments` devolvía **array vacío** |
| Formulario de dictamen ético | `POST /submit` fallaba con **404** (no existía `assignmentId`) |
| Dashboard Presidenta → Carga | `currentLoad` mostraba **0** para todos los evaluadores |
| Consolidación Anexo 12 | Sin datos para consolidar |
| Estado del protocolo | Nunca pasaba a **"EN EVALUACIÓN"** |

### 1.2 Tablas involucradas

```
┌─────────────────────────────────┐       ┌──────────────────────────────────┐
│  asignaciones_pares_riesgo      │       │  asignaciones_evaluacion         │
│  (evaluacion schema)            │       │  (evaluacion schema)             │
├─────────────────────────────────┤       ├──────────────────────────────────┤
│  id                             │       │  id                              │
│  protocolo_id  → protocolos     │       │  version_id → versiones_proto..  │
│  evaluador_id  → usuarios       │       │  evaluador_id → usuarios         │
│  nivel_riesgo_propuesto_id      │       │  perfil_id → perfiles_evaluador  │
│  observaciones                  │       │  modalidad_id                    │
│  fecha_asignacion               │       │  estado_id → estados             │
│  fecha_envio                    │       │  fecha_limite                    │
│                                 │       │  fecha_asignacion                │
│  ✅ SÍ se llenaba (2 registros) │       │  asignado_por → usuarios         │
│                                 │       │                                  │
│                                 │       │  ❌ NO se llenaba (0 registros)  │
└─────────────────────────────────┘       └──────────────────────────────────┘
```

---

## 2. ¿Qué se corrigió?

Se aplicaron **3 correcciones** al backend.

### 2.1 Corrección Principal — Crear asignaciones de evaluación

El método `assignPeerEvaluators()` ahora ejecuta **5 pasos** en vez de solo guardar pares de riesgo:

```
ANTES (roto):
  Secretaría llama POST → se guardan 2 en asignaciones_pares_riesgo → FIN
                           (asignaciones_evaluacion queda VACÍA)

AHORA (corregido):
  Secretaría llama POST →
    PASO 1: Buscar/crear registro en versiones_protocolo (FK requerida)
    PASO 2: Limpiar asignaciones previas si es re-asignación
    PASO 3: Guardar 2 aleatorios en asignaciones_pares_riesgo
    PASO 4: ✨ Guardar N asignaciones en asignaciones_evaluacion (TODOS)
    PASO 5: Protocolo pasa a estado "EN EVALUACIÓN" (statusId: 2)
```

**Detalle del PASO 4** — Para cada uno de los N evaluadores enviados:
- `version_id` → versión del protocolo (creada en paso 1)
- `evaluador_id` → ID del evaluador
- `estado_id` → `ASSIGNED` (2) — van directo a asignado
- `fecha_limite` → calculada según tipo de revisión (PLENO / EXPEDITA / ENSAYO CLÍNICO)
- `asignado_por` → ID del usuario de Secretaría que hizo la asignación

### 2.2 Corrección Secundaria — Trazabilidad (`asignado_por`)

**Antes:** El controlador no pasaba `req.user.id` al servicio → el campo `asignado_por` quedaba `NULL`.

```typescript
// ANTES (sin trazabilidad):
async assignPeerEvaluators(@Param('id') id, @Body() dto) {
  return this.evaluationsService.assignPeerEvaluators(id, dto);
}

// AHORA (con trazabilidad):
async assignPeerEvaluators(@Param('id') id, @Body() dto, @Request() req) {
  return this.evaluationsService.assignPeerEvaluators(id, dto, req.user.id);
}
```

### 2.3 Corrección Menor — Swagger actualizado

La documentación en `/docs` ahora dice correctamente:

| | Texto |
|---|---|
| **Antes** ❌ | *"Secretaría asigna exactamente 2 evaluadores pares a un protocolo"* |
| **Ahora** ✅ | *"Secretaría asigna evaluadores al protocolo (mínimo 4). 2 aleatorios para riesgo + todos para evaluación ética."* |

---

## 3. Cambios en el Contrato de Respuesta

### Endpoint afectado

```
POST /api/evaluations/protocols/:id/assign-peer-evaluators
```

> ⚠️ **La respuesta ahora incluye 2 campos nuevos: `versionId` y `evaluationAssignmentIds`.**  
> El body del request NO cambió. Los campos existentes de la respuesta NO se eliminaron.

### 3.1 Request (sin cambios)

```http
POST /api/evaluations/protocols/42/assign-peer-evaluators
Authorization: Bearer <jwt_secretaria>
Content-Type: application/json

{
  "evaluatorIds": [3, 4, 7, 12, 15]
}
```

### 3.2 Response — ANTES (incompleta) ❌

```json
{
  "message": "5 evaluadores asignados exitosamente al protocolo.",
  "totalEvaluators": 5,
  "riskEvaluators": [7, 3],
  "allEvaluators": [3, 4, 7, 12, 15],
  "deadline": "2026-06-20T00:00:00.000Z"
}
```

### 3.3 Response — AHORA (completa) ✅

```json
{
  "message": "5 evaluadores asignados exitosamente al protocolo.",
  "totalEvaluators": 5,
  "riskEvaluators": [7, 3],
  "allEvaluators": [3, 4, 7, 12, 15],
  "versionId": 1,
  "evaluationAssignmentIds": [101, 102, 103, 104, 105],
  "deadline": "2026-06-20T00:00:00.000Z"
}
```

### 3.4 Descripción de campos nuevos

| Campo nuevo | Tipo | Descripción |
|-------------|------|-------------|
| `versionId` | `number` | ID del registro en `versiones_protocolo`. Referencia interna que vincula las asignaciones de evaluación con el protocolo. |
| `evaluationAssignmentIds` | `number[]` | IDs de los registros creados en `asignaciones_evaluacion`. Cada ID corresponde positionally al evaluador en `allEvaluators`. |

### 3.5 Interfaces TypeScript para el Frontend

```typescript
// --- Request ---
interface AssignPeerEvaluatorsRequest {
  evaluatorIds: number[];  // Mínimo 4 IDs, sin duplicados
}

// --- Response ---
interface AssignPeerEvaluatorsResponse {
  message: string;                    // "5 evaluadores asignados exitosamente..."
  totalEvaluators: number;            // Cantidad total asignada
  riskEvaluators: number[];           // 2 IDs aleatorios seleccionados para riesgo
  allEvaluators: number[];            // Todos los IDs enviados en el request
  versionId: number;                  // 🆕 ID de versiones_protocolo
  evaluationAssignmentIds: number[];  // 🆕 IDs de asignaciones_evaluacion creadas
  deadline: string;                   // Fecha límite en formato ISO 8601
}
```

---

## 4. Validaciones y Errores HTTP

El endpoint realiza las siguientes validaciones. El frontend debería manejar estos códigos de error:

| Código HTTP | Condición | Mensaje del Backend |
|-------------|-----------|---------------------|
| `400` | Menos de 4 evaluadores | `"Debe asignar un mínimo de 4 evaluadores. Se recibieron X."` |
| `400` | IDs duplicados | `"No se permiten evaluadores duplicados en la asignación."` |
| `400` | Protocolo no en estado COMPLETO | `"El protocolo debe estar en estado COMPLETO de recepción."` |
| `400` | Investigador no aceptó términos | `"El investigador principal debe aceptar el sometimiento a los tiempos y reglamentos del comité antes de asignar evaluadores."` |
| `400` | Riesgo ya fue designado | `"El nivel de riesgo de este protocolo ya fue designado y confirmado."` |
| `404` | Protocolo inexistente | `"Protocolo X no encontrado"` |
| `409` | Conflicto de interés crítico | `"Conflicto Ético Crítico con el Evaluador X: [razón]"` |

---

## 5. Flujo Completo de Evaluación (8 pasos)

A continuación el flujo end-to-end con los endpoints involucrados:

```
╔══════════════════════════════════════════════════════════════════════╗
║                    FASE 1: ASIGNACIÓN (Secretaría)                 ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  PASO 1 → GET /api/evaluations/protocols/pending-peer-assignment   ║
║           Obtener protocolos con recepción COMPLETA                ║
║                                                                    ║
║  PASO 2 → GET /api/evaluations/evaluators/active                   ║
║           Obtener lista de evaluadores disponibles                 ║
║                                                                    ║
║  PASO 3 → POST /api/evaluations/protocols/:id/assign-peer-eval... ║
║           Asignar mín. 4 evaluadores ← ENDPOINT CORREGIDO ✅      ║
║           Body: { "evaluatorIds": [3, 4, 7, 12, 15] }             ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║              FASE 2: ESTRATIFICACIÓN DE RIESGO (2 Evaluadores)     ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  PASO 4 → GET /api/evaluations/peer-assignments/my-pending         ║
║           El evaluador ve si fue seleccionado para riesgo          ║
║                                                                    ║
║  PASO 5 → POST /api/evaluations/peer-assignments/:id/submit-risk   ║
║           Envía propuesta de nivel de riesgo                       ║
║           Body: { "riskLevelId": 5, "observations": "..." }        ║
║           → Cuando ambos envían, el backend consolida el riesgo    ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║            FASE 3: EVALUACIÓN ÉTICA (Todos los Evaluadores)        ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  PASO 6 → GET /api/evaluations/my-assignments                      ║
║           El evaluador ve sus protocolos asignados                 ║
║           ✅ AHORA DEVUELVE DATOS (antes devolvía array vacío)     ║
║                                                                    ║
║  PASO 7 → POST /api/evaluations/submit                             ║
║           Envía dictamen ético (Anexo 9, 10 u 11 según tipo)      ║
║           ✅ AHORA FUNCIONA (antes no había assignmentId)          ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║              FASE 4: CONSOLIDACIÓN (Presidenta)                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  PASO 8 → GET /api/evaluations/consolidate/:protocolId             ║
║           Genera informe consolidado (Anexo 12)                    ║
║           ✅ AHORA TIENE DATOS PARA CONSOLIDAR                    ║
║                                                                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 6. Modelo de Estados del Protocolo

```
 ┌──────────┐    Secretaría completa    ┌──────────┐    assign-peer-     ┌────────────────┐
 │ RECEPCIÓN│ ─────recepción──────────→ │ COMPLETO │ ──evaluators──────→ │ EN EVALUACIÓN  │
 │ (id: 1)  │                           │          │    (PASO 3)         │ (id: 2)  ✨    │
 └──────────┘                           └──────────┘                     └───────┬────────┘
                                                                                 │
                                                                    Todos envían │
                                                                    dictamen     │
                                                                                 ▼
                                        ┌──────────┐                 ┌───────────────────┐
                                        │ RESUELTO │ ←── Presidenta  │    EVALUADO       │
                                        │ (id: 4)  │     resuelve    │    (id: 3)        │
                                        └──────────┘                 └───────────────────┘
```

**Transición clave corregida:**  
`COMPLETO → EN EVALUACIÓN` ahora ocurre automáticamente al llamar `assign-peer-evaluators`.

---

## 7. Referencia Completa de Endpoints del Módulo

> Todos los endpoints requieren `Authorization: Bearer <token>` y están bajo el prefijo `/api/evaluations`.

### 7.1 Endpoints de Asignación (Secretaría / Presidenta)

| # | Método | Ruta | Permiso Requerido | Rol | Descripción |
|---|--------|------|-------------------|-----|-------------|
| 1 | `GET` | `/protocols/pending-peer-assignment` | `EVALUATORS_ASSIGN` | Secretaría | Protocolos pendientes de asignar pares |
| 2 | `GET` | `/evaluators/active` | `EVALUATORS_ASSIGN` ó `EVALUATORS_SUGGEST` | Secretaría / Presidenta | Lista de evaluadores activos (id, nombre, email) |
| 3 | `POST` | `/protocols/:id/assign-peer-evaluators` | `EVALUATORS_ASSIGN` | Secretaría | **✅ CORREGIDO** — Asignar mín. 4 evaluadores |
| 4 | `GET` | `/evaluators/dashboard` | `EVALUATORS_WORKLOAD_VIEW` | Presidenta | Dashboard de carga de trabajo |
| 5 | `POST` | `/suggest` | `EVALUATORS_SUGGEST` | Presidenta | Sugerir evaluadores a un protocolo |
| 6 | `GET` | `/pending-suggestions` | `EVALUATORS_ASSIGN` | Secretaría | Sugerencias pendientes de confirmar |
| 7 | `PATCH` | `/confirm-assignment` | `EVALUATORS_ASSIGN` | Secretaría | Confirmar sugerencias de Presidenta |
| 8 | `DELETE` | `/reject-suggestion/:id` | `EVALUATORS_ASSIGN` | Secretaría | Rechazar sugerencia |

### 7.2 Endpoints de Evaluación (Evaluador)

| # | Método | Ruta | Permiso Requerido | Descripción |
|---|--------|------|-------------------|-------------|
| 9 | `GET` | `/peer-assignments/my-pending` | `EVALUATION_VIEW_MINE` | Mis asignaciones de riesgo pendientes |
| 10 | `POST` | `/peer-assignments/:id/submit-risk` | `EVALUATION_FILL` | Enviar nivel de riesgo propuesto |
| 11 | `GET` | `/my-assignments` | `EVALUATION_VIEW_MINE` | Mis protocolos asignados para evaluación ética |
| 12 | `POST` | `/submit` | `EVALUATION_FILL` | Enviar dictamen ético final (Anexo 9/10/11) |

### 7.3 Endpoints de Consolidación y Perfiles

| # | Método | Ruta | Permiso Requerido | Descripción |
|---|--------|------|-------------------|-------------|
| 13 | `GET` | `/consolidate/:protocolId` | `EVALUACION_INFORMES` | Consolidar evaluaciones (Anexo 12) |
| 14 | `GET` | `/profiles` | *Solo autenticado* | Listar perfiles de evaluadores |
| 15 | `POST` | `/profiles` | `PERMISSIONS_MANAGE` | Crear perfil de evaluador |
| 16 | `PATCH` | `/profiles/:id` | `PERMISSIONS_MANAGE` | Actualizar perfil |
| 17 | `DELETE` | `/profiles/:id` | `PERMISSIONS_MANAGE` | Eliminar perfil (soft-delete) |

---

## 8. Detalle de Endpoints Clave para el Frontend

### 8.1 `GET /my-assignments` — Mis protocolos asignados

**Rol:** Evaluador  
**Ahora funcional** gracias al hotfix.

**Response:**
```json
[
  {
    "id": 101,
    "versionId": 1,
    "evaluatorId": 3,
    "statusId": 2,
    "deadline": "2026-06-20",
    "assignedAt": "2026-06-01T22:50:00.000Z",
    "version": {
      "id": 1,
      "protocolId": 42,
      "protocol": {
        "id": 42,
        "ceishCode": "CEISH-2026-042",
        "title": "Estudio sobre...",
        "reviewType": "PLENO"
      }
    },
    "isUrgent": false,
    "daysRemaining": 19,
    "annexToUse": "Anexo 10 (Revisión Plena)"
  }
]
```

**Campos importantes para la UI:**
- `annexToUse`: Indica qué formulario mostrar (Anexo 9, 10 u 11)
- `isUrgent`: `true` si faltan ≤ 2 días → mostrar alerta visual
- `daysRemaining`: Días restantes para el deadline

### 8.2 `POST /submit` — Enviar dictamen ético

**Rol:** Evaluador  
**Requiere:** `assignmentId` obtenido de `GET /my-assignments`

**Request según tipo de revisión:**

#### Para Revisión Expedita (Anexo 9):
```json
{
  "assignmentId": 101,
  "annex9": {
    "eticaResult": "FAVORABLE",
    "eticaPlazo": "30 días",
    "metodologiaResult": "FAVORABLE",
    "metodologiaPlazo": "30 días",
    "juridicaResult": "FAVORABLE",
    "juridicaPlazo": "30 días"
  },
  "result": "APROBADO",
  "observations": "El protocolo cumple con los estándares éticos."
}
```

#### Para Revisión en Pleno (Anexo 10):
```json
{
  "assignmentId": 101,
  "annex10": {
    "resultado": "APROBADO",
    "condicionesDescripcion": "Sin condiciones"
  },
  "result": "APROBADO",
  "observations": "Aprobado sin observaciones."
}
```

#### Para Ensayos Clínicos (Anexo 11):
```json
{
  "assignmentId": 101,
  "annex11": {
    "resultado": "APROBADO",
    "fechaEvaluacion": "2026-06-01"
  },
  "result": "APROBADO"
}
```

**Valores posibles de `result`:**
| Valor | Descripción |
|-------|-------------|
| `APROBADO` | Protocolo aprobado sin observaciones |
| `APROBADO_CON_OBSERVACIONES` | Aprobado con condiciones |
| `RECHAZADO` | No aprobado |
| `PENDIENTE_SUBSANACION` | Requiere correcciones del investigador |

> **Nota:** Si `result` ≠ `APROBADO`, el campo `reportPath` (ruta al PDF consolidado) es **obligatorio**.

### 8.3 `POST /peer-assignments/:id/submit-risk` — Enviar riesgo

**Rol:** Evaluador (solo los 2 seleccionados aleatoriamente)

**Request:**
```json
{
  "riskLevelId": 5,
  "observations": "Se detecta uso de datos sensibles en la metodología."
}
```

**Niveles de riesgo disponibles (catálogo):**

| ID | Código | Tipo Revisión |
|----|--------|---------------|
| 4 | `SIN_RIESGO` | EXPEDITA |
| 5 | `RIESGO_MINIMO` | EXPEDITA |
| 6 | `RIESGO_MODERADO` | PLENO |
| 7 | `RIESGO_MAYOR` | PLENO |
| 8 | `ENSAYO_CLINICO` | ENSAYO_CLINICO |

---

## 9. Acciones Requeridas del Equipo Frontend

### ✅ No requiere cambios (retrocompatible)

- El **body del request** de `assign-peer-evaluators` no cambió
- Los campos existentes en la respuesta no cambiaron ni se eliminaron
- Los demás endpoints no fueron modificados
- No se cambió ninguna ruta ni método HTTP

### 📌 Cambios opcionales recomendados

| # | Acción | Prioridad | Detalle |
|---|--------|-----------|---------|
| 1 | Mostrar confirmación mejorada | Baja | Usar `evaluationAssignmentIds` en el toast/modal de éxito |
| 2 | Badge de riesgo | Baja | Marcar visualmente los 2 evaluadores de `riskEvaluators` en la lista |
| 3 | Validación en frontend | Media | Deshabilitar botón "Asignar" si `evaluatorIds.length < 4` |
| 4 | Probar "Mis Asignaciones" | **Alta** | `GET /my-assignments` ahora devuelve datos reales. Verificar que la vista del evaluador los renderiza correctamente |
| 5 | Probar envío de dictamen | **Alta** | `POST /submit` ahora funciona. Verificar el formulario de Anexos |

### ⚠️ Puntos de atención

1. **Re-asignación es segura:** Si Secretaría llama `assign-peer-evaluators` dos veces para el mismo protocolo, el backend limpia las asignaciones anteriores (SUGGESTED o ASSIGNED) y crea nuevas. No se duplican.

2. **Estado automático:** Al asignar evaluadores, el protocolo pasa automáticamente a `EN EVALUACIÓN` (statusId: 2). No es necesario un endpoint separado.

3. **Deadline por tipo de revisión:** El backend calcula el deadline automáticamente según el `reviewType` del protocolo. No se envía desde el frontend.

---

## 10. Documentación Swagger

La documentación interactiva actualizada está disponible en:

```
http://localhost:3002/docs
```

Buscar el tag **`evaluations`** para ver todos los endpoints con sus schemas actualizados.

---

*Informe generado el 2026-06-01. Contactar al equipo backend para cualquier duda sobre los contratos.*
