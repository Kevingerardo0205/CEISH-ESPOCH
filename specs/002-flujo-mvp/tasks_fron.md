# Plan de Tareas Frontend: Flujo 002 - Asignación y Evaluación Par

**Código de Especificación Activa:** `specs/002-flujo-mvp/spec.md` (v1.1.0)  
**Ubicación del Plan:** `specs/002-flujo-mvp/plan.md`  
**Ubicación de Tareas Frontend:** `specs/002-flujo-mvp/tasks_fron.md`  
**Estimación por Tarea:** Máximo 20-30 minutos por tarea.

---

## 📋 Lista de Tareas Frontend por Módulo y Orden de Dependencia

### 1. Tipos, Modelos y Servicios API (`src/types`, `src/services`)

- [ ] **TSK-002-FE-01**: Definir los tipos, interfaces y enums del módulo de evaluaciones en el frontend.
  - **Requisitos cubiertos:** `RF-12.1`, `RF-12.2`, `RF-12.3`
  - **Hecho cuando:** Se exporten los enums (`EvaluatorProfile`, `AssignmentStatus`, `ReassignmentReason`) e interfaces (`EvaluatorAssignment`, `ReassignmentHistory`, `AssignEvaluatorsPayload`, `ReassignEvaluatorPayload`) en `src/types/evaluations.types.ts`.

- [ ] **TSK-002-FE-02**: Implementar el servicio cliente HTTP `evaluationService`.
  - **Requisitos cubiertos:** `RF-12.1`, `RF-12.2`, `RF-12.3`, `RF-12.4`, `RF-12.6`
  - **Hecho cuando:** El servicio consuma los endpoints de la API (`assignEvaluators`, `reassignEvaluator`, `getProtocolAssignments`, `submitEvaluation`, `getEvaluationPanel`) devolviendo respuestas tipadas.

---

### 2. Componentes de Gestión Administrativa (Secretaría / Presidente) (`src/components/evaluations`)

- [ ] **TSK-002-FE-03**: Crear el componente `EvaluatorQuotaForm` para la selección de 4 evaluadores.
  - **Requisitos cubiertos:** `RF-12.1`
  - **Hecho cuando:** El formulario contenga 4 selectores visuales etiquetados por perfil (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO`, `SALUD`), impidiendo el envío si falta un perfil o si hay duplicados, mostrando mensajes de error en español.

- [ ] **TSK-002-FE-04**: Crear el modal `ReassignEvaluatorModal` para sustitución por vencimiento o COI.
  - **Requisitos cubiertos:** `RF-12.3`
  - **Hecho cuando:** El modal permita seleccionar el motivo (`VENCIMIENTO` o `CONFLICTO_INTERES`), justificación, y filtre la lista de candidatos de reemplazo estrictamente al mismo perfil del evaluador saliente.

- [ ] **TSK-002-FE-05**: Crear el componente `ReassignmentAuditHistoryTable` para visualizar la bitácora inmutable.
  - **Requisitos cubiertos:** `RF-12.3`
  - **Hecho cuando:** Se renderice una tabla con las sustituciones históricas mostrando evaluador previo, motivo, nuevo evaluador, usuario que ejecutó la acción y fecha/hora exacta.

- [ ] **TSK-002-FE-06**: Crear la vista administrativa `ProtocolAssignmentPage` de gestión de cuota.
  - **Requisitos cubiertos:** `RF-12.1`, `RF-12.2`, `RF-12.4`
  - **Hecho cuando:** Muestre el resumen del protocolo, las 4 tarjetas de evaluadores activos, badges indicando los 2 elegidos aleatoriamente para el Anexo 10 (excluyendo a Sociedad Civil) y el indicador de completitud del 100%.

---

### 3. Panel de Evaluador Par y Formularios (`src/pages/evaluations`, `src/components/evaluations`)

- [ ] **TSK-002-FE-07**: Implementar la vista y ruta del panel de evaluador par (`EvaluatorPanelPage`) accesible mediante Deep-Linking.
  - **Requisitos cubiertos:** `RF-12.2`, `RF-12.6`
  - **Hecho cuando:** La ruta `/evaluations/:assignmentId/panel` cargue el resumen del protocolo asignado, contador regresivo de fecha límite, enlace de descarga de expediente y la indicación clara sobre el Anexo 10.

- [ ] **TSK-002-FE-08**: Crear el componente `Annex9Form` para registro de dictamen e Informe Narrativo.
  - **Requisitos cubiertos:** `RF-12.4`
  - **Hecho cuando:** Permita seleccionar la decisión (Aprobado, Subsanar, Rechazado) y adjuntar el archivo PDF del Informe Narrativo con validación de tipo y tamaño.

- [ ] **TSK-002-FE-09**: Crear el componente `Annex10Form` para la Estratificación del Riesgo.
  - **Requisitos cubiertos:** `RF-12.2`, `RF-12.4`
  - **Hecho cuando:** Sea visible únicamente para los evaluadores con `isAssignedForAnnex10: true`, permitiendo calificar los ítems de riesgo e integrándose en la entrega final del evaluador.

- [ ] **TSK-002-FE-10**: Implementar el componente `FinalResolutionGuard` y control de completitud del 100%.
  - **Requisitos cubiertos:** `RF-12.4`
  - **Hecho cuando:** El botón de "Emitir Resolución Final" permanezca deshabilitado con un tooltip indicativo hasta que los 4 evaluadores hayan entregado el 100% de sus dictámenes e informes.

---

### 4. Pruebas y Verificación (`src/__tests__`)

- [ ] **TSK-002-FE-11**: Implementar pruebas unitarias e integración de componentes frontend con React Testing Library / Jest.
  - **Requisitos cubiertos:** `RF-12.1`, `RF-12.2`, `RF-12.3`, `RF-12.4`
  - **Hecho cuando:** `npm run test` valide en el frontend la restricción de cuota en el formulario, el filtrado estricto por perfil en la reasignación, la renderización condicional del Anexo 10 y el bloqueo del botón de resolución final.

---

### 5. Campos de Estado de Convocatoria (PR-B2)

- [ ] **TSK-002-FE-12**: Mostrar `assignedAt` y `estadoConvocatoria` en el panel de asignaciones; manejar `deadline` nulo.
  - **Requisitos cubiertos:** `RF-12.7(a)`, `RF-12.7(b)`
  - **PR:** PR-B2 (`feat/assignment-without-deadline`)
  - **Framework:** Angular 20 (repo del frontend separado del backend)
  - **Archivos afectados:** pendiente de verificar en el repo del frontend
  - **Dependencias:** TSK-002-N04 (backend expone los nuevos campos)
  - **Descripción:** El backend (TSK-002-N04) añade `assignedAt` y `estadoConvocatoria` al response de asignaciones. El frontend Angular debe: (i) mostrar la fecha de asignación (`assignedAt`) en la tarjeta del evaluador; (ii) mostrar el badge "Pendiente de convocatoria" cuando `estadoConvocatoria === 'Pendiente de convocatoria'` (= `deadline === null`); (iii) mostrar la fecha límite de entrega solo cuando `estadoConvocatoria === 'Con plazo asignado'`; (iv) el contador regresivo del panel del evaluador (equivalente a TSK-002-FE-07) debe estar deshabilitado/ocultado cuando `deadline === null`.
  - **Hecho cuando:** El panel del evaluador muestra "Pendiente de convocatoria" para asignaciones sin fecha de entrega, y el contador regresivo aparece solo cuando `deadline !== null`; prueba unitaria Angular (Karma/Jasmine o Jest si está configurado) cubre ambos estados.
