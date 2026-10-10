# Plan de Arquitectura y Diseño Técnico: RF-13 Registro de Observaciones Multilínea y Correo Consolidado

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.4.1, HU-013, RF-13)  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/plan-rf13-observaciones.md`  
**Cumplimiento Constitucional:** `docs/doc_base/constitution.md` y `AGENTS.md` (Arquitectura Hexagonal, NestJS, TypeORM, Resend Email Service, cero dependencias no autorizadas).

---

## 1. Mapeo de Criterios EARS y Requisitos Funcionales

| Criterio EARS / Requisito | Ubicación en este Plan | Descripción de Cobertura |
|---|---|---|
| **RF-13.1 (EARS 1)**: Captura Multilínea por Requisito Documental | Sección 2 (Módulos), Sección 3 (Modelo JSON) y Sección 4 (Contrato API) | Habilitación de campo de texto explicativo multilínea por requisito en la auditoría documental de Secretaría. |
| **RF-13.1 (EARS 2)**: Consolidación de Notificación y Cálculo a `plazo_subsanacion_documental_dias` Días Hábiles | Sección 3 (Algoritmo de Consolidación), Sección 4 (Endpoints) y Sección 5 (Decisiones Técnicas) | Algoritmo que itera el checklist, filtra ítems observados/pendientes, calcula la fecha límite a `plazo_subsanacion_documental_dias` días hábiles (inicial 30) y emite un único correo consolidado al Investigador Principal. |

---

## 2. Estructura de Módulos (Arquitectura Hexagonal)

El módulo se integra en el bounded context de `reception` en `src/modules/reception/` y `notifications/`.

```
src/modules/reception/
├── domain/
│   ├── entities/
│   │   ├── reception-audit.entity.ts       # Entidad de Dominio Auditoría de Recepción
│   │   └── requirement-observation.entity.ts # Entidad de Dominio Observación por Requisito
│   └── ports/
│       ├── reception-repository.port.ts     # Puerto de persistencia de recepción
│       └── business-days-calculator.port.ts # Puerto para cálculo de días hábiles
├── application/
│   ├── dtos/
│   │   ├── audit-requirements.dto.ts        # DTO de entrada con observaciones por ítem
│   │   └── consolidated-observation-response.dto.ts # DTO de salida consolidada
│   ├── services/
│   │   ├── save-document-observations.use-case.ts # Caso de Uso: Guardar borrador/final de auditoría
│   │   └── send-consolidated-observations.use-case.ts # Caso de Uso: Consolidar y enviar correo único
│   └── mappers/
│       └── reception.mapper.ts
└── infrastructure/
    ├── database/
    │   ├── entities/
    │   │   ├── recepcion-requisito.orm-entity.ts # Mapea a schema 'recepcion', tabla 'recepcion_requisitos'
    │   │   └── recepcion-protocolo.orm-entity.ts # Mapea a schema 'recepcion', tabla 'recepcion_protocolos'
    │   └── repositories/
    │       └── reception-typeorm.repository.ts
    └── controllers/
        └── reception-observations.controller.ts # Endpoint REST (/api/reception/protocols/:id/observations)
```

---

## 3. Modelo de Datos JSON (Checklist con Requisitos Observados)

```json
{
  "receptionId": "e3a89102-1234-4ef8-90ab-556677889900",
  "protocolId": "c2ffcd77-7b0a-2ef6-994b-4aa7ac160a33",
  "protocolCode": "CEISH-ESPOCH-IO-005-2026",
  "principalInvestigator": {
    "name": "Dr. Carlos Mendoza",
    "email": "carlos.mendoza@espoch.edu.ec"
  },
  "auditStatus": "OBSERVADO",
  "responseDeadline": "2026-10-14T23:59:59.000Z",
  "businessDaysAllowed": "<plazo_subsanacion_documental_dias>",
  "requirements": [
    {
      "requirementId": "req-001",
      "requirementName": "Carta de Presentación del Proyecto firmada por el Decano",
      "status": "OBSERVADO",
      "observation": "La carta adjunta no cuenta con la firma del Decano de la Facultad de Ciencias de la Salud.\nFavor adjuntar el documento escaneado con la firma de responsabilidad correspondiente."
    },
    {
      "requirementId": "req-002",
      "requirementName": "Consentimiento Informado (Anexo 3)",
      "status": "OBSERVADO",
      "observation": "En la sección 4 (Riesgos del Estudio), el texto no especifica el procedimiento de compensación en caso de eventos adversos.\nAdicionalmente, el lenguaje utilizado es demasiado técnico para los participantes."
    },
    {
      "requirementId": "req-003",
      "requirementName": "Hoja de Vida del Investigador Principal",
      "status": "APROBADO",
      "observation": null
    }
  ]
}
```

---

## 4. Algoritmo en Pseudocódigo: Consolidación y Envío de Correo Único (EARS 2)

```text
ALGORITMO ConsolidateAndSendObservationEmail(protocolId: UUID, auditData: AuditRequirementsDto)
ENTRADA: protocolId, auditData (lista de ítems con sus observaciones multilínea)
SALIDA: Objeto con { emailSent: Boolean, deadlineDate: Timestamp, missingRequirementsCount: Integer }

PASO 1: Iniciar transacción de persistencia en PostgreSQL.
PASO 2: Guardar o actualizar las observaciones multilínea en la tabla 'recepcion_requisitos':
        PARA CADA item EN auditData.requirements HACER
            UPDATE recepcion_requisitos 
            SET estado_requisito = item.status,
                observaciones = item.observation,
                updated_at = NOW()
            WHERE recepcion_id = auditData.receptionId AND requisito_id = item.requirementId;
        FIN PARA

PASO 3: Filtrar en memoria los requisitos marcados como 'OBSERVADO' o 'PENDIENTE':
        observedItems = auditData.requirements.filter(r => r.status == 'OBSERVADO' || r.status == 'PENDIENTE')

PASO 4: IF observedItems ES VACÍO ENTONCES
            // No hay observaciones, cambiar estado a VALIDADO_DOCUMENTALMENTE
            UPDATE recepcion_protocolos SET estado = 'VALIDADO_DOCUMENTALMENTE' WHERE id = protocolId;
            RETORNAR { emailSent: false, deadlineDate: null, missingRequirementsCount: 0 }
        FIN IF

PASO 5: Calcular la fecha límite exacta sumando `plazo_subsanacion_documental_dias` DÍAS HÁBILES (inicial 30; excluyendo fines de semana y feriados institucionales):
        startDate = FechaActual()
        deadlineDate = BusinessDaysCalculator.addBusinessDays(startDate, plazo_subsanacion_documental_dias) // Establece hora a 23:59:59.999

PASO 6: Construir el cuerpo del correo consolidado (HTML + Formato Texto Plano):
        emailBody = "Estimado/a Investigador/a Principal,\n\n"
                    + "Se ha concluido la revisión documental de su protocolo " + protocolCode + ".\n"
                    + "Se encontraron los siguientes requisitos observados que deben ser corregidos:\n\n"

        PARA CADA req EN observedItems HACER
            emailBody += "• REQUISITO: " + req.requirementName + "\n"
                      + "  OBSERVACIONES:\n" + Indentar(req.observation, "    ") + "\n\n"
        FIN PARA

        emailBody += "FECHA LÍMITE DE SUBSANACIÓN: " + FormatearFecha(deadlineDate) + " (" + plazo_subsanacion_documental_dias + " días hábiles).\n"
                  + "Enlace para resometer observaciones: " + SystemConfig.PORTAL_URL + "/protocols/" + protocolId + "/subsanar\n\n"
                  + "Atentamente,\nSecretaría CEISH-ESPOCH"

PASO 7: Enviar UN ÚNICO correo electrónico a través del servicio de notificaciones (Resend API):
        NotificationService.sendEmail({
            to: principalInvestigator.email,
            subject: "CEISH-ESPOCH: Observaciones Documentales Requeridas - Protocolo " + protocolCode,
            body: emailBody
        })

PASO 8: Actualizar el estado del protocolo a 'DOCUMENTACION_OBSERVADA' y registrar 'deadlineDate':
        UPDATE recepcion_protocolos 
        SET estado = 'DOCUMENTACION_OBSERVADA', 
            fecha_limite_subsanacion = deadlineDate 
        WHERE id = protocolId;

PASO 9: Confirmar transacción en BD.
PASO 10: RETORNAR { emailSent: true, deadlineDate: deadlineDate, missingRequirementsCount: observedItems.length }
FIN ALGORITMO
```

---

## 5. Contrato de API REST

### Endpoint: Finalizar Revisión Documental y Enviar Notificación Consolidada
- **Método / Ruta**: `POST /api/reception/protocols/:id/observations/send`
- **Guards**: `JwtAuthGuard`, `RolesGuard('SECRETARIA', 'ADMIN')`, `PermissionsGuard('RECEPTION_AUDIT')`
- **Request DTO (`AuditRequirementsDto`)**:
  ```json
  {
    "receptionId": "e3a89102-1234-4ef8-90ab-556677889900",
    "requirements": [
      {
        "requirementId": "req-001",
        "status": "OBSERVADO",
        "observation": "Falta la firma del Decano en la carta de presentación.\nPor favor adjuntar escaneado original."
      },
      {
        "requirementId": "req-002",
        "status": "OBSERVADO",
        "observation": "En el Anexo 3 falta aclarar la cobertura de seguros en caso de riesgos."
      }
    ]
  }
  ```
- **Respuestas HTTP**:
  - **200 OK**: Observaciones registradas y correo consolidado enviado exitosamente.
    ```json
    {
      "statusCode": 200,
      "message": "Observaciones documentales guardadas y notificación consolidada enviada exitosamente",
      "data": {
        "protocolId": "c2ffcd77-7b0a-2ef6-994b-4aa7ac160a33",
        "auditStatus": "DOCUMENTACION_OBSERVADA",
        "responseDeadline": "2026-10-14T23:59:59.000Z",
        "businessDaysAllowed": "<plazo_subsanacion_documental_dias>",
        "consolidatedItemsCount": 2,
        "emailSentTo": "carlos.mendoza@espoch.edu.ec"
      }
    }
    ```
  - **400 Bad Request**: Formato de observaciones inválido o falta de texto explicativo en un ítem marcado como `OBSERVADO`.

---

## 6. Decisiones Técnicas Justificadas

### Decisión: Notificación en Mensaje Único Consolidado vs. Múltiples Correos por Documento
- **Decisión**: El sistema envía **un único correo electrónico consolidado** con la lista estructurada de todos los requisitos observados al concluir la auditoría.
- **Justificación**: Evita el spam de correos electrónicos al investigador principal (quien recibiría entre 10 y 15 correos individuales si se enviara por documento), previene la saturación del servicio transaccional de correos (Resend API) y ofrece una experiencia de usuario clara con una sola fecha límite unificada de `plazo_subsanacion_documental_dias` días hábiles para subsanar todo el paquete.
- **Alternativa descartada**: Enviar un correo electrónico inmediatamente cada vez que la Secretaría guarda la observación de un archivo individual. Descartada por mala usabilidad y falta de consolidación en la auditoría.

---

## 7. Estrategia de Pruebas (TDD)

1. **Pruebas Unitarias (`npm test`)**:
   - `send-consolidated-observations.use-case.spec.ts`: Verificar que se agrupen únicamente los requisitos `OBSERVADO` / `PENDIENTE`, ignorando los `APROBADO`.
   - `business-days-calculator.spec.ts`: Validar que el cálculo de `plazo_subsanacion_documental_dias` días hábiles se salte fines de semana y feriados.
2. **Pruebas E2E (`npm run test:e2e`)**:
   - `reception-observations.e2e-spec.ts`: Probar endpoint `POST /api/reception/protocols/:id/observations/send` mockeando `ResendService`. Validar cambio de estado a `DOCUMENTACION_OBSERVADA` y recepción del payload estructurado.
