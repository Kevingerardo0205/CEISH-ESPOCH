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

### Task TSK-009-002 [P] - [x] COMPLETADA
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

### Task TSK-009-006 - [x] COMPLETADA
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

### Task TSK-009-N01 - [x] COMPLETADA
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

### Task TSK-009-N03 - [x] COMPLETADA
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

### Task TSK-009-N04 - [x] COMPLETADA (PR-C3)
- **ID Único**: `TSK-009-N04`
- **Requisito Relacionado**: `RF-09.1`
- **PR**: PR-C3 (`feat/convocatoria-params`)
- **Criterio EARS**: `EARS 2`
- **Acción**: `CREAR` (migración + columnas)
- **Archivos Afectados**:
  - `src/migrations/1840000000000-AddConvocatoriaDeliveryParams.ts` (NUEVO)
  - `src/modules/evaluations/infrastructure/database/entities/convocatoria.orm-entity.ts`
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts`
  - `src/modules/evaluations/application/services/calculate-meeting-dates.service.ts`
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts`
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts`
  - `src/modules/evaluations/application/services/calculate-meeting-dates.service.spec.ts`
  - `src/modules/evaluations/application/services/create-meeting.use-case.spec.ts`
  - `test/real-db-evaluations.e2e-spec.ts`
- **Dependencias**: `TSK-015-N03` (tabla `sistema.parametros_sistema` debe existir antes de leer parámetros desde ahí) — completada en PR-C1.
- **Descripción**: Persistir los parámetros de cálculo de fecha de entrega directamente en la tabla `evaluacion.convocatorias` como trazabilidad de la regla usada al crear cada sesión. Columnas añadidas: `entrega_evaluacion_dias_habiles_tras_reunion INTEGER NOT NULL DEFAULT 2` y `entrega_evaluacion_hora_corte VARCHAR(5) NOT NULL DEFAULT '12:00'`. Al crear una convocatoria, `CalculateMeetingDatesService.getEntregaDias()` (misma fuente que `calculateSuggestedEvalDeadline`) provee el valor dinámico; `ENTREGA_EVALUACION_HORA_CORTE` (constante no parametrizable) provee la hora.
  - **Registros existentes**: reciben los defaults automáticamente (equivale a los valores históricos hardcodeados). No se requiere backfill manual.
  - **Snapshot inmutable**: la fecha `fechaEntregaEvaluacion` es la fuente que usa la reasignación de evaluadores. Editar `sistema.parametros_sistema` después de crear una convocatoria no altera retroactivamente su snapshot.
  - **`entregaHoraCorte` es constante**: `ENTREGA_EVALUACION_HORA_CORTE = '12:00'` no es parametrizable vía BD (parte del protocolo institucional).
- **Tests**: Unitarios: `getEntregaDias()` con mock=3, snapshot coherente con fecha calculada. E2E describe 9 (9a defaults, 9b con SP=3).
- **Criterio "Hecho cuando:"**: La tabla `evaluacion.convocatorias` tiene las dos columnas nuevas; el repositorio las persiste al crear; `npm test` verde; E2E 9a y 9b pasan tras aplicar migración 1840000000000 en `ceish_test_db`.

### Task TSK-009-N05 - [x] COMPLETADA
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

### Task TSK-009-N06 - [x] COMPLETADA (PR-C4)
- **ID Único**: `TSK-009-N06`
- **Requisito Relacionado**: `RF-09.1`
- **PR**: PR-C4 (`feat/deadline-warnings`)
- **Criterio EARS**: Advertencia suave cuando `fecha_entrega_evaluacion` supera el plazo normativo del protocolo.
- **Archivos Afectados**:
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts` (MODIFICAR — método `findNormativeDeadlineInputs` + interfaz `NormativeDeadlineInput`)
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` (MODIFICAR — implementación de `findNormativeDeadlineInputs`)
  - `src/modules/evaluations/application/services/calculate-meeting-dates.service.ts` (MODIFICAR — `computeNormativeDeadline` estático + parámetro `evalDeadline` en `evaluateSoftWarnings`)
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts` (MODIFICAR — paso 4b: obtener inputs y construir snapshots normativos)
  - `src/modules/evaluations/application/services/calculate-meeting-dates.service.spec.ts` (MODIFICAR — tests `computeNormativeDeadline` y `evaluateSoftWarnings` con `evalDeadline`)
  - `src/modules/evaluations/application/services/create-meeting.use-case.spec.ts` (MODIFICAR — tests advertencia normativa con mocks)
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.spec.ts` (MODIFICAR — mock `findNormativeDeadlineInputs`)
  - `test/meetings.e2e-spec.ts` (MODIFICAR — mock `findNormativeDeadlineInputs`)
  - `test/meetings-concurrency.e2e-spec.ts` (MODIFICAR — mock `findNormativeDeadlineInputs`)
  - `test/real-db-evaluations.e2e-spec.ts` (MODIFICAR — describe 10: protocolo 993/994 con receptionDate antigua/reciente)
- **Dependencias**: `TSK-009-N03`, `TSK-009-N04`
- **Descripción**: Emitir advertencia suave (`warnings`) cuando la `fecha_entrega_evaluacion` de la convocatoria supera el plazo normativo de algún protocolo agendado. Implementado con un método de puerto aditivo `findNormativeDeadlineInputs` que retorna datos crudos `{ protocolCode, reviewType, receptionDate }`. El cálculo del plazo normativo (45 días hábiles EXPEDITA, 60 días PLENO/ENSAYO_CLINICO) se realiza en capa `application/` mediante `CalculateMeetingDatesService.computeNormativeDeadline()` estático. Protocolo sin `receptionDate` o `reviewType` omite advertencia con `logger.warn`.
- **Tests**: Test E2E describe 10 en `test/real-db-evaluations.e2e-spec.ts`: protocolos 993 (receptionDate 2025-01-01 → advertencia) y 994 (receptionDate 2026-12-01 → sin advertencia). Tests unitarios en `calculate-meeting-dates.service.spec.ts` y `create-meeting.use-case.spec.ts`.
- **Criterio "Hecho cuando:"**: Crear una convocatoria con protocolo cuyo plazo normativo es anterior a `fecha_entrega_evaluacion` retorna un warning en el campo `advertencias`; los protocolos con plazo normativo posterior no generan warning.

### Task TSK-009-N07 - [x] COMPLETADA (PR-T1)
- **ID Único**: `TSK-009-N07`
- **Requisito Relacionado**: higiene de tests (no RF funcional)
- **PR**: PR-T1 (`test/e2e-cleanup-hygiene`)
- **Criterio EARS**: Cuando se ejecutan 3 corridas E2E consecutivas, el COUNT de `evaluacion.convocatorias` es idéntico al baseline antes y después de cada corrida.
- **Acción**: `MODIFICAR` (tests)
- **Archivos Afectados**:
  - `test/real-db-evaluations.e2e-spec.ts` (orden de DELETE en `beforeAll`/`afterAll` global; `try/finally` con DELETE por `convocatoria_id` en describes 6a y 6b)
- **Dependencias**: ninguna
- **Descripción**: Corregir el leak de filas en `evaluacion.convocatorias` producido por los describes 6a y 6b de `real-db-evaluations.e2e-spec.ts`. El fix tiene dos partes: (1) invertir el orden de DELETE en los bloques de limpieza `beforeAll`/`afterAll` global para que `evaluacion.convocatorias` se borre antes que `evaluacion.convocatoria_protocolos` (la FK es ON DELETE CASCADE); (2) añadir `try/finally` en cada `it` de 6a y 6b con DELETE explícito por `convocatoria_id`, patrón idéntico al de 9a/9b.
  - **Nota de riesgo residual**: el endpoint legacy `POST /api/evaluations/calls` genera `numero_convocatoria` con COUNT+1 no atómico y puede acumular filas espurias bajo carga. Ese problema es independiente y queda fuera de alcance de esta tarea.
- **Tests**: `npx jest --config ./test/jest-e2e.json --forceExit --runInBand` (real-db-evaluations.e2e-spec.ts). Verificar con `SELECT COUNT(*) FROM evaluacion.convocatorias` antes y después de cada corrida.
- **Criterio "Hecho cuando:"**: El COUNT de `evaluacion.convocatorias` es idéntico antes y después de 3 corridas E2E consecutivas (TZ=UTC, TZ=America/Guayaquil, TZ=UTC).

### Task TSK-009-N08 - [x] MERGEADO (PR-X1, dev 699afcf)
- **ID Único**: `TSK-009-N08`
- **Requisito Relacionado**: `RF-09.1` (EARS criterio 4: notificación por correo con PDF al crear convocatoria)
- **PR**: PR-X1 (`feat/meeting-notification-email`)
- **Criterio EARS**: Cuando se crea una convocatoria vía `POST /api/evaluations/meetings`, todos los usuarios con rol `EVALUADOR` o `PRESIDENTE` reciben un correo con el PDF del orden del día adjunto.
- **Archivos Afectados**:
  - `src/modules/evaluations/domain/ports/meeting-pdf-generator.port.ts` (MODIFICAR — return type `Promise<string>` → `Promise<{ url: string; buffer: Buffer }>`)
  - `src/modules/evaluations/infrastructure/adapters/meeting-pdf-generator.adapter.ts` (MODIFICAR — devolver `{ url, buffer }` en lugar de solo la URL)
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts` (MODIFICAR — añadir inyección de `IEmailServicePort` e `IUserRepository`; paso 8 fire-and-forget `notifyMembersAsync`)
  - `src/modules/evaluations/application/services/create-meeting.use-case.spec.ts` (MODIFICAR — mocks de email y users; tests TSK-009-N08 a/b/c/d/e)
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.spec.ts` (MODIFICAR — actualizar mock de `generateAgendaPdf` a `{ url, buffer }`)
  - `test/meetings.e2e-spec.ts` (MODIFICAR — mock `generateAgendaPdf` a `{ url, buffer }`; añadir `overrideProvider(IEmailServicePort)`)
  - `test/meetings-concurrency.e2e-spec.ts` (MODIFICAR — ídem)
  - `test/real-db-evaluations.e2e-spec.ts` (MODIFICAR — nuevo describe TSK-009-N08: correo y PDF mockeados, verificar `sendCallNotification` llamado)
- **Dependencias**: `TSK-009-N07`
- **Decisiones de paridad**: Flujo legacy `calls.service.ts:322-372` emite correo sincrónicamente. El flujo canónico `/meetings` lo hace fire-and-forget (void) post-commit para no bloquear la respuesta HTTP. Casos C2/C3/C5 descartados por no corresponder al flujo canónico. Caso C4 cubierto por `/api/resolutions` + RF-14. El flujo `/calls` sigue en paralelo sin modificación.
- **Descripción**: Portar la notificación por correo con PDF adjunto a `CreateMeetingUseCase`. La URL del PDF es determinista (`/api/evaluations/meetings/${id}/pdf`) y se devuelve sin `await` del generador. La generación del PDF y el envío de correos se realizan en `notifyMembersAsync` (fire-and-forget): obtiene miembros con roles `EVALUADOR`/`PRESIDENTE` via `IUserRepository.findByRoleCodes`, genera el PDF, y envía correos vía `IEmailServicePort.sendCallNotification`. Errores en el paso asíncrono solo se loguean, nunca propagan al caller.
- **Tests**: Tests unitarios (a–e) en `create-meeting.use-case.spec.ts`. Test E2E describe `TSK-009-N08` en `real-db-evaluations.e2e-spec.ts` (prefijo `TEST-N08-`, COUNT = 65). Tests de regresión en `meetings.e2e-spec.ts` y `meetings-concurrency.e2e-spec.ts`.
- **Criterio "Hecho cuando:"**: `POST /api/evaluations/meetings` retorna HTTP 201 con `agendaPdfUrl`; tras la respuesta, `sendCallNotification` se invoca una vez por cada miembro activo con rol `EVALUADOR` o `PRESIDENTE`, con el buffer del PDF correcto. Fallos en PDF o correo no propagan error HTTP.

### Task TSK-009-N09 - [x] MERGEADO (PR-D1, dev 0b1e1e5)
- **ID Único**: `TSK-009-N09`
- **Requisito Relacionado**: `RF-09.2` / `RF-15.2`
- **PR**: PR-D1 (`feat/meeting-followup-guard`)
- **Criterio EARS**: Guard fail-fast: cuando `POST /api/evaluations/meetings` recibe `followUpReportIds` no vacío, responde 400 con código `SEGUIMIENTO_NO_DISPONIBLE` y no persiste ninguna fila en `evaluacion.convocatorias`.
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts` (MODIFICAR — guard al inicio de `execute()`)
  - `src/modules/evaluations/application/dtos/create-meeting.dto.ts` (MODIFICAR — descripción del campo `followUpReportIds`)
  - `src/modules/evaluations/application/services/create-meeting.use-case.spec.ts` (MODIFICAR — tests unitarios nuevos; reescritura de tests que usaban `followUpReportIds` como entrada válida)
  - `test/meetings.e2e-spec.ts` (MODIFICAR — reemplazar `followUpReportIds` como entrada válida por `protocolVersionIds`)
  - `test/meetings-concurrency.e2e-spec.ts` (MODIFICAR — ídem)
  - `test/real-db-evaluations.e2e-spec.ts` (MODIFICAR — nuevo describe TSK-009-N09)
- **Dependencias**: `TSK-009-N08`
- **Descripción**: Mientras no exista `seguimiento.informes_seguimiento` (PR-F1), `CreateMeetingUseCase` debe rechazar cualquier request con `followUpReportIds` no vacío con `BadRequestException('SEGUIMIENTO_NO_DISPONIBLE: ...')`, sin tocar la BD. La validación actúa también cuando se mezclan `protocolVersionIds` + `followUpReportIds`. Arrays vacíos (`[]`) y `undefined` NO activan el guard. El campo se mantiene en el DTO (no es breaking change del contrato JSON); solo se actualiza su descripción Swagger.
- **Tests**:
  1. Unit: `followUpReportIds` no vacío → 400 con código; mocks de repo/pdf/email NO llamados.
  2. Unit: mezcla `protocolVersionIds` + `followUpReportIds` → también 400; sin persistencia.
  3. Unit: `followUpReportIds: []` y `undefined` + `protocolVersionIds` → pasa el guard, crea convocatoria.
  4. E2E real-db: COUNT(*) de `evaluacion.convocatorias` idéntico antes y después; `finally` limpia cualquier fila espuria.
- **Criterio "Hecho cuando:"**: `POST /api/evaluations/meetings` con `followUpReportIds` no vacío responde 400 con código `SEGUIMIENTO_NO_DISPONIBLE` y no persiste nada en BD. `npm test` verde. E2E pendiente de ejecución por el usuario.

### Task TSK-009-N10 - [x] MERGEADO (PR-D2, dev f3fdbf9)
- **ID Único**: `TSK-009-N10`
- **Requisito Relacionado**: `RF-09.1` (integridad del Orden del Día)
- **PR**: PR-D2 (`feat/meeting-version-unique`)
- **Criterio EARS**: Guard fail-fast y constraint de BD: `protocolVersionIds` con elementos repetidos → 400 `VERSIONES_DUPLICADAS` listando los IDs repetidos; UNIQUE en BD como defensa en profundidad.
- **Acción**: `MODIFICAR` (use case + ORM) / `CREAR` (migración)
- **Archivos Afectados**:
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts` (MODIFICAR — guard `VERSIONES_DUPLICADAS` al inicio de `execute()`, antes del guard `SEGUIMIENTO_NO_DISPONIBLE`)
  - `src/migrations/1851000000000-AddUniqueConvocatoriaProtocolosVersion.ts` (CREAR — constraint `uq_convocatoria_protocolos_version UNIQUE (convocatoria_id, version_id)`; idempotente; pre-check que aborta si hay duplicados en BD)
  - `src/modules/evaluations/infrastructure/database/entities/convocatoria-protocolo.orm-entity.ts` (MODIFICAR — `@Unique('uq_convocatoria_protocolos_version', ['convocatoriaId', 'versionId'])`)
  - `src/modules/evaluations/application/services/create-meeting.use-case.spec.ts` (MODIFICAR — describe TSK-009-N10, tests N10-a/b/c)
  - `test/real-db-evaluations.e2e-spec.ts` (MODIFICAR — describe TSK-009-N10, tests TEST-N10-01/02)
- **Dependencias**: `TSK-009-N09`
- **Descripción**: Cierra el bug latente diagnosticado en PR-D1: si `protocolVersionIds` contiene el mismo ID más de una vez, `CreateMeetingUseCase` debe lanzar `BadRequestException('VERSIONES_DUPLICADAS: ...')` listando los IDs repetidos, sin llegar a la BD. El guard actúa antes del guard `SEGUIMIENTO_NO_DISPONIBLE`. No se deduplica en silencio. La migración 1851 añade `UNIQUE (convocatoria_id, version_id)` en `evaluacion.convocatoria_protocolos` (constraint `uq_convocatoria_protocolos_version`) como defensa en profundidad: pre-verifica ausencia de duplicados, es idempotente y usa `DROP CONSTRAINT IF EXISTS` en `down()`.
- **Tests**:
  1. Unit (N10-a): `protocolVersionIds: [100, 101, 100]` → `BadRequestException` con `VERSIONES_DUPLICADAS` y `"100"` en el mensaje; repo/pdf/email NO llamados.
  2. Unit (N10-b): `protocolVersionIds: [137, 138]` → no lanza excepción (pasa el guard).
  3. Unit (N10-c): `protocolVersionIds: [137]` → no lanza excepción (pasa el guard).
  4. E2E real-db (TEST-N10-01): `POST /api/evaluations/meetings` con `protocolVersionIds: [991, 991]` → 400 `VERSIONES_DUPLICADAS`; COUNT(*) de `evaluacion.convocatorias` idéntico antes y después.
  5. E2E real-db (TEST-N10-02): inserción directa de dos filas con el mismo `(convocatoria_id, version_id)` en `evaluacion.convocatoria_protocolos` → error PostgreSQL código `23505`. **REQUIERE migración 1851 aplicada en `ceish_test_db` antes de ejecutar**.
- **Criterio "Hecho cuando:"**: Guard rechaza 400 con `VERSIONES_DUPLICADAS` antes de tocar BD; migración 1851 crea el UNIQUE idempotentemente en ambas bases; `npm test` verde; E2E pendiente de ejecución por el usuario.

---

### Task TSK-009-N11 - [x] COMPLETADA
- **ID Único**: `TSK-009-N11`
- **Requisito Relacionado**: `RF-09.1` (contrato estable de la API de convocatorias)
- **PR**: PR-M1 (`feat/meeting-stable-contract`)
- **Criterio EARS**: DTOs de respuesta estables para GET /meetings, GET /meetings/:id, GET /meetings/pending-protocols. Sin fuga de ORM ni PII. Swagger documentado.
- **Acción**: `CREAR` (DTOs, mappers, helper) / `MODIFICAR` (entidad de dominio, port, repositorio, controller, tests)
- **Archivos Afectados**:
  - `src/modules/evaluations/application/dtos/response/meeting-summary.dto.ts` (CREAR)
  - `src/modules/evaluations/application/dtos/response/meeting-detail.dto.ts` (CREAR)
  - `src/modules/evaluations/application/dtos/response/pending-protocol.dto.ts` (CREAR)
  - `src/modules/evaluations/application/mappers/meeting.mapper.ts` (CREAR)
  - `src/modules/evaluations/application/mappers/meeting.mapper.spec.ts` (CREAR)
  - `src/shared/utils/meeting-pdf-url.helper.ts` (CREAR)
  - `src/modules/evaluations/domain/entities/meeting.entity.ts` (MODIFICAR — añadir MeetingDetailEntity, AgendaProtocolItem, PendingProtocolItem)
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts` (MODIFICAR — tipos honestos en findById/findAll/findPendingProtocols)
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` (MODIFICAR — mapeo ORM→dominio)
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts` (MODIFICAR — usar mappers, @ApiOkResponse)
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts` (MODIFICAR — helper PDF URL)
  - `src/modules/evaluations/infrastructure/adapters/meeting-pdf-generator.adapter.ts` (MODIFICAR — helper PDF URL)
  - `src/shared/utils/to-safe-date.util.ts` (CREAR — normaliza `Date|string|null → Date|null`)
  - `src/shared/utils/to-safe-date.util.spec.ts` (CREAR — 7 tests)
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.spec.ts` (CREAR — tolerancia a fechas string del ORM)
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.spec.ts` (MODIFICAR — nuevo contrato)
  - `test/meetings.e2e-spec.ts` (MODIFICAR — nuevo contrato)
  - `test/evaluations-contract.e2e-spec.ts` (MODIFICAR — mocks con MeetingDetailModel / MeetingSummaryModel)
  - `test/real-db-evaluations.e2e-spec.ts` (MODIFICAR — TEST-M1-01, TEST-M1-02, TEST-M1-03)
- **Dependencias**: `TSK-009-N10`
- **Descripción**:
  1. Crear `MeetingSummaryDto`, `MeetingDetailDto`, `PendingProtocolDto` en `application/dtos/response/`.
  2. Crear `meeting.mapper.ts` con funciones puras `toSummary()`, `toDetail()`, `toPendingProtocol()`.
  3. Extraer helper `meetingPdfUrl(id: string): string` en `shared/utils/`, reemplazando las dos fuentes actuales.
  4. Ampliar `meeting.entity.ts` con `MeetingDetailEntity`, `AgendaProtocolItem`, `PendingProtocolItem`.
  5. Hacer honestos los tipos de `findById`, `findAll`, `findPendingProtocols` en el port.
  6. Mapear ORM→dominio en `findById`, `findAll`, `findPendingProtocols` del repositorio TypeORM.
  7. Quitar joins innecesarios de `findAll` (solo `lugar` y count de protocolos).
  8. Actualizar `getMeeting`, `getMeetings`, `getPendingProtocols` en el controller para usar los mappers.
  9. Documentar con `@ApiOkResponse` en Swagger.
  10. Actualizar `meetings.controller.spec.ts` y `test/meetings.e2e-spec.ts`.
- **Tests**:
  1. Unit mapper: detalle completo; place null; protocols vacíos; investigador null; fechas ISO; exactitud de claves.
  2. Unit mapper pending: `protocolId ≠ versionId`; email no aparece en respuesta.
  3. Controller spec: actualizado para el nuevo contrato.
  4. E2E meetings: `GET /meetings` → `data[]` con campos ingleses; `GET /meetings/:id` → `data.meetingNumber`; `GET /pending-protocols` → `data[]` con `protocolId`, `versionId`.
- **Criterio "Hecho cuando:"**: `npx tsc --noEmit` limpio; `npm test` verde (≥257 tests); E2E meetings verde; ningún campo ORM ni PII (email/teléfono) en respuestas; `agendaPdfUrl` generado por helper único.

**Contrato final de los 3 endpoints (Ronda 3):**

Raíz del 500 original: `meetingDate` y `evalSubmissionDeadline` son nullable en el ORM; el repositorio no asume no-nulos — `toSafeDate()` normaliza `Date|string|null → Date|null` antes de serializar.

- `GET /api/evaluations/meetings` → `{ statusCode, message, data: MeetingSummaryDto[], meta: { total, page, limit } }`. Campos `meetingDate` y `evalSubmissionDeadline`: `string | null` (ISO 8601). Campo adicional `agendaPdfUrl: string` en cada elemento. Orden: `fechaReunion` descendente, NULLS LAST.
- `GET /api/evaluations/meetings/:id` → `{ statusCode, message, data: MeetingDetailDto }`. Incluye `protocols: AgendaProtocolDto[]` ordenados por `order` ASC. `normativeDeadline: string | null`. `protocolId` y `versionId` son `number | null` (ítems de seguimiento pueden tener ambos nulos).
- `GET /api/evaluations/meetings/pending-protocols` → `{ statusCode, message, data: PendingProtocolDto[] }`. Campos `receptionDate` y `deadline`: `string | null`. `protocolId ≠ versionId` (son IDs distintos de tablas distintas).
- Ningún campo de ORM ni PII (email, teléfono) aparece en ninguna respuesta.
- `meetingDate` y `evalSubmissionDeadline` son nullable (timestamptz NULL en BD); en ceish_test_db 1 de 65 convocatorias (`000-2026`) las tiene en NULL. La lista ordena `fechaReunion` descendente con NULLS LAST.

Resultados finales: `npm test` 290 tests, 49 suites ✓ — E2E 93 tests, 7 suites ✓ — `npx tsc --noEmit` limpio ✓.

---

### Task TSK-009-N12 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N12`
- **Requisito Relacionado**: `RF-09.1` (integridad del adapter de PDF)
- **PR**: PR-X2 (pendiente)
- **Criterio EARS**: `generateAgendaPdf` no reinserta una convocatoria borrada entre el `findOne` y la escritura del campo `ordenDiaPdfPath`.
- **Acción**: `MODIFICAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/infrastructure/adapters/meeting-pdf-generator.adapter.ts` (MODIFICAR — reemplazar `save(meeting)` por `update(id, { ordenDiaPdfPath })` parcial)
  - `src/modules/evaluations/infrastructure/adapters/meeting-pdf-generator.adapter.spec.ts` (MODIFICAR — test que borra la convocatoria entre `findOne` y la escritura)
- **Dependencias**: `TSK-009-N11`
- **Descripción**:
  En `meeting-pdf-generator.adapter.ts:24-27` se carga la entidad con `findOne`; en las líneas 82-83 se asigna `meeting.ordenDiaPdfPath = relativeUrl` y se persiste con `convocatoriaRepo.save(meeting)`. TypeORM `save()` con un entity que tiene `id` definido intenta `UPDATE`; si la fila fue borrada entre el `findOne` y el `save` (ventana de carrera con `notifyMembersAsync` fire-and-forget en `create-meeting.use-case.ts:158`), TypeORM hace `INSERT` y **reinserta la fila borrada**.
  Fix: reemplazar `convocatoriaRepo.save(meeting)` por `convocatoriaRepo.update(meeting.id, { ordenDiaPdfPath: relativeUrl })`. El método `update()` emite solo un `UPDATE ... WHERE id = $1` sin `INSERT` de respaldo; si la fila no existe, el comando no afecta ninguna fila (no lanza ni reinserta).
  Test a añadir: spy sobre `convocatoriaRepo.delete` o `convocatoriaRepo.remove` — borra la fila entre `findOne` y la escritura y verifica que la fila sigue sin existir después del `update`.
- **Tests**:
  1. Unit: mock de `convocatoriaRepo.findOne` que devuelve la entidad, luego `delete` que borra la fila, luego verificación de que `convocatoriaRepo.update` fue llamado con `(id, { ordenDiaPdfPath })` y NO con `save`.
  2. Unit negativo: si `findOne` retorna `null`, el adapter lanza `NotFoundException` (comportamiento existente, sin cambio).
- **Criterio "Hecho cuando:"**: `convocatoriaRepo.update` reemplaza a `convocatoriaRepo.save` en el adapter; test unitario que simula la carrera pasa; `npx tsc --noEmit` limpio; `npm test` verde.

### Task TSK-009-N13 - [x] COMPLETADA
- **ID Único**: `TSK-009-N13`
- **Requisito Relacionado**: `RF-09.1` (legibilidad/contrato API — lugares)
- **PR**: PR-M2 (`feat/meeting-places-contract`)
- **Criterio EARS**: Los endpoints de `/meetings/places` no exponen campos ORM ni PII; retornan envelope `{statusCode, message, data}`; el listado excluye inactivos por defecto.
- **Acción**: `MODIFICAR` + `CREAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/domain/entities/meeting.entity.ts` (MODIFICAR — añadir `MeetingPlaceFullModel`)
  - `src/modules/evaluations/domain/ports/meeting-repository.port.ts` (MODIFICAR — reemplazar `MeetingPlaceItem` → `MeetingPlaceFullModel`, añadir `FindPlacesOptions`)
  - `src/modules/evaluations/infrastructure/repositories/meeting-typeorm.repository.ts` (MODIFICAR — `mapPlaceFull`, filtro `activo=true` por defecto, retornos tipados)
  - `src/modules/evaluations/application/services/create-meeting.use-case.ts` (MODIFICAR — `place?.nombre` → `place?.name`)
  - `src/modules/evaluations/application/dtos/response/meeting-summary.dto.ts` (MODIFICAR — renombrar `MeetingPlaceDto` → `PlaceEmbedDto`)
  - `src/modules/evaluations/application/dtos/response/meeting-place.dto.ts` (CREAR — `MeetingPlaceDto` con `isActive`, `PlaceListResponseDto`, `PlaceSingleResponseDto`)
  - `src/modules/evaluations/application/dtos/find-places-query.dto.ts` (CREAR — `FindPlacesQueryDto` con `includeInactive` booleano)
  - `src/modules/evaluations/application/mappers/meeting-place.mapper.ts` (CREAR — `toPlaceDto`)
  - `src/modules/evaluations/application/mappers/meeting-place.mapper.spec.ts` (CREAR — 5 tests del mapper)
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.ts` (MODIFICAR — envelope en 5 rutas places, `@ApiQuery`, `@ApiCreatedResponse`)
  - `src/modules/evaluations/infrastructure/controllers/meetings.controller.spec.ts` (MODIFICAR — 8 tests nuevos de places)
  - `test/evaluations-contract.e2e-spec.ts` (MODIFICAR — mocks MeetingPlaceFullModel, aserciones envelope)
  - `test/meetings.e2e-spec.ts` (MODIFICAR — mocks createPlace/updatePlace → MeetingPlaceFullModel)
  - `test/real-db-evaluations.e2e-spec.ts` (MODIFICAR — body.id → body.data?.id, añadir describe TEST-M2 con 7 tests)
- **Dependencias**: `TSK-009-N11`
- **Descripción**:
  Los endpoints de `/meetings/places` devolvían directamente objetos ORM (`LugarOrmEntity`) con nombres en español (`nombre`, `esVirtual`, `activo`) y sin envelope. Esta tarea estabiliza el contrato:
  - `GET /meetings/places` → `data: MeetingPlaceDto[]` (solo activos por defecto; `includeInactive=true` opcional; 400 si valor inválido)
  - `GET /meetings/places/:id` → `data: MeetingPlaceDto` (ParseUUIDPipe; 404 si no existe; inactivo SÍ accesible por id)
  - `POST /meetings/places` → 201, `data: MeetingPlaceDto`
  - `PATCH /meetings/places/:id` → 200, `data: MeetingPlaceDto`
  - `DELETE /meetings/places/:id` → soft delete, `{statusCode, message}`
  `MeetingPlaceDto = { id, name, address, isVirtual, meetingLink, isActive }` (inglés camelCase, sin ORM leak).
  `CreatePlaceDto/UpdatePlaceDto` mantienen `@Transform` por compatibilidad con nombres en español.
- **Tests**:
  1. Unit mapper: 5 tests (claves exactas, sin ORM leak, nulls, isActive, virtual).
  2. Unit controller: 8 tests (GET list + filtro + sin ORM leak, GET by id + 404, POST 201, PATCH, DELETE).
  3. E2E TEST-M2 (real-db): 7 tests (POST, GET list, GET/:id, soft-delete + includeInactive + GET/:id inactivo, PATCH, includeInactive=invalido→400, baseline). M2-06 eliminado: `@Transform` legacy no actúa sin la clave canónica (ver TSK-009-N15). `DELETE /places/:id` responde `{statusCode, message}` sin campo `data`. Las requests HTTP de TEST-M2 llevan `x-forwarded-for: 10.0.0.1` para evitar el límite de DosDefenseMiddleware (ver TSK-SEC-01).
- **Criterio "Hecho cuando:"**: `npx tsc --noEmit` limpio; `npm test` verde (309/309); E2E 100/100; contrato de places documentado.

### Task TSK-009-N15 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N15`
- **Requisito Relacionado**: `RF-09.1` (alias legacy en DTOs de places)
- **Descripción**:
  `CreatePlaceDto/UpdatePlaceDto` declaran `@Transform` en el campo `name` para leer `obj.nombre` cuando `name` no viene en el body. Sin embargo, en class-transformer 0.5.1 el `@Transform` no se ejecuta si la clave decorada (`name`) está ausente del objeto plano de entrada. Consecuencia: `POST /meetings/places` con solo `{ nombre: 'X' }` devuelve 400 (falló `@IsNotEmpty()` en `name`), a pesar de que el `@Transform` debería cubrir ese caso. Verificado con `plainToInstance + validate`: solo `{ nombre: X }` → `name: undefined, errors: [name:isNotEmpty,isString]`; solo `{ name: X }` → NONE.
  Decidir: (a) corregir los alias usando `@Transform` en el campo `nombre` para poblarlo desde `name` cuando el cliente envía la clave canónica, o usar un DTO separado de entrada; (b) eliminar los alias legacy para simplificar el contrato y documentar que solo se aceptan las claves canónicas (`name`, `location`, `isVirtual`, etc.). No implementar sin decisión explícita.
- **Archivos Afectados**: `src/modules/evaluations/application/dtos/create-place.dto.ts` (MODIFICAR)
- **Dependencias**: `TSK-009-N13`

### Task TSK-009-N14 - [ ] PENDIENTE
- **ID Único**: `TSK-009-N14`
- **Requisito Relacionado**: `RF-09.1` (integridad de lugares en convocatoria)
- **Descripción**:
  `POST /meetings` acepta `locationId` de un lugar inactivo (`activo = false`). `CreateMeetingUseCase` llama a `findPlaceById`, que devuelve el lugar sin filtrar por `activo`. Si la secretaría desactiva un lugar y luego crea una convocatoria con ese `locationId`, la convocatoria queda ligada a un lugar fuera de servicio sin aviso. Validar en el use case: si el lugar existe pero `isActive = false`, rechazar con 400 y código `LUGAR_INACTIVO`. No implementado.
- **Archivos Afectados**: `src/modules/evaluations/application/services/create-meeting.use-case.ts` (MODIFICAR)
- **Dependencias**: `TSK-009-N13`

### Task TSK-SEC-01 - [ ] PENDIENTE
- **ID Único**: `TSK-SEC-01`
- **Requisito Relacionado**: Seguridad transversal (DosDefenseMiddleware)
- **Descripción**:
  `DosDefenseMiddleware.extractIp` confía en `X-Forwarded-For` sin validar que el proxy emisor sea de confianza: un cliente externo puede evadir el rate limit y la lista negra rotando ese header libremente. Adicionalmente, `requestHistory` y `blacklist` son `Map` en memoria sin tope máximo de entradas ni TTL de expiración por inactividad; bajo un ataque con IPs inventadas el mapa crece sin límite. Correcciones a implementar en PR aparte (`fix/dos-defense-forwarded-for`): (a) configurar trust proxy explícito en `main.ts`/Express y usar `req.ip` en lugar de leer `X-Forwarded-For` directamente; (b) añadir tope de tamaño al mapa o expiración activa de entradas inactivas. Descubierto durante PR-M2 (workaround de tests: `x-forwarded-for: 10.0.0.1`); no tocado aquí.
- **Archivos Afectados**: `src/shared/middleware/dos-defense.middleware.ts` (MODIFICAR), `src/main.ts` (MODIFICAR)
- **Dependencias**: ninguna
