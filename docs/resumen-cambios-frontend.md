# 📢 Reporte para el Equipo Frontend: Hotfix y Sincronización de Estados de Evaluación

**Fecha:** 2026-06-02  
**Módulo:** Evaluaciones (`/api/evaluations`)  
**Estado:** ✅ Desplegado en Backend  
**Impacto en Frontend:** 🔄 Transparente y Retrocompatible (Sin cambios obligatorios en payloads)

---

## 1. Resumen de los Ajustes en el Backend

Se han corregido problemas de inconsistencia entre el backend y la base de datos que impedían que los protocolos asignados se cargaran en la vista del Evaluador ("Mis Asignaciones").

1.  **Sincronización de IDs de Estado de Asignación:**
    *   **Antes:** El backend enviaba `statusId = 2` para las asignaciones activas. Sin embargo, en el catálogo de base de datos (`catalogos.estados`), el ID `2` es **`RECHAZADO`** de la categoría de documentos, mientras que el ID **`6`** es **`ASIGNADO`** de la categoría de evaluaciones.
    *   **Ahora:** El backend envía correctamente **`statusId = 6`** para reflejar el estado real de **`ASIGNADO`**.
2.  **Poblamiento del Perfil del Evaluador (`perfil_id` / `profile`):**
    *   **Antes:** Se enviaba en `null` al crear la asignación, lo que podía romper componentes de Angular que hicieran renderizados del tipo `assignment.profile.nombre` (errores de referencia nula).
    *   **Ahora:** Se asocia automáticamente el `perfil_id` del evaluador resolviéndolo desde la tabla de perfiles en base de datos.
3.  **Sincronización de Estados del Protocolo:**
    *   Al ser asignado, el protocolo ahora pasa al ID de estado oficial **`13`** (`EN EVALUACIÓN` en el catálogo de base de datos) en lugar del ID `2` (`RECHAZADO`).

---

## 2. ¿Tiene que hacer algún cambio el Frontend?

> ⚠️ **El cambio es retrocompatible y transparente.** El cuerpo de las peticiones (`Request Payloads`) sigue siendo exactamente el mismo. 

Sin embargo, el equipo de frontend debe revisar y tener en cuenta lo siguiente:

### 📌 Acción 1: Verificar el Mapeo de Enums Locales
Si en el frontend (Angular) tenían un enum local para manejar los estados de las asignaciones, verifiquen que coincida con los IDs reales sembrados en la base de datos:

```typescript
// ❌ ANTES (IDs temporales obsoletos)
export enum AssignmentStatus {
  SUGGESTED = 1,
  ASSIGNED = 2,
  COMPLETED = 3,
  ARCHIVED = 4,
}

// ✅ AHORA (Alineado con el catálogo catalogos.estados)
export enum AssignmentStatus {
  SUGGESTED = 5,  // Estado 'SUGERIDO' en BD
  ASSIGNED = 6,   // Estado 'ASIGNADO' en BD
  COMPLETED = 7,  // Estado 'COMPLETADO' en BD
  ARCHIVED = 8,   // Estado 'ARCHIVADO' en BD
}
```

### 📌 Acción 2: Uso Recomendado de Códigos de Estado (Mejor Práctica)
Para evitar fallos futuros por IDs numéricos, recomendamos que el frontend realice validaciones basadas en el campo de texto `codigo` del estado cuando se unan las relaciones, o utilizar el enum de base de datos actualizado arriba.

---

## 3. Pruebas de Verificación Sugeridas para Frontend

Para confirmar que la integración funciona de extremo a extremo:
1.  **Como Secretaría:** Asignar un mínimo de 4 evaluadores al protocolo (ej. `CEISH-ESPOCH-IO-002-2026`). Confirmar que responde `201 OK` y muestra el modal de éxito.
2.  **Como Evaluador Asignado:** Iniciar sesión e ingresar a "Mis Asignaciones". La petición `GET /api/evaluations/my-assignments` ahora responderá con los datos de las asignaciones conteniendo `statusId: 6` y el `profileId` correctamente poblados, lo que permitirá a la interfaz renderizar la tabla inmediatamente.
