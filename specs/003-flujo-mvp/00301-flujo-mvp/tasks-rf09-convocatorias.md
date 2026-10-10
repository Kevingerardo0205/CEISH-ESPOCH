# Desglose de Tareas de Implementación (TDD): RF-09 Gestión de Convocatorias a Sesiones del Pleno y Orden del Día Clasificado

**Código de Especificación:** `specs/003-flujo-mvp/spec.md` (Versión 1.4.1, HU-007, RF-09.1, RF-09.2, RF-15.2)  
**Plan Técnico de Referencia:** `specs/003-flujo-mvp/00301-flujo-mvp/plan-rf09-convocatorias.md`  
**Ubicación del Documento:** `specs/003-flujo-mvp/00301-flujo-mvp/tasks-rf09-convocatorias.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Metodología:** TDD Estricto Brownfield (Test Red ➔ Implementation Green ➔ Refactor), Arquitectura Hexagonal.

---

## Leyenda de Notaciones
- `[x] COMPLETADA`: Tarea totalmente implementada, probada y verificada.
- `[ ] PENDIENTE`: Tarea pendiente de ejecución.
- `[P]`: Tarea paralelizable (sin dependencias bloqueantes dentro del mismo bloque).
- `EARS 1`: Numeración correlativa atómica anual (`001-2026`).
- `EARS 2`: Registro de 3 fechas normativas con validación dura `fecha_entrega_evaluacion > fecha_reunion` (entrega DESPUÉS de la reunión, +2 días hábiles a las 12:00 ECT).
- `EARS 3`: Orden del Día clasificado en 4 secciones (Evaluación de Protocolos e Informes de Seguimiento).
- `EARS 4`: Generación de PDF oficial del Orden del Día y despacho de notificaciones a miembros.

---

## Grafo de Dependencias entre Tareas

```text
┌────────────────────────────────────────────────────────┐
│   TSK-009-000: Precondiciones Arquitectónicas RF-09    │
│  (Saneamiento TypeScript, Desacoplamiento Ports, Enums)│
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐
│   TSK-009-001    │               │   TSK-009-002    │
│ Migración DB DB  │               │ Value Objects    │
│ Secuencias/Backf.│               │ Numbers / Dates  │
└────────┬─────────┘               └────────┬─────────┘
         │                                  │
         └─────────────────┬────────────────┘
                           ▼
                 ┌──────────────────┐
                 │   TSK-009-003    │
                 │ Entidad ORM Item │
                 │ Agenda y Tipos   │
                 └────────┬─────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐
│   TSK-009-004    │             │   TSK-009-005    │
│ CreateMeetingDto │             │ Repository Type  │
│ con followUpIds  │             │ ORM Opción E     │
└────────┬─────────┘             └────────┬─────────┘
         │                                │
         └────────────────┬───────────────┘
                          ▼
                ┌──────────────────┐
                │   TSK-009-006    │
                │ CreateMeeting    │
                │ Use Case         │
                └────────┬─────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│   TSK-009-007    │            │   TSK-009-008    │
│ PDF Generator    │            │ MeetingsControl  │
│ Real 4 Secciones │            │ ler & Seguridad  │
└───────┬──────────┘            └────────┬─────────┘
        │                                │
        └────────────────┬───────────────┘
                         ▼
               ┌──────────────────┐
               │   TSK-009-009    │
               │ Tests Concurren- │
               │ cia (2, 5, 10)   │
               └────────┬─────────┘
                        ▼
               ┌──────────────────┐
               │   TSK-009-010    │
               │ Pruebas E2E      │
               │ Meetings Suite   │
               └────────┬─────────┘
                        ▼
               ┌──────────────────┐
               │   TSK-009-011    │
               │ Verificación     │
               │ Constitucional   │
               └──────────────────┘
```

---

## Fase 0: Precondiciones Arquitectónicas Obligatorias

### Task TSK-009-000 - [x] COMPLETADA
- **ID Único**: `TSK-009-000`
- **Requisito Relacionado**: Arquitectura, Calidad de Código
- **Criterio EARS**: Todos
- **Acción**: `REFACTORIZAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts`
  - `src/shared/enums/agenda-section.enum.ts`
  - `src/modules/evaluations/infrastructure/controllers/calls.controller.ts`
  - `src/modules/evaluations/application/services/calls.service.ts`
  - `src/modules/evaluations/application/use-cases/submit-evaluation.use-case.ts`
  - `src/modules/evaluations/application/use-cases/assign-evaluators.use-case.ts`
- **Dependencias**: Ninguna
- **Precondiciones**: Ninguna
- **Descripción**:
  1. **Desacoplar Puertos**: Eliminar la importación de `ConvocatoriaOrmEntity` en `meeting-repository.port.ts`. El puerto debe definir y retornar únicamente interfaces planas de dominio (`MeetingResult` o `MeetingEntity`).
  2. **Consolidar Meetings/Calls**: Deprecar `CallsController` y unificar los providers en `EvaluationsModule` para que `MeetingsController` sea el único punto de entrada canónico de Convocatorias.
  3. **Fuente Canónica de Enums**: Crear `src/shared/enums/agenda-section.enum.ts` con `AgendaSectionType` (`ACTA_ANTERIOR`, `EVALUACION_DICTAMEN`, `SEGUIMIENTO_INFORMES`, `ASUNTOS_VARIOS`) y `AgendaItemType` (`EVALUACION_INICIAL`, `SUBSANACION`, `INFORME_INICIO`, `INFORME_AVANCE`, `INFORME_FIN`), garantizando que no existan enums duplicados.
  4. **Saneamiento TypeScript**: Resolver los errores detectados por `npx tsc --noEmit` en use cases de evaluación y repositorios.
- **Tests**: `npx tsc --noEmit`
- **Criterio "Hecho cuando:"**: `npx tsc --noEmit` finaliza con 0 errores de compilación y los puertos de dominio quedan 100% libres de dependencias hacia TypeORM.

---

## Fase 1: Persistencia y Numeración Concurrente Segura (Opción E)

### Task TSK-009-001 - [x] COMPLETADA
- **ID Único**: `TSK-009-001`
- **Requisito Relacionado**: `RF-09.1`
- **Criterio EARS**: `EARS 1`
- **Acción**: `CREAR / MODIFICAR`
- **Archivos Afectados**:
  - `src/migrations/1800000000000-CreateSecuenciasConvocatoriaAndBackfill.ts`
  - `src/modules/evaluations/infrastructure/database/entities/secuencia-convocatoria.orm-entity.ts`
  - `src/modules/evaluations/infrastructure/database/entities/convocatoria.orm-entity.ts`
- **Dependencias**: `TSK-009-000`
- **Precondiciones**: Revisión del estado actual de 10 filas en `evaluacion.convocatorias`.
- **Descripción**:
  1. Crear la entidad ORM y tabla `evaluacion.secuencias_convocatoria` (`anio_lectivo INT PRIMARY KEY`, `ultimo_secuencial INT NOT NULL`).
  2. Migración no destructiva con backfill:
     - Asignar `numero_convocatoria = '000-2026'` al registro huérfano (`id = 'e15834e2...'`).
     - Inicializar `evaluacion.secuencias_convocatoria` con `anio_lectivo = 2026, ultimo_secuencial = 9`.
     - Aplicar `ALTER TABLE evaluacion.convocatorias ALTER COLUMN numero_convocatoria SET NOT NULL;`.
     - Aplicar `ADD CONSTRAINT uq_convocatorias_numero UNIQUE (numero_convocatoria);`.
- **Tests**: `npm run test -- src/modules/evaluations/infrastructure/database/entities/convocatoria.orm-entity.spec.ts`.
- **Criterio "Hecho cuando:"**: La migración se ejecuta limpiamente sin pérdida de datos históricos y la restricción `UNIQUE` queda activa en PostgreSQL.

### Task TSK-009-002 [P] - [ ] PENDIENTE (REABIERTA: spec v1.4.1 RF-09.1, pendiente de código)
- **ID Único**: `TSK-009-002`
- **Requisito Relacionado**: `RF-09.1`
- **Criterio EARS**: `EARS 1`, `EARS 2`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/domain/value-objects/meeting-number.vo.ts`
  - `src/modules/evaluations/domain/value-objects/meeting-dates.vo.ts`
  - `src/modules/evaluations/application/services/calculate-meeting-dates.service.ts`
- **Dependencias**: Ninguna
- **Precondiciones**: Ninguna
- **Descripción**: Actualizar Value Objects y servicios de dominio para validación dura de precedencia (`fecha_entrega_evaluacion > fecha_reunion`, entrega DESPUÉS de la reunión) y cálculo de +2 días hábiles tras la reunión a las 12:00 ECT (America/Guayaquil). El código actual implementa la regla vieja (`<` y jueves previo).
- **Tests**: `meeting-number.vo.spec.ts`, `meeting-dates.vo.spec.ts`, `calculate-meeting-dates.service.spec.ts`.
- **Criterio "Hecho cuando:"**: Tests unitarios en verde validando nueva regla `>` y cálculo +2 días hábiles a las 12:00 ECT.

### Task TSK-009-003 [P] - [x] COMPLETADA
- **ID Único**: `TSK-009-003`
- **Requisito Relacionado**: `RF-09.2`, `RF-15.2`
- **Criterio EARS**: `EARS 3`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/infrastructure/database/entities/convocatoria-protocolo.orm-entity.ts`
- **Dependencias**: `TSK-009-000`, `TSK-009-001`
- **Precondiciones**: Enums canónicos creados.
- **Descripción**: Extender `ConvocatoriaProtocoloOrmEntity` añadiendo:
  - `tipo_punto_agenda`: Column VARCHAR(50) enum `AgendaItemType` (default `'EVALUACION_INICIAL'`).
  - `informe_seguimiento_id`: Column INTEGER nullable (FK a `seguimiento.informes_seguimiento`).
  - Flexibilizar constraints para admitir ítems de seguimiento sin `version_id` obligatoria.
- **Tests**: `convocatoria-protocolo.orm-entity.spec.ts`.
- **Criterio "Hecho cuando:"**: Mapeo ORM soporta tanto protocolos de evaluación como entregables de seguimiento.

### Task TSK-009-004 [P] - [x] COMPLETADA
- **ID Único**: `TSK-009-004`
- **Requisito Relacionado**: `RF-09.2`
- **Criterio EARS**: `EARS 3`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/application/dtos/create-meeting.dto.ts`
  - `src/modules/evaluations/application/dtos/create-meeting.dto.spec.ts`
- **Dependencias**: `TSK-009-000`
- **Precondiciones**: Ninguna
- **Descripción**: Actualizar `CreateMeetingDto` para recibir `@IsOptional() @IsArray() @IsInt({ each: true }) followUpReportIds?: number[]`.
- **Tests**: `create-meeting.dto.spec.ts`.
- **Criterio "Hecho cuando:"**: La validación de DTO acepta arreglos de IDs de informes y rechaza datos inválidos.

### Task TSK-009-005 - [x] COMPLETADA
- **ID Único**: `TSK-009-005`
- **Requisito Relacionado**: `RF-09.1`, `RF-09.2`
- **Criterio EARS**: `EARS 1`, `EARS 3`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts`
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.spec.ts`
- **Dependencias**: `TSK-009-001`, `TSK-009-003`
- **Precondiciones**: Tabla `secuencias_convocatoria` y puertos limpios.
- **Descripción**: Implementar en `MeetingTypeOrmRepository` el algoritmo Opción E:
  1. Incremento atómico en `evaluacion.secuencias_convocatoria` mediante `INSERT ... ON CONFLICT DO UPDATE RETURNING`.
  2. Persistencia de la Convocatoria y sus puntos clasificados (Sección II y Sección III) en una única transacción.
  3. Retry handler para capturar errores PostgreSQL `23505` y `40001` con reintentos exponenciales suaves.
- **Tests**: `meeting-typeorm.repository.spec.ts`.
- **Criterio "Hecho cuando:"**: Pruebas unitarias mockeando `QueryRunner` y colisiones confirman que no se producen números duplicados.

---

## Fase 2: Aplicación, Use Cases y PDF Oficial

### Task TSK-009-006 - [ ] PENDIENTE (REABIERTA: spec v1.4.1 RF-09.1, pendiente de código)
- **ID Único**: `TSK-009-006`
- **Requisito Relacionado**: `RF-09.1`, `RF-09.2`, `RF-15.2`
- **Criterio EARS**: `EARS 1`, `EARS 2`, `EARS 3`, `EARS 4`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts`
  - `src/modules/evaluations/application/services/create-meeting.use-case.spec.ts`
- **Dependencias**: `TSK-009-002`, `TSK-009-004`, `TSK-009-005`
- **Precondiciones**: Repositorio y DTOs listos; TSK-009-002 completada (nueva regla `>`).
- **Descripción**: Modificar `CreateMeetingUseCase` para:
  1. Validar precedencia dura mediante `MeetingDatesVO` con la regla `fecha_entrega_evaluacion > fecha_reunion` (entrega DESPUÉS de la reunión).
  2. Validar que exista al menos un punto en el Orden del Día (evaluación o seguimiento).
  3. Delegar la persistencia atómica al repositorio.
  4. Invocar la generación de PDF oficial estructurado en 4 secciones.
- **Tests**: `create-meeting.use-case.spec.ts`.
- **Criterio "Hecho cuando:"**: Caso de uso coordina la creación completa y retorna el ID, número (`010-2026`) y URL del PDF; rechaza `fecha_entrega_evaluacion <= fecha_reunion`.

### Task TSK-009-007 - [x] COMPLETADA
- **ID Único**: `TSK-009-007`
- **Requisito Relacionado**: `RF-09.1`, `RF-09.2`
- **Criterio EARS**: `EARS 3`, `EARS 4`
- **Acción**: `ADAPTAR`
- **Archivos Afectados**:
  - `src/shared/utils/pdf-generator.service.ts`
  - `src/modules/evaluations/infrastructure/adapters/meeting-pdf-generator.adapter.ts`
- **Dependencias**: `TSK-009-000`
- **Precondiciones**: Enums de secciones disponibles.
- **Descripción**: Implementar en `PdfGeneratorService` y su adaptador `MeetingPdfGeneratorAdapter` el renderizado real del PDF oficial del Orden del Día del Pleno con las 4 secciones normativas:
  - I. Lectura y aprobación del acta anterior.
  - II. Evaluación ética y dictamen de protocolos (nuevos y subsanaciones).
  - III. Conocimiento, revisión y pronunciamiento de Informes de Seguimiento (Inicio, Avance Anexo 18, Fin Anexo 8).
  - IV. Asuntos varios.
- **Tests**: Prueba unitaria de renderizado y estructura de buffer PDF.
- **Criterio "Hecho cuando:"**: El PDF generado contiene encabezados oficiales y el desglose clasificado en 4 secciones.

---

## Fase 3: Controlador REST, Seguridad y Pruebas E2E

### Task TSK-009-008 - [x] COMPLETADA
- **ID Único**: `TSK-009-008`
- **Requisito Relacionado**: `RF-09.1`, `RF-09.2`
- **Criterio EARS**: `EARS 1`, `EARS 2`, `EARS 3`, `EARS 4`
- **Acción**: `ADAPTAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts`
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.spec.ts`
- **Dependencias**: `TSK-009-006`, `TSK-009-007`
- **Precondiciones**: Use case y adaptador PDF integrados.
- **Descripción**: Adaptar `MeetingsController` asegurando que todos los endpoints (`POST /api/evaluations/meetings`, `GET /api/evaluations/meetings/:id`, `GET /api/evaluations/meetings/:id/pdf`) estén protegidos con `JwtAuthGuard` y `RolesGuard('SECRETARIA', 'ADMIN')`.
- **Tests**: `meetings.controller.spec.ts`.
- **Criterio "Hecho cuando:"**: Endpoints responden con códigos HTTP 201 y 200 con la estructura JSON completa y rechazan accesos no autorizados.

### Task TSK-009-009 - [x] COMPLETADA
- **ID Único**: `TSK-009-009`
- **Requisito Relacionado**: `RF-09.1`
- **Criterio EARS**: `EARS 1`
- **Acción**: `CREAR`
- **Archivos Afectados**:
  - `test/meetings-concurrency.e2e-spec.ts`
- **Dependencias**: `TSK-009-008`
- **Precondiciones**: API REST operativa.
- **Descripción**: Crear suite de pruebas de estrés y concurrencia simulando **2, 5 y 10 solicitudes simultáneas concurrentes** de creación de convocatorias.
- **Tests**: `npm run test:e2e -- test/meetings-concurrency.e2e-spec.ts`.
- **Criterio "Hecho cuando:"**: Todas las convocatorias creadas concurrentemente obtienen números correlativos únicos consecutivos (`010-2026`, `011-2026`, etc.) sin colisiones `23505` ni números duplicados.

### Task TSK-009-010 - [x] COMPLETADA
- **ID Único**: `TSK-009-010`
- **Requisito Relacionado**: `RF-09.1`, `RF-09.2`
- **Criterio EARS**: `EARS 1`, `EARS 2`, `EARS 3`, `EARS 4`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `test/meetings.e2e-spec.ts`
- **Dependencias**: `TSK-009-008`
- **Precondiciones**: API REST operativa.
- **Descripción**: Actualizar la suite E2E general para validar creación HTTP 201 con Orden del Día en 4 secciones, descarga de PDF y rechazo HTTP 400 por precedencia inválida.
- **Tests**: `npm run test:e2e -- test/meetings.e2e-spec.ts`.
- **Criterio "Hecho cuando:"**: Todos los escenarios E2E pasan al 100% en verde.

### Task TSK-009-011 - [x] COMPLETADA
- **ID Único**: `TSK-009-011`
- **Requisito Relacionado**: Calidad Constitucional
- **Criterio EARS**: Todos
- **Acción**: `REUTILIZAR / VERIFICAR`
- **Archivos Afectados**: Todo el repositorio
- **Dependencias**: `TSK-009-009`, `TSK-009-010`
- **Precondiciones**: Todas las tareas anteriores finalizadas.
- **Descripción**: Ejecución obligatoria de la batería de calidad del proyecto:
  1. `npx tsc --noEmit` (0 errores).
  2. `npm test` (100% suites unitarias en verde).
  3. `npm run test:e2e` (100% suites E2E en verde).
  4. `npm run lint` y `npm run format`.
- **Tests**: Ejecución de scripts npm.
- **Criterio "Hecho cuando:"**: Verificación integral superada sin fallos ni advertencias bloqueantes.

---

## Fase 4: Nuevas Tareas RF-09.1 y RF-09.3 (Pendientes de código)

### Task TSK-009-N01 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N01`
- **Requisito Relacionado**: `RF-09.1`
- **Criterio EARS**: `EARS 2`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/domain/value-objects/meeting-dates.vo.ts`
  - `src/modules/evaluations/application/services/calculate-meeting-dates.service.ts`
- **Dependencias**: `TSK-009-002`
- **Descripción**: Implementar la nueva regla de `fecha_entrega_evaluacion`: DESPUÉS de la reunión (`fecha_entrega_evaluacion > fecha_reunion`), calculada como `fecha_reunion + entrega_evaluacion_dias_habiles_tras_reunion` días laborables a las `entrega_evaluacion_hora_corte` (12:00) en America/Guayaquil. Usar `Intl.DateTimeFormat` para la zona horaria (nunca `.toISOString().split('T')[0]`).
  - **Constantes (PR-B1 y PR-B2 usan estas mismas)**: N = `ENTREGA_EVALUACION_DIAS_HABILES_TRAS_REUNION = 2` y H = `ENTREGA_EVALUACION_HORA_CORTE = '12:00'` se leen de `src/shared/deadlines/deadline-rules.ts`, **NO** de `sistema.parametros_sistema` (que no existe hasta TSK-015-N03 en PR-C). PR-C añadirá migración para persistir esos valores en BD (TSK-009-N04), pero PR-B1 opera con las constantes.
- **Tests**: `meeting-dates.vo.spec.ts`, `calculate-meeting-dates.service.spec.ts`.
- **Criterio "Hecho cuando:"**: Tests validan la nueva regla `>` y que el cálculo respeta días laborables y zona horaria ECT.

### Task TSK-009-N02 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N02`
- **Requisito Relacionado**: `RF-09.3`
- **Criterio EARS**: aplica RF-ALR
- **Acción**: `CREAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/application/services/meeting-reminders.service.ts`
- **Dependencias**: `TSK-009-N01`
- **Descripción**: Implementar recordatorios de convocatoria parametrizables (RF-09.3): (i) el viernes previo, enviar a los pares la lista de protocolos; (ii) recordar a evaluadores pendientes el día de la sesión por la tarde, el día siguiente por la mañana y 1 hora antes del corte. Al cierre, registrar incumplimiento si un evaluador no entregó. Aplica RF-ALR.
- **Tests**: `meeting-reminders.service.spec.ts`.
- **Criterio "Hecho cuando:"**: Tests unitarios validan los tres momentos de recordatorio y el registro de incumplimiento al cierre.

### Task TSK-009-N03 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N03`
- **Requisito Relacionado**: `RF-09.1`, `RF-12.7(b)`
- **PR**: PR-B1 (`feat/meeting-delivery-after-session`)
- **Criterio EARS**: `EARS 2`
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts`
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts`
- **Dependencias**: `TSK-009-N01` (nueva regla `fecha_entrega_evaluacion > fecha_reunion`)
- **Descripción**: Al crear una convocatoria, sobrescribir `fecha_limite` (type `date`, YYYY-MM-DD) en cada registro de `asignaciones_evaluacion` con estado `ASIGNADO` que corresponda a un protocolo agendado. La propagación debe ocurrir dentro de la misma transacción `QueryRunner` de `saveMeetingWithAtomicNumber`. Usa las mismas constantes de `deadline-rules.ts` que TSK-009-N01 (N=2, H=12:00); **NO lee `sistema.parametros_sistema`** (inexistente hasta TSK-015-N03 en PR-C).
  - **Fuente de la fecha (verificado)**: La fecha de entrega vive en `ConvocatoriaOrmEntity.fechaEntregaEvaluacion` (`timestamptz`, nullable; `convocatoria.orm-entity.ts:56-60`) — es **única por sesión**, compartida por todos los protocolos agendados. `ConvocatoriaProtocoloOrmEntity` **NO tiene** `fecha_entrega_evaluacion`; solo tiene `fechaPlazoNormativo` (plazo normativo de revisión del protocolo, `convocatoria-protocolo.orm-entity.ts:46-50`).
  - **Conversión timezone-safe**: `fechaEntregaEvaluacion` es `timestamptz`; `fecha_limite` es `date` (YYYY-MM-DD). Usar `Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil' })` para extraer la fecha local. **Nunca** usar `.toISOString().split('T')[0]` (produce fecha UTC distinta en horario ECT).
  - **Hallazgo Paso 1 (a)**: `fecha_limite` ya es `nullable: true` y `fecha_asignacion` ya existe como `@CreateDateColumn` — no se necesita migración de BD.
  - **Hallazgo Paso 1 (d)**: `saveMeetingWithAtomicNumber` actualmente no toca `asignaciones_evaluacion` (`meeting-typeorm.repository.ts`). Este es el gap que esta tarea cierra.
- **Tests**: Ver TSK-009-N05 para la tarea específica de actualizar `test/real-db-evaluations.e2e-spec.ts:616` y añadir assertion post-convocatoria.
- **Criterio "Hecho cuando:"**: Al crear una convocatoria cuya `fechaEntregaEvaluacion = '2026-10-14T17:00:00Z'` (= miércoles 12:00 ECT), las asignaciones activas del protocolo agendado tienen `fecha_limite = '2026-10-14'` en BD. Test E2E verifica el valor exacto.

### Task TSK-009-N04 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N04`
- **Requisito Relacionado**: `RF-09.1`
- **PR**: PR-C (`feat/deadline-alerts`)
- **Criterio EARS**: `EARS 2`
- **Acción**: `CREAR` (migración + columnas)
- **Archivos Afectados**:
  - Migración TypeORM nueva (ej. `src/migrations/<ts>-AddConvocatoriaDeliveryParams.ts`)
  - `src/modules/evaluations/infrastructure/database/entities/convocatoria.orm-entity.ts`
- **Dependencias**: `TSK-015-N03` (tabla `sistema.parametros_sistema` debe existir antes de migrar estos valores desde ahí)
- **Descripción**: Persistir los parámetros de cálculo de fecha de entrega directamente en la tabla `evaluacion.convocatorias` para que cada convocatoria registre los valores con los que fue creada. Añadir columnas: `entrega_evaluacion_dias_habiles_tras_reunion INTEGER DEFAULT 2` y `entrega_evaluacion_hora_corte VARCHAR(5) DEFAULT '12:00'`. Poblarlas al crear la convocatoria desde `sistema.parametros_sistema` (o desde las constantes de `deadline-rules.ts` si `sistema.parametros_sistema` aún no tiene esos parámetros).
- **Tests**: Verificar migración `up`/`down`; prueba unitaria confirma que los valores se persisten en la convocatoria.
- **Criterio "Hecho cuando:"**: La tabla `evaluacion.convocatorias` tiene las dos columnas nuevas con sus valores por defecto, y el repositorio las lee al calcular `fecha_limite` en TSK-009-N03 (o lo hace de forma directa en el mismo PR-C).

### Task TSK-009-N05 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N05`
- **Requisito Relacionado**: `RF-09.1`, `RF-12.7(b)`
- **PR**: PR-B1 (`feat/meeting-delivery-after-session`)
- **Criterio EARS**: `EARS 2`
- **Acción**: `MODIFICAR` (tests)
- **Archivos Afectados**:
  - `test/real-db-evaluations.e2e-spec.ts` (nueva assertion post-convocatoria)
- **Dependencias**: `TSK-009-N03`
- **Descripción**: Añadir assertion E2E que verifique el comportamiento de PR-B1 tras crear una convocatoria:
  - Después de `POST /api/evaluations/meetings`, verificar en BD que `asignaciones_evaluacion.fecha_limite` de cada protocolo agendado = `convocatoria.fechaEntregaEvaluacion` convertida a YYYY-MM-DD en ECT.
  - **Nota**: La línea `:616` (test de reasignación COI sin convocatoria activa; aserta `'2026-03-23'` LEGACY) pertenece a **TSK-002-N07** (PR-B2), no a este PR. Las líneas `:363` y `:372` también pertenecen a TSK-002-N07.
- **Tests**: `npm run test:e2e -- test/real-db-evaluations.e2e-spec.ts`.
- **Criterio "Hecho cuando:"**: Nueva assertion en verde: después de crear convocatoria con `fechaEntregaEvaluacion = '2026-10-14T17:00:00Z'`, las asignaciones activas del protocolo agendado tienen `fecha_limite = '2026-10-14'` en BD.
