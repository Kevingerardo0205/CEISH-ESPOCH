# Informe de Análisis Técnico y Plan de Acción: Fase 7 - Trazabilidad y logs de auditoría

Este informe detalla el análisis de requerimientos, diseño y estrategia de implementación ejecutada para la **Fase 7** de la refactorización (Trazabilidad y logs de auditoría) en **CEISH-ESPOCH**.

---

## 1. Objetivos de la Fase 7

El objetivo principal es registrar de manera inmutable y auditable el ciclo de vida completo de cada protocolo y sus correspondientes archivos, presentando una bitácora transparente e integrada en el workspace del investigador y la secretaría:

1. **Resolución de Vacíos de Auditoría (Faltantes de ID):**
   * Corregir el interceptor de auditoría del backend para evitar registrar IDs nulos/indefinidos cuando las peticiones (`submit`, `accept-timeline`, etc.) devuelven objetos informativos sin clave primaria `id`.
2. **Exposición de API de Auditoría:**
   * Crear controladores y endpoints en el backend NestJS para exponer los logs generales y la trazabilidad ético-científica de un protocolo específico de forma segura.
3. **Línea de Tiempo Visual en el Cliente:**
   * Visualizar los eventos de auditoría (Creación, Envío, Validación, Asignación, Evaluación, Dictamen) de forma cronológica, con indicación de responsables y la correspondiente huella digital (SHA-256) de integridad.

---

## 2. Estrategia de Refactorización

### 2.1 Backend (NestJS)
* **Interceptor de Auditoría:** Se modificó [`audit.interceptor.ts`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/shared/interceptors/audit.interceptor.ts) para inferir el identificador del registro a través del parámetro de ruta de la petición HTTP (`request.params.id`) en caso de que los datos de retorno no contengan `data.id`:
  ```typescript
  const paramsId = request.params?.id ? parseInt(request.params.id, 10) : NaN;
  // recordId: data?.id || (!isNaN(paramsId) ? paramsId : undefined)
  ```
* **Controlador de Logs:** Se implementó [`audit.controller.ts`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/audit/infrastructure/controllers/audit.controller.ts) para exponer endpoints de trazabilidad con seguridad perimetral JWT.
* **Servicio de Auditoría:** Se dotó a [`audit.service.ts`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/audit/application/services/audit.service.ts) de métodos para resolver y mapear en memoria los datos de nombre completo y rol de los usuarios responsables de cada acción a partir de `UserOrmEntity`.

### 2.2 Frontend (Angular)
* **Adaptador HTTP:** Se actualizó [`audit-repository.adapter.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/audit/infrastructure/adapters/audit-repository.adapter.ts) para realizar peticiones HTTP reales al endpoint `/audit/protocol/:id` y mapear los eventos crudos al tipo de UI `ProtocolTrailEvent`.
* **Bitácora de Trazabilidad:** Se insertó una sección de línea de tiempo interactiva dentro de [`protocol-detail-tab.component.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/protocols/presentation/pages/protocol-workspace/tabs/protocol-detail-tab.component.ts) que renderiza la bitácora de auditoría inmutable firmada digitalmente.

---
*Informe elaborado para el plan de refactorización de CEISH-ESPOCH.*
