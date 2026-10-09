# Especificación de Requisitos de Software: Módulo de Convocatorias a Pleno, Subsanaciones y Seguimiento Post-Aprobación

**Código de Especificación:** `specs/003-flujo-mvp/spec.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Versión:** 1.3.0  
**Estado:** Aprobado  

---

## 1. Contexto y Objetivo

### 1.1 Contexto
En el flujo operativo del Comité de Ética en Investigación en Seres Humanos de la ESPOCH (CEISH-ESPOCH), la fase técnica posterior a la recepción requiere el agendamiento formal de Convocatorias al Pleno (Ordinaria / Extraordinaria) con numeración correlativa anual atómica (`001-2026`), la estructuración del Orden del Día en 4 secciones reglamentarias, la gestión de observaciones multilínea consolidadas (15 días hábiles), el ciclo de vida multiversión (v1.0 ➔ v2.0 ➔ v3.0) con inmutabilidad de aprobados (30 días hábiles) y la auditoría continua post-aprobación mediante Informes de Inicio de Actividades, Informes Periódicos de Avance (Anexo 18) e Informe Final de Cierre (Anexo 8).

### 1.2 Objetivo
Especificar las reglas operativas, funcionales y de integridad para:
1. El agendamiento de Convocatorias al Pleno con numeración secuencial correlativa anual atómica (`001-2026`), control de las 3 fechas normativas obligatorias, estructuración y clasificación temática del Orden del Día en 4 secciones normativas, generación del PDF oficial integrado y despacho de notificaciones a los miembros.
2. La captura de observaciones multilínea por requisito documental y su notificación en un correo único consolidado (15 días hábiles).
3. El ciclo de vida multiversión tras dictamen del Pleno "Requiere Subsanación", garantizando inmutabilidad (congelamiento) de requisitos aprobados y asignando 30 días hábiles para la subsanación.
4. El control de la agenda de entregables periódicos (Informe de Inicio, Anexo 18 para Avances, Anexo 8 para Cierre Final) con notificaciones parametrizadas por hito, habilitación para agendamiento en Convocatorias al Pleno (Sección III) y periodos de gracia ante incumplimientos.

---

## 2. Usuarios y Roles

| Rol | Descripción | Acciones Principales |
|---|---|---|
| **Investigador Principal** | Docente, estudiante o investigador externo. | Consultar observaciones consolidadas, resometer requisitos observados en v2.0/v3.0 y cargar entregables de seguimiento (Informe de Inicio, Anexo 18 para Avance, Anexo 8 para Cierre Final). |
| **Secretaria CEISH** | Personal administrativo operativo. | Agendar Convocatorias al Pleno con correlativo anual (`001-2026`), registrar las 3 fechas normativas, estructurar los puntos del Orden del Día en sus 4 secciones (Acta anterior, Evaluaciones, Informes de seguimiento, Varios), generar el PDF oficial y enviar correos consolidados. |
| **Presidente CEISH** | Autoridad supervisora del comité. | Autorizar Convocatorias al Pleno, presidir sesiones del Pleno para dictamen de protocolos y conocimiento/pronunciamiento de informes de seguimiento, editar la agenda de entregables post-aprobación y emitir resoluciones finales. |
| **Miembro del Pleno** | Evaluador / Vocal del comité. | Recibir notificación de convocatoria con Orden del Día oficial en PDF y acceder al expediente de evaluación y seguimiento antes de la fecha límite. |

---

## 3. Historias de Usuario

### HU-007: Gestión de Convocatorias, Agendamiento de Sesiones del Pleno y Orden del Día Clasificado
#### 1. Información General
| Campo | Valor |
|---|---|
| **Título** | Gestión de Convocatorias al Pleno, Secuencial Anual Atómico `001-2026`, Orden del Día Clasificado en 4 Secciones, PDF y Notificaciones |
| **ID** | HU-007 |
| **Descripción** | Permite a la Secretaría agendar expedientes para dictamen ético e informes de seguimiento en una Convocatoria a Pleno (Ordinaria o Extraordinaria) con numeración correlativa anual (`001-2026`), registrando obligatoriamente las 3 fechas normativas, generando el PDF del Orden del Día estructurado en 4 secciones y notificando a los miembros del CEISH. |
| **Prioridad** | CRÍTICA |
| **Requisitos origen** | RF-09.1, RF-09.2 |

#### 2. Pruebas de Aceptación (EARS)
1. **Numeración Secuencial Atómica Anual (EARS 1)**: **Cuando** la Secretaría ordene una sesión del Pleno (Ordinaria o Extraordinaria), **el sistema debe** asignar un número secuencial correlativo único por año calendario de la reunión (formato `001-2026`, `002-2026`), garantizando atomicidad y unicidad ante solicitudes concurrentes.
2. **Registro Obligatorio de 3 Fechas Normativas (EARS 2)**: **Cuando** se programe la Convocatoria, **el sistema debe** exigir el registro obligatorio de: `fecha_plazo_normativo` (solo lectura), `fecha_reunion` y `fecha_entrega_evaluacion`, aplicando la validación dura de precedencia `fecha_entrega_evaluacion < fecha_reunion`.
3. **Orden del Día Clasificado Temáticamente (EARS 3)**: **Cuando** la Secretaría configure la agenda de la sesión, **el sistema debe** estructurar el Orden del Día en 4 secciones canónicas:
   - **Sección I**: Lectura y aprobación del acta de la sesión anterior (`ACTA_ANTERIOR`).
   - **Sección II**: Evaluación ética y dictamen de protocolos (`EVALUACION_DICTAMEN`: `EVALUACION_INICIAL`, `SUBSANACION`).
   - **Sección III**: Conocimiento, revisión y pronunciamiento de Informes de Seguimiento (`SEGUIMIENTO_INFORMES`: `INFORME_INICIO`, `INFORME_AVANCE`, `INFORME_FIN`).
   - **Sección IV**: Asuntos varios (`ASUNTOS_VARIOS`).
4. **Generación de PDF Oficial y Notificación (EARS 4)**: **Cuando** se confirme el guardado de la Convocatoria, **el sistema debe** generar el PDF oficial del Orden del Día mediante el servicio de plantillas y despachar notificaciones por correo a los miembros convocados.

---

### HU-013: Observaciones Multilínea y Correo Consolidado de Subsanación
#### 1. Información General
| Campo | Valor |
|---|---|
| **Título** | Registro de Observaciones Multilínea por Requisito y Notificación Única Consolidada |
| **ID** | HU-013 |
| **Descripción** | Permite a la Secretaría ingresar observaciones explicativas multilínea por cada requisito del checklist y enviar un único correo consolidado al Investigador con la lista estructurada, fecha límite de 15 días hábiles y enlace directo al sistema. |
| **Prioridad** | ALTA |
| **Requisitos origen** | RF-13.1 |

#### 2. Pruebas de Aceptación (EARS)
1. **Captura Multilínea**: **Cuando** la Secretaría marque un requisito como observatorio, **el sistema debe** desplegar un área de texto multilínea sin compresión para redactar los hallazgos.
2. **Consolidación de Notificación**: **Cuando** la Secretaría concluya la auditoría documental, **el sistema debe** enviar un único correo electrónico consolidado al Investigador Principal que contenga la lista formateada (Requisito + Observaciones), la fecha límite a 15 días hábiles y el enlace directo al portal.

---

### HU-014: Ciclo Multiversión (v1.0 ➔ v2.0 ➔ v3.0) e Inmutabilidad de Aprobados
#### 1. Información General
| Campo | Valor |
|---|---|
| **Título** | Generación de Versión Mayor con Congelamiento de Aprobados y Plazo de 30 Días Hábiles |
| **ID** | HU-014 |
| **Descripción** | Gestiona la creación automática de una nueva versión del expediente (v2.0, v3.0) tras dictamen del Pleno "Requiere Subsanación", manteniendo inmutables los documentos previamente validados y otorgando 30 días hábiles para corregir únicamente los observados. |
| **Prioridad** | CRÍTICA |
| **Requisitos origen** | RF-14.1 |

#### 2. Pruebas de Aceptación (EARS)
1. **Auto-Generación de Versión Mayor**: **Cuando** el Pleno o Presidente dictaminen "Requiere Subsanación", **el sistema debe** incrementar la versión mayor secuencialmente (v1.0 ➔ v2.0) y asignar un plazo normativo de 30 días hábiles.
2. **Inmutabilidad y Congelamiento Documental**: **Cuando** se genere la versión v2.0, **el sistema debe** mantener congelados y bloqueados (🔒) los requisitos con estado `APROBADO` o `NO_APLICA`, y resetear únicamente a `NO_PRESENTADO` los observados.
3. **Incremento Dinámico sin Límite Duro**: **Mientras** el Pleno continúe dictaminando "Requiere Subsanación", **el sistema debe** permitir el incremento numérico de versiones (v3.0, v4.0), requiriendo un dictamen explícito de `RECHAZADO` para cerrar el expediente.

---

### HU-015: Agenda de Entregables Periódicos, Informes de Inicio, Avances (Anexo 18), Informe Final (Anexo 8) y Traspaso a Pleno
#### 1. Información General
| Campo | Valor |
|---|---|
| **Título** | Control de Agenda de Entregables, Informes de Inicio, Avance (Anexo 18), Fin (Anexo 8) y Elevación al Pleno |
| **ID** | HU-015 |
| **Descripción** | Pre-llena automáticamente la agenda de entregables post-aprobación (permitiendo edición por Presidencia), notifica según la parametrización del hito, gestiona la carga formal del Informe de Inicio, Informes de Avance (Anexo 18) e Informe Final de Cierre (Anexo 8), y habilita su inclusión en la Convocatoria del Pleno para pronunciamiento oficial. |
| **Prioridad** | ALTA |
| **Requisitos origen** | RF-15.1, RF-15.2, RF-15.3 |

#### 2. Pruebas de Aceptación (EARS)
1. **Pre-llenado de Agenda y Edición por Presidencia**: **Cuando** se confirme la Resolución de Aprobación Ética, **el sistema debe** pre-llenar la agenda de entregables según el tipo de estudio (`catalogos.tipos_estudio`), permitiendo a la Presidencia ajustar libremente la periodicidad antes de emitir la resolución.
2. **Recepción de Entregables de Seguimiento**: **Cuando** el Investigador rinda cuentas post-aprobación, **el sistema debe** recibir el **Informe de Inicio de Actividades**, el **Anexo 18 (Informe de Avance)** y el **Anexo 8 (Informe Final)**.
3. **Disponibilidad para Pleno**: **Cuando** un entregable sea presentado, **el sistema debe** marcar su estado como `PRESENTADO` y dejarlo disponible en la bandeja de selección de la Secretaría para la Sección III del Orden del Día.
4. **Pronunciamiento del Pleno sobre Seguimiento**: **Cuando** el Pleno delibere sobre un informe de seguimiento, **el sistema debe** registrar el pronunciamiento oficial entre 4 desenlaces normativos: `APROBADO`, `OBSERVADO`, `CONVALIDADO` o `CIERRE_DEFINITIVO`.
5. **Alertas Parametrizadas y Período de Gracia**: **Si** se aproxima la fecha límite de un entregable, **el sistema debe** emitir correos preventivos. **Si** la fecha es superada sin entrega, **el sistema debe** cambiar a `VENCIDO`/`SUSPENDIDO`, notificar a la Secretaría y activar 30 días de gracia.

---

## 4. Requisitos Funcionales

### RF-09: Gestión de Convocatorias a Sesiones del Pleno y Orden del Día Clasificado
- **RF-09.1**: El sistema debe agendar expedientes en Convocatorias al Pleno (Ordinaria / Extraordinaria) con numeración correlativa anual única (`001-2026`).
  - **Definición de Año del Correlativo**: El año del correlativo corresponde al año calendario de la `fecha_reunion` de la sesión plenaria.
  - **Numeración atómica**: Secuencia correlativa anual con padding de 3 dígitos (`001-2026`, `002-2026`), compartida entre sesiones Ordinarias y Extraordinarias, garantizada bajo concurrencia.
  - **`fecha_reunion`**: Campo de fecha y hora seleccionada por la Secretaría.
  - **`fecha_plazo_normativo`**: Solo lectura en el formulario. Leído de la versión del protocolo (45 días hábiles Expedita, 60 días Ensayo Clínico/Pleno).
  - **`fecha_entrega_evaluacion`**: Auto-sugerida como el jueves inmediatamente anterior a la `fecha_reunion` a las 23:59:59. Editable por la Secretaría con **validación dura de precedencia**: `fecha_entrega_evaluacion < fecha_reunion`.
- **RF-09.2**: El sistema debe estructurar los puntos del Orden del Día en 4 secciones canónicas:
  - **Sección I (`ACTA_ANTERIOR`)**: Lectura y aprobación del acta anterior.
  - **Sección II (`EVALUACION_DICTAMEN`)**: Evaluación ética y dictamen de protocolos (ítems: `EVALUACION_INICIAL`, `SUBSANACION`).
  - **Sección III (`SEGUIMIENTO_INFORMES`)**: Conocimiento, revisión y pronunciamiento de Informes de Seguimiento (ítems: `INFORME_INICIO`, `INFORME_AVANCE`, `INFORME_FIN`).
  - **Sección IV (`ASUNTOS_VARIOS`)**: Asuntos varios.
- **Criterio EARS (RF-09.1)**: **Cuando** la Secretaría ordene una sesión del pleno, **el sistema debe** registrar obligatoriamente las 3 fechas normativas, asignar correlativo atómico `001-2026`, estructurar el Orden del Día en 4 secciones, generar el PDF oficial y notificar a los miembros del CEISH.

### RF-13: Observaciones Multilínea por Requisito Documental
- **RF-13.1**: El sistema debe habilitar un campo de texto multilínea por cada requisito del checklist durante la auditoría de la Secretaría y consolidar todas las correcciones en una sola notificación.
- **Criterio EARS (RF-13.1)**: **Cuando** la Secretaría concluya la validación documental e ingrese observaciones por ítem, **el sistema debe** consolidar un único correo electrónico para el Investigador Principal con la lista estructurada por documento, la fecha límite a 15 días hábiles y el enlace directo al sistema.

### RF-14: Subsanación de Versión Mayor (Ciclo Multiversión v1.0 ➔ v2.0 ➔ v3.0)
- **RF-14.1**: El sistema debe soportar el ciclo de vida multiversión (v1.0 ➔ v2.0 ➔ v3.0), asignando 30 días hábiles por versión, bloqueando documentos aprobados previamente e incrementando el número de versión secuencialmente.
  - **Almacenamiento vs. Presentación**: En BD (`versiones_protocolo`), la versión se almacena como `numero_version` entero secuencial (`1`, `2`, `3`). En presentación se despliega como `v${numero_version}.0` (ej. v1.0, v2.0).
- **Criterio EARS (RF-14.1)**: **Cuando** un protocolo reciba el dictamen "Requiere Subsanación" tras evaluación del Pleno, **el sistema debe** congelar e inhabilitar los documentos previamente aprobados (🔒), liberar para resometimiento únicamente los observados, asignar 30 días hábiles y aumentar la versión mayor a v2.0.

### RF-15: Informes de Inicio, Avance (Anexo 18), Fin (Anexo 8), Agenda de Entregables y Seguimiento
- **RF-15.1**: El sistema debe pre-llenar y controlar la agenda de entregables periódicos e informe final de protocolos aprobados a partir de los metadatos de `catalogos.tipos_estudio` (`requiere_informe_inicio`, `requiere_informe_final`, `periodicidad_informe_dias`), permitiendo la edición por Presidencia y la recepción del **Informe de Inicio de Actividades**, **Anexo 18 (Avance)** y **Anexo 8 (Cierre/Fin)**.
- **RF-15.2**: Una vez presentado un entregable de seguimiento, el sistema debe habilitarlo para ser agendado por la Secretaría en la Sección III de la Convocatoria al Pleno, permitiendo que el Pleno emita pronunciamiento oficial: `APROBADO`, `OBSERVADO`, `CONVALIDADO` o `CIERRE_DEFINITIVO`.
- **Criterio EARS (RF-15.1)**: **Cuando** una investigación sea aprobada, **el sistema debe** pre-calcular la agenda de entregables (modificable por la Presidencia), enviar notificaciones automáticas por hito y procesar el Informe de Inicio, el Anexo 18 para avances y el Anexo 8 para cierre final.
- **Criterio EARS (RF-15.2)**: **Si** vence el plazo de entrega de un informe sin recepción, **el sistema debe** marcar el estado como `VENCIDO`/`SUSPENDIDO`, notificar a la Secretaría e iniciar un plazo de gracia de 30 días antes del escalamiento normativo.

---

## 5. Requisitos No Funcionales

1. **Concurrencia e Integridad Transaccional**: La generación de numeración correlativa (`001-2026`) debe ser inmune a condiciones de carrera (Race Conditions) bajo solicitudes simultáneas.
2. **Seguridad y Autorización**: Todos los endpoints de gestión de convocatorias y seguimiento deben estar protegidos bajo `JwtAuthGuard` y `RolesGuard` (`SECRETARIA`, `PRESIDENTE`, `ADMIN`).
3. **Mantenibilidad y Clean Architecture**: Desacoplamiento total entre capas: Domain/Application interactúan exclusivamente a través de puertos (Interfaces), sin referencias directas a entidades de persistencia ORM.
4. **Calidad de Código y Tipado Estricto**: Cero errores de compilación TypeScript estricta (`npx tsc --noEmit`) y cumplimiento de ESLint/Prettier.

---

## 6. Casos Límite y Manejo de Excepciones

- **Concurrencia en Numeración**: Manejo controlado de códigos de error PostgreSQL `23505` (unique violation) y `40001` (serialization failure) mediante reintentos automáticos con backoff exponencial suave.
- **Cambio de Año Calendario**: El correlativo debe reiniciarse automáticamente a `001-AAAA` al registrar la primera convocatoria de un nuevo año lectivo/calendario.
- **Doble Envío / Idempotencia**: Detección de solicitudes repetidas para evitar la creación de convocatorias duplicadas idénticas en la misma fecha y lugar.
- **Expiración de Periodo de Gracia**: Si tras 30 días de gracia no se remite el informe de seguimiento, el sistema escala el expediente para revocatoria o suspensión ética por Presidencia.

---

## 7. Criterios de Finalización (Definition of Done)

1. Agendamiento de Convocatoria a Pleno con numeración secuencial atómica anual (`001-2026`), validación dura de las 3 fechas normativas y generación del PDF oficial del Orden del Día estructurado en 4 secciones.
2. Inclusión y procesamiento de Informes de Inicio, Avance (Anexo 18) y Cierre (Anexo 8) en la Sección III del Pleno con registro de pronunciamiento de 4 estados.
3. Despacho comprobable de correo único consolidado con observaciones multilínea y 15 días hábiles.
4. Generación exitosa de v2.0 con congelamiento inmutable de requisitos aprobados y plazo de 30 días hábiles.
5. Verificación de calidad: 0 errores en `npx tsc --noEmit`, 100% de tests unitarios y E2E en verde.
