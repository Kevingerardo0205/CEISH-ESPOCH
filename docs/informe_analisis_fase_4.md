# Informe de Análisis Técnico e Implementación: Fase 4 - Concurrencia Optimista y HTTP 409

Este documento contiene el análisis, diseño y la documentación técnica de la implementación realizada para la **Fase 4** de la refactorización, cubriendo la prevención de sobreescritura de expedientes y dictámenes mediante concurrencia optimista.

---

## 1. Análisis de Concurrencia en CEISH-ESPOCH

En sistemas donde múltiples usuarios de comités (Bioética, Metodología, Aspectos Jurídicos) y Secretaría modifican el estado de los protocolos e ingresan observaciones en paralelo, existe el riesgo de colisión. Si dos coordinadores dictaminan el mismo protocolo simultáneamente:
1. El usuario A carga la bandeja de resoluciones.
2. El usuario B carga la misma bandeja de resoluciones.
3. El usuario A emite una resolución (tipo 1: Aprobado).
4. El usuario B emite una resolución (tipo 3: Rechazado) segundos después.
5. Sin control de concurrencia, el último cambio (usuario B) pisa silenciosamente el dictamen del usuario A, dejando la base de datos en un estado inconsistente y duplicando transacciones R2 de archivos PDF.

---

## 2. Arquitectura de Concurrencia Optimista Implementada

Para resolver esto, se utilizó **Bloqueo Optimista (Optimistic Locking)** apoyado en el control de versiones a nivel de registro de base de datos (`versionLock`).

```text
Usuario A (Carga v1) -------> POST (versionLock: 1) -------> Guardado con Éxito (BD sube a v2)
                                                                
Usuario B (Carga v1) -------> POST (versionLock: 1) -------> ERROR 409 (Conflicto)
                                                             "El expediente ya ha sido modificado"
```

---

## 3. Detalle de Archivos Modificados e Implementaciones

### 3.1 Backend (Workspace NestJS)

- **`ProtocolOrmEntity` (`src/modules/protocols/infrastructure/database/protocol.entity.orm.ts`):** 
  Utiliza `@VersionColumn({ name: 'version', default: 1 }) versionLock!: number;`. TypeORM incrementa automáticamente esta columna en cada operación `save()`.
- **`ProtocolMapper` (`src/modules/protocols/application/mappers/protocol.mapper.ts`):**
  Se añadió la propiedad `versionLock: orm.versionLock` a la respuesta JSON para que el frontend conozca la versión exacta del registro recuperado.
- **DTO `CreateResolutionPayload` (`src/modules/resolutions/infrastructure/controllers/resolutions.controller.ts`):**
  Se añadió la propiedad `versionLock?: number;` para recibir la versión leída por el cliente.
- **`ResolutionsService` (`src/modules/resolutions/application/services/resolutions.service.ts`):**
  - Se modificó la transacción de creación de resolución. Ahora carga la entidad dentro de la transacción y valida:
    ```typescript
    if (dto.versionLock !== undefined && protocolOrm.versionLock !== dto.versionLock) {
      throw new ConflictException('El protocolo ha sido modificado de forma concurrente.');
    }
    ```
  - Se reemplazaron los métodos `update()` directos de TypeORM por `save()` en la entidad `ProtocolOrmEntity` para que el motor de TypeORM valide y actualice la columna de versión, atrapando excepciones `OptimisticLockVersionMismatchError` para convertirlas a `ConflictException` (HTTP 409).

### 3.2 Frontend (Workspace Angular)

- **`ErrorInterceptor` (`src/infrastructure/interceptors/error.interceptor.ts`):**
  Intercepta errores HTTP 409 y los mapea a un error personalizado con tipo `'CONCURRENCY_ERROR'` y código de estado `status: 409`.
- **`ResolutionGeneratorPage` (`src/features/resolutions/presentation/pages/resolution-generator/resolution-generator.page.ts`):**
  En el flujo de guardado, atrapa el error y evalúa `if (err?.type === 'CONCURRENCY_ERROR' || err?.status === 409)`. Al cumplirse, levanta de manera bloqueante el diálogo [`ConflictDialogComponent`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/shared/components/conflict-dialog/conflict-dialog.component.ts) que le impide guardar y le obliga a recargar la bandeja de protocolos.

---

## 4. Estado de Calidad y Pruebas Unitarias

* **Suite de Pruebas Frontend:** Ejecución exitosa de 37 test unitarios de Karma.
* **Compilación de Backend:** Compilado a producción con **SWC** sin ningún tipo de error sintáctico o semántico.

---
*Informe elaborado para documentar el cierre de la Fase 4 de calidad.*
