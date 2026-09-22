# Especificación de Requisitos de Software: Sistema Backend CEISH-ESPOCH

**Código de Especificación:** `specs/001-flujo-mvp/spec.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Versión:** 3.2.0  
**Estado:** Aprobado  

---

## 1. Contexto y Objetivo

### 1.1 Contexto
El Comité de Ética en Investigación en Seres Humanos de la ESPOCH (CEISH-ESPOCH) gestiona la recepción, validación documental, asignación de evaluadores, agendamiento de sesiones del pleno, evaluación ética y notificaciones normativas de investigaciones médicas y científicas.

### 1.2 Objetivo
Proporcionar una plataforma digital integral que automatice el flujo operativo del CEISH-ESPOCH: autenticación segura (interna y vía OTP para externos), recepción y validación documental con inmutabilidad de archivos aprobados, asignación de evaluadores basada en cuotas por perfil, agendamiento de Convocatorias al Pleno con notificaciones PDF, asistencia virtual mediante IA/RAG sobre la normativa PET 2023 y emisión de resoluciones.

---

## 2. Usuarios y Roles

| Rol | Descripción | Acciones Principales |
|---|---|---|
| **Investigador Principal (Interno / Externo)** | Docente, estudiante o investigador externo a la ESPOCH. | Autenticarse (vía credenciales o código OTP), registrar borrador de protocolo, subir requisitos individuales, subsanar observaciones multilínea y realizar la Aceptación Explícita de plazos. |
| **Secretaria CEISH** | Personal administrativo encargado de la gestión técnica y operativa. | Auditar el checklist documental, redactar observaciones multilínea por ítem, ajustar tipología de estudio, agendar Convocatorias al Pleno (ordinaria/extraordinaria), emitir la Constancia PDF y consultar al Asistente de IA. |
| **Evaluador Par** | Miembro del comité asignado según perfil profesional. | Revisar protocolos asignados dentro de la cuota permitida, consultar la normativa vía Asistente de IA (RAG) y emitir dictámenes éticos/metodológicos. |
| **Presidente CEISH** | Autoridad supervisora del comité. | Supervisar la carga de trabajo, autorizar la asignación de evaluadores respetando cuotas por perfil y convocar a sesiones del pleno. |

---

## 3. Historias de Usuario (Estructura Tabular Detallada)

### HU-001: Autenticación y Gestión de Perfiles
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Autenticación y Gestión de Perfiles de Usuario |
| **ID** | HU-001 |
| **Descripción** | Permite el acceso seguro de usuarios politécnicos al sistema mediante credenciales validadas y asignación de permisos según rol (RBAC). |
| **Estimación** | 12 horas |
| **Prioridad** | ALTA (1) |
| **Dependencias** | Ninguna |
| **Requisitos origen** | RF-001 |

#### 2. Pruebas de Aceptación
1. **Acceso por Rol**: Si el usuario ingresa credenciales válidas, el sistema concede acceso al dashboard según su rol (`Investigador`, `Secretaria`, `Evaluador`, `Presidente`).
2. **Control de Sesión**: La sesión se mantiene con tokens JWT y refresh tokens con expiración configurada.
3. **Auditabilidad**: Se registran los logs de inicio de sesión y acciones de perfil.

---

### HU-002: Registro Simplificado de Protocolo
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Registro Simplificado de Protocolo de Investigación |
| **ID** | HU-002 |
| **Descripción** | Permite al Investigador Principal registrar los datos mínimos (`title`, `studyTypeId`, `principalInvestigatorId`) y aceptar la Declaración Jurada para iniciar la solicitud. |
| **Estimación** | 16 horas |
| **Prioridad** | ALTA (2) |
| **Dependencias** | HU-001 |
| **Requisitos origen** | RF-002 |

#### 2. Pruebas de Aceptación
1. **Campos Obligatorios**: El sistema exige título, tipo de estudio e ID del Investigador Principal.
2. **Declaración Jurada Obligatoria**: Impide guardar el borrador si no se acepta la declaración de que el estudio no ha iniciado previamente.
3. **Estado Inicial**: Al registrar, se asigna el estado inicial `TRÁMITE EN PROCESO` / `PENDIENTE_ASIGNACION`.

---

### HU-003: Carga y Checklist Dinámico de Requisitos
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Carga y Checklist Dinámico de Requisitos Documentales |
| **ID** | HU-003 |
| **Descripción** | Despliega la matriz de requisitos según la tipología del estudio (`IO`, `EI`, `EC`, `EX`) y permite la carga individual de archivos por cada ítem. |
| **Estimación** | 14 horas |
| **Prioridad** | ALTA (3) |
| **Dependencias** | HU-002 |
| **Requisitos origen** | RF-003, RF-004 |

#### 2. Pruebas de Aceptación
1. **Generación de Checklist**: Muestra dinámicamente los requisitos específicos según el PET 2023.
2. **Carga Individual**: Cada documento se sube independientemente.
3. **Límite de Tamaño**: Rechaza archivos que superen el límite máximo parametrizado.

---

### HU-004: Validación Documental y Control de Tipología
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Validación Documental y Control de Tipología de Estudio |
| **ID** | HU-004 |
| **Descripción** | Permite a la Secretaria auditorar los documentos, corregir la tipología del estudio si hay inconsistencias metodológicas y aprobar la recepción. |
| **Estimación** | 18 horas |
| **Prioridad** | ALTA (4) |
| **Dependencias** | HU-003 |
| **Requisitos origen** | RF-003.2, RF-005 |

#### 2. Pruebas de Aceptación
1. **Auditoría Individual**: La Secretaria clasifica cada documento como `Aprobado` u `Observado`.
2. **Ajuste de Tipología**: Al corregir el tipo de estudio, el checklist se recalcula automáticamente manteniendo el trámite activo.
3. **Asignación del Código Único**: Al aprobar el 100% de los requisitos, se genera atómicamente el código correlativo (`CEISH-ESPOCH-IO-001-2026`).

---

### HU-005: Subsanación Focalizada y Control de Plazo (15 Días Hábiles)
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Subsanación Focalizada y Control de Plazo de 15 Días Hábiles |
| **ID** | HU-005 |
| **Descripción** | Gestiona el plazo de 15 días hábiles para corregir únicamente los archivos observados, manteniendo inmutables los requisitos ya validados. |
| **Estimación** | 16 horas |
| **Prioridad** | ALTA (5) |
| **Dependencias** | HU-004 |
| **Requisitos origen** | RF-004.2, RF-007, RF-013 |

#### 2. Pruebas de Aceptación
1. **Notificación de Observaciones Multilínea**: Envía un correo notificando las observaciones detalladas por cada ítem y la fecha límite exacta.
2. **Inmutabilidad de Aprobados**: Muestra bloqueados (🔒) los documentos validados previamente.
3. **Archivado Híbrido**: Transcurridos los 15 días hábiles sin subsanación, el expediente pasa automáticamente a `Archivado por Vencimiento`.

---

### HU-006: Constancia de Recepción PDF y Aceptación Explícita
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Constancia de Recepción PDF y Aceptación Explícita de Plazos |
| **ID** | HU-006 |
| **Descripción** | Genera la Constancia de Recepción en PDF con el código asignado y exige al Investigador confirmar la aceptación explícita de sometimiento a plazos. |
| **Estimación** | 14 horas |
| **Prioridad** | ALTA (6) |
| **Dependencias** | HU-004, HU-005 |
| **Requisitos origen** | RF-008 |

#### 2. Pruebas de Aceptación
1. **Emisión de PDF**: Adjunta el PDF oficial de la Constancia de Recepción al correo de aprobación documental.
2. **Aceptación Explícita**: El Investigador confirma el sometimiento a plazos desde su perfil web.
3. **Registro de Fecha e IP**: La confirmación se guarda con timestamp e IP en la base de datos; si falta la aceptación, se impide asignar evaluadores.

---

### HU-007: Gestión de Convocatorias y Agendamiento del Pleno
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Gestión de Convocatorias y Agendamiento de Sesiones del Pleno |
| **ID** | HU-007 |
| **Descripción** | Permite agendar protocolos validados en una Convocatoria a Pleno (Ordinaria/Extraordinaria) con numeración correlativa (`001-2026`), orden del día y envío de notificaciones PDF. |
| **Estimación** | 16 horas |
| **Prioridad** | ALTA (7) |
| **Dependencias** | HU-006 |
| **Requisitos origen** | RF-009 |

#### 2. Pruebas de Aceptación
1. **Agendamiento Secuencial**: Crea convocatorias asignando número secuencial correlativo por año lectivo (ej. `001-2026`).
2. **Control de 3 Fechas**: Registra obligatoriamente `fecha_plazo_normativo`, `fecha_reunion` y `fecha_entrega_evaluacion`.
3. **Generación y Envío de PDF**: Genera automáticamente el PDF de la Convocatoria con el Orden del Día y lo notifica por correo a los miembros del CEISH.

---

### HU-008: Autenticación de Investigadores Externos vía OTP
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Autenticación de Investigadores Externos mediante Código OTP |
| **ID** | HU-008 |
| **Descripción** | Permite a investigadores externos (sin correo `@espoch.edu.ec`) registrarse y validar la veracidad de su correo mediante un código OTP temporal de 6 dígitos. |
| **Estimación** | 12 horas |
| **Prioridad** | ALTA (8) |
| **Dependencias** | HU-001 |
| **Requisitos origen** | RF-010 |

#### 2. Pruebas de Aceptación
1. **Generación de OTP**: Al ingresar el correo externo, el sistema genera y envía un token numérico de 6 dígitos.
2. **Tiempo de Expiración**: El código OTP tiene una vigencia máxima de 15 minutos.
3. **Validación e Ingrese**: Al verificar el OTP correcto, el sistema autentica al investigador externo y permite crear solicitudes.

---

### HU-009: Asistente Virtual Inteligente de Consultas Normativas (IA / RAG)
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Asistente Virtual Inteligente de Consultas Normativas (IA / RAG) |
| **ID** | HU-009 |
| **Descripción** | Proporciona un asistente virtual con IA que realiza búsquedas semánticas sobre la normativa PET 2023 y el contexto del protocolo para orientar a la Secretaria y Evaluadores. |
| **Estimación** | 16 horas |
| **Prioridad** | MEDIA (9) |
| **Dependencias** | HU-001 |
| **Requisitos origen** | RF-011 |

#### 2. Pruebas de Aceptación
1. **Búsqueda Semántica (RAG)**: El asistente responde preguntas sobre los reglamentos del CEISH utilizando fragmentos del PET 2023.
2. **Inyección de Contexto**: Al consultar desde la ficha de un protocolo, el asistente incorpora los datos del expediente para afinar las sugerencias.
3. **Modo Tolerante a Fallos**: Si la API externa no está disponible o falta la API Key, el sistema muestra un mensaje claro sin afectar el resto del flujo.

---

### HU-010: Subsanación por Dictamen del Pleno y Generación de Versión v2.0
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Subsanación por Dictamen de Pleno y Generación de Versión v2.0 |
| **ID** | HU-010 |
| **Descripción** | Permite al Investigador resometer su propuesta en una nueva versión mayor (v2.0, v3.0) cuando el Pleno emite un dictamen de "Aprobado con Condiciones / Requiere Subsanación", heredando los documentos aprobados como inmutables y otorgando un plazo normativo de 30 días hábiles para corregir los observados. |
| **Estimación** | 16 horas |
| **Prioridad** | CRÍTICA (ALTA) |
| **Dependencias** | HU-006, HU-007 |
| **Requisitos origen** | RF-014 |

#### 2. Pruebas de Aceptación (EARS)
1. **Auto-Generación de Versión**: **Cuando** el Presidente o Secretaría emiten la resolución "Aprobado con Observaciones" (`resolutionTypeId: 2`), **el sistema debe** congelar la versión v1.0 (estado 19), crear automáticamente la versión v2.0 y asignar un nuevo plazo de 30 días hábiles (`correctionDeadlineDate`).
2. **Herencia e Inmutabilidad de Requisitos**: **Cuando** se cree la nueva versión v2.0, **el sistema debe** mantener congelados y bloqueados (🔒) los requisitos previamente aprobados, y resetear a `NO_PRESENTADO` únicamente los requisitos observados o rechazados.
3. **Re-Ingreso a Control Documental**: **Cuando** el Investigador complete la carga de las observaciones de v2.0 y presione enviar, **el sistema debe** cambiar el estado a `EN_CONTROL_DOCUMENTAL` (estado 21) para su posterior agendamiento en una nueva Convocatoria.

---

### HU-011: Seguimiento Post-Aprobación e Informes de Avance / Finales
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Seguimiento de Entregables, Informes de Avance e Informe Final |
| **ID** | HU-011 |
| **Descripción** | Permite al Investigador Principal someter Informes Periódicos de Avance y el Informe Final de la Investigación aprobada, y permite al CEISH auditarlos para renovar o cerrar el aval ético. |
| **Estimación** | 16 horas |
| **Prioridad** | MEDIA / ALTA |
| **Dependencias** | HU-006 |
| **Requisitos origen** | RF-015 |

#### 2. Pruebas de Aceptación (EARS)
1. **Notificación de Vencimiento de Avance**: **Si** se cumple la fecha programada para la entrega del Informe de Avance (ej: semestral/anual), **el sistema debe** notificar por correo al Investigador Principal recordando la obligación de entrega.
2. **Carga de Informe Final**: **Cuando** la investigación concluya, **el sistema debe** permitir al Investigador adjuntar el Informe Final de Resultados, el resumen de participantes y la declaración de cierre de muestras biológicas.
3. **Aprobación de Seguimiento**: **Cuando** la Secretaría o Evaluador revise el Informe de Avance/Final, **el sistema debe** permitir registrar el estado de conformidad (`Aprobado`, `Con Observaciones` o `Requiere Inspección`).

---

### HU-012: Gestión de Enmiendas, Renovaciones y Eventos Adversos
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Gestión de Enmiendas al Protocolo, Renovaciones y Reporte de Eventos Adversos |
| **ID** | HU-012 |
| **Descripción** | Permite gestionar cambios metodológicos al protocolo aprobado (Enmiendas), solicitudes de prórroga/renovación del aval ético y el reporte urgente de Eventos Adversos Graves (EAG) en participantes. |
| **Estimación** | 18 horas |
| **Prioridad** | ALTA (Seguridad del Paciente/Participante) |
| **Dependencias** | HU-006 |
| **Requisitos origen** | RF-016 |

#### 2. Pruebas de Aceptación (EARS)
1. **Solicitud de Enmienda**: **Cuando** el Investigador requiera modificar el diseño, tamaño de muestra o equipo de investigación de un protocolo aprobado, **el sistema debe** crear un trámite de Enmienda (`SEGUIMIENTO_ENMIENDAS`) adjuntando el documento de cambios justificados.
2. **Reporte Urgencia Evento Adverso**: **Si** ocurre un Evento Adverso Grave (EAG), **el sistema debe** permitir al Investigador enviar un reporte de emergencia en un plazo no mayor a 24-48 horas, notificando inmediatamente con alerta roja al Presidente y Secretaría.
3. **Suspensión / Revocatoria**: **Si** el Comité detecta incumplimientos éticos o riesgos no tolerables en el seguimiento, **el Pleno debe** poder cambiar el estado del protocolo a Suspendido o Revocado (`SEGUIMIENTO_SUSPENSION`).

---

## 4. Requisitos Funcionales

### RF-01: Autenticación y Perfil de Usuario
- **RF-01.1**: El sistema debe permitir el inicio de sesión seguro para usuarios registrados.
- **Criterio EARS (RF-01.1)**: **Cuando** un usuario ingrese credenciales válidas, **el sistema debe** autenticar la sesión y conceder acceso al dashboard según su rol (`Investigador`, `Secretaria`, `Evaluador` o `Presidente`).

### RF-02: Registro de Datos Mínimos del Protocolo
- **RF-02.1**: El sistema exige los campos obligatorios `title`, `studyTypeId`, `principalInvestigatorId` e `isAffidavitAccepted`.
- **Criterio EARS (RF-02.1)**: **Mientras** el Investigador Principal no acepte la Declaración Jurada, **el sistema debe** impedir el registro del protocolo.

### RF-03: Generación Automática y Ajuste del Checklist Documental
- **RF-03.1**: El sistema debe generar dinámicamente la matriz de requisitos según el tipo de estudio.
- **RF-03.2**: La Secretaria podrá corregir el tipo de estudio durante la revisión técnica si detecta discrepancias metodológicas.
- **Criterio EARS (RF-03.1)**: **Cuando** se registre un protocolo o la Secretaria corrija su tipología, **el sistema debe** actualizar automáticamente el checklist de requisitos obligatorios.

### RF-04: Carga Individual y Bloqueo de Inmutabilidad
- **RF-04.1**: Permite la subida de archivos individuales por cada punto del checklist.
- **RF-04.2**: Los requisitos calificados como `Aprobado` por la Secretaria quedarán bloqueados contra ediciones.
- **Criterio EARS (RF-04.1)**: **Si** el usuario intenta modificar un archivo previamente aprobado o excede el peso parametrizado, **el sistema debe** rechazar la petición con un error explícito en español.

### RF-05: Validación Técnica y Auditoría Focalizada
- **RF-05.1**: La Secretaria auditará los documentos y clasificará la recepción como `Completa` o `Incompleta / Requiere Subsanación`.
- **Criterio EARS (RF-05.1)**: **Cuando** la Secretaria revise una subsanación, **el sistema debe** mostrar inhabilitados los ítems aprobados y destacar únicamente los corregidos.

### RF-06: Asignación del Código Único Oficial
- **RF-06.1**: Formato atómico: `CEISH-ESPOCH-[SIGLA]-[SECUENCIAL_3_DIGITOS]-[AÑO]`.
- **Criterio EARS (RF-06.1)**: **Cuando** la Secretaria apruebe la validación documental completa, **el sistema debe** generar de forma atómica e incremental el código único oficial en la base de datos.

### RF-07: Gestión del Plazo de 15 Días Hábiles y Archivado Híbrido
- **RF-07.1**: Otorga 15 días hábiles para subsanar observaciones.
- **Criterio EARS (RF-07.1)**: **Si** se registran observaciones, **el sistema debe** calcular el plazo de 15 días hábiles, enviar la notificación por correo y cambiar el estado a `Incompleto / Requiere Subsanación`.
- **Criterio EARS (RF-07.2)**: **Si** transcurren los 15 días hábiles sin subsanación o se ejecuta el Cron Job diario, **el sistema debe** marcar el trámite como `Archivado por Vencimiento / Extemporáneo`.

### RF-08: Emisión de Constancia PDF y Aceptación Explícita del Investigador
- **RF-08.1**: Genera la Constancia de Recepción en PDF con el código asignado.
- **RF-08.2**: Requiere la Aceptación Explícita de plazos por el Investigador.
- **Criterio EARS (RF-08.1)**: **Cuando** la recepción quede validada, **el sistema debe** generar la Constancia PDF y enviarla por correo al Investigador.
- **Criterio EARS (RF-08.2)**: **Mientras** el Investigador Principal no confirme la Aceptación Explícita desde su perfil, **el sistema debe** impedir la asignación de evaluadores pares.

### RF-09: Gestión de Convocatorias a Sesiones del Pleno
- **RF-09.1**: El sistema debe agendar protocolos validados en Convocatorias al Pleno (Ordinaria / Extraordinaria) con numeración correlativa (`001-2026`).
- **Criterio EARS (RF-09.1)**: **Cuando** la Secretaria ordene una sesión del pleno, **el sistema debe** registrar obligatoriamente `fecha_plazo_normativo`, `fecha_reunion` y `fecha_entrega_evaluacion`, generar la convocatoria en PDF con el Orden del Día y notificarla por correo a los miembros del CEISH.

### RF-10: Autenticación de Investigadores Externos vía OTP
- **RF-10.1**: El sistema debe permitir el autoregistro de usuarios externos mediante código de un solo uso (OTP).
- **Criterio EARS (RF-10.1)**: **Cuando** un usuario con correo no-politécnico solicite acceso, **el sistema debe** generar un código OTP de 6 dígitos con expiración de 15 minutos y enviarlo por correo para autenticar la sesión.

### RF-11: Asistente Virtual Inteligente (IA / RAG)
- **RF-11.1**: Proporciona un módulo de asistencia basado en IA para consultar la normativa PET 2023 y el contexto de protocolos.
- **Criterio EARS (RF-11.1)**: **Cuando** la Secretaria o un Evaluador realicen una consulta en el chat del asistente, **el sistema debe** recuperar fragmentos del PET 2023 mediante RAG y retornar la orientación correspondiente respetando el control de acceso RBAC.

### RF-12: Matriz de Asignación y Restricción de Cuotas por Perfil de Evaluador
- **RF-12.1**: El sistema debe controlar el número máximo de evaluadores asignados por tipo en cada protocolo.
- **Criterio EARS (RF-12.1)**: **Cuando** se asignen evaluadores a un protocolo, **el sistema debe** verificar que no se superen las cuotas permitidas: máximo 1 para `SOCIEDAD_CIVIL`, máximo 1 para `JURIDICO`, y hasta 2 para `ETICA / METODOLOGICO_SALUD`.

### RF-13: Observaciones Multilínea por Requisito Documental
- **RF-13.1**: Permite a la Secretaria detallar correcciones específicas por cada documento del checklist.
- **Criterio EARS (RF-13.1)**: **Si** la Secretaria marca un requisito como observatorio, **el sistema debe** habilitar un campo multilínea (textarea) por ítem y consolidar todas las observaciones en el correo de subsanación.

### RF-14: Subsanación de Versión Mayor (Ciclo Multiversión)
- **RF-14.1**: El sistema debe soportar el ciclo de vida multiversión (v1.0 → v2.0 → v3.0), asignando 30 días hábiles por versión y bloqueando documentos aprobados previamente.
- **Criterio EARS (RF-14.1)**: **Cuando** un protocolo requiera observaciones mayores tras dictamen del Pleno, **el sistema debe** generar una nueva versión correlativa del expediente, asignar un plazo normativo de 30 días hábiles para la respuesta e inhabilitar la modificación de los documentos validados previamente.

### RF-15: Informes de Avance, Cierre y Calendario de Entregables
- **RF-15.1**: El sistema debe controlar el calendario de entregables periódicos e informe final de los protocolos aprobados (`SEGUIMIENTO_AVANCE`, `SEGUIMIENTO_FINAL`).
- **Criterio EARS (RF-15.1)**: **Cuando** una investigación sea aprobada, **el sistema debe** calcular las fechas de vencimiento de sus informes periódicos y final, enviando notificaciones automáticas por correo recordando la obligación de entrega.

### RF-16: Gestión de Enmiendas, Renovaciones y Eventos Adversos
- **RF-16.1**: El sistema debe permitir la tramitación de Enmiendas al protocolo, Renovaciones del certificado ético y Alertas tempranas de Eventos Adversos Graves (`SEGUIMIENTO_EVENTOS`).
- **Criterio EARS (RF-16.1)**: **Cuando** el Investigador Principal reporte un Evento Adverso Grave (EAG), **el sistema debe** registrar la notificación de urgencia en un plazo no mayor a 24-48 horas e informar inmediatamente con alerta roja al Presidente y Secretaría.

### RF-17: Suspensión y Revocatoria del Aval Ético
- **RF-17.1**: El sistema debe permitir al Pleno del CEISH suspender o revocar resoluciones vigentes ante violaciones éticas o riesgos no tolerables (`SEGUIMIENTO_SUSPENSION`).
- **Criterio EARS (RF-17.1)**: **Si** el Pleno dicta la suspensión o revocatoria del protocolo, **el sistema debe** actualizar inmediatamente el estado del trámite, inhabilitar nuevas entregas y notificar exclusivamente por correo al Investigador y a la Secretaría para el control interno.

### RF-18: Usabilidad, Plantillas de Requisitos y Deep-Linking
- **RF-18.1**: El sistema debe proveer acceso directo a las plantillas y formatos oficiales descargables por cada Anexo en el catálogo de requisitos, y soportar deep-linking desde notificaciones de correo.
- **Criterio EARS (RF-18.1)**: **Cuando** un Investigador consulte el checklist de requisitos, **el sistema debe** retornar la URL de descarga directa de la plantilla oficial del anexo correspondiente.
- **Criterio EARS (RF-18.2)**: **Cuando** un Investigador abra el enlace de la notificación por correo, **el sistema debe** redirigirlo directamente a la pantalla de Aceptación Explícita de Plazos de ese protocolo específico.
- **Criterio EARS (RF-18.3)**: **Cuando** la Secretaría redacte observaciones por ítem del checklist, **el sistema debe** disponer de áreas de texto multilínea (`textarea`) sin compresión ni scrolls perezosos.

### RF-19: Reglas Específicas de Tesis, Informe Narrativo de Evaluador e Integración Quipux
- **RF-19.1**: El sistema debe adaptar el checklist documental para proyectos de Tesis de Grado/Posgrado exigiendo obligatoriamente: (a) Acta de Aprobación de Tema de Tesis, y (b) Certificado de Revisión y Respaldo del Director de Tesis.
- **RF-19.2**: El sistema debe permitir a los Evaluadores adjuntar su Informe Narrativo detallado en formato digital (Word/PDF) como complemento de la captura estructurada de los Anexos 9 y 10.
- **RF-19.3**: El sistema debe permitir registrar el Número de Oficio / Trámite Quipux para trazabilidad institucional en las notificaciones y convocatorias expedidas.
- **Criterio EARS (RF-19.1)**: **Si** la modalidad del estudio es Tesis (Pregrado o Posgrado), **el sistema debe** inyectar automáticamente en el checklist los requisitos obligatorios del Acta de Aprobación de Tema y Certificado del Director.
- **Criterio EARS (RF-19.2)**: **Cuando** un Evaluador Par registre su dictamen técnico, **el sistema debe** permitir subir el informe narrativo en Word/PDF y registrar simultáneamente el dictamen estructurado de los Anexos 9 y 10.
- **Criterio EARS (RF-19.3)**: **Cuando** la Secretaría emita un comunicado formal o convocatoria, **el sistema debe** permitir incluir el código de referencia Quipux correspondiente.

---

## 5. Requisitos No Funcionales

1. **Usabilidad**: Interfaces adaptadas a perfiles administrativos, académicos y externos, con mensajes de validación explicativos 100% en idioma **Español**.
2. **Seguridad e Integridad**: Control de acceso basado en roles (RBAC), hashing de claves con bcrypt y tokens OTP de 6 dígitos con expiración estricta de 15 minutos.
3. **Parametrización**: Tamaño máximo por archivo individual, extensiones permitidas y plantillas de correo editables.
4. **Auditabilidad**: Trazabilidad completa con usuario, fecha, hora e IP en cambios de estado, Aceptación Explícita de plazos y firma de convocatorias.
5. **Arquitectura Limpia e Idioma Interno**: Todo el código fuente, entidades TypeORM, DTOs y clases deben redactarse en **Inglés**, manteniendo la comunicación al usuario, respuestas de error y documentos PDF exclusivamente en **Español**.

---

## 6. Casos Límite y Manejo de Excepciones

- **Fallo de Envíos de Correo / SMTP**: El sistema registrará la falla en bitácora sin revertir las transacciones de cambio de estado o generación de convocatorias.
- **Expiración de Código OTP**: Si un usuario ingresa un token OTP después de los 15 minutos, el sistema rechazará la autenticación e invitará a solicitar un nuevo código.
- **Superación de Cuotas de Evaluadores**: Si se intenta asignar un segundo evaluador de `SOCIEDAD_CIVIL` o `JURIDICO` al mismo protocolo, el sistema rechazará la asignación con un error explicativo.
- **Indisponibilidad del Asistente de IA**: Si falta la API Key o falla el proveedor de IA (Gemini), el módulo responderá con una excepción 553 / Service Unavailable sin interrumpir el funcionamiento de la plataforma.
- **Concurrencia en Convocatorias y Código Único**: Las secuencias correlativas de código CEISH (`001-2026`) y Convocatorias (`001-2026`) se aislarán mediante transacciones atómicas en PostgreSQL para evitar duplicaciones.

---

## 7. Fuera de Alcance

Quedan diferidos para iteraciones posteriores:
1. Formularios de Evaluación Ética avanzada para Ensayos Clínicos complejos (Fase I/II).
2. Firma Electrónica con certificado digital en la emisión de resoluciones definitivas.
3. Integración mediante API directa hacia sistemas externos del Ministerio de Salud Pública (MSP) o ARCSA.

---

## 8. Criterios de Finalización (Definition of Done)

Un requerimiento se considerará **Finalizado** cuando:
1. Todos los criterios de aceptación EARS asociados sean verificables funcionalmente.
2. Se permita la autenticación politécnica y externa vía OTP de 6 dígitos.
3. Se generen códigos atómicos y Convocatorias al Pleno con notificaciones PDF sin duplicados.
4. Se aplique la restricción de cuotas por perfil de evaluador (`SOCIEDAD_CIVIL`, `JURIDICO`, `ETICA`).
5. Se registre atómicamente la Aceptación Explícita de plazos con fecha e IP por el Investigador.
6. Todos los mensajes al usuario, errores, correos y PDFs estén 100% en idioma Español y el código interno en Inglés.

---

## 9. Dudas Abiertas

- `[NECESITA ACLARACIÓN]`: Ninguna. La totalidad de funcionalidades desarrolladas en el Backend y reglas de negocio han sido integradas y documentadas en la especificación.
