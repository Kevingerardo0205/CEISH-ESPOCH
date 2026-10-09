# Desglose de Tareas de Implementación (TDD): RF-09 Gestión de Convocatorias a Sesiones del Pleno y Orden del Día Clasificado

**Código de Especificación:** `specs/003-flujo-mvp/spec.md` (Versión 1.3.0, HU-007, RF-09.1, RF-09.2, RF-15.2)  
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
- `EARS 2`: Registro de 3 fechas normativas con validación dura `fecha_entrega_evaluacion < fecha_reunion`.
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
- **Acción**: `REUTILIZAR`
- **Archivos Afectados**:
  - `src/modules/evaluations/domain/value-objects/meeting-number.vo.ts`
  - `src/modules/evaluations/domain/value-objects/meeting-dates.vo.ts`
  - `src/modules/evaluations/application/services/calculate-meeting-dates.service.ts`
- **Dependencias**: Ninguna
- **Precondiciones**: Ninguna
- **Descripción**: Value Objects y servicios de dominio para validación dura de precedencia (`fecha_entrega_evaluacion < fecha_reunion`), cálculo de jueves previo y formateo de correlativo `001-2026`.
- **Tests**: `meeting-number.vo.spec.ts`, `meeting-dates.vo.spec.ts`, `calculate-meeting-dates.service.spec.ts`.
- **Criterio "Hecho cuando:"**: Tests unitarios en verde validando reglas de fechas y formato.

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
- **Dependencias**: `TSK-009-004`, `TSK-009-005`
- **Precondiciones**: Repositorio y DTOs listos.
- **Descripción**: Modificar `CreateMeetingUseCase` para:
  1. Validar precedencia dura mediante `MeetingDatesVO`.
  2. Validar que exista al menos un punto en el Orden del Día (evaluación o seguimiento).
  3. Delegar la persistencia atómica al repositorio.
  4. Invocar la generación de PDF oficial estructurado en 4 secciones.
- **Tests**: `create-meeting.use-case.spec.ts`.
- **Criterio "Hecho cuando:"**: Caso de uso coordina la creación completa y retorna el ID, número (`010-2026`) y URL del PDF.

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
