# Plan de Arquitectura y Diseño Técnico: RF-09 Gestión de Convocatorias a Sesiones del Pleno y Orden del Día Clasificado

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.3.0, HU-007, RF-09.1, RF-09.2, RF-15.2)  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/00301-flujo-mvp/plan-rf09-convocatorias.md`  
**Cumplimiento Constitucional:** `docs/doc_base/constitution_v2.md`, `specs/003-flujo-mvp/reconciliation.md`, `AGENTS.md` (Arquitectura Hexagonal, TypeScript Strict, TypeORM, cero dependencias no autorizadas).

---

## 1. Mapeo de Criterios EARS y Requisitos Funcionales

| Criterio EARS / Requisito | Ubicación en este Plan | Descripción de Cobertura |
|---|---|---|
| **RF-09.1 (EARS 1)**: Numeración Secuencial Atómica Anual (`001-2026`) | Sección 3 (Fase 1, Algoritmo A) y Sección 5 | Estrategia Opción E: Tabla de secuencias anuales + `UNIQUE` constraint en PostgreSQL + retry loop ante errores `23505`/`40001`. |
| **RF-09.1 (EARS 2)**: Registro Obligatorio de 3 Fechas Normativas (`fecha_plazo_normativo`, `fecha_reunion`, `fecha_entrega_evaluacion`) | Sección 3 (Fase 1, Algoritmo B) y Sección 4 | Validación dura de precedencia temporal `fecha_entrega_evaluacion < fecha_reunion` y sugerencia de jueves previo a las 23:59:59. |
| **RF-09.2 (EARS 3)**: Orden del Día Clasificado en 4 Secciones (Evaluaciones e Informes de Seguimiento) | Sección 2, Sección 3 (Fases 2 y 3) y Sección 4 | Modelo unificado de `AgendaItem` con `AgendaSectionType` (I, II, III, IV) y `AgendaItemType` (Evaluación inicial, Subsanación, Inicio, Avance Anexo 18, Fin Anexo 8). |
| **RF-09.1 / RF-09.2 (EARS 4)**: Generación de PDF Oficial del Orden del Día y Notificación a Miembros | Sección 2 (Módulos), Sección 3 (Fase 4) y Sección 6 | Integración de `MeetingPdfGeneratorAdapter` con `PdfGeneratorService` real (sin mocks) y despacho de notificaciones a vocales. |

---

## 2. Estructura de Módulos (Arquitectura Hexagonal Desacoplada)

```text
src/
├── shared/
│   ├── enums/
│   │   └── agenda-section.enum.ts           # [CANÓNICO] AgendaSectionType y AgendaItemType
│   └── utils/
│       └── pdf-generator.service.ts         # [REUTILIZAR / ADAPTAR] Renderizado PDF con 4 secciones
└── modules/
    ├── evaluations/
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   ├── meeting.entity.ts        # Entidad pura de Dominio Convocatoria
    │   │   │   └── agenda-item.entity.ts    # Entidad pura de Dominio Punto del Orden del Día
    │   │   ├── value-objects/
    │   │   │   ├── meeting-number.vo.ts     # Value Object 001-2026
    │   │   │   └── meeting-dates.vo.ts      # Value Object validación dura de precedencia
    │   │   └── ports/
    │   │       ├── meeting-repository.port.ts # Puerto LIMPIO (sin importar entidades ORM)
    │   │       └── meeting-pdf-generator.port.ts # Puerto para generación de PDF oficial
    │   ├── application/
    │   │   ├── dtos/
    │   │   │   ├── create-meeting.dto.ts    # DTO con protocolVersionIds y followUpReportIds
    │   │   │   ├── meeting-response.dto.ts  # DTO con desglose de las 4 secciones
    │   │   │   └── calculate-eval-date.dto.ts # DTO pre-cálculo de jueves previo
    │   │   ├── services/
    │   │   │   ├── create-meeting.use-case.ts # Orquestación transaccional con retry handler
    │   │   │   ├── calculate-meeting-dates.service.ts # Cálculo de jueves previo
    │   │   │   └── get-meeting.use-case.ts  # Consulta detallada de Convocatoria
    │   │   └── mappers/
    │   │       └── meeting.mapper.ts        # Mapeo Dominio <-> ORM <-> DTO
    │   └── infrastructure/
    │       ├── database/entities/
    │       │   ├── convocatoria.orm-entity.ts # Mapeo a evaluacion.convocatorias
    │       │   ├── secuencia-convocatoria.orm-entity.ts # Mapeo a evaluacion.secuencias_convocatoria
    │       │   ├── convocatoria-protocolo.orm-entity.ts # Mapeo a evaluacion.convocatoria_protocolos
    │       │   └── lugar.orm-entity.ts      # Mapeo a evaluacion.lugares
    │       ├── repositories/
    │       │   └── meeting-typeorm.repository.ts # Implementación de IMeetingRepositoryPort
    │       ├── adapters/
    │       │   └── meeting-pdf-generator.adapter.ts # Implementación de IMeetingPdfGeneratorPort
    │       └── controllers/
    │           └── meetings.controller.ts   # Controlador REST /api/evaluations/meetings
    └── follow-up/                           # Módulo Bounded Context de Seguimiento Post-Aprobación
        ├── domain/entities/
        │   └── deliverable-report.entity.ts # Entidad de informe presentado
        └── infrastructure/database/entities/
            └── informe-seguimiento.orm-entity.ts # Mapeo a seguimiento.informes_seguimiento
```

---

## 3. Fases del Plan de Implementación Técnica

### Fase 0: Precondiciones Arquitectónicas Obligatorias
1. **Desacoplamiento de Puertos**: Eliminar la importación de `ConvocatoriaOrmEntity` en `meeting-repository.port.ts`. El puerto debe definir y retornar interfaces planas de dominio (`MeetingEntity` o `MeetingResult`).
2. **Consolidación Meetings vs. Calls**: Desactivar/deprecar `CallsController` y canalizar todas las operaciones de Convocatorias a través de `MeetingsController`.
3. **Fuente Canónica de Enums**: Centralizar `AgendaSectionType` y `AgendaItemType` en `src/shared/enums/agenda-section.enum.ts` evitando duplicados.
4. **Saneamiento TypeScript**: Corregir los errores detectados en `npx tsc --noEmit` en use cases, repositorios y tests.

### Fase 1: Numeración Concurrente Segura (Estrategia Opción E)
1. **Tabla de Secuencias Anuales**: Crear entidad y tabla `evaluacion.secuencias_convocatoria` (`anio_lectivo INT PRIMARY KEY`, `ultimo_secuencial INT NOT NULL`).
2. **Restricción UNIQUE**: Agregar constraint `UNIQUE (anio_lectivo, numero_secuencial)` en `evaluacion.convocatorias`.
3. **Mecanismo de Generación Atómica**:
   ```sql
   INSERT INTO evaluacion.secuencias_convocatoria (anio_lectivo, ultimo_secuencial)
   VALUES ($1, 1)
   ON CONFLICT (anio_lectivo)
   DO UPDATE SET ultimo_secuencial = evaluacion.secuencias_convocatoria.ultimo_secuencial + 1
   RETURNING ultimo_secuencial;
   ```
4. **Manejo de Conflictos y Reintentos**:
   - Capturar errores PostgreSQL `23505` (unique_violation) y `40001` (serialization_failure).
   - Reintentar la transacción hasta 3 veces con backoff exponencial suave (50ms, 150ms, 300ms).

### Fase 2: Modelo de Orden del Día en 4 Secciones
1. **Estructura Canónica de Secciones**:
   - **Sección I (`ACTA_ANTERIOR`)**: Generada automáticamente con referencia a la última sesión concluida.
   - **Sección II (`EVALUACION_DICTAMEN`)**: Lista de protocolos para dictamen ético inicial (`EVALUACION_INICIAL`) o subsanación (`SUBSANACION`).
   - **Sección III (`SEGUIMIENTO_INFORMES`)**: Lista de informes de seguimiento presentados (`INFORME_INICIO`, `INFORME_AVANCE`, `INFORME_FIN`).
   - **Sección IV (`ASUNTOS_VARIOS`)**: Puntos informativos o administrativos adicionales.
2. **Extensión de `ConvocatoriaProtocoloOrmEntity`**:
   - Columna `tipo_punto_agenda` (VARCHAR 50, mapeada a `AgendaItemType`).
   - Columna `informe_seguimiento_id` (INTEGER nullable, FK a `seguimiento.informes_seguimiento`).
   - Flexibilización de `protocolo_id` y `version_id` para permitir ítems vinculados a informes.

### Fase 3: Integración de Seguimiento (RF-15.2)
1. **Reutilización de Metadatos**: Extraer periodicidad y obligatoriedad desde `catalogos.tipos_estudio`.
2. **Disponibilidad para Pleno**: Los entregables con estado `PRESENTADO` se listan en el endpoint de selección de Secretaría para ser incluidos en la Sección III de la Convocatoria.
3. **Pronunciamiento Oficial**: Soporte para los 4 desenlaces normativos: `APROBADO`, `OBSERVADO`, `CONVALIDADO` y `CIERRE_DEFINITIVO`.

### Fase 4: Integración Real del Generador de PDF
1. **Implementación del Adaptador**: `MeetingPdfGeneratorAdapter` implementa `IMeetingPdfGeneratorPort` invocando a `PdfGeneratorService`.
2. **Diseño de Plantilla Oficial**: Renderizar documento con encabezado institucional ESPOCH, número correlativo (`001-2026`), metadatos de sesión (fecha, hora, lugar/enlace virtual) y desglose estructurado de las 4 secciones normativas.
3. **Persistencia y Descarga**: Guardar el PDF generado en el almacenamiento documental y registrar la URL en `convocatorias.orden_dia_pdf_path`.

### Fase 5: API REST y Seguridad
1. **Endpoints Canónicos**:
   - `POST /api/evaluations/meetings/calculate-eval-date`: Pre-cálculo de jueves previo (Helper UI).
   - `POST /api/evaluations/meetings`: Creación atómica de convocatoria con Orden del Día clasificado (`JwtAuthGuard`, `RolesGuard('SECRETARIA', 'ADMIN')`).
   - `GET /api/evaluations/meetings/:id`: Consulta detallada estructurada en las 4 secciones (`JwtAuthGuard`).
   - `GET /api/evaluations/meetings/:id/pdf`: Descarga del PDF oficial del Orden del Día (`JwtAuthGuard`).
2. **Protección de Rutas**: Asegurar que ningún endpoint de meetings quede expuesto sin autenticación ni validación de roles.

### Fase 6: Migración de Datos y Backfill No Destructivo
1. **Backfill de Datos Existentes**:
   - Convocatoria huérfana (`id = 'e15834e2...'`): Asignar `numero_convocatoria = '000-2026'` y marcar como histórica/anulada.
   - Convocatorias existentes (`001-2026` a `009-2026`): Preservar íntegras.
   - Inicializar `evaluacion.secuencias_convocatoria` con `anio_lectivo = 2026, ultimo_secuencial = 9`.
2. **Aplicación de Constraints**: Aplicar `ALTER TABLE evaluacion.convocatorias ALTER COLUMN numero_convocatoria SET NOT NULL;` y `ADD CONSTRAINT uq_convocatorias_numero UNIQUE (numero_convocatoria);` únicamente después del backfill.

### Fase 7: Estrategia de Pruebas (TDD) y Concurrencia
1. **Pruebas Unitarias (`npm test`)**:
   - `meeting-number.vo.spec.ts`: Formato correlativo y validación de año.
   - `meeting-dates.vo.spec.ts`: Precedencia `evalDeadline < meetingDate`.
   - `calculate-meeting-dates.service.spec.ts`: Auto-cálculo de jueves previo.
   - `create-meeting.use-case.spec.ts`: Creación con ítems clasificados, reintentos y generación de PDF.
2. **Pruebas de Integración y Concurrencia**:
   - Test de persistencia transaccional con `QueryRunner`.
   - Test de concurrencia simulando **2, 5 y 10 solicitudes simultáneas** verificando la ausencia total de números duplicados o colisiones `23505`.
3. **Pruebas E2E (`npm run test:e2e`)**:
   - `test/meetings.e2e-spec.ts`: Flujo completo HTTP 201, generación de `010-2026`, validación de secciones y rechazo HTTP 400 ante precedencia inválida.

---

## 4. Modelo de Datos JSON: Convocatoria con 4 Secciones

```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "meetingNumber": "010-2026",
  "academicYear": 2026,
  "sessionType": "ORDINARIA",
  "meetingDate": "2026-10-15T09:00:00.000Z",
  "evalSubmissionDeadline": "2026-10-08T23:59:59.000Z",
  "location": {
    "id": 1,
    "name": "Sala de Sesiones CEISH - Edificio Central ESPOCH",
    "isVirtual": false,
    "meetingLink": null
  },
  "status": "PROGRAMADA",
  "agendaPdfUrl": "/api/documents/download/convocatoria-010-2026-orden-del-dia.pdf",
  "agendaSections": [
    {
      "sectionType": "ACTA_ANTERIOR",
      "sectionRoman": "I",
      "title": "Lectura y aprobación del acta de la sesión anterior",
      "items": [
        {
          "order": 1,
          "itemType": "ACTA_ANTERIOR",
          "description": "Lectura y aprobación del acta de la Sesión Ordinaria N° 009-2026"
        }
      ]
    },
    {
      "sectionType": "EVALUACION_DICTAMEN",
      "sectionRoman": "II",
      "title": "Evaluación ética y dictamen de protocolos de investigación",
      "items": [
        {
          "order": 2,
          "itemType": "EVALUACION_INICIAL",
          "protocolId": 165,
          "versionId": 137,
          "protocolCode": "CEISH-ESPOCH-IO-005-2026",
          "formattedVersion": "v1.0",
          "title": "Estudio epidemiológico de prevalencia metabólica en Chimborazo",
          "normativeDeadline": "2026-10-20T17:00:00.000Z",
          "warning": null
        }
      ]
    },
    {
      "sectionType": "SEGUIMIENTO_INFORMES",
      "sectionRoman": "III",
      "title": "Conocimiento, revisión y pronunciamiento de Informes de Seguimiento",
      "items": [
        {
          "order": 3,
          "itemType": "INFORME_AVANCE",
          "protocolId": 120,
          "reportId": 45,
          "protocolCode": "CEISH-ESPOCH-EC-002-2025",
          "title": "Ensayo clínico fase II de nuevo compuesto bioactivo",
          "reportName": "Primer Informe Semestral de Avance (Anexo 18)"
        }
      ]
    },
    {
      "sectionType": "ASUNTOS_VARIOS",
      "sectionRoman": "IV",
      "title": "Asuntos varios",
      "items": [
        {
          "order": 4,
          "itemType": "ASUNTOS_VARIOS",
          "description": "Comunicaciones generales y correspondencia recibida"
        }
      ]
    }
  ],
  "createdAt": "2026-09-30T15:00:00.000Z"
}
```

---

## 5. Algoritmos de Negocio en Pseudocódigo

### Algoritmo A: Generación Atómica Concurrente de Correlativo (Opción E)

```text
ALGORITMO GenerateAtomicMeetingNumberWithRetry(meetingDate: Timestamp, sessionData: CreateMeetingDto)
ENTRADA: meetingDate, sessionData
SALIDA: Convocatoria creada con número correlativo atómico (ej. "010-2026")

PASO 1: Extraer año calendario de la reunión:
        academicYear = meetingDate.getFullYear()
        maxRetries = 3
        retryCount = 0

PASO 2: MIENTRAS retryCount < maxRetries HACER
            INTENTAR
                queryRunner = dataSource.createQueryRunner()
                queryRunner.connect()
                queryRunner.startTransaction('READ COMMITTED') // El bloqueo atómico lo provee la fila de secuencia

                // 1. Obtener y bloquear secuencial atómico para el año lectivo
                secuenciaRow = queryRunner.query(`
                    INSERT INTO evaluacion.secuencias_convocatoria (anio_lectivo, ultimo_secuencial)
                    VALUES ($1, 1)
                    ON CONFLICT (anio_lectivo)
                    DO UPDATE SET ultimo_secuencial = evaluacion.secuencias_convocatoria.ultimo_secuencial + 1
                    RETURNING ultimo_secuencial;
                `, [academicYear])

                nextSecuencial = secuenciaRow[0].ultimo_secuencial
                correlativoFormatted = PadLeft(nextSecuencial, 3, '0') + '-' + String(academicYear)

                // 2. Insertar Convocatoria
                nuevaConvocatoria = InsertarConvocatoria(queryRunner, correlativoFormatted, academicYear, sessionData)

                // 3. Insertar Puntos de Agenda clasificados (Secciones I, II, III, IV)
                InsertarPuntosAgenda(queryRunner, nuevaConvocatoria.id, sessionData)

                // 4. Confirmar transacción
                queryRunner.commitTransaction()
                queryRunner.release()

                RETORNAR nuevaConvocatoria

            CAPTURAR Error DB (PostgreSQL 23505 'unique_violation' O 40001 'serialization_failure')
                queryRunner.rollbackTransaction()
                queryRunner.release()
                retryCount = retryCount + 1
                IF retryCount >= maxRetries ENTONCES
                    LANZAR ConflictException("CONCURRENCY_CONFLICT: No se pudo asignar número correlativo tras 3 reintentos.")
                SINO
                    EsperarBackoff(retryCount * 50 milisegundos) // 50ms, 100ms, 150ms
                FIN IF
        FIN MIENTRAS
FIN ALGORITMO
```

---

## 6. Criterios de Calidad y No Regresión

1. **TypeScript Strict**: Todo el código debe compilar con 0 errores ejecutando `npx tsc --noEmit`.
2. **Clean Architecture Strict**: Puertos desacoplados de TypeORM.
3. **No Duplicación**: Consolidación total de Meetings; eliminación de código muerto de Calls.
4. **Preservación de Datos**: Backfill seguro sin operaciones destructivas (`DROP`, `TRUNCATE`).
