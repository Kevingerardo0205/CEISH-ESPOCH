# Plan de Arquitectura y Diseño Técnico: RF-15 Seguimiento Post-Aprobación, Agenda de Entregables, Anexo 18 y Anexo 8

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.4.1, HU-015, RF-15.1, RF-15.2)  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/plan-rf15-seguimiento.md`  
**Cumplimiento Constitucional:** `docs/doc_base/constitution.md` y `AGENTS.md` (Arquitectura Hexagonal, NestJS, TypeORM, PostgreSQL, cero dependencias no autorizadas).

---

## 1. Mapeo de Criterios EARS y Requisitos Funcionales

| Criterio EARS / Requisito | Ubicación en este Plan | Descripción de Cobertura |
|---|---|---|
| **RF-15.1 (EARS 1)**: Pre-llenado de Agenda y Edición por Presidencia | Sección 3 (Algoritmo A), Sección 2 (Modelos) y Sección 4 (Endpoints) | Pre-cálculo de fechas sugeridas (Inicio 30 días, Avances, Cierre Anexo 8 a 60 días, Renovación a 60 días antes) con edición libre por Presidencia. |
| **RF-15.1 (EARS 2)**: Recepción de Entregables Oficiales (Anexo 18 y Anexo 8) | Sección 2 (Módulos), Sección 3 (Modelo JSON) y Sección 4 (Contrato API) | Recepción y validación estricta de Anexo 18 (Informe de Avance) para seguimiento periódico y Anexo 8 (Informe Final) para cierre. |
| **RF-15.1 / RF-15.2 (EARS 3)**: Alertas Parametrizadas y Período de Gracia de 30 Días | Sección 3 (Algoritmos B y C), Sección 5 (Decisiones) y Sección 6 (Estrategia TDD) | Alertas preventivas según RF-ALR (`alerta_offsets_dias` [7, 1] para hitos generales; `alerta_renovacion_offsets_dias` [90, 60, 15] para renovación) y cambio automático a `VENCIDO`/`SUSPENDIDO` con 30 días de gracia. |

---

## 2. Estructura de Módulos (Arquitectura Hexagonal)

El módulo se ubica en el bounded context de `follow-up` en `src/modules/follow-up/`.

```
src/modules/follow-up/
├── domain/
│   ├── entities/
│   │   ├── deliverable-schedule.entity.ts   # Entidad de Dominio Agenda de Entregables
│   │   └── deliverable-report.entity.ts     # Entidad de Dominio Informe Presentado (Anexo 18/8)
│   └── ports/
│       ├── follow-up-repository.port.ts     # Puerto de persistencia de seguimiento
│       └── notification-scheduler.port.ts   # Puerto para programación de alertas por hito
├── application/
│   ├── dtos/
│   │   ├── configure-schedule.dto.ts        # DTO de edición de agenda por Presidencia
│   │   ├── submit-report.dto.ts             # DTO de carga de Anexo 18 / Anexo 8
│   │   └── schedule-response.dto.ts         # DTO de respuesta con estado de cumplimiento
│   ├── services/
│   │   ├── generate-schedule.use-case.ts    # Caso de Uso: Pre-calcular agenda post-aprobación
│   │   ├── update-schedule.use-case.ts      # Caso de Uso: Edición manual por Presidencia
│   │   ├── process-deliverable.use-case.ts  # Caso de Uso: Procesar Anexo 18 / Anexo 8
│   │   └── audit-deliverable-grace.service.ts # Cron/Servicio: Control de vencimiento y 30 días de gracia
│   └── mappers/
│       └── follow-up.mapper.ts
└── infrastructure/
    ├── database/
    │   ├── entities/
    │   │   ├── agenda-entregable.orm-entity.ts # Mapea a schema 'seguimiento', tabla 'agenda_entregables'
    │   │   └── informe-seguimiento.orm-entity.ts # Mapea a schema 'seguimiento', tabla 'informes_seguimiento'
    │   └── repositories/
    │       └── follow-up-typeorm.repository.ts
    └── controllers/
        └── follow-up.controller.ts          # Endpoints REST (/api/follow-up)
```

---

## 3. Modelo de Datos JSON: Agenda Pre-llenada de Protocolo Aprobado

```json
{
  "protocolId": "c2ffcd77-7b0a-2ef6-994b-4aa7ac160a33",
  "approvalDate": "2026-10-01T00:00:00.000Z",
  "studyDurationMonths": 12,
  "expirationDate": "2027-10-01T00:00:00.000Z",
  "isPresidencyCustomized": false,
  "deliverables": [
    {
      "id": "del-001",
      "milestoneType": "INFORME_INICIO",
      "name": "Informe de Inicio de Actividades (Anexo 18)",
      "dueDate": "2026-10-31T23:59:59.000Z",
      "requiredDocumentType": "ANEXO_18",
      "status": "PENDIENTE",
      "alertsConfig": [7, 1],
      "gracePeriodDaysRemaining": null
    },
    {
      "id": "del-002",
      "milestoneType": "INFORME_AVANCE_TRIMESTRAL",
      "name": "Primer Informe Periódico de Avance (Anexo 18)",
      "dueDate": "2027-01-31T23:59:59.000Z",
      "requiredDocumentType": "ANEXO_18",
      "status": "PENDIENTE",
      "alertsConfig": [15, 5],
      "gracePeriodDaysRemaining": null
    },
    {
      "id": "del-003",
      "milestoneType": "RENOVACION_AVAL",
      "name": "Solicitud de Renovación del Aval Ético",
      "dueDate": "2027-08-02T23:59:59.000Z",
      "requiredDocumentType": "ANEXO_18",
      "status": "PENDIENTE",
      "alertsConfig": [90, 60, 15],
      "gracePeriodDaysRemaining": null
    },
    {
      "id": "del-004",
      "milestoneType": "INFORME_FINAL_CIERRE",
      "name": "Informe Final de Cierre del Estudio (Anexo 8)",
      "dueDate": "2027-11-30T23:59:59.000Z",
      "requiredDocumentType": "ANEXO_8",
      "status": "PENDIENTE",
      "alertsConfig": [60, 30, 7],
      "gracePeriodDaysRemaining": null
    }
  ]
}
```

---

## 4. Algoritmos en Pseudocódigo

### Algoritmo A: Pre-cálculo y Edición por Presidencia (EARS 1)
```text
ALGORITMO GenerateDefaultSchedule(protocolId: UUID, approvalDate: Date, durationMonths: Integer)
ENTRADA: protocolId, approvalDate, durationMonths
SALIDA: Lista de Entregables creados en 'agenda_entregables'

PASO 1: Calcular fechas base sugeridas:
        inicioDate = approvalDate + 30 días
        finalDate = (approvalDate + durationMonths meses) + 60 días
        renovacionDate = (approvalDate + durationMonths meses) - 60 días

PASO 2: Insertar Hito 'INFORME_INICIO':
        INSERT INTO agenda_entregables (protocolo_id, tipo_hito, fecha_vencimiento, tipo_documento_requerido)
        VALUES (protocolId, 'INFORME_INICIO', inicioDate, 'ANEXO_18');

PASO 3: Insertar Hitos de Avance Periódico (según periodicidad de duración):
        IF durationMonths >= 12 ENTONCES
            // Avance cada 6 meses
            INSERT INTO agenda_entregables (protocolo_id, tipo_hito, fecha_vencimiento, tipo_documento_requerido)
            VALUES (protocolId, 'INFORME_AVANCE_SEMESTRAL', approvalDate + 6 meses, 'ANEXO_18');
        FIN IF

PASO 4: Insertar Hito 'RENOVACION_AVAL':
        INSERT INTO agenda_entregables (protocolo_id, tipo_hito, fecha_vencimiento, tipo_documento_requerido)
        VALUES (protocolId, 'RENOVACION_AVAL', renovacionDate, 'ANEXO_18');

PASO 5: Insertar Hito 'INFORME_FINAL_CIERRE':
        INSERT INTO agenda_entregables (protocolo_id, tipo_hito, fecha_vencimiento, tipo_documento_requerido)
        VALUES (protocolId, 'INFORME_FINAL_CIERRE', finalDate, 'ANEXO_8');

FIN ALGORITMO

ALGORITMO OverrideScheduleByPresidency(protocolId: UUID, customItems: List<ConfigureScheduleItemDto>)
ENTRADA: protocolId, customItems (fechas y tipos de hito ajustados manualmente por la Presidencia)
SALIDA: Agenda actualizada

PASO 1: Eliminar o actualizar hitos no bloqueados de 'agenda_entregables' para el protocolo.
PASO 2: PARA CADA item EN customItems HACER
            UPDATE agenda_entregables 
            SET fecha_vencimiento = item.dueDate,
                tipo_documento_requerido = item.requiredDocumentType
            WHERE id = item.id AND protocolo_id = protocolId;
        FIN PARA
PASO 3: Marcar bandera 'es_personalizada_presidencia = true' en el protocolo.
FIN ALGORITMO
```

---

### Algoritmo B: Alertas Preventivas Parametrizadas por Hito (EARS 3)
```text
ALGORITMO AuditDeliverableAlerts()
SALIDA: Notificaciones preventivas enviadas por correo

PASO 1: Consultar todos los entregables pendientes en BD:
        pendingDeliverables = Query("SELECT * FROM agenda_entregables WHERE estado = 'PENDIENTE'")

PASO 2: PARA CADA item EN pendingDeliverables HACER
            diasRestantes = CalculateDaysBetween(FechaActual(), item.fecha_vencimiento)
            
            // Obtener configuración de alertas del hito (ej. [7, 1] o [90, 60, 15])
            alertDaysList = GetAlertDaysConfig(item.tipo_hito)
            
            IF alertDaysList.contains(diasRestantes) Y NOT AlertAlreadySentToday(item.id, diasRestantes) ENTONCES
                SendPreventiveEmail(item.protocolo_id, item.tipo_hito, diasRestantes)
                RecordAlertLog(item.id, diasRestantes)
            FIN IF
        FIN PARA
FIN ALGORITMO
```

---

### Algoritmo C: Transición a `VENCIDO`/`SUSPENDIDO` y Periodo de Gracia de 30 Días (EARS 3)
```text
ALGORITMO AuditExpiredDeliverablesAndGracePeriod()
SALIDA: Entregables actualizados a VENCIDO/SUSPENDIDO y contadores de gracia activados

PASO 1: Consultar entregables cuyo vencimiento haya sido superado sin recepción:
        expiredItems = Query("SELECT * FROM agenda_entregables WHERE fecha_vencimiento < NOW() AND estado = 'PENDIENTE'")

PASO 2: PARA CADA item EN expiredItems HACER
            // Cambiar estado del entregable y protocolo
            UPDATE agenda_entregables 
            SET estado = 'VENCIDO', 
                inicio_periodo_gracia = NOW(),
                fin_periodo_gracia = NOW() + 30 DÍAS
            WHERE id = item.id;

            UPDATE seguimiento_protocolos 
            SET estado_seguimiento = 'SUSPENDIDO' 
            WHERE protocolo_id = item.protocolo_id;

            NotificarSecretariaYPresidencia(item.protocolo_id, "ENTREGABLE_VENCIDO_GRACIA_INICIADA")
        FIN PARA

PASO 3: Auditar los que ya están en periodo de gracia y superan los 30 días:
        graceExpiredItems = Query("SELECT * FROM agenda_entregables WHERE estado = 'VENCIDO' AND fin_periodo_gracia < NOW()")
        
        PARA CADA item EN graceExpiredItems HACER
            UPDATE seguimiento_protocolos 
            SET estado_seguimiento = 'REVOCADO_DEFINITIVAMENTE' 
            WHERE protocolo_id = item.protocolo_id;

            NotificarEscalamientoSancionEtica(item.protocolo_id)
        FIN PARA
FIN ALGORITMO
```

---

## 5. Contrato de API REST

### Endpoint 1: Personalizar Agenda de Entregables (Presidencia)
- **Método / Ruta**: `PUT /api/follow-up/protocols/:id/schedule`
- **Guards**: `JwtAuthGuard`, `RolesGuard('PRESIDENTE', 'ADMIN')`
- **Request DTO (`ConfigureScheduleDto`)**:
  ```json
  {
    "deliverables": [
      {
        "id": "del-001",
        "dueDate": "2026-11-15T23:59:59.000Z"
      }
    ]
  }
  ```

---

### Endpoint 2: Cargar Informe de Seguimiento (Anexo 18 / Anexo 8)
- **Método / Ruta**: `POST /api/follow-up/protocols/:id/deliverables/:deliverableId/submit`
- **Guards**: `JwtAuthGuard`, `RolesGuard('INVESTIGADOR')`
- **Request Payload (`SubmitReportDto`)**: Multipart Form Data (`documentType`: `ANEXO_18` | `ANEXO_8`, `file`: Buffer PDF).
- **Response HTTP 200 OK**:
  ```json
  {
    "statusCode": 200,
    "message": "Informe Anexo 18 registrado exitosamente. Estado de cumplimiento actualizado.",
    "data": {
      "deliverableId": "del-001",
      "status": "ENTREGADO",
      "submissionDate": "2026-10-25T14:30:00.000Z",
      "gracePeriodDeactivated": true
    }
  }
  ```

---

## 6. Decisiones Técnicas Justificadas

### Decisión: Agenda con Periodicidad Editable por Presidencia vs. Fórmula Cerrada Rígida
- **Decisión**: El sistema pre-calcula sugerencias por defecto, pero habilita a la Presidencia la edición manual del número de informes y sus fechas límite antes de finalizar la resolución.
- **Justificación**: Cumple con la realidad del CEISH observada en la documentación de campo. No todas las investigaciones con seres humanos tienen el mismo nivel de riesgo; ensayos clínicos de alto riesgo requieren informes trimestrales, mientras que estudios observacionales simples requieren solo reporte semestral o anual.
- **Alternativa descartada**: Imponer una fórmula matemática rígida no modificable en el código. Descartada porque violaría la flexibilidad operativa requerida por la Presidencia.

---

## 7. Estrategia de Pruebas (TDD)

1. **Pruebas Unitarias (`npm test`)**:
   - `generate-schedule.use-case.spec.ts`: Validar pre-cálculo sugerido para 12 meses.
   - `audit-deliverable-grace.service.spec.ts`: Verificar el cálculo de los 30 días de gracia y activación de bandera `SUSPENDIDO`.
2. **Pruebas E2E (`npm run test:e2e`)**:
   - `follow-up.e2e-spec.ts`: Simular flujo post-aprobación, edición de agenda por Presidencia, carga de Anexo 18 / Anexo 8 por Investigador y verificación de estado `ENTREGADO`.
