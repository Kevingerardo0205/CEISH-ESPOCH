# Plan de Tareas de Implementación: CEISH-ESPOCH Backend (RF-12 a RF-19)

**Código de Especificación Activa:** `specs/001-flujo-mvp/spec.md` (v3.2.0)  
**Ubicación de Plan:** `specs/001-flujo-mvp/plan.md`  
**Ubicación de Tareas:** `specs/001-flujo-mvp/tasks.md`  
**Alcance Solicitado:** Tareas de granularidad fina (20-30 min) desde el **Requerimiento Funcional 12 en adelante** (`RF-12` a `RF-19`).

---

## 📋 Lista de Tareas por Módulo y Orden de Dependencia

### Módulo: Evaluaciones y Cuotas por Perfil (`evaluations`)

- [ ] **TSK-12.1**: Implementar la entidad y DTO para asignación de evaluadores con su rol/perfil profesional (`ETICA_METODOLOGICO_SALUD`, `JURIDICO`, `SOCIEDAD_CIVIL`).
  - **Requisitos cubiertos:** `RF-12.1`
  - **Hecho cuando:** La entidad `EvaluationAssignmentOrmEntity` almacena `evaluatorRole` y las validaciones DTO rechazan roles inválidos.

- [ ] **TSK-12.2**: Implementar el servicio de dominio `QuotaValidatorService` para verificar cuotas de evaluadores por protocolo.
  - **Requisitos cubiertos:** `RF-12.1`
  - **Hecho cuando:** La función de validación retorna `false` o lanza un error explicativo en español cuando se intenta asignar un 2do evaluador `JURIDICO` o `SOCIEDAD_CIVIL` al mismo protocolo.

- [ ] **TSK-12.3**: Crear las pruebas unitarias en `src/modules/evaluations/domain/services/quota-validator.service.spec.ts`.
  - **Requisitos cubiertos:** `RF-12.1`
  - **Hecho cuando:** `npm test` ejecuta los casos de prueba probando asignaciones válidas (1 Jurídico, 1 Sociedad Civil, 2 Ética) y rechaza combinaciones excedidas.

- [ ] **TSK-13.1**: Extender la entidad `ChecklistItemOrmEntity` para soportar campo de observación multilínea (`observationText`).
  - **Requisitos cubiertos:** `RF-13.1`, `RF-18.3`
  - **Hecho cuando:** La columna `observation_text` en la DB acepte texto multilínea sin scroll perezoso ni truncamiento.

- [ ] **TSK-13.2**: Crear endpoint de auditoría documental por ítem de checklist (`PATCH /api/reception/checklist/:id/audit`).
  - **Requisitos cubiertos:** `RF-13.1`, `RF-05.1`
  - **Hecho cuando:** La Secretaria envía un estado `OBSERVED` junto a su `observationText` y el backend actualiza el ítem y consolida las observaciones.

---

### Módulo: Control Multiversión y Ciclo de Vida (`protocols`)

- [ ] **TSK-14.1**: Crear el servicio de migración de versión `VersioningService` (v1.0 ➔ v2.0 ➔ v3.0).
  - **Requisitos cubiertos:** `RF-14.1`
  - **Hecho cuando:** Al invocarse con un dictamen de "Aprobado con Observaciones" (`resolutionTypeId: 2`), congela la versión actual y crea la v2.0.

- [ ] **TSK-14.2**: Implementar la herencia de requisitos inmutables en `ChecklistService`.
  - **Requisitos cubiertos:** `RF-14.1`, `RF-04.2`
  - **Hecho cuando:** Los requisitos previamente calificados como `APPROVED` mantengan `isLocked = true` en v2.0 y los observados cambien a `NO_PRESENTADO` para re-subida.

- [ ] **TSK-14.3**: Integrar el cálculo de 30 días hábiles en `VersioningService`.
  - **Requisitos cubiertos:** `RF-14.1`, `RF-07.1`
  - **Hecho meidante:** Invocación a `BusinessDayCalculator.calculateDeadline` con 30 días hábiles asignando `correctionDeadlineDate`.

---

### Módulo: Seguimiento Post-Aprobación, Avance y Cierre (`follow-up`)

- [ ] **TSK-15.1**: Crear entidad y migraciones para la agenda de entregables (`FollowUpScheduleOrmEntity`).
  - **Requisitos cubiertos:** `RF-15.1`
  - **Hecho cuando:** Se registren automáticamente los hitos de entrega periódica (semestral/anual) e Informe Final al aprobar la versión final del protocolo.

- [ ] **TSK-15.2**: Crear comando CLI `npm run cli:notify-deliverables` para alertas preventivas de entrega.
  - **Requisitos cubiertos:** `RF-15.1`
  - **Hecho cuando:** La ejecución del comando identifique los informes con vencimiento próximo y despache los correos de recordatorio al Investigador Principal.

- [ ] **TSK-16.1**: Implementar endpoint para la recepción de solicitudes de Enmienda (`POST /api/follow-up/amendments`).
  - **Requisitos cubiertos:** `RF-16.1`
  - **Hecho cuando:** El Investigador envíe el documento de cambios justificados y el sistema registre la solicitud en estado `SEGUIMIENTO_ENMIENDAS`.

- [ ] **TSK-16.2**: Implementar el servicio de Alerta Roja por Evento Adverso Grave (EAG) (`POST /api/follow-up/adverse-events`).
  - **Requisitos cubiertos:** `RF-16.1`
  - **Hecho cuando:** Al registrar un EAG, el sistema genere un log de urgencia y notifique por correo prioritario (alerta roja) al Presidente y Secretaria en un plazo no mayor a 24-48h.

- [ ] **TSK-17.1**: Implementar endpoint de Suspensión / Revocatoria ética del Pleno (`POST /api/resolutions/suspend`).
  - **Requisitos cubiertos:** `RF-17.1`
  - **Hecho cuando:** El Pleno cambie el estado del protocolo a `SUSPENDIDO` o `REVOCADO`, inhabilitando la carga de nuevos entregables y notificando por correo interno.

---

### Módulo: Usabilidad, Plantillas, Tesis, Anexos e Integración Quipux (`documents` / `reception` / `resolutions`)

- [ ] **TSK-18.1**: Extender el catálogo de requisitos para retornar `downloadTemplateUrl`.
  - **Requisitos cubiertos:** `RF-18.1`
  - **Hecho cuando:** `GET /api/reception/requirements` retorne la URL de descarga del formato oficial Word/PDF para cada Anexo.

- [ ] **TSK-18.2**: Configurar enlaces Deep-Linking en notificaciones por correo.
  - **Requisitos cubiertos:** `RF-18.2`
  - **Hecho cuando:** El cuerpo del correo de recepción contenga el enlace que redirige directamente a la pantalla de Aceptación Explícita de Plazos de ese protocolo (`/protocols/:id/explicit-acceptance`).

- [ ] **TSK-19.1**: Inyectar requisitos de Tesis de Grado/Posgrado en `ChecklistService`.
  - **Requisitos cubiertos:** `RF-19.1`
  - **Hecho cuando:** Si `isThesis = true`, el checklist incluya automáticamente los ítems obligatorios: *Acta de Aprobación de Tema* y *Certificado del Director de Tesis*.

- [ ] **TSK-19.2**: Permitir la subida de Informe Narrativo de Evaluador en `POST /api/evaluations/narrative-report`.
  - **Requisitos cubiertos:** `RF-19.2`
  - **Hecho cuando:** El Evaluador pueda subir su informe detallado (Word/PDF) junto a los dictámenes digitalizados de los Anexos 9 y 10.

- [ ] **TSK-19.3**: Añadir el campo de referencia Quipux en Convocatorias y Comunicados (`quipuxReferenceNumber`).
  - **Requisitos cubiertos:** `RF-19.3`
  - **Hecho cuando:** Al agendar una Convocatoria (`001-2026`), el campo opcional `quipuxReferenceNumber` se guarde en la DB y se imprima en la cabecera del PDF oficial.

---

## 🧪 Verificación Final de Tareas

- [ ] **TSK-V.1**: Ejecutar suite completa de linters y pruebas unitarias (`npm run lint` && `npm test`).
  - **Hecho cuando:** No existan errores de linting en TypeScript y los 16+ tests pasen limpiamente en 0 errores.
