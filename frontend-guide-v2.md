# Guía Técnica Actualizada: Requisitos Documentales Dinámicos (v2)

## 1. Cambios Recientes (Backend)
Se ha estabilizado el motor de requisitos con los siguientes cambios críticos:
- **Relación Relacional:** Los documentos ahora se filtran mediante una tabla de unión (`tipo_documento_estudio`), lo que garantiza que solo se devuelvan documentos válidos para el tipo de estudio seleccionado (`IO`, `EI`, `EC`).
- **Integridad de Códigos:** Se garantizó que cada requisito devuelva su `code` único (ej: `ANEXO_1`, `CONSENTIMIENTO`). **Ya no vendrán códigos vacíos.**
- **Normalización:** Se corrigieron nombres duplicados o con errores tipográficos en el catálogo.

## 2. Flujo de Trabajo en el Frontend

### A. Obtención Dinámica (Modo Preview)
Mientras el investigador llena el formulario, el frontend debe consultar la lista de documentos que le serán exigidos.

**Endpoint:** `GET /protocols/requirements`
**Query Params:**
- `tipo`: El código del estudio (`IO`, `EI`, `EC`).
- `muestras`, `vulnerable`, `multicentrico`, `riesgoMayor`, `institucionesPublicas`, `poblacionIndigena`: Valores booleanos (`true`/`false`).

**Comportamiento esperado:**
- Si cambias el **Tipo de Estudio**, la lista de documentos base cambiará drásticamente (especialmente para `EC`).
- Si marcas **Población Indígena**, aparecerán automáticamente documentos adicionales como `TRADUCCION_ANCESTRAL`.

### B. Visualización del Checklist
Cada objeto de la respuesta contiene:
- `name`: Nombre amigable para mostrar al usuario.
- `code`: Identificador técnico (ANEXO_1, etc.).
- `isRequired`: Indica si es obligatorio para el envío.
- `isConditional`: Indica si apareció por un flag (informativo).

### C. Subida de Archivos (Punto Crítico)
Para que el checklist se marque como "Presentado" en la base de datos, es obligatorio enviar el `requirementCode` en el cuerpo del POST de subida.

**Endpoint:** `POST /protocols/:id/upload-document`
**Payload:**
```json
{
  "protocolId": 79,
  "requirementCode": "ANEXO_1", 
  "fileName": "mi_archivo.pdf",
  "path": "/uploads/path/archivo.pdf",
  "sizeBytes": "12345"
}
```

## 3. Resolución de Problemas Detectados
| Problema Anterior | Estado Actual | Acción Frontend |
| :--- | :--- | :--- |
| Array de requisitos vacío (`Array(0)`) | **Corregido** | Refrescar la llamada al cambiar cualquier flag del formulario. |
| `requirementCode` vacío (`""`) | **Corregido** | Usar el campo `code` de la respuesta para el mapping. |
| Typos en nombres (ej. `Anexo 2::`) | **Corregido** | Mostrar el campo `name` tal cual llega del API. |

## 4. Checklist de Validación para el Frontend
1. [ ] ¿El API se llama cada vez que cambia el tipo de estudio?
2. [ ] ¿Se envían todos los flags (muestras, vulnerable, etc.) como booleanos?
3. [ ] ¿Se está mapeando el `code` del API al `requirementCode` en la subida?
4. [ ] ¿Se bloquea el botón "Enviar Protocolo" si faltan documentos obligatorios?

---
*Esta documentación reemplaza a la versión anterior y refleja el estado final de la API de Recepción.*
