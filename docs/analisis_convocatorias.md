# Análisis Profundo de Impacto: Módulo de Convocatorias y Sesiones

Este documento contiene un análisis detallado sobre cómo la implementación del flujo de **Convocatorias y Sesiones** afecta a la base de datos (PostgreSQL) y a los servicios del backend (NestJS / TypeORM).

---

## 1. Impacto y Diseño en la Base de Datos

Actualmente, el archivo [`script.sql`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/script.sql) cuenta con bosquejos iniciales para `evaluacion.sesiones` y `evaluacion.actas`. Sin embargo, no existe representación para las convocatorias, los lugares de reunión parametrizables, ni la relación histórica entre convocatorias y versiones de protocolos.

Proponemos la creación y alteración de las siguientes tablas bajo el esquema `evaluacion`:

### 1.1. Nueva Tabla: `evaluacion.lugares` (Parametrizable)
Permite al administrador/secretaría gestionar los lugares físicos o virtuales donde se celebran las reuniones, evitando "hardcodear" opciones en la interfaz.

```sql
CREATE TABLE evaluacion.lugares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    ubicacion VARCHAR(250),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2. Nueva Tabla: `evaluacion.convocatorias`
Almacena la programación oficial de una sesión del comité y su agenda inicial.

```sql
CREATE TABLE evaluacion.convocatorias (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE, -- Formato: correlativo-año (ej. '25-2026')
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    lugar_id INT REFERENCES evaluacion.lugares(id),
    tipo_sesion VARCHAR(50) NOT NULL, -- 'ORDINARIA' o 'EXTRAORDINARIA'
    estado_id INT REFERENCES catalogos.estados(id), -- 'CREADA', 'ENVIADA', 'FINALIZADA'
    resumen_agenda TEXT, -- 5 puntos obligatorios del orden del día
    creado_por INT REFERENCES catalogos.usuarios(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3. Nueva Tabla: `evaluacion.convocatoria_protocolos` (Relación Histórica N:M)
Un protocolo puede participar en varias convocatorias si requiere subsanaciones. Esta tabla relaciona la versión específica del protocolo con la convocatoria y establece los plazos internos de evaluación.

```sql
CREATE TABLE evaluacion.convocatoria_protocolos (
    id SERIAL PRIMARY KEY,
    convocatoria_id INT REFERENCES evaluacion.convocatorias(id) ON DELETE CASCADE,
    version_protocolo_id INT REFERENCES public.versiones_protocolo(id) ON DELETE CASCADE,
    orden INT NOT NULL, -- Posición del protocolo en el orden del día
    fecha_reunion DATE NOT NULL, -- Copia de la fecha de la convocatoria
    fecha_entrega_evaluacion DATE NOT NULL, -- Fecha límite para que los pares envíen su dictamen (ej. jueves previo)
    resultado_id INT REFERENCES catalogos.estados(id) NULL, -- 'APROBADO', 'APROBADO_CON_CONDICION', 'NO_APROBADO'
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_convocatoria_version UNIQUE (convocatoria_id, version_protocolo_id)
);
```

### 1.4. Ajuste en Tabla Existente: `evaluacion.sesiones` (Reunión Real)
Para conectar la reunión física con la convocatoria previa, se debe agregar una referencia opcional en `evaluacion.sesiones`:

```sql
ALTER TABLE evaluacion.sesiones 
ADD COLUMN convocatoria_id INT REFERENCES evaluacion.convocatorias(id) ON DELETE SET NULL;
```

---

## 2. Impacto en los Modelos ORM (TypeORM Entities)

Debemos definir las nuevas entidades en el backend dentro de la carpeta `src/modules/evaluations/infrastructure/database/`:

1.  **[`PlaceOrmEntity`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/evaluations/infrastructure/database/place.entity.orm.ts):** Mapea `evaluacion.lugares`.
2.  **[`CallOrmEntity`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/evaluations/infrastructure/database/call.entity.orm.ts):** Mapea `evaluacion.convocatorias`.
3.  **[`CallProtocolOrmEntity`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/evaluations/infrastructure/database/call-protocol.entity.orm.ts):** Mapea `evaluacion.convocatoria_protocolos`.

### Modificación en [`SessionOrmEntity`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/evaluations/infrastructure/database/session.entity.orm.ts):
Añadir la relación ManyToOne con `CallOrmEntity`:
```typescript
@Column({ name: 'convocatoria_id', nullable: true })
callId?: number;

@ManyToOne(() => CallOrmEntity, { nullable: true })
@JoinColumn({ name: 'convocatoria_id' })
call?: CallOrmEntity;
```

---

## 3. Impacto en los Servicios del Backend (NestJS)

La lógica de negocio del módulo de convocatorias se implementará en un nuevo servicio o ampliando el [`EvaluationsService`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/evaluations/application/services/evaluations.service.ts).

### 3.1. Algoritmo de Creación de Convocatoria (`createCall`)
Cuando la secretaria crea una convocatoria:
1.  **Cálculo de Código Correlativo Anual:**
    *   Consultar la base de datos para contar cuántas convocatorias se han realizado en el año en curso.
    *   Generar el código `[consecutivo]-[año]` (ej. `25-2026`).
2.  **Priorización de Protocolos Pendientes:**
    *   Buscar protocolos cuyo estado sea `PENDIENTE_CONVOCATORIA` (documentación validada y aceptada por el investigador).
    *   **Regla de Ordenación:** Ordenar por la fecha de plazo normativo de forma ascendente (los plazos más cercanos al vencimiento aparecen primero en la selección).
3.  **Cálculo Automático de Plazos Internos:**
    *   Al asociar los protocolos seleccionados en `convocatoria_protocolos`, calcular la `fecha_entrega_evaluacion`. Por regla general, si la reunión es el lunes, la fecha límite de entrega de evaluaciones para los pares será el jueves anterior a la medianoche.
4.  **Notificación Automática por Correo:**
    *   El sistema recupera la lista de los miembros activos del comité y envía un correo con el PDF/Word de la convocatoria adjunto.

### 3.2. Sincronización con el Proceso de Evaluación
*   **Asignaciones:** Al guardar la relación convocatoria-protocolo, se deben actualizar los campos de fecha de reunión y entrega en las asignaciones de los evaluadores (`EvaluationAssignmentOrmEntity`), lo que reflejará la fecha límite en su panel de "Mis Asignaciones".
*   **Versionamiento al Finalizar la Sesión:**
    *   Al cerrar y firmar el acta de una sesión (`actas`), el sistema recorre los protocolos de la reunión.
    *   Si el resultado consolidado es `APROBADO_CON_CONDICION`, el backend activa automáticamente el flujo para que el investigador cree la **Versión 2**, reiniciando los contadores y bloqueando la edición de la versión 1.

---

## 4. Plan de Implementación de Archivos Backend

Para habilitar este módulo, crearemos y modificaremos los siguientes archivos:

1.  **Base de Datos / Migración:** Generar una migración para crear `evaluacion.lugares`, `evaluacion.convocatorias`, `evaluacion.convocatoria_protocolos` e inyectar la FK en `evaluacion.sesiones`.
2.  **Entidades ORM:** Crear `place.entity.orm.ts`, `call.entity.orm.ts` y `call-protocol.entity.orm.ts`.
3.  **DTOs:** Crear `create-call.dto.ts` y `add-protocol-to-call.dto.ts` en `src/modules/evaluations/application/dtos/`.
4.  **Servicio de Convocatorias:** Crear `calls.service.ts` para encapsular la lógica de creación, cálculo de código secuencial, envío de correos y priorización.
5.  **Controlador de Convocatorias:** Crear `calls.controller.ts` para exponer los endpoints de administración de convocatorias y lugares.
6.  **Módulo:** Registrar los nuevos componentes en [`evaluations.module.ts`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/evaluations/evaluations.module.ts).
