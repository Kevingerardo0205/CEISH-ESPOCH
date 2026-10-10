# Reconciliación Backend Exhaustiva — CEISH-ESPOCH

## 1. Propósito y Marco Metodológico

El propósito de este documento es auditar, contrastar y reconciliar de manera exhaustiva el estado real del backend en el repositorio **CEISH-ESPOCH** frente a la especificación técnica [`specs/003-flujo-mvp/spec.md`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/specs/003-flujo-mvp/spec.md) (Versión 1.4.1) y sus planes/tareas asociados.

Siguiendo las directrices de la [`constitution_v2.md`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/docs/doc_base/constitution_v2.md) para entornos Brownfield (Spec-Driven Development / SDD), esta auditoría se fundamenta en **evidencia técnica real e inmutable** extraída de la base de datos PostgreSQL, del código fuente, del compilador TypeScript y de la ejecución de pruebas.

---

## 2. Evidencia de la Realidad del Sistema (Base de Datos y Código)

### 2.1 Evidencia en Base de Datos (PostgreSQL en `localhost:3100`)

1. **Tabla `evaluacion.convocatorias`** (10 registros existentes):
   - Registro 1: `id = 'e15834e2-28d1-4155-9971-6f5fffe4c934'`, `numero_convocatoria = NULL`, `anio_lectivo = NULL`, `fecha_reunion = NULL` (registro huérfano / de prueba preliminar).
   - Registros 2 al 10: `numero_convocatoria` correlativos desde `'001-2026'` hasta `'009-2026'`, `anio_lectivo = 2026`, `fecha_reunion = '2026-04-16'`.
   - **Restricción actual**: No existe índice `UNIQUE` sobre `(anio_lectivo, numero_convocatoria)` a nivel de base de datos.
2. **Tabla `evaluacion.convocatoria_protocolos`** (8 registros existentes):
   - Clave primaria `id` (UUID), `convocatoria_id` (UUID FK), `protocolo_id` (INTEGER = 165), `version_id` (INTEGER = 137), `orden = 1`, `fecha_plazo_normativo` (TIMESTAMPTZ).
   - **Hallazgo**: Las columnas `protocolo_id` y `version_id` son actualmente `NOT NULL`. Esto impide registrar directamente puntos de la Sección I (Acta anterior) o ítems independientes sin protocolo asociado.
3. **Tabla `evaluacion.sesiones`** (0 registros):
   - La tabla existe pero está completamente vacía (0 filas). No existe flujo operativo activo sobre `SessionOrmEntity`.
4. **Tabla `catalogos.tipos_seguimiento`** (0 registros):
   - La tabla existe en el esquema `catalogos` pero no contiene filas cargadas.
5. **Tabla `catalogos.tipos_estudio`** (4 registros con metadatos de seguimiento existentes):
   - `IO` (Observacional): `requiere_informe_inicio = true`, `requiere_informe_final = true`, `periodicidad_informe_dias = 180`.
   - `EI` (Intervención): `requiere_informe_inicio = true`, `requiere_informe_final = true`, `periodicidad_informe_dias = 90`.
   - `EC` (Ensayo Clínico): `requiere_informe_inicio = true`, `requiere_informe_final = true`, `periodicidad_informe_dias = 90`.
   - `EX` (Exento): `requiere_informe_inicio = false`, `requiere_informe_final = true`, `periodicidad_informe_dias = 0`.
   - **Conclusión**: La lógica de periodicidad y requerimiento de informes ya está formalmente modelada y debe ser reutilizada, no reinventada.

### 2.2 Evidencia en Código Fuente y Arquitectura

1. **Duplicidad Convocatorias vs. Calls**:
   - Coexisten `MeetingsController` (`src/modules/evaluations/infrastructure/controllers/meetings.controller.ts`) y el legado `CallsController` (`calls.controller.ts`).
   - `MeetingsController` es el controlador canónico alineado a la Clean Architecture del Sprint 003. `CallsController` debe ser unificado/deprecado.
2. **Violación de Clean Architecture (Domain/Ports -> ORM Entity)**:
   - En `src/modules/evaluations/domain/ports/meeting-repository.port.ts`, el puerto importa directamente `ConvocatoriaOrmEntity` de la capa de infraestructura:
     ```typescript
     import { ConvocatoriaOrmEntity } from '../../infrastructure/database/entities/convocatoria.orm-entity';
     ```
   - Esto rompe el principio de Inversión de Dependencias (DIP) y la regla constitucional. El puerto debe retornar interfaces de dominio o tipos planos.
3. **Generación de PDF**:
   - `PdfGeneratorService` (`src/shared/utils/pdf-generator.service.ts`) contiene la lógica real de renderizado con `pdfkit` / `puppeteer`, pero el caso de uso `CreateMeetingUseCase` utiliza un mock en pruebas y no está completamente integrado al adaptador real con las 4 secciones normativas.
4. **Estado del Compilador TypeScript (`npx tsc --noEmit`)**:
   - La ejecución de `tsc --noEmit` reporta errores de tipado estricto en specs de meetings, comparaciones de enums en `submit-evaluation.use-case.ts` y tipos de `Permission` vs `Permissions`. SWC compila con éxito pero omite el type-checking estricto.

---

## 3. Estado Brownfield y Matriz de Reconciliación

| Requisito / Componente | Estado Actual Real | Estado Objetivo (To-Be) | Brecha / Delta | Acción Brownfield |
|---|---|---|---|---|
| **RF-09.1: Numeración Concurrente (`001-2026`)** | Funcional en memoria/QueryRunner básico, pero sin tabla de control ni `UNIQUE` constraint en PostgreSQL. | Numeración anual atómica garantizada con tabla `evaluacion.secuencias_convocatoria`, `UNIQUE(anio_lectivo, numero_secuencial)` y reintentos ante `23505`/`40001`. | Falta tabla de secuencias, constraint DB y retry handler. | **MODIFICAR / REFACTORIZAR** |
| **RF-09.2: Orden del Día en 4 Secciones** | La tabla `convocatoria_protocolos` solo acepta `protocolVersionIds` y no soporta reportes ni secciones. | Modelo estructurado de `AgendaItem` con `AgendaSectionType` (I, II, III, IV) y `AgendaItemType`. | Falta modelo discriminado de agenda y DTO con `followUpReportIds`. | **ADAPTAR / MODIFICAR** |
| **RF-09.1: Validación de 3 Fechas** | Implementada en `MeetingDatesVO` y `CalculateMeetingDatesService`. | Validación dura de precedencia (`evalDeadline > meetingDate`, entrega DESPUÉS de la reunión) y cálculo de +2 días hábiles a las 12:00 ECT. | Brecha: código implementa regla vieja (`<` y jueves previo); pendiente de PR de código. | **MODIFICAR (pendiente de código)** |
| **RF-09.1: Generación de PDF Orden del Día** | `PdfGeneratorService.generateCallPdf` existente pero desconectado del caso de uso. | Adaptador real `MeetingPdfGeneratorAdapter` integrado que renderiza las 4 secciones normativas. | Integrar puerto con servicio real y diseñar plantilla 4 secciones. | **MODIFICAR / ADAPTAR** |
| **RF-13.1: Observaciones Multilínea (`plazo_subsanacion_documental_dias`)** | Implementado en `ProtocolRequirementOrmEntity.observations` y `ReceptionService.finalizarRevision`. | Correo único consolidado con lista estructurada y `plazo_subsanacion_documental_dias` días hábiles. | Validar despacho en integración. | **REUTILIZAR / VERIFICAR** |
| **RF-14.1: Multiversión v1.0➔v2.0 (`plazo_condicion_dias`)** | Implementado en `ResolutionsService.createResolution` con congelamiento de aprobados y `plazo_condicion_dias` días (inicial 30). | Versión mayor `vX.0` en respuestas REST y plazo normativo de `plazo_condicion_dias` días hábiles. | Asegurar proyección `vX.0` en DTOs. | **REUTILIZAR / VERIFICAR** |
| **RF-15.1: Agenda Entregables Post-Aprobación** | Metadatos en `catalogos.tipos_estudio`. `src/modules/follow-up/` como scaffolding vacío. | Entidades `seguimiento.agenda_entregables` e `informes_seguimiento` con use cases de pre-cálculo y edición. | Implementar submódulo `follow-up`. | **CREAR** en `follow-up/` |
| **RF-15.2: Elevación a Pleno de Informes** | No existe conexión entre entregables y convocatorias. | Informes presentados pasan a estado `PRESENTADO` y se listan para la Sección III del Pleno. | Integración entre `follow-up` y `evaluations`. | **CREAR / ADAPTAR** |

---

## 4. Análisis Arquitectónico y Decisiones de Diseño

### 4.1 Análisis de Estrategias de Numeración Concurrente (`001-2026`)

Se evaluaron formalmente 5 opciones:
- **Opción A (SELECT MAX + FOR UPDATE)**: Vulnerable ante la primera convocatoria del año (`MAX` retorna null) y proclive a deadlocks bajo llamadas concurrentes sin fila previa.
- **Opción B (PostgreSQL Sequences)**: Las secuencias nativas de DB no se reinician anualmente sin jobs/triggers externos complejos y no soportan formato `001-AAAA`.
- **Opción C (Advisory Lock `pg_advisory_xact_lock`)**: Funcional pero acopla la lógica a hashes de 64 bits y no garantiza unicidad física en disco ante bypass manual.
- **Opción D (INSERT/UPDATE atómico + UNIQUE + retry)**: Maneja concurrencia pero puede generar huecos en la secuencia si la transacción se cancela tras consumir un valor.
- **Opción E (Seleccionada - Combinación de Mecanismos)**:
  1. Tabla de control de secuencias anuales `evaluacion.secuencias_convocatoria` (`anio_lectivo INT PK`, `ultimo_secuencial INT NOT NULL`).
  2. Transacción que ejecuta `INSERT INTO evaluacion.secuencias_convocatoria VALUES (anio, 1) ON CONFLICT (anio_lectivo) DO UPDATE SET ultimo_secuencial = secuencias_convocatoria.ultimo_secuencial + 1 RETURNING ultimo_secuencial;`.
  3. Restricción de integridad en base de datos: `UNIQUE (anio_lectivo, numero_secuencial)` o `UNIQUE (numero_convocatoria)` en `evaluacion.convocatorias`.
  4. Middleware de reintentos (Retry Loop con hasta 3 intentos) que captura códigos de error PostgreSQL `23505` (unique_violation) y `40001` (serialization_failure) con backoff exponencial suave (50ms, 150ms, 300ms).

### 4.2 Definición de "Año" del Correlativo
- **Evidencia**: En `evaluacion.convocatorias`, los 9 registros existentes poseen `anio_lectivo = 2026` y `fecha_reunion` en el año 2026. `spec.md` establece que el contador reinicia cada año lectivo.
- **Decisión Confirmada**: El año del correlativo corresponde al **año calendario de la `fecha_reunion`** (ej. 2026), el cual se sincroniza automáticamente con el campo `anio_lectivo`.

### 4.3 Modelo del Orden del Día y Secciones
- **Problema Detectado**: `convocatoria_protocolos` posee `protocolo_id NOT NULL` y `version_id NOT NULL`, lo que impide modelar la Sección I (Acta anterior) o ítems genéricos.
- **Decisión Arquitectónica**:
  - Implementar el modelo unificado de **Puntos del Orden del Día (`AgendaItem`)** que clasifica cada punto mediante dos dimensiones estrictamente tipadas:
    - `AgendaSectionType` (Sección): `ACTA_ANTERIOR` (I), `EVALUACION_DICTAMEN` (II), `SEGUIMIENTO_INFORMES` (III), `ASUNTOS_VARIOS` (IV).
    - `AgendaItemType` (Tipo de Ítem): `EVALUACION_INICIAL`, `SUBSANACION`, `INFORME_INICIO`, `INFORME_AVANCE`, `INFORME_FIN`.
  - Desacoplar la persistencia para permitir:
    - Puntos de evaluación vinculados a `protocolo_id` y `version_id`.
    - Puntos de seguimiento vinculados a `informe_seguimiento_id` y `protocolo_id`.
    - Puntos de acta o varios con metadatos descriptivos.

### 4.4 Sección I — Acta Anterior
- **Evidencia**: `evaluacion.sesiones` tiene 0 filas y no hay actas previas digitalizadas en la base de datos.
- **Decisión**: La Sección I se representa como una **sección estructural fija generada automáticamente** en el Orden del Día ("Lectura y aprobación del acta de la sesión plenaria anterior"), registrando como metadato el número de la última convocatoria concluida cuando exista.

### 4.5 Pronunciamiento del Seguimiento en Pleno (RF-15.2)
- **Requisito Confirmado**: El Pleno emite 4 desenlaces posibles sobre un informe de seguimiento:
  1. `APROBADO`: Informe satisfactorio; la investigación continúa su curso regular.
  2. `OBSERVADO`: Se solicitan aclaraciones al Investigador en un plazo de 15 días hábiles (valor del PET, por confirmar).
  3. `CONVALIDADO`: Se aprueba tras subsanar observaciones previas.
  4. `CIERRE_DEFINITIVO`: Aplica para el Informe Final (Anexo 8), concluyendo el aval ético y archivando el estudio con éxito.

---

## 5. Tratamiento y Backfill de Datos Existentes en Base de Datos

Para respetar la integridad de los datos productivos/de prueba existentes:
1. **Convocatoria Huérfana (`id = 'e15834e2...'`)**: Posee `numero_convocatoria = NULL`. Se aplicará una migración de backfill controlada que le asigne el número histórico `'000-2026'` o la marque como anulada/borrador, permitiendo aplicar la restricción `NOT NULL` y `UNIQUE` sobre `numero_convocatoria` sin errores.
2. **Convocatorias Existentes (`001-2026` a `009-2026`)**: Se preservan íntegramente. La tabla de control `evaluacion.secuencias_convocatoria` se inicializará con `ultimo_secuencial = 9` para el año 2026, garantizando que la próxima convocatoria generada sea exactamente la `010-2026`.
3. **Registros en `convocatoria_protocolos`**: Se mantendrán asociados asignándoles por defecto `tipo_punto_agenda = 'EVALUACION_INICIAL'` y `seccion = 'EVALUACION_DICTAMEN'`.

---

## 6. Registro de Decisiones

### 6.1 Decisiones Confirmadas
1. **Meetings como Bounded Context Canónico**: `MeetingsController` y `CreateMeetingUseCase` son la única vía de agendamiento; `CallsController` queda deprecado.
2. **Numeración Atómica Opción E**: Tabla de secuencias anuales + `UNIQUE` constraint en PostgreSQL + retry loop ante errores `23505`/`40001`.
3. **Fuente Canónica de Enums**: Ubicados exclusivamente en `src/shared/enums/agenda-section.enum.ts` (sin duplicados en otros módulos).
4. **Desacoplamiento de Puertos**: `IMeetingRepositoryPort` retornará tipos de dominio puros e interfaces TypeScript, eliminando dependencias hacia `ConvocatoriaOrmEntity`.
5. **Reutilización de Tipos de Estudio**: Los plazos de seguimiento provienen directamente de `catalogos.tipos_estudio`.

### 6.2 Decisiones Pendientes de Confirmación Humana
- **Política de Archivo de Datos Huérfanos**: Confirmar si el registro `e15834e2...` debe ser asignado como `000-2026` o eliminado físicamente antes de aplicar el constraint `NOT NULL`.
- **Firma Electrónica de Actas**: Se mantiene fuera del alcance del MVP 3 según spec.
