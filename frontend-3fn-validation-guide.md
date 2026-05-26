# Guía Técnica Final: Recepción Normalizada 3FN e Historial de Validaciones

## 1. Nueva Arquitectura de Recepción
Para garantizar la integridad y trazabilidad, el sistema se ha normalizado bajo la **Tercera Forma Normal (3FN)**. La estructura lógica ahora es:
**Requisito (Checklist)** $\rightarrow$ **Documentos (Versiones de archivos)** $\rightarrow$ **Validaciones (Historial de revisiones)**.

## 2. Flujo de Implementación para el Frontend

### A. Obtener el Checklist (Una vez creado el protocolo)
Cuando el protocolo ya existe, el frontend debe consultar el checklist oficial para obtener los `ID` de cada requisito.

**Endpoint:** `GET /reception/protocol/:protocolId`
**Uso:** Este objeto contiene el checklist. Debes guardar los `id` de cada ítem (ej. el ID del requisito "Anexo 1").

### B. Subida de Documentos (Investigador)
Al subir un archivo, ahora es **OBLIGATORIO** enviar el `requirementId` (el ID numérico del checklist) en lugar de solo el código. Esto permite que el sistema asocie el archivo a la entrada correcta de forma unívoca.

**Endpoint:** `POST /reception/protocol/:id/document`
**Payload:**
```json
{
  "protocolId": 83,
  "requirementId": 738, // ID numérico obtenido del checklist
  "fileName": "solicitud_corregida.pdf",
  "path": "/uploads/protocols/83/solicitud.pdf",
  "sizeBytes": "284472"
}
```

### C. Validación de Documentos (Secretaría)
La secretaría ahora puede validar un documento. Al hacerlo, se crea un registro en el **Historial de Validaciones**.

**Endpoint:** `POST /reception/document/:documentId/validate`
**Payload:**
```json
{
  "statusId": 1, // 1: APROBADO, 2: RECHAZADO, 3: OBSERVADO
  "observations": "Falta firma en la página 3"
}
```
**Sincronización Automática:** Al ejecutar este POST, el backend actualizará automáticamente el estado del requisito vinculado en el checklist a `APROBADO` o `RECHAZADO`.

## 3. Estados del Checklist
El frontend debe reaccionar a los nuevos estados del campo `status` en el checklist:
- `PENDIENTE`: Estado inicial.
- `PRESENTADO`: El investigador subió el archivo, espera revisión.
- `APROBADO`: La secretaría aceptó el documento (Check verde).
- `RECHAZADO`: La secretaría denegó el documento. El investigador **DEBE subir un nuevo archivo** para este mismo `requirementId`.

## 4. Resumen de Endpoints Listos

| Funcionalidad | Método | Endpoint |
| :--- | :--- | :--- |
| **Checklist Actual** | GET | `/reception/protocol/:id` |
| **Archivos Subidos** | GET | `/reception/protocol/:id/documents` |
| **Subir Archivo** | POST | `/reception/protocol/:id/document` |
| **Validar Archivo** | POST | `/reception/document/:id/validate` |
| **Finalizar Recepción** | POST | `/reception/protocol/:id/finalize` |

---
*Nota: Con esta estructura 3FN, el sistema es capaz de mantener el historial de todas las versiones de archivos subidas y todas las revisiones realizadas por la secretaría.*
