# Guía de Implementación: Requisitos Documentales Dinámicos (Frontend)

## 1. Contexto Técnico
Se ha migrado la lógica de requisitos documentales desde el código del backend hacia la base de datos. Ahora, el frontend debe consultar el endpoint de requisitos para obtener la lista exacta de documentos que el investigador debe cargar según las características de su protocolo.

## 2. Consumo de API

### Endpoint: `GET /protocols/requirements`
Este endpoint devuelve los documentos obligatorios y condicionales.

**Parámetros de Query (Flags):**
- `tipo`: (Requerido) `IO` | `EI` | `EC`
- `muestras`: `true` | `false` (Utiliza muestras biológicas)
- `vulnerable`: `true` | `false` (Población vulnerable)
- `multicentrico`: `true` | `false` (Estudio multicéntrico)
- `riesgoMayor`: `true` | `false` (Nivel de riesgo mayor al mínimo)
- `institucionesPublicas`: `true` | `false` (Participación de instituciones externas/públicas)
- `poblacionIndigena`: `true` | `false` (Participación de comunidades indígenas)

### Ejemplo de Respuesta:
```json
[
  {
    "code": "ANEXO_1",
    "name": "Anexo 1: Solicitud de Evaluación",
    "isRequired": true,
    "isConditional": false
  },
  {
    "code": "TRADUCCION_ANCESTRAL",
    "name": "Traducción a idiomas ancestrales",
    "isRequired": true,
    "isConditional": true
  }
]
```

## 3. Lógica Sugerida para el UI/UX

### A. Reactividad en el Formulario
El frontend debe reaccionar a los cambios en los campos del formulario de creación de protocolo. Se recomienda disparar la consulta al API cuando cambien:
1. El Tipo de Estudio (Select).
2. Cualquiera de los Switches/Checkboxes de condiciones especiales (muestras, vulnerable, etc.).

### B. Visualización del Checklist
Se recomienda mostrar una sección de "Documentación Requerida" que se actualice dinámicamente:
- **Indicador de Carga:** Mientras se recalculan los requisitos.
- **Lista de Documentos:** Cada item debe mostrar el `name` y un botón o zona de drop para subir el archivo.
- **Validación:** No permitir el envío (Submit) del protocolo si no se han cargado todos los documentos devueltos por este endpoint.

## 4. Mapeo de Campos del Formulario a Query Params
Para que la lógica funcione, asegúrate de mapear los campos de tu formulario de la siguiente manera al llamar al API:

| Form Field | Query Parameter |
| :--- | :--- |
| `tipoEstudio` | `tipo` |
| `utilizaMuestras` | `muestras` |
| `poblacionVulnerable` | `vulnerable` |
| `esMulticentrico` | `multicentrico` |
| `riesgo` (Si es > Mínimo) | `riesgoMayor` |
| `institucionesExternas` | `institucionesPublicas` |
| `poblacionIndigena` | `poblacionIndigena` |

## 5. Subida de Archivos
Al realizar la subida de cada archivo (`POST /protocols/:id/upload-document`), es **CRÍTICO** enviar el campo `requirementCode` con el valor del `code` recibido del endpoint de requisitos. 

**Ejemplo de Payload para subida:**
```json
{
  "protocolId": 123,
  "fileName": "solicitud.pdf",
  "path": "storage/path/solicitud.pdf",
  "requirementCode": "ANEXO_1", 
  "pageCount": 5,
  "sizeBytes": "1048576"
}
```

---
*Nota: Esta implementación asegura que el sistema cumpla estrictamente con el PET CEISH-ESPOCH V2 de forma automatizada.*
