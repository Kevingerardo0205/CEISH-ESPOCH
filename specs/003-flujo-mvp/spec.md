# Especificación de Requisitos de Software: Módulo de Convocatorias a Pleno, Subsanaciones y Seguimiento Post-Aprobación

**Código de Especificación:** `specs/003-flujo-mvp/spec.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Versión:** 1.6.4  
**Estado:** Aprobado  
**Historial:** 2026-10-10 — v1.4.0: alineado con decisiones de Secretaría/Tutor (ver Pendientes por confirmar)  
**Historial:** 2026-10-10 — v1.4.1: RF-ALR renovación cambia a `alerta_renovacion_offsets_dias` [90, 60, 15]; HU-015 EARS 3 usa el parámetro  
**Historial:** 2026-10-27 — v1.5.0: CS-06 plazo dictamen 48 h corridas; CS-07 4 resultados del pleno; CS-08 corrección de decisión; CS-09 asistencia y quórum; CS-11 seguimiento precisión; CS-13 endpoint pendientes — rediseño 27/10/2026
**Historial:** 2026-10-28 — v1.5.1: sección Pendientes de confirmar con el comité añadida  
**Historial:** 2026-11-04 — v1.5.2: RF-ALR.f contrato de `GET /secretaria/pendientes`, detección de las filas VALIDAR, ASIGNAR y REASIGNAR, grupos de plazo en America/Guayaquil y filas omitidas con su motivo (decisiones pendientes de validar con la Secretaría)  
**Historial:** 2026-11-04 — v1.5.3: RF-ALR.f.7 contrato de `GET /evaluations/meetings/next` (tarjeta «Próxima reunión»): estados, inicio del día en America/Guayaquil, protocolos a tratar e `informesATratar` null; pendientes de RF-09 (cierre de reuniones, informes en el orden del día, `protocolCount`) (decisiones pendientes de validar con la Secretaría)
**Historial:** 2026-11-24 — v1.6.0: decisiones de la reunión del 24/11/2026 sobre la resolución del pleno: RF-17 (resultado del pleno por protocolo, carta firmada Anexos 13–16, plazo de 96 h, versiones de la carta y B8), nueva fila «Subir resolución firmada» en RF-ALR.f.8 y ajustes a RF-09.2, RF-14 y RF-ALR.f.6; la matriz de permisos (solo SECRETARIA crea/sube resoluciones) se actualiza en specs/001  
**Historial:** 2026-11-24 — v1.6.1: correcciones de la decisión del 24/11/2026: `SUSPENDIDO` sale de RF-17 (no es resultado del pleno; la suspensión es el Anexo 26, de seguimiento) y se cierran los pendientes 11 a 14 de la Sección 10; Anexo 13 o 14 por tipo de estudio (PET, «Dictamen de aprobación definitiva»); Anexo 12 verificado como carta de exención (PET, índice de anexos, pág. 84); plazo de 96 h desde `fecha_reunion` sin reinicio por corrección (RF-09.4); versión de la carta como entero independiente por protocolo y convocatoria; RF-16 reservado para renovaciones; líneas del Anexo 9 verificadas en `dev`; aprobado con condición → estado 19; SUSPENDIDO solo en Sección III  
**Historial:** 2026-11-24 — v1.6.2: contrato del registro del resultado del pleno (TSK-015-N08) dentro de RF-17.1: endpoint `PATCH /api/evaluations/meetings/:id/protocolos/:convocatoriaProtocoloId/resultado`; permiso `PLENO_RESULTADO_REGISTRAR` solo para SECRETARIA; ventana (no CANCELADA y `fecha_reunion` ≤ hoy en America/Guayaquil, 409 si no); historial append-only `evaluacion.convocatoria_protocolo_resultados` con `motivo_correccion` obligatorio en las correcciones; supuesto de que todas las filas de `convocatoria_protocolos` son Sección II; cierre canónico movido a TSK-015-N16
**Historial:** 2026-11-25 — v1.6.3: forma de la respuesta del registro del resultado del pleno (RF-17.1): `{ data: { convocatoriaProtocoloId, resultado, motivo, observaciones, motivoCorreccion }, statusCode: 200, message }`, envoltura puesta por el `ResponseInterceptor` (main.ts:39); el controlador devuelve el payload plano. Hallazgo para tarea futura: otros endpoints de Meetings ya devuelven su propia envoltura y quedan con `data.data` (ver TSK-015-N08, Riesgo conocido).
**Historial:** 2026-11-25 — v1.6.4: diseño de la carta firmada por versiones (TSK-015-N09) en RF-17.2, RF-17.4 y RF-17.7: tabla `resolucion.cartas_firmadas` (columnas, UNIQUE, índice parcial de vigente), subida en dos pasos con clave generada por el backend y verificación con HeadObject (PDF, ≤ 10 MB), endpoints `upload-url`, `POST cartas`, `GET cartas/vigente` y `GET cartas` con sus permisos y códigos 400/404/409; el Exento (EX) queda fuera de RF-17; `POST /resolutions` pasa a legacy (se retira en TSK-015-N18); lectura restringida de `GET /resolutions/protocol/:id` (TSK-015-N17)

---

## 1. Contexto y Objetivo

### 1.1 Contexto
En el flujo operativo del Comité de Ética en Investigación en Seres Humanos de la ESPOCH (CEISH-ESPOCH), la fase técnica posterior a la recepción requiere el agendamiento formal de Convocatorias al Pleno (Ordinaria / Extraordinaria) con numeración correlativa anual atómica (`001-2026`), la estructuración del Orden del Día en 4 secciones reglamentarias, la gestión de observaciones multilínea consolidadas (plazo `plazo_subsanacion_documental_dias`, inicial 30 días; SRS v3.2 decía 15 días hábiles), el ciclo de vida multiversión (v1.0 ➔ v2.0 ➔ v3.0) con inmutabilidad de aprobados (`plazo_condicion_dias`, inicial 30 días hábiles) y la auditoría continua post-aprobación mediante Informes de Inicio de Actividades, Informes Periódicos de Avance (Anexo 18) e Informe Final de Cierre (Anexo 8).

### 1.2 Objetivo
Especificar las reglas operativas, funcionales y de integridad para:
1. El agendamiento de Convocatorias al Pleno con numeración secuencial correlativa anual atómica (`001-2026`), control de las 3 fechas normativas obligatorias, estructuración y clasificación temática del Orden del Día en 4 secciones normativas, generación del PDF oficial integrado y despacho de notificaciones a los miembros.
2. La captura de observaciones multilínea por requisito documental y su notificación en un correo único consolidado (plazo `plazo_subsanacion_documental_dias`).
3. El ciclo de vida multiversión tras dictamen del Pleno "Requiere Subsanación", garantizando inmutabilidad (congelamiento) de requisitos aprobados y asignando `plazo_condicion_dias` (inicial 30 días hábiles) para la subsanación.
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
2. **Registro Obligatorio de 3 Fechas Normativas (EARS 2)**: **Cuando** se programe la Convocatoria, **el sistema debe** exigir el registro obligatorio de: `fecha_plazo_normativo` (solo lectura), `fecha_reunion` y `fecha_entrega_evaluacion` (auto-calculada como `fecha_reunion` 23:59 + `entrega_dictamen_horas_tras_sesion` horas corridas, editable), aplicando la validación dura de precedencia `fecha_entrega_evaluacion > fecha_reunion`. — CS-06, rediseño 27/10/2026
3. **Orden del Día Clasificado Temáticamente (EARS 3)**: **Cuando** la Secretaría configure la agenda de la sesión, **el sistema debe** estructurar el Orden del Día en 4 secciones canónicas:
   - **Sección I**: Lectura y aprobación del acta de la sesión anterior (`ACTA_ANTERIOR`).
   - **Sección II**: Evaluación ética y dictamen de protocolos (`EVALUACION_DICTAMEN`: `EVALUACION_INICIAL`, `SUBSANACION`).
   - **Sección III**: Conocimiento, revisión y pronunciamiento de Informes de Seguimiento (`SEGUIMIENTO_INFORMES`: `INFORME_INICIO`, `INFORME_AVANCE`, `INFORME_FIN`).
   - **Sección IV**: Asuntos varios (`ASUNTOS_VARIOS`).
4. **Generación de PDF Oficial y Notificación (EARS 4)**: **Cuando** se confirme el guardado de la Convocatoria, **el sistema debe** generar el PDF oficial del Orden del Día mediante el servicio de plantillas y despachar notificaciones por correo a los miembros convocados.
5. **Resultados del pleno sobre protocolos (EARS 5)**: **Cuando** el pleno delibere sobre un protocolo en Sección II, **el sistema debe** registrar el resultado en `convocatoria_protocolos.dictamen_resultado` con uno de los 4 valores válidos: `APROBADO_DEFINITIVO`, `APROBADO_CON_CONDICION`, `NO_APROBADO` (motivo obligatorio) o `SUSPENDIDO` (motivo obligatorio). Los valores "Requiere modificaciones" y "Diferido" son inválidos. — CS-07, rediseño 27/10/2026
6. **Asistencia y quórum (EARS 6)**: **Cuando** la Secretaría abra la ventana de asistencia, **el sistema debe** mostrar todos los convocados (excluyendo a la Secretaría) para marcado individual (Presente/Excusa/Ausente). **No se puede cerrar la sesión ni generar el acta** hasta que todos estén marcados y haya quórum (más de la mitad de los miembros con voto). — CS-09, rediseño 27/10/2026

---

### HU-013: Observaciones Multilínea y Correo Consolidado de Subsanación
#### 1. Información General
| Campo | Valor |
|---|---|
| **Título** | Registro de Observaciones Multilínea por Requisito y Notificación Única Consolidada |
| **ID** | HU-013 |
| **Descripción** | Permite a la Secretaría ingresar observaciones explicativas multilínea por cada requisito del checklist y enviar un único correo consolidado al Investigador con la lista estructurada, fecha límite según `plazo_subsanacion_documental_dias` (inicial 30 días; SRS v3.2 decía 15 días hábiles) y enlace directo al sistema. |
| **Prioridad** | ALTA |
| **Requisitos origen** | RF-13.1 |

#### 2. Pruebas de Aceptación (EARS)
1. **Captura Multilínea**: **Cuando** la Secretaría marque un requisito como observatorio, **el sistema debe** desplegar un área de texto multilínea sin compresión para redactar los hallazgos.
2. **Consolidación de Notificación**: **Cuando** la Secretaría concluya la auditoría documental, **el sistema debe** enviar un único correo electrónico consolidado al Investigador Principal que contenga la lista formateada (Requisito + Observaciones), la fecha límite según `plazo_subsanacion_documental_dias` y el enlace directo al portal.

---

### HU-014: Ciclo Multiversión (v1.0 ➔ v2.0 ➔ v3.0) e Inmutabilidad de Aprobados
#### 1. Información General
| Campo | Valor |
|---|---|
| **Título** | Generación de Versión Mayor con Congelamiento de Aprobados y Plazo de 30 Días Hábiles |
| **ID** | HU-014 |
| **Descripción** | Gestiona la creación automática de una nueva versión del expediente (v2.0, v3.0) tras dictamen del Pleno "Requiere Subsanación", manteniendo inmutables los documentos previamente validados y otorgando `plazo_condicion_dias` (inicial 30 días hábiles) para corregir únicamente los observados. |
| **Prioridad** | CRÍTICA |
| **Requisitos origen** | RF-14.1 |

#### 2. Pruebas de Aceptación (EARS)
1. **Auto-Generación de Versión Mayor**: **Cuando** el Pleno o Presidente dictaminen "Requiere Subsanación", **el sistema debe** incrementar la versión mayor secuencialmente (v1.0 ➔ v2.0) y asignar un plazo normativo de `plazo_condicion_dias` (inicial 30 días hábiles).
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
5. **Alertas Parametrizadas y Período de Gracia**: Las alertas preventivas se rigen por RF-ALR. **Si** la fecha es superada sin entrega, **el sistema debe** cambiar a `VENCIDO`/`SUSPENDIDO`, notificar a la Secretaría según RF-ALR y activar 30 días de gracia.
6. **Informe de Inicio**: **Cuando** se confirme la resolución de aprobación, **el sistema debe** registrar la fecha de inicio del plazo y exigir la entrega del Informe de Inicio dentro de `plazo_informe_inicio_dias` días (inicial 30) desde la fecha de aprobación. Fuente: Secretaría (oct 2026).
7. **Seguimiento Periódico**: La periodicidad se fija por protocolo en la carta de aprobación, editable por Secretaría/Presidencia, no solo por fórmula.
8. **Informe Final**: **Cuando** el plazo del informe final se abra, **el sistema debe** registrar la fecha y exigir la entrega dentro de `plazo_informe_final_dias` días (inicial 60).

---

## 4. Requisitos Funcionales

### RF-09: Gestión de Convocatorias a Sesiones del Pleno y Orden del Día Clasificado
- **RF-09.1**: El sistema debe agendar expedientes en Convocatorias al Pleno (Ordinaria / Extraordinaria) con numeración correlativa anual única (`001-2026`).
  - **Definición de Año del Correlativo**: El año del correlativo corresponde al año calendario de la `fecha_reunion` de la sesión plenaria.
  - **Numeración atómica**: Secuencia correlativa anual con padding de 3 dígitos (`001-2026`, `002-2026`), compartida entre sesiones Ordinarias y Extraordinarias, garantizada bajo concurrencia.
  - **`fecha_reunion`**: fecha y hora seleccionada por la Secretaría.
  - **`fecha_plazo_normativo`**: solo lectura, leída de la versión del protocolo (RF-NORM de specs/001).
  - **`fecha_entrega_evaluacion`**: calculada automáticamente como el fin del día de la `fecha_reunion` (23:59:59 hora America/Guayaquil) más `entrega_dictamen_horas_tras_sesion` horas corridas (inicial 48, parámetro). Ejemplo: sesión el lunes → hasta el miércoles 23:59. Editable por la Secretaría con **validación dura**: `fecha_entrega_evaluacion > fecha_reunion`. Si supera `fecha_plazo_normativo`, advertencia no bloqueante. El parámetro se copia a la convocatoria al crearla; cambiar el parámetro global no altera convocatorias ya creadas. La regla del "jueves previo" de `CallsService` queda **retirada**; ese servicio está deprecado. Las convocatorias ya creadas **no se recalculan**. — Reemplaza a: `fecha_reunion` + `entrega_evaluacion_dias_habiles_tras_reunion` días laborables a las 12:00 — reunión 21/10/2026 / rediseño 27/10/2026
  - **Las 3 fechas** (normativo, reunión, entrega) se registran por protocolo y por versión; la fecha de entrega prevalece sobre la normativa para el evaluador.
- **RF-09.2**: El sistema debe estructurar los puntos del Orden del Día en 4 secciones canónicas:
  - **Sección I (`ACTA_ANTERIOR`)**: Lectura y aprobación del acta anterior.
  - **Sección II (`EVALUACION_DICTAMEN`)**: Evaluación ética y dictamen de protocolos (ítems: `EVALUACION_INICIAL`, `SUBSANACION`). Al deliberar sobre un protocolo, el pleno registra uno de los siguientes 4 resultados en `convocatoria_protocolos.dictamen_resultado`. — Reemplaza a: lista anterior que incluía "Requiere modificaciones" y "Diferido" — rediseño 27/10/2026

    | Resultado | Qué pasa después | ¿Motivo obligatorio? |
    |---|---|---|
    | `APROBADO_DEFINITIVO` | Pasa a "Por emitir resolución" | No |
    | `APROBADO_CON_CONDICION` | La Secretaría envía las observaciones; el investigador tiene 30 días | No |
    | `NO_APROBADO` | Se emite la carta de no aprobación | Sí |
    | `SUSPENDIDO` | El protocolo queda detenido hasta que el pleno lo reactive | Sí |

    > "Requiere modificaciones" y "Diferido" se eliminan como resultados de sesión. **Revocado** no es un resultado de sesión: es un estado al que puede pasar un protocolo suspendido. Si Metodológico y Salud no coincidieron en el riesgo (CS-03/RF-12.2e), el pleno fija el nivel en esta misma sesión y el protocolo sigue a Resolución.
    >
    > **Decisión 24/11/2026**: el resultado registrado aquí es el que decide el tipo de resolución, el anexo exigido (13 a 16) y el cambio de estado del protocolo; el agregado de los dictámenes individuales solo se muestra como referencia. Ver RF-17.1 a RF-17.5. La fila `SUSPENDIDO` de esta tabla se mantiene, pero `SUSPENDIDO` solo aplica a la Sección III (`SEGUIMIENTO_INFORMES`) y nunca a la Sección II (`EVALUACION_DICTAMEN`); la suspensión es el Anexo 26 (seguimiento) y queda fuera de RF-17.

  - **Sección III (`SEGUIMIENTO_INFORMES`)**: Conocimiento, revisión y pronunciamiento de Informes de Seguimiento (ítems: `INFORME_INICIO`, `INFORME_AVANCE`, `INFORME_FIN`).
  - **Sección IV (`ASUNTOS_VARIOS`)**: Asuntos varios.
- **Criterio EARS (RF-09.1)**: **Cuando** la Secretaría ordene una sesión del pleno, **el sistema debe** registrar obligatoriamente las 3 fechas normativas (con `fecha_entrega_evaluacion` calculada como `fecha_reunion` 23:59 + `entrega_dictamen_horas_tras_sesion` horas corridas), asignar correlativo atómico `001-2026`, estructurar el Orden del Día en 4 secciones, generar el PDF oficial y notificar a los miembros del CEISH. **Cuando** la Secretaría agregue un protocolo a una convocatoria, **el sistema debe** registrar la `fecha_reunion` y la `fecha_entrega_evaluacion` como plazo de las asignaciones activas de ese protocolo. Si lo retira, las asignaciones vuelven a "Pendiente de convocatoria". — CS-06, rediseño 27/10/2026
- **RF-09.3 (Recordatorios de Convocatoria)**: El sistema debe, de forma parametrizable:
  - i) El viernes previo a la sesión, enviar a los pares la lista de protocolos a tratar con sus evaluadores.
  - ii) Recordar a los evaluadores pendientes el día de la sesión por la tarde, el día siguiente por la mañana y 1 hora antes del corte.
  - Al cierre, si un evaluador no entregó, registrar el incumplimiento y notificar a la Secretaría. La Secretaría puede ajustar la fecha de entrega por convocatoria. Aplica RF-ALR.

- **RF-09.4 (Corrección de decisión del pleno)**: Después de cerrar la sesión, si se registró mal lo que acordó el pleno, el sistema debe permitir a `SECRETARIA` corregir el resultado, el nivel de riesgo o el estado del protocolo. — CS-08, rediseño 27/10/2026
  - **Dónde**: en la misma vista de la sesión; no hay pantalla aparte.
  - **Motivo**: obligatorio.
  - **Trazabilidad**: el registro original no se borra ni sobrescribe. La corrección se guarda en una tabla aparte de correcciones por protocolo en la convocatoria: valor anterior, valor nuevo, motivo, usuario y fecha. Queda como nota en el acta y en el recorrido del protocolo.
  - **Notificación**: se notifica al investigador.

- **RF-09.5 (Asistencia y quórum)**: La Secretaría registra la asistencia en una ventana flotante usando la tabla `evaluacion.asistencia_sesiones`. — CS-09, rediseño 27/10/2026

  > **Prerequisito técnico**: corregir que `sesiones.convocatoria_id` sea `varchar` mientras `convocatorias.id` es `uuid`. — Reemplaza a: campo con tipo inconsistente — rediseño 27/10/2026

  - Cada convocado se marca **Presente** (`asistio = true`, `fecha_registro` como hora de llegada), **Excusa** (`excusa_presentada = true`) o **Ausente** (ninguno de los dos).
  - Los convocados salen de la convocatoria. La **Secretaría no vota** y no cuenta para el quórum.
  - **Quórum**: más de la mitad de los miembros con voto (ejemplo: 6 con voto → quórum de 4).
  - **No se puede cerrar la sesión ni generar el acta** si algún convocado no está marcado o si no hay quórum.
  - La lista de asistencia (con horas y excusas) va en el acta.
  - El endpoint de toma de lista va en `MeetingsController`.
  - > Por confirmar: si el PET fija una regla de quórum diferente.

### RF-13: Observaciones Multilínea por Requisito Documental
- **RF-13.1**: El sistema debe habilitar un campo de texto multilínea por cada requisito del checklist durante la auditoría de la Secretaría y consolidar todas las correcciones en una sola notificación.
- **Criterio EARS (RF-13.1)**: **Cuando** la Secretaría concluya la validación documental e ingrese observaciones por ítem, **el sistema debe** consolidar un único correo electrónico para el Investigador Principal con la lista estructurada por documento, la fecha límite según `plazo_subsanacion_documental_dias` y el enlace directo al sistema.

### RF-14: Subsanación de Versión Mayor (Ciclo Multiversión v1.0 ➔ v2.0 ➔ v3.0)
- **RF-14.1**: El sistema debe soportar el ciclo de vida multiversión (v1.0 ➔ v2.0 ➔ v3.0), asignando `plazo_condicion_dias` (inicial 30 días hábiles) por versión, bloqueando documentos aprobados previamente e incrementando el número de versión secuencialmente.
  - **Almacenamiento vs. Presentación**: En BD (`versiones_protocolo`), la versión se almacena como `numero_version` entero secuencial (`1`, `2`, `3`). En presentación se despliega como `v${numero_version}.0` (ej. v1.0, v2.0).
- **Criterio EARS (RF-14.1)**: **Cuando** el pleno registre el resultado `APROBADO_CON_CONDICION` (RF-17.1) y la Secretaría suba el Anexo 15 con las observaciones consolidadas (RF-17.2), **el sistema debe** congelar e inhabilitar los documentos previamente aprobados (🔒), liberar para resometimiento únicamente los observados, asignar `plazo_condicion_dias` (inicial 30 días hábiles) y aumentar la versión mayor a v2.0. El agregado de los dictámenes individuales no dispara la v2.0.

### RF-15: Informes de Inicio, Avance (Anexo 18), Fin (Anexo 8), Agenda de Entregables y Seguimiento
- **RF-15.1**: El sistema debe pre-llenar y controlar la agenda de entregables periódicos e informe final de protocolos aprobados a partir de los metadatos de `catalogos.tipos_estudio` (`requiere_informe_inicio`, `requiere_informe_final`, `periodicidad_informe_dias`), permitiendo la edición por Presidencia/Secretaría y la recepción del **Informe de Inicio de Actividades** (plazo: `plazo_informe_inicio_dias` días desde la notificación de aprobación), **Anexo 18 (Avance)** y **Anexo 8 (Cierre/Fin)**. Los informes de seguimiento son evaluados por los **mismos pares evaluadores** del protocolo; la Secretaría solo controla plazos y los lleva a la sesión. — CS-11, rediseño 27/10/2026
- **RF-15.2**: Una vez presentado un entregable de seguimiento, el sistema debe habilitarlo para ser agendado por la Secretaría en la Sección III de la Convocatoria al Pleno, permitiendo que el Pleno emita pronunciamiento oficial: `APROBADO` (equivale a "Validado" en pantalla), `OBSERVADO` (equivale a "Con observaciones"; 30 días para corregir), `CONVALIDADO` o `CIERRE_DEFINITIVO`. Si el plazo vence: la subida se **bloquea**, el informe pasa a "No cumplidos" y la Secretaría decide (reanudar, suspender o revocar, siempre con motivo). El botón "Reanudar informe de seguimiento" solo se activa cuando el plazo ya venció. — CS-11, rediseño 27/10/2026
- **Criterio EARS (RF-15.1)**: **Cuando** una investigación sea aprobada, **el sistema debe** pre-calcular la agenda de entregables (modificable por Presidencia/Secretaría), despachar notificaciones por hito según RF-ALR (`aviso_previo_plazo_dias` días antes y el mismo día) y procesar el Informe de Inicio, el Anexo 18 para avances y el Anexo 8 para cierre final.
- **Criterio EARS (RF-15.2)**: **Si** vence el plazo de entrega de un informe sin recepción, **el sistema debe** bloquear la subida, marcar el estado como `VENCIDO`/`SUSPENDIDO`, notificar a la Secretaría según RF-ALR e iniciar un plazo de gracia de 30 días antes del escalamiento normativo.

---

### RF-17: Resultado del Pleno, Carta Firmada y Versiones de la Resolución

> Decisiones de la reunión del 24/11/2026. La resolución se firma **fuera del sistema**; el sistema solo recibe la carta firmada. RF-16 queda reservado para renovaciones (ver `src/shared/deadlines/deadline-rules.ts`).

- **RF-17.1 (Resultado del pleno por protocolo)**: **Cuando** la Secretaría cierre la sesión del pleno, **el sistema debe** registrar, por cada protocolo de la Sección II (`EVALUACION_DICTAMEN`), el resultado acordado en `evaluacion.convocatoria_protocolos.dictamen_resultado` con uno de estos tres valores, según el PET (Anexo 10/11): `APROBADO_DEFINITIVO`, `APROBADO_CON_CONDICION` o `NO_APROBADO`. El resultado se registra en la misma vista de la sesión; `NO_APROBADO` exige motivo. El agregado de los dictámenes individuales (hoy `ResolutionsService.determineResolutionType`, `resolutions.service.ts:50-60`) **solo se muestra como referencia** y ya no decide el tipo de resolución ni el estado del protocolo.
  - **Qué deriva el resultado**: el tipo de resolución (`APROBADO` 17, `REQUIERE_SUBSANACION_VERSION` 19 para `APROBADO_CON_CONDICION`, o `RECHAZADO` 18), el anexo exigido (RF-17.2) y el cambio de estado del protocolo. El estado se aplica al subir la carta firmada, en la misma transacción que crea la versión vigente de la resolución (RF-17.4). Mientras no se suba la carta, el protocolo queda pendiente de resolución y aparece en la fila de RF-ALR.f.8. Tras el Anexo 15 el protocolo espera la v2.0 con el estado 19; el estado 25 (`APROBADO_CON_CONDICION`) queda **sin uso** en este flujo, porque recepción y los filtros ya dependen del 19. La distinción queda en `dictamen_resultado` y en el tipo de resolución (Anexo 15).
  - **Fuera de RF-17**: `SUSPENDIDO` solo aplica a la Sección III (`SEGUIMIENTO_INFORMES`) y nunca a la Sección II (`EVALUACION_DICTAMEN`). La suspensión es el Anexo 26 (seguimiento, RF-15); no genera carta de RF-17 ni cambia el estado por esta vía.
  - **Corrección**: aplica RF-09.4. Corregir no borra el original: cada registro o corrección inserta una fila nueva en el historial (ver «Historial» abajo).
  - **Contrato del registro (decisión 24/11/2026, TSK-015-N08)**: `PATCH /api/evaluations/meetings/:id/protocolos/:convocatoriaProtocoloId/resultado` con body `{ resultado, motivo?, observaciones?, motivoCorreccion? }`. `:id` es el uuid de la convocatoria; `:convocatoriaProtocoloId` es el uuid de `evaluacion.convocatoria_protocolos`. La operación es por protocolo e idempotente en su efecto sobre el valor vigente.
  - **Forma de la respuesta (v1.6.3)**: `200` con `{ data: { convocatoriaProtocoloId, resultado, motivo, observaciones, motivoCorreccion }, statusCode: 200, message: "Success" }`. La envoltura la pone el `ResponseInterceptor`; el controlador devuelve el payload plano y no `data.data`.
  - **Permiso**: `PLENO_RESULTADO_REGISTRAR`, concedido **solo a SECRETARIA** (migración de datos, separada de la de esquema; matriz de specs/001). La ruta es la del flujo canónico (Meetings); el flujo legacy `/evaluations/calls` no se modifica.
  - **Ventana**: se permite registrar o corregir si la convocatoria **no** está `CANCELADA` y `fecha_reunion` ≤ hoy en America/Guayaquil. Si no, `409` en español. Si el `convocatoriaProtocoloId` no pertenece a la convocatoria, `404`. Hoy el flujo canónico solo escribe el estado `PROGRAMADA` (`meeting-typeorm.repository.ts:214`); `CONCLUIDA` lo escribe solo el flujo legacy (`calls.service.ts:472`). Por eso la ventana usa la fecha y no el estado.
  - **Validaciones**: solo los tres valores; `NO_APROBADO` exige `motivo`; `APROBADO_CON_CONDICION` exige `observaciones`; si el protocolo ya tiene resultado, `motivoCorreccion` es obligatorio (`400` si falta). Mensajes en español.
  - **Historial (RF-09.4)**: tabla nueva `evaluacion.convocatoria_protocolo_resultados`, **append-only**: cada registro o corrección inserta una fila con `resultado`, `motivo`, `observaciones`, `motivo_correccion`, `registrado_por` (NOT NULL, FK a `catalogos.usuarios.id`) y `registrado_en`. **Nunca UPDATE ni DELETE** sobre el historial. El valor vigente queda en `convocatoria_protocolos` (`dictamen_resultado`, `dictamen_motivo`, `dictamen_observaciones`, `dictamen_registrado_por` con FK, `dictamen_registrado_en`).
  - **Estado del protocolo**: el registro **no** cambia `protocolos.estado_id`; eso lo hace la subida de la carta firmada (RF-17.4).
  - **Supuesto de Sección II**: todas las filas de `convocatoria_protocolos` son Sección II, porque los informes de seguimiento no viven en esa tabla. Si se agregan ítems de Sección III a esa tabla, habrá que persistir `tipo_punto_agenda`.
  - **Cierre**: el cierre canónico con validación de resultados (EARS de RF-17.1, «el cierre se bloquea») **no existe hoy en Meetings** y es TSK-015-N16. Hasta entonces, el registro del resultado no depende de ningún cierre.
- **Criterio EARS (RF-17.1)**: **Cuando** la Secretaría cierre la sesión del pleno, **el sistema debe** exigir el resultado por protocolo (`APROBADO_DEFINITIVO`, `APROBADO_CON_CONDICION` con observaciones consolidadas, o `NO_APROBADO` con motivo) y guardarlo en `convocatoria_protocolos.dictamen_resultado`; **si** falta el resultado de un protocolo, **el sistema debe** impedir el cierre con un mensaje en español. El agregado de dictámenes no puede sobrescribir el resultado del pleno.

- **RF-17.2 (Carta firmada: Anexos 13 a 16)**: **Cuando** el pleno haya decidido, **la Secretaría debe** subir la carta firmada correspondiente; el sistema no genera ni firma la carta. El anexo depende del resultado del pleno:

  | Resultado del pleno | Anexo exigido | Efecto en el protocolo |
  |---|---|---|
  | `APROBADO_DEFINITIVO` — estudio observacional o de intervención | **Anexo 13** (aprobación definitiva) | `APROBADO` (17) |
  | `APROBADO_DEFINITIVO` — ensayo clínico | **Anexo 14** (aprobación definitiva de ensayo clínico) | `APROBADO` (17) |
  | `APROBADO_CON_CONDICION` | **Anexo 15** (aprobado con condición, con las observaciones consolidadas) | `REQUIERE_SUBSANACION_VERSION` (19) y creación de la versión de subsanación (RF-14) |
  | `NO_APROBADO` | **Anexo 16** (no aprobado, con el motivo) | `RECHAZADO` (18) |

  - **Anexo 13 o 14 (decisión 24/11/2026)**: se elige por el tipo de estudio, según el PET (sección «Dictamen de aprobación definitiva»): observacional o de intervención → Anexo 13; ensayo clínico → Anexo 14.
  - **Plantillas**: hoy no existen plantillas de los Anexos 13 a 16 en `catalogos.tipos_documento` (verificado en `ceish_test_db`: los anexos sembrados son ANEXO_1, ANEXO_2, ANEXO_4, ANEXO_5 y ANEXO_6) ni en `documents.document_templates` (sin verificar); se requieren para las pantallas de carga y para el nombrado de archivos. La carta firmada **no** se genera desde el sistema: se adjunta como archivo.
  - **Contenido del Anexo 15**: las observaciones consolidadas del pleno son las que se registran en RF-17.1 (no el agregado de los informes individuales).
  - **Solo la Secretaría** crea o sube resoluciones. La Presidenta ve la resolución en **solo lectura** (ver la matriz de permisos de specs/001, RF-17.7).
- **Criterio EARS (RF-17.2)**: **Cuando** la Secretaría suba la carta firmada, **el sistema debe** validar que el anexo corresponda al resultado registrado en RF-17.1 (`APROBADO_DEFINITIVO` → Anexo 13 o 14; `APROBADO_CON_CONDICION` → Anexo 15; `NO_APROBADO` → Anexo 16) y **si** no coincide, **el sistema debe** rechazar la subida con `400` y un mensaje en español.
  - **Exento (EX, decisión v1.6.4)**: el estudio de tipo `EX` (`catalogos.tipos_estudio.codigo = 'EX'`) **no pasa por el pleno** y queda fuera de RF-17. Registrar un resultado del pleno (RF-17.1, TSK-015-N08 y su seguimiento TSK-015-N20) o subir una carta (RF-17.2) para un protocolo EX responde `409` en español. La carta de exención (Anexo 12) es una tarea futura (TSK-015-N19), no es RF-17.
  - **Flujo de la carta firmada**: la validación del anexo se hace en el paso `upload-url` (RF-17.4) y se vuelve a verificar en el paso de registro.

- **RF-17.3 (Plazo de 96 horas para subir la carta firmada)**: **Cuando** el protocolo tenga resultado del pleno, **el sistema debe** fijar el plazo para subir la carta firmada en **96 horas corridas desde `convocatorias.fecha_reunion`**; el plazo **no se reinicia** si el resultado se corrige (RF-09.4). El plazo se muestra en `GET /secretaria/pendientes` como una acción nueva, «Subir resolución firmada», con su fecha de plazo y su grupo (`VENCIDO`, `HOY`, `SEMANA`, `PROXIMO`). Si vence, la fila queda en `VENCIDO` y **la subida no se bloquea**; solo se marca en rojo.
  - **Cálculo**: `fecha_reunion` + 96 horas corridas (no días hábiles), en el instante de la base; la fecha se muestra en America/Guayaquil. No aplica `BusinessDayCalculator`.
  - **Dónde vive**: el plazo se define en `src/shared/deadlines/deadline-rules.ts` (p. ej. `PLAZO_RESOLUCION_FIRMADA_HORAS = 96`) y la fila se implementa en la consulta única de `PendingItemsTypeormRepository` (RF-ALR.f.8).
- **Criterio EARS (RF-17.3)**: **Mientras** un protocolo de la convocatoria tenga resultado del pleno y no tenga una versión vigente de la carta firmada, **el sistema debe** listarlo en `GET /secretaria/pendientes` con `accion = SUBIR_RESOLUCION`, `accionTexto = «Subir resolución firmada»` y `fechaPlazo = fecha_reunion + 96 h`; **si** el plazo venció, **el sistema debe** devolver `estadoPlazo = VENCIDO` sin impedir la subida.

- **RF-17.4 (Versiones de la carta firmada)**: Cada carta firmada que se suba se guarda como una **versión nueva**; no se sobrescribe la anterior. La versión de la carta es un entero `numero_version` (1, 2, 3…) independiente por protocolo y convocatoria; **no** es la versión del protocolo de RF-14 (v1.0, v2.0). Cada versión guarda fecha de subida, usuario y, **si reemplaza a otra**, motivo obligatorio. El investigador y los demás roles ven solo la versión **vigente**; el historial queda para la Secretaría y auditoría. La versión vigente es la que se usa en el correo y en el detalle de la resolución.
  - **Reemplazo**: reemplazar una carta ya subida exige motivo (texto libre) y no borra la anterior; crea una versión nueva y marca la anterior como no vigente.
  - **Modelo (v1.6.4)**: tabla nueva `resolucion.cartas_firmadas`, una fila por versión. `resolucion.resoluciones` queda **legacy y sin cambios** (sus 7 filas no se vinculan a convocatoria). Columnas: `id` uuid PK; `convocatoria_protocolo_id` uuid NOT NULL, FK a `evaluacion.convocatoria_protocolos(id)` ON DELETE RESTRICT; `protocolo_id` integer NOT NULL, FK a `protocolos(id)`; `version_id` integer NOT NULL, FK a `versiones_protocolo(id)`; `numero_version` integer NOT NULL, `>= 1`; `resultado` varchar NOT NULL, CHECK con los tres valores de RF-17.1; `anexo_codigo` varchar(50) NOT NULL (`ANEXO_13` a `ANEXO_16`); `clave_archivo` varchar(500) NOT NULL; `vigente` boolean NOT NULL DEFAULT true; `motivo_reemplazo` text NULL; `subido_por` integer NOT NULL, FK a `catalogos.usuarios(id)`; `subido_en` timestamptz NOT NULL DEFAULT now().
    - Restricciones: `UNIQUE (convocatoria_protocolo_id, numero_version)`; `UNIQUE (clave_archivo)`; índice único parcial `(convocatoria_protocolo_id) WHERE vigente` (una sola versión vigente por protocolo y convocatoria); `CHECK (numero_version = 1 OR motivo_reemplazo tiene texto no vacío)`.
    - `numero_version` es independiente de la versión del protocolo de RF-14 (v1.0, v2.0).
  - **Clave del archivo (generada por el backend)**: `protocols/{protocolId}/resolutions/{convocatoriaProtocoloId}/v{numero_version}/{uuid}.pdf`. El frontend nunca elige ni construye la clave. Como el `uuid` la hace única y `clave_archivo` es UNIQUE, ninguna subida sobrescribe un archivo anterior. La clave fija `Carta_Resolucion_Consolidada.pdf` queda retirada para las cartas nuevas.
  - **Subida en dos pasos**:
    1. `POST …/cartas/upload-url` (ver endpoints abajo): valida permiso, resultado del pleno (RF-17.1), anexo (RF-17.2) y que el estudio no sea EX; devuelve `{ uploadUrl, claveArchivo }`, con la URL prefirmada para `application/pdf` (vía `generateUploadUrl` de `IStorageService`). No registra nada.
    2. `POST …/cartas` con `{ claveArchivo, anexoCodigo, motivoReemplazo? }`: el backend verifica que `claveArchivo` tenga exactamente el prefijo generado en el paso 1; con `HeadObject` (`getMetadata` de `IStorageService`) verifica que el objeto exista, que su `contentType` sea `application/pdf` y que pese **≤ 10 MB** (10 485 760 bytes). Si algo falla, responde `400` en español y no crea nada. Solo entonces crea la versión.
  - **Formato**: solo PDF, máximo 10 MB.
  - **Endpoints y permisos**:
    - `POST /resolutions/convocatorias/:convocatoriaId/protocolos/:convocatoriaProtocoloId/cartas/upload-url` y `POST …/cartas`: `RESOLUCION_CREAR` (solo SECRETARIA, RF-17.7).
    - `GET …/cartas/vigente`: el investigador principal del protocolo y los roles con `RESOLUCION_HISTORIAL` (SECRETARIA y PRESIDENTE). Devuelve solo la versión vigente, sin datos del evaluador (RF-17.6). A cualquier otro usuario, `404` con «Protocolo no encontrado.» (igual que RF-02.10).
    - `GET …/cartas`: historial completo de versiones, solo con `RESOLUCION_HISTORIAL`. El investigador no lo ve (`404` con el mismo mensaje).
  - **Versiones**: la primera subida crea `numero_version = 1`. Una subida con una vigente existente crea `n + 1`, exige `motivoReemplazo` (`400` si falta), marca la anterior con `vigente = false` y la conserva. Todo se hace en una transacción con `SELECT … FOR UPDATE` sobre la fila de `convocatoria_protocolos`. Una colisión de `numero_version` o del índice parcial responde `409` en español.
  - **Estado del protocolo**: se fija en la misma transacción que crea la versión vigente. `APROBADO_DEFINITIVO` → 17; `APROBADO_CON_CONDICION` → 19, y la creación de la v2.0 es de RF-17.5 (TSK-015-N13); `NO_APROBADO` → 18. N09 y N13 se entregan juntas (misma rama y PR, commits separados, N09 primero) para no dejar el estado 19 sin v2.0.
  - **Códigos de respuesta**:
    - `400`: anexo que no corresponde al resultado o al tipo de estudio; motivo de reemplazo faltante; clave fuera del prefijo; objeto inexistente, no PDF o mayor de 10 MB.
    - `404`: convocatoria, convocatoria-protocolo o protocolo inexistente, o que no pertenece a la convocatoria.
    - `409`: sin resultado del pleno (RF-17.1); estudio EX; colisión de versión o del índice parcial.
  - **POST /resolutions (legacy, v1.6.4)**: el endpoint actual se mantiene **solo** porque el frontend lo usa (`resolution-api.adapter.ts:20`, con `generate-and-submit-resolution.use-case.ts` y `emit-consolidated-resolution.use-case.ts`). No se usa en el flujo nuevo ni se extiende. Su tipo calculado por dictámenes es solo referencia (RF-17.1). Se retira en TSK-015-N18 cuando el frontend use el flujo de cartas. **Riesgo**: mientras exista, puede cambiar el estado del protocolo a partir del agregado de dictámenes.
- **Criterio EARS (RF-17.4)**: **Cuando** la Secretaría suba una carta firmada, **el sistema debe** crear una versión nueva con fecha, usuario y archivo; **si** esa carta reemplaza a una vigente, **el sistema debe** exigir motivo y conservar la anterior como no vigente. **Cuando** el investigador consulte la resolución, **el sistema debe** devolver únicamente la versión vigente.

- **RF-17.5 (V2 de subsanación desde el resultado del pleno)**: La creación de la versión mayor de subsanación (RF-14) se dispara **solo** cuando el resultado del pleno es `APROBADO_CON_CONDICION` y la Secretaría sube el Anexo 15. No se dispara desde el agregado de dictámenes ni desde `calls.service.ts`. En la misma transacción se congelan los requisitos aprobados, se crea la versión v2.0 y se asigna `plazo_condicion_dias` (30, con el cálculo actual de `protocol-deadline.service.ts`), como ya define RF-14.
- **Criterio EARS (RF-17.5)**: **Cuando** la Secretaría suba el Anexo 15 de un protocolo con resultado `APROBADO_CON_CONDICION`, **el sistema debe** crear la versión v2.0 en la misma transacción y **no debe** crear la v2.0 si el resultado es `APROBADO_DEFINITIVO` o `NO_APROBADO`.

- **RF-17.6 (B8 — el investigador nunca ve la identidad del evaluador)**: El investigador **nunca** recibe el nombre, el correo ni ningún dato de identidad del evaluador: ni en las respuestas de la API, ni en los documentos generados (Anexo 9 en PDF y DOCX), ni en los adjuntos ni en el cuerpo del correo de la resolución. El investigador sí ve el **perfil** y el **dictamen** de cada par.
  - **Correo de la resolución**: hoy adjunta el informe individual de cada evaluador con su nombre (`resolutions.service.ts:103-130` y `:317-327`). Debe dejar de adjuntar los informes individuales; si se requiere evidencia, se adjunta solo la carta firmada.
  - **Anexo 9 (PDF/DOCX)**: hoy el PDF imprime `revisores` (`pdf-generator.service.ts:795-797`, alimentado en `evaluations.service.ts:614`) y el DOCX imprime `revisorName` (`docx-generator.service.ts:469`, alimentado en `evaluations.service.ts:622`). Debe dejar de imprimir el nombre. Además, `evaluations.service.ts:585` usa el nombre del evaluador como respaldo de `investigatorName` cuando falta el investigador; ese respaldo también se retira.
  - **API**: las respuestas que consume el investigador no incluyen nombre, correo ni `userId` del evaluador; exponen el perfil y el dictamen.
  - **Verificado en `dev` (24/11/2026)**: el nombre del revisor sí aparece en el Anexo 9, en PDF (`pdf-generator.service.ts:795-797`) y en DOCX (`docx-generator.service.ts:469`), alimentado desde `evaluations.service.ts:585`, `:614` y `:622`. La afirmación de que el Anexo 9 «ya se genera sin el nombre» no se cumple en `dev`; la tarea TSK-015-N12 lo corrige.
- **Criterio EARS (RF-17.6)**: **Cuando** el investigador consulte un protocolo, sus evaluaciones o su resolución, **el sistema no debe** devolver nombre, correo ni identificador del evaluador; **cuando** se genere el Anexo 9 o se envíe el correo de la resolución, **el sistema no debe** incluir el nombre del evaluador ni adjuntar sus informes individuales. **Mientras** el investigador consulte los pares, **el sistema debe** mostrar el perfil y el dictamen de cada uno.

- **RF-17.7 (Permiso de creación y carga de resoluciones)**: Solo la `SECRETARIA` crea o sube resoluciones (`RESOLUCION_CREAR`). La `PRESIDENTE` **pierde** `RESOLUCION_CREAR` y ve la resolución en solo lectura (con `RESOLUCION_HISTORIAL`). La matriz fija de specs/001 se actualiza en consecuencia. `RESOLUCION_FIRMAR` sigue sin endpoint: la firma es externa.
- **Criterio EARS (RF-17.7)**: **Cuando** la Presidenta intente crear o subir una resolución, **el sistema debe** responder `403`; **cuando** consulte la resolución, **el sistema debe** devolverla en solo lectura.

> **Pendiente del frontend**: algunas pantallas rotulan la carta consolidada como «Anexo 12». Verificado en el PET (índice de anexos, pág. 84): el **Anexo 12 es la carta de exención**; ese rótulo es incorrecto y debe corregirse en el frontend. No hay cambio de backend asociado.

---

### RF-ALR: Alertas de Plazo por Correo y Notificación Interna
- **RF-ALR.a**: Para cada hito con plazo (documentos faltantes, aprobado con condición, informe de inicio, seguimiento, informe final, renovación, entrega del evaluador), el sistema debe enviar: un aviso al abrirse el plazo con la fecha límite, recordatorios según `alerta_offsets_dias` del hito (para renovación: `alerta_renovacion_offsets_dias`), un aviso el día del vencimiento y otro al ejecutarse su consecuencia (archivado, suspendido o inicio de gracia).
- **RF-ALR.b**: Los avisos se envían por correo y como notificación interna. Los destinatarios por hito son parametrizables (investigador, Secretaría, Presidencia). Valores iniciales:
  - Documentos faltantes: al notificar; 7 y 1 días antes; vence = archivo; investigador con copia a Secretaría.
  - Aprobado con condición (`plazo_condicion_dias`, inicial 30 días hábiles): al notificar la carta; 7 y 1; vence = archivo; investigador con copia a Secretaría.
  - Informe de inicio: al aprobar; `aviso_previo_plazo_dias` días antes y el mismo día del plazo; vence = vencido/suspendido y 30 días de gracia; investigador y Secretaría. — CS-11, rediseño 27/10/2026
  - Seguimiento: al fijar el calendario; `aviso_previo_plazo_dias` días antes y el mismo día del plazo; vence = vencido/suspendido y gracia; investigador y Secretaría. — CS-11, rediseño 27/10/2026
  - Informe final: al abrirse; `aviso_previo_plazo_dias` días antes y el mismo día del plazo; vence = vencido/suspendido y gracia; investigador y Secretaría. — CS-11, rediseño 27/10/2026
  - Renovación (`alerta_renovacion_offsets_dias` [90, 60, 15]): aviso a 90 días antes del vencimiento (equivale a "3 meses antes"), aviso a 60 días antes (fecha límite para presentar la solicitud) y aviso a 15 días antes (recordatorio final); investigador y Secretaría.
- **RF-ALR.c**: Un proceso diario debe evaluar los plazos. Cada alerta se envía una sola vez; el sistema registra las enviadas para evitar duplicados.
- **RF-ALR.d**: El correo debe incluir el código del protocolo, el hito, la fecha límite y un enlace al sistema, sin contenido confidencial del protocolo.
- **RF-ALR.e**: Si el envío falla, reintentar y dejar el fallo en auditoría; la notificación interna queda disponible igualmente.
- **RF-ALR.f**: La Secretaría debe tener una vista unificada de todos sus pendientes. El endpoint `GET /secretaria/pendientes` (solo lectura) compone las consultas existentes (pendientes de asignación, pendientes de agendar, plazos) y devuelve, por cada fila: código del protocolo, título, estado actual, etapa y fecha de plazo. La vista se ordena con los vencidos primero. Filtros: Todos, Vencidos, Hoy, Esta semana. La acción principal de cada fila se deriva del estado del protocolo (no se almacena en BD). — CS-13, rediseño 27/10/2026; Reemplaza a: vista de plazos próximos a vencer

  | Estado | Acción |
  |---|---|
  | Recepción por validar | Validar |
  | Recepción completa · sin evaluadores | Asignar |
  | En evaluación · dictamen vencido | Reasignar |
  | Aprobado con condición | Enviar observaciones |
  | Aprobado · sin resolución | Emitir |
  | Resolución pendiente de subir (pleno cerrado) | Subir resolución firmada |
  | Informe no entregado | Ver control |

  **RF-ALR.f.1 — Filas implementadas (decisión 04/11/2026, pendiente de validar con la Secretaría)**

  Todas las filas se calculan sobre la versión activa del protocolo (`protocolos.version_actual_id`) y excluyen protocolos con `eliminado_en`.

  | Fila | Se detecta cuando | `estadoActual` | `accion` | `accionTexto` | Plazo |
  |---|---|---|---|---|---|
  | a) Validar | La recepción de la versión activa está en `EN_REVISION_SECRETARIA` (15). | Recepción por validar | `VALIDAR` | Validar documentos | Sin plazo |
  | b) Asignar | Recepción `COMPLETO` (10), `protocolos.estado_id` NULL, `nivel_riesgo_confirmado = false`, `sometimiento_tiempos_aceptado = true` y ninguna asignación activa (`SUGERIDO` 5 o `ASIGNADO` 6) en la versión activa. Se excluyen los que esperan la aceptación de plazos del investigador. | Recepción completa · sin evaluadores | `ASIGNAR` | Asignar evaluadores | Sin plazo |
  | c) Reasignar | Hay una asignación `ASIGNADO` (6) de la versión activa que pertenece a una convocatoria con plazo (`convocatoria_protocolos` sin `eliminado_en`, convocatoria no `CANCELADA` y con `fecha_entrega_evaluacion`), y su plazo `COALESCE(fecha_limite_ts, fin del día de fecha_limite en America/Guayaquil)` es anterior a `NOW()` de la base. Las asignaciones sin convocatoria no cuentan. | En evaluación · dictamen vencido | `REASIGNAR` | Reasignar evaluador | El plazo vencido más antiguo del protocolo (una sola fila por protocolo) |
  | d) Subir resolución firmada | El pleno cerró la sesión, el protocolo tiene `convocatoria_protocolos.dictamen_resultado` con resultado que exige carta (`APROBADO_DEFINITIVO`, `APROBADO_CON_CONDICION` o `NO_APROBADO`) y no tiene una versión vigente de la carta firmada en `resolucion.resoluciones`. Ver RF-17.3. | Resolución pendiente de subir | `SUBIR_RESOLUCION` | Subir resolución firmada | `convocatorias.fecha_reunion + 96 h corridas` |

  **RF-ALR.f.2 — Grupos de plazo (`estadoPlazo`)**: se calculan con `NOW()` de la base y la fecha de calendario de Ecuador (America/Guayaquil); cada fila está en un solo grupo.
  - `VENCIDO`: el instante del plazo ya pasó, aunque sea hoy.
  - `HOY`: vence hoy en Ecuador y todavía no pasa.
  - `SEMANA`: vence desde mañana hasta el domingo de la semana actual (la semana va de lunes a domingo).
  - `PROXIMO`: vence después de ese domingo.
  - `SIN_PLAZO`: la fila no tiene plazo (`fechaPlazo = null`).

  Con las filas de RF-ALR.f.1, la fila c) siempre está vencida y la fila d) puede estar vencida, de hoy, de esta semana o próxima. `HOY`, `SEMANA` y `PROXIMO` quedan operativos con la fila d).

  **RF-ALR.f.3 — Orden y filtros**: orden `VENCIDO`, `HOY`, `SEMANA`, `PROXIMO`, `SIN_PLAZO`; dentro de cada grupo, por `fechaPlazo` ascendente y luego por `ceishCode`. El parámetro `filtro` acepta `todos` (por defecto, todas las filas), `vencidos`, `hoy` o `semana` (solo ese grupo); cualquier otro valor responde 400. `totales` no depende del filtro: `todos` cuenta todas las filas (incluye `PROXIMO` y `SIN_PLAZO`); `vencidos`, `hoy` y `semana`, las de cada grupo.

  **RF-ALR.f.4 — Acceso**: `@Roles(SECRETARIA)` y `@Permissions(DASHBOARD_VENCIMIENTOS)`. Sin token: 401. `PRESIDENTE` (tiene el permiso, no el rol): 403.

  **RF-ALR.f.5 — Contrato de respuesta** (`GET /api/secretaria/pendientes?filtro=todos|vencidos|hoy|semana`; fechas en ISO 8601):

  ```json
  {
    "statusCode": 200,
    "message": "Pendientes obtenidos exitosamente",
    "data": {
      "fechaReferencia": "2026-11-04",
      "totales": { "todos": 0, "vencidos": 0, "hoy": 0, "semana": 0 },
      "items": [{
        "protocolId": 0, "ceishCode": "…", "title": "…",
        "estadoActual": "En evaluación · dictamen vencido",
        "etapa": "EVALUACION", "etapaOrden": 3,
        "fechaPlazo": "2026-10-21T04:59:59.999Z", "estadoPlazo": "VENCIDO",
        "accion": "REASIGNAR", "accionTexto": "Reasignar evaluador"
      }]
    }
  }
  ```

  `fechaReferencia` es la fecha de hoy en Ecuador (`YYYY-MM-DD`). `etapa` y `etapaOrden` salen de `resolveProtocolStage` (spec-001 RF-EST.1). La vista se resuelve con una sola consulta a la base.

  **RF-ALR.f.6 — Filas no implementadas en esta versión (decisión 04/11/2026; revisada 24/11/2026)**
  - Aprobado con condición → Enviar observaciones: el estado `APROBADO_CON_CONDICION` (25) no se asigna; con RF-17 el envío de observaciones se sustituye por la carta firmada (Anexo 15) y la fila d).
  - ~~Aprobado · sin resolución → Emitir: no puede ocurrir; el estado `APROBADO` (17) se fija en la misma transacción que crea la resolución.~~ **Sustituido 24/11/2026**: con RF-17 el resultado del pleno queda registrado antes de subir la carta; la fila «Subir resolución firmada» (RF-ALR.f.8) cubre ese estado. El estado del protocolo se fija al subir la carta, no al registrar el resultado.
  - Informe no entregado → Ver control: no existe el módulo de seguimiento.
  - Pendientes de agendar: se dejan fuera por ahora.

  **RF-ALR.f.7 — Tarjeta «Próxima reunión» (decisión 04/11/2026, pendiente de validar con la Secretaría; TSK-015-N07)**

  `GET /api/evaluations/meetings/next` (en `MeetingsController`, declarado antes de `GET :id`) devuelve la próxima reunión del comité. No tiene parámetros y es de solo lectura.

  - **Acceso**: `@Roles(SECRETARIA, PRESIDENTE)` y `@Permissions(RESOLUCION_CONVOCATORIAS)`; el handler añade `PermissionsGuard` (la clase ya aplica `JwtAuthGuard` y `RolesGuard`). Sin token: 401. EVALUADOR, INVESTIGADOR o un usuario sin el permiso vigente: 403.
  - **Qué reunión es**: la convocatoria en estado `PROGRAMADA` o `EN_CURSO` con `fecha_reunion` mayor o igual al inicio del día de hoy en America/Guayaquil, calculado con `NOW()` de la base. Así la reunión de hoy se sigue mostrando todo el día aunque su hora haya pasado (hoy ningún flujo la pasa a `CONCLUIDA`). Se excluyen `CANCELADA`, `CONCLUIDA` y las convocatorias sin `fecha_reunion`. Si hay varias, la de `fecha_reunion` más cercana y, si empatan, la de `numero_convocatoria` menor.
  - **Respuesta**: `200` con `data: null` si no hay ninguna.

  ```json
  {
    "statusCode": 200,
    "message": "Próxima reunión obtenida exitosamente",
    "data": {
      "id": "uuid", "numeroConvocatoria": "001-2026", "tipoSesion": "ORDINARIA",
      "fechaReunion": "2026-11-10T14:00:00.000Z",
      "lugar": { "nombre": "Sala del CEISH", "esVirtual": false, "enlaceReunion": null },
      "protocolosATratar": 3,
      "informesATratar": null
    }
  }
  ```

  - `lugar` es `null` si la convocatoria no tiene lugar.
  - `protocolosATratar` = `COUNT(DISTINCT protocolo_id)` de `convocatoria_protocolos` con `eliminado_en IS NULL` (0 si no hay).
  - `informesATratar` es siempre `null`: los informes de seguimiento (Sección III, RF-09.2) no se pueden agendar hasta RF-15 (`POST /evaluations/meetings` responde `SEGUIMIENTO_NO_DISPONIBLE`). `null` significa «no disponible», no «cero».
  - Se resuelve con una sola consulta SQL en el repositorio de meetings, sin relaciones nuevas entre entidades.

  **RF-ALR.f.8 — Fila «Subir resolución firmada» (decisión 24/11/2026)**

  Se añade a la consulta única de pendientes (RF-ALR.f.1) una cuarta fila:

  - **Qué la activa**: el protocolo pertenece a una convocatoria cuya sesión ya se cerró (`convocatorias.estado = CONCLUIDA`, o el cierre que defina RF-09), tiene `convocatoria_protocolos.dictamen_resultado` en `APROBADO_DEFINITIVO`, `APROBADO_CON_CONDICION` o `NO_APROBADO`, y **no** tiene una versión vigente de la carta firmada en `resolucion.resoluciones`. `SUSPENDIDO` no es resultado del pleno y no activa la fila.
  - **`estadoActual`**: «Resolución pendiente de subir».
  - **`accion` / `accionTexto`**: `SUBIR_RESOLUCION` / «Subir resolución firmada».
  - **Plazo**: `convocatorias.fecha_reunion + 96 h corridas` (`PLAZO_RESOLUCION_FIRMADA_HORAS` en `deadline-rules.ts`). Si `fecha_reunion` es null, la fila queda `SIN_PLAZO`.
  - **Vencida**: si el instante del plazo ya pasó, `estadoPlazo = VENCIDO`; la subida **no** se bloquea.
  - **Una sola fila por protocolo**: si el protocolo tiene varias versiones en la convocatoria, se toma la de la versión activa.
  - **Al subir la carta**: la fila desaparece porque el protocolo deja de cumplir «no tiene versión vigente». El cambio de estado ocurre en la misma transacción (RF-17.4).

  **Pendientes (no implementados en esta versión)**
  - a) Cierre de reuniones: ningún flujo del `MeetingsController` pasa una convocatoria a `CONCLUIDA` (solo la ruta antigua de `calls`); en `ceish_test_db` hay 63 convocatorias `PROGRAMADA` con fecha pasada.
  - b) Informes de seguimiento en el orden del día: `tipoPuntoAgenda` e `informeSeguimientoId` de `ConvocatoriaProtocoloOrmEntity` no son columnas, y `protocolo_id`, `version_id` y `fecha_plazo_normativo` son NOT NULL en la base, así que hoy no se puede guardar un punto de informe ni distinguir el tipo de punto.
  - c) `protocolCount` de `GET /evaluations/meetings` y `GET /evaluations/meetings/:id` cuenta filas (versiones) y no excluye `eliminado_en`; no coincide con `protocolosATratar`.

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
3. Despacho comprobable de correo único consolidado con observaciones multilínea y plazo `plazo_subsanacion_documental_dias`.
4. Generación exitosa de v2.0 con congelamiento inmutable de requisitos aprobados y plazo `plazo_condicion_dias` (inicial 30 días hábiles).
5. Verificación de calidad: 0 errores en `npx tsc --noEmit`, 100% de tests unitarios y E2E en verde.

---

## 8. Pendientes por confirmar

- ~~Entrega del informe: miércoles 12:00 posterior a la sesión (presidenta)~~ → **RESUELTO 27/10/2026 — CS-06**: plazo = fin del día de la sesión (23:59) + `entrega_dictamen_horas_tras_sesion` horas corridas (inicial 48).
- Documentos faltantes: 30 días, ¿laborables o calendario?
- Tiempo mínimo del oficio: 8 días para expedita y pleno (el SRS v3.2 decía 15).
- `dias_max_sin_convocatoria` (8) y `dias_alerta_normativo_sin_convocatoria`.
- Receso académico: no modelado; ¿suspende el plazo normativo? ¿quién lo cargaría?
- ¿El informe al Ministerio de Salud mide el cumplimiento del plazo normativo al día? De ser así, ¿se requiere precisión exacta?
- Valores de aviso por hito y si la Secretaría quiere resumen diario por correo o solo la vista dentro del sistema.
- Riesgo: lo estratifican 2 de los 4 pares (sociedad civil excluida).
- Riesgo mayor al mínimo: ¿se requieren más de 4 pares (bioética)?
- Prórroga de hasta 30 días del plazo normativo (PET): ¿se modela?
- Informe de inicio: ¿desde la aprobación (Secretaría) o desde el inicio de la ejecución (PET y carta)?
- Situación de un protocolo "No aprobado" (qué pasa después).
- `submit-risk` (`peer-assignments/:id/submit-risk`) con convocatoria vigente: ¿el endpoint exige que el protocolo esté en convocatoria (`403` si no la hay)? — RF-12.7(4b) en specs/002, DECISIÓN POR DEFECTO 28/10/2026, pendiente de confirmar con Secretaría.
- **RF-17 (resuelta 24/11/2026)**: `SUSPENDIDO` no es resultado del pleno; no hay carta de RF-17 (la suspensión es el Anexo 26, de seguimiento).
- **RF-17 (resuelta 24/11/2026)**: el cambio de estado del protocolo ocurre al subir la carta firmada, no al registrar el resultado del pleno.
- **RF-17 (resuelta 24/11/2026)**: Anexo 13 (observacional o de intervención) o Anexo 14 (ensayo clínico) según el tipo de estudio, según el PET («Dictamen de aprobación definitiva»).
- **RF-17 (resuelta 24/11/2026)**: RF-16 queda reservado para renovaciones; RF-17 es la resolución del pleno.

---

## 9. Pendientes de confirmar con el comité

| # | Pendiente | RF | Estado |
|---|---|---|---|
| 1 | ¿El PET fija una regla de quórum diferente a "más de la mitad de los miembros con voto"? | RF-09.5 | PENDIENTE |
| 2 | Documentos faltantes: ¿el plazo de 30 días es laborable o de calendario? | RF-ALR / RF-07.1 en specs/001 | PENDIENTE |
| 3 | Tiempo mínimo del oficio: ¿8 días para expedita y pleno o 15 (SRS v3.2)? | RF-12.7(c) en specs/002 | PENDIENTE |
| 4 | ¿Cuál es el valor correcto de `dias_max_sin_convocatoria` y `dias_alerta_normativo_sin_convocatoria`? | RF-12.7(d) en specs/002 | PENDIENTE |
| 5 | ¿La propuesta de riesgo de pares (`submit-risk`) exige convocatoria vigente (`403` si no hay)? Confirmar con Secretaría. | RF-12.7(4b) en specs/002 | PENDIENTE |
| 6 | Vista de pendientes: ¿son correctas las filas implementadas (Validar, Asignar, Reasignar), sin plazo para Validar y Asignar, y la omisión de Aprobado con condición, Aprobado sin resolución, Informe no entregado y Pendientes de agendar? (decisiones del 04/11/2026) | RF-ALR.f.1–f.6 | PENDIENTE de validar con la Secretaría |
| 7 | Tarjeta «Próxima reunión»: ¿cuentan `PROGRAMADA` y `EN_CURSO` desde el inicio del día en Ecuador, la más cercana, con `protocolosATratar` por protocolo distinto, `informesATratar` null y acceso de SECRETARIA y PRESIDENTE? (decisiones del 04/11/2026) | RF-ALR.f.7 | PENDIENTE de validar con la Secretaría |
| 8 | ¿Cómo y cuándo pasa una convocatoria a `CONCLUIDA` (y a `EN_CURSO`)? | RF-09, RF-ALR.f.7 a) | PENDIENTE |
| 9 | Informes de seguimiento en el orden del día: columnas del tipo de punto y del informe en `convocatoria_protocolos` (hoy `protocolo_id`, `version_id` y `fecha_plazo_normativo` son NOT NULL) | RF-09.2, RF-15, RF-ALR.f.7 b) | PENDIENTE |
| 10 | ¿`protocolCount` de `GET /evaluations/meetings` debe contar protocolos distintos sin `eliminado_en`, como `protocolosATratar`? | RF-ALR.f.7 c) | PENDIENTE |
| 11 | Si el pleno registra `SUSPENDIDO`, ¿se exige carta firmada o el protocolo queda detenido sin resolución? | RF-17.1, RF-17.2 | CERRADO 24/11/2026: `SUSPENDIDO` no es resultado del pleno (Anexo 26, seguimiento); sale de RF-17 |
| 12 | ¿El cambio de estado del protocolo se aplica al registrar el resultado del pleno o al subir la carta firmada? | RF-17.1, RF-17.4 | CERRADO 24/11/2026: al subir la carta firmada |
| 13 | ¿Cómo se decide Anexo 13 (observacional/intervención) frente a Anexo 14 (ensayo clínico)? ¿Por `tipos_estudio` o por el tipo de revisión? | RF-17.2 | CERRADO 24/11/2026: por tipo de estudio, según el PET («Dictamen de aprobación definitiva») |
| 14 | ¿La numeración RF-16 queda reservada para renovaciones y RF-17 para la resolución del pleno? | RF-17 | CERRADO 24/11/2026: sí |
