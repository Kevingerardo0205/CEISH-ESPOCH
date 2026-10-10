# Desglose de Tareas de Implementación (TDD): RF-14 Ciclo Multiversión e Inmutabilidad de Aprobados

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.4.1, HU-014, RF-14)  
**Plan Técnico de Referencia:** `specs/003-flujo-mvp/plan-rf14-multiversion.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/tasks-rf14-multiversion.md`  
**Metodología:** TDD Estricto (Test Red ➔ Implementation Green ➔ Refactor), Arquitectura Hexagonal.

---

## Leyenda de Notaciones
- `[P]`: Tarea ejecutable en paralelo con otras del mismo bloque (sin dependencias cruzadas).
- `EARS 1`: Auto-Generación de Versión Mayor (v1.0 ➔ v2.0) y asignación del plazo normativo de `plazo_condicion_dias` días hábiles (inicial 30).
- `EARS 2`: Inmutabilidad y Congelamiento Documental (🔒) de requisitos `APROBADO` / `NO_APLICA` y reseteo a `NO_PRESENTADO` solo de observados/rechazados.
- `EARS 3`: Incremento dinámico sin límite duro hasta dictamen explícito `RECHAZADO` y formateo de presentación `v${numero_version}.0`.

---

## Fase 1: Setup y Estructura Base

### Task T001 [P]
- **Descripción**: Crear directorios hexagonales para el versionamiento dentro del módulo `protocols`.
- **Archivos Afectados**:
  - `src/modules/protocols/domain/entities/`
  - `src/modules/protocols/application/dtos/`
  - `src/modules/protocols/application/services/`
  - `src/modules/protocols/infrastructure/controllers/`
- **Dependencias**: Ninguna
- **Cobertura Plan**: Sección 2 (Estructura de Módulos)

### Task T002 [P]
- **Descripción**: Mapear la entidad ORM `VersionProtocoloOrmEntity` (`protocolos.versiones_protocolo`) asegurando el campo `numero_version` como `integer` y el plazo normativo de `plazo_condicion_dias` días hábiles (inicial 30).
- **Archivos Afectados**: `src/modules/protocols/infrastructure/database/entities/version-protocolo.orm-entity.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 2 (Entidades ORM), `EARS 1`

### Task T003 [P]
- **Descripción**: Mapear la entidad ORM `RequisitoVersionOrmEntity` (`protocolos.requisitos_version`) incluyendo la bandera `es_congelado` (BOOLEAN).
- **Archivos Afectados**: `src/modules/protocols/infrastructure/database/entities/requisito-version.orm-entity.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 2 (Entidades ORM), `EARS 2`

---

## Fase 2: Tests Unitarios de Dominio (TDD Red)

### Task T004 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para la función formateadora de versión `formatVersionForPresentation` (enteros `1, 2, 3` ➔ `"v1.0", "v2.0", "v3.0"`).
- **Archivos Afectados**: `src/modules/protocols/application/mappers/version-formatter.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmo C), `EARS 3`

### Task T005 [P]
- **Descripción**: Escribir prueba unitaria en ROJO para el servicio de congelamiento de requisitos `FreezeRequirementsService`, verificando inmutabilidad (🔒) de `APROBADO` / `NO_APLICA` y reseteo a `NO_PRESENTADO` para `OBSERVADO` / `RECHAZADO`.
- **Archivos Afectados**: `src/modules/protocols/domain/services/freeze-requirements.service.spec.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 4 (Algoritmo B), `EARS 2`

### Task T006
- **Descripción**: Escribir prueba unitaria en ROJO para el caso de uso `CreateNextVersionUseCase` comprobando:
  - Incremento de `numero_version` (+1)
  - Asignación de `plazo_condicion_dias` días hábiles de plazo (inicial 30)
  - Caso límite: Dictamen `RECHAZADO` cierra/archiva el expediente sin crear v2.0
  - Caso límite: Transición atómica de versión anterior `es_activa = false` a nueva versión `es_activa = true`.
- **Archivos Afectados**: `src/modules/protocols/application/services/create-next-version.use-case.spec.ts`
- **Dependencias**: T004, T005
- **Cobertura Plan**: Sección 4 (Algoritmos A y B), `EARS 1`, `EARS 3`

---

## Fase 3: Core y Lógica de Dominio (TDD Green)

### Task T007
- **Descripción**: Implementar `formatVersionForPresentation` haciendo pasar la prueba unitaria T004 (`v${numero_version}.0`).
- **Archivos Afectados**: `src/modules/protocols/application/mappers/version-formatter.ts`
- **Dependencias**: T004
- **Cobertura Plan**: Sección 4 (Algoritmo C), `EARS 3`

### Task T008
- **Descripción**: Implementar `FreezeRequirementsService` haciendo pasar T005 (congelamiento de `APROBADO`/`NO_APLICA` manteniendo referencia de archivo, y reseteo a `NO_PRESENTADO` con `archivo_id = NULL` para observados).
- **Archivos Afectados**: `src/modules/protocols/domain/services/freeze-requirements.service.ts`
- **Dependencias**: T005
- **Cobertura Plan**: Sección 4 (Algoritmo B), `EARS 2`

### Task T009
- **Descripción**: Implementar `CreateNextVersionUseCase` haciendo pasar T006 (incremento de entero en BD, `plazo_condicion_dias` días hábiles (inicial 30), cierre ante dictamen `RECHAZADO`).
- **Archivos Afectados**: `src/modules/protocols/application/services/create-next-version.use-case.ts`
- **Dependencias**: T006, T007, T008
- **Cobertura Plan**: Sección 4 (Algoritmos A, B y C), `EARS 1`, `EARS 3`

---

## Fase 4: API REST, DTOs e Integración Transaccional Atómica

### Task T010 [P]
- **Descripción**: Crear DTO `CreateNextVersionDto` con validaciones `class-validator` para el dictamen del Pleno.
- **Archivos Afectados**: `src/modules/protocols/application/dtos/create-next-version.dto.ts`
- **Dependencias**: T001
- **Cobertura Plan**: Sección 5 (Contrato API REST)

### Task T011
- **Descripción**: Implementar en `ProtocolVersionTypeOrmRepository` la transacción atómica que inactiva v1.0, crea v2.0 y ejecuta el congelamiento de requisitos dentro del mismo `QueryRunner`.
- **Archivos Afectados**: `src/modules/protocols/infrastructure/repositories/protocol-version-typeorm.repository.ts`
- **Dependencias**: T002, T003, T009
- **Cobertura Plan**: Sección 4 (Algoritmos A y B), Integración Atómica

### Task T012
- **Descripción**: Crear el controlador `ProtocolVersionsController` exponiendo `POST /api/protocols/:id/versions/next` y `GET /api/protocols/:id/versions/active/checklist`.
- **Archivos Afectados**: `src/modules/protocols/infrastructure/controllers/protocol-versions.controller.ts`
- **Dependencias**: T010, T011
- **Cobertura Plan**: Sección 5 (Contrato API REST)

### Task T013
- **Descripción**: Registrar controladores, repositorios y servicios en `ProtocolsModule`.
- **Archivos Afectados**: `src/modules/protocols/protocols.module.ts`
- **Dependencias**: T012
- **Cobertura Plan**: Sección 2 (Estructura de Módulos)

---

## Fase 5: Pruebas E2E y Verificación Obligatoria

### Task T014
- **Descripción**: Crear prueba E2E `protocol-versions.e2e-spec.ts` validando la generación de v2.0 tras dictamen "Requiere Subsanación", verificando que los requisitos congelados muestren `isFrozen: true` y no permitan edición.
- **Archivos Afectados**: `test/protocol-versions.e2e-spec.ts`
- **Dependencias**: T013
- **Cobertura Plan**: Sección 7 (Estrategia E2E), `EARS 1`, `EARS 2`, `EARS 3`

### Task T015
- **Descripción**: Verificación obligatoria de la Constitución: `npm test`, `npm run test:e2e`, `npm run lint` y `npm run format`.
- **Archivos Afectados**: Todo el proyecto.
- **Dependencias**: T014
- **Cobertura Plan**: Sección 7 (Definition of Done), Constitución del Proyecto
