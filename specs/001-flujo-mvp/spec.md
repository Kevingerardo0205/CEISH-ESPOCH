# Especificación de Requisitos de Software: Sistema Backend CEISH-ESPOCH

**Código de Especificación:** `specs/001-flujo-mvp/spec.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Versión:** 3.5.2
**Estado:** Aprobado  
**Historial:** 2026-10-10 — v3.3.0: alineado con decisiones de Secretaría/Tutor (ver Pendientes por confirmar)  
**Historial:** 2026-10-10 — v3.3.1: RF-16.1 avisos de renovación actualizados a 90, 60 y 15 días; parámetro `alerta_renovacion_offsets_dias`  
**Historial:** 2026-10-27 — v3.4.0: CS-01 etapas (7) del protocolo en catálogo estados; CS-10 precisión de recepción; CS-12 renovación como etapa propia; CS-14 parámetros del sistema; CS-16 enmiendas fuera de alcance — rediseño 27/10/2026
**Historial:** 2026-10-28 — v3.4.1: HU-001 roles fijos y gestión de usuarios del comité; RF-16.1 mismos pares resuelto; RF-EST.1/RF-EST.2/RF-EST.3 transición a 6 etapas canónicas (Riesgo integrado dentro de Evaluación, columnas de riesgo y dictámenes, filtros por riesgo y dictámenes, Evaluación concluye con nivel de riesgo fijado y todos los dictámenes entregados, Renovación etapa 6); sección Pendientes de confirmar con el comité
**Historial:** 2026-10-28 — v3.5.0: HU-001 roles fijos completo: ADMIN_TI absorbido, segregación INVESTIGADOR excluyente, una sola SECRETARIA, matriz de permisos fija, permisos retirados, asistente IA, reglas de migración de datos
**Historial:** 2026-10-28 — v3.5.1: HU-001 c) Presidente ve la consolidación de dictámenes; i) permiso por endpoint; j) vigencia en sesión y guards
**Historial:** 2026-10-29 — v3.5.2: HU-001 b) cambio de investigador a comité sin protocolos en curso; registro con cédula o correo repetidos

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
| **Título** | Autenticación, Roles Fijos, Matriz de Permisos y Segregación de Funciones |
| **ID** | HU-001 |
| **Descripción** | Gestiona el acceso al sistema con roles fijos (`SECRETARIA`, `PRESIDENTE`, `EVALUADOR`, `INVESTIGADOR`), matriz de permisos sembrada por migración y no editable desde la aplicación, segregación de funciones (`INVESTIGADOR` excluyente de roles del comité) y regla de Secretaría única. `ADMIN_TI` queda absorbido por `SECRETARIA`; los identificadores `ADMIN` y `PRESIDENTA` no son roles. — Reemplaza a: gestión dinámica de roles y permisos — decisión 28/10/2026 |
| **Estimación** | 12 horas |
| **Prioridad** | ALTA (1) |
| **Dependencias** | Ninguna |
| **Requisitos origen** | RF-001 |

#### 2. Pruebas de Aceptación
1. **Acceso por Rol**: Si el usuario ingresa credenciales válidas, el sistema concede acceso al dashboard según su rol (`INVESTIGADOR`, `SECRETARIA`, `EVALUADOR`, `PRESIDENTE`). Una persona puede tener varios roles del comité simultáneamente (ver punto b).
2. **Control de Sesión**: La sesión se mantiene con tokens JWT y refresh tokens con expiración configurada.
3. **Auditabilidad**: Se registran los logs de inicio de sesión y acciones de perfil.
4. **Roles fijos — ADMIN_TI absorbido (decisión 28/10/2026)**: Los roles disponibles son `SECRETARIA` (incluye la administración del sistema; absorbe todas las funciones que antes tenía `ADMIN_TI`), `PRESIDENTE`, `EVALUADOR` (con perfil `METODOLOGICO`, `SALUD`, `JURIDICO` o `SOCIEDAD_CIVIL`) e `INVESTIGADOR`. Los identificadores `ADMIN` y `PRESIDENTA` no son roles del sistema. No existen en la base de datos; solo aparecen como texto en el código y en pruebas, y se retiran de ahí. — Reemplaza a: ADMIN_TI como rol propio — decisión 28/10/2026
5. **Gestión de usuarios del comité (Configuración → Usuarios)**: La Secretaría (permiso `USUARIOS_GESTIONAR`) puede invitar a un usuario del comité con correo OTP, reenviar la invitación, asignarle un rol del comité, desactivarlo y reactivarlo. No hay borrado físico: el historial se conserva íntegro. — decisión 28/10/2026
6. **Gestión de investigadores**: Los investigadores se registran solos. La Secretaría solo puede verlos y desactivarlos. — decisión 28/10/2026

#### 3. Requisitos de Roles, Permisos y Segregación de Funciones

**a) Roles fijos (decisión 28/10/2026)**

Los cuatro roles del sistema son fijos y no se crean ni editan desde la aplicación. — Reemplaza a: roles dinámicos — decisión 28/10/2026

| Rol | Descripción |
|---|---|
| `SECRETARIA` | Gestión operativa y administrativa del CEISH. Absorbe las funciones que antes tenía `ADMIN_TI`. — Reemplaza a: ADMIN_TI como rol separado — decisión 28/10/2026 |
| `PRESIDENTE` | Autoridad supervisora del comité. |
| `EVALUADOR` | Miembro del comité; lleva uno de los cuatro perfiles: `METODOLOGICO`, `SALUD`, `JURIDICO` o `SOCIEDAD_CIVIL`. |
| `INVESTIGADOR` | Docente, estudiante o externo que somete protocolos. |

Los identificadores `ADMIN` y `PRESIDENTA` no son roles del sistema. No existen en la base de datos; solo aparecen como texto en el código y en pruebas, y se retiran de ahí.

**b) Combinación de roles (decisión 28/10/2026, actualizada 29/10/2026)**

- Un usuario puede tener varios roles del comité simultáneamente: `SECRETARIA`, `PRESIDENTE` y/o `EVALUADOR`.
- `INVESTIGADOR` es **excluyente** con todos los roles del comité:
  - Un usuario con cualquier rol del comité no puede registrarse como investigador ni recibir el rol `INVESTIGADOR`.
  - A un usuario con rol `INVESTIGADOR` no se le puede asignar ningún rol del comité de forma simultánea.
  - Cambio de investigador a miembro del comité (decisión 29/10/2026): la Secretaría puede reemplazar `INVESTIGADOR` por uno o más roles del comité en una sola asignación. `INVESTIGADOR` se revoca con `fecha_fin` y nunca coexiste con un rol del comité. Solo se permite si la persona no es investigador principal ni co-investigador de ningún protocolo en curso. Un protocolo está en curso si su estado no es terminal; hoy los estados terminales son `RECHAZADO` y `ARCHIVADO_VENCIMIENTO` (cuando existan estados de cierre o revocación, se agregan). Si tiene protocolos en curso, el backend rechaza la operación e indica cuántos son.
  - El cambio inverso sigue prohibido: a quien tiene un rol del comité vigente no se le asigna `INVESTIGADOR`.
  - Todos los caminos que dan o reactivan un rol (crear usuario, editar usuario, asignar roles, prorrogar un rol) aplican las reglas b) y b2).
  - El registro de investigador rechaza con un mensaje claro (400) un correo o una cédula ya registrados.
  - En todos los casos el backend rechaza la operación con un mensaje en español. — Reemplaza a: sin restricción de combinación — decisión 28/10/2026

**b2) Una sola Secretaría vigente (decisión 28/10/2026, actualizada 29/10/2026)**

Solo puede haber un usuario con el rol `SECRETARIA` activo a la vez. Si se intenta asignar `SECRETARIA` a un segundo usuario mientras haya uno vigente, el backend rechaza la operación con un mensaje claro. Mientras la suplencia de la Secretaría esté pendiente (sección 11), se rechaza asignar o prorrogar `SECRETARIA` a otra persona si su período se superpone con el de la titular vigente o programada. — Reemplaza a: sin restricción de unicidad — decisión 28/10/2026

**c) Matriz de permisos fija (decisión 28/10/2026)**

La matriz se siembra por migración y **no se edita desde la aplicación**. Los endpoints que escriben en tablas de roles, módulos, permisos y `rol_permisos` se cierran. — Reemplaza a: gestión dinámica de permisos — decisión 28/10/2026

| Permiso | SECRETARIA | PRESIDENTE | EVALUADOR | INVESTIGADOR |
|---|---|---|---|---|
| `DASHBOARD_RESUMEN`, `DASHBOARD_NOTIF` | ✓ | ✓ | ✓ | ✓ |
| `DASHBOARD_VENCIMIENTOS` | ✓ | ✓ | — | — |
| `RECEPCION_LISTA`, `RECEPCION_VALIDAR`, `RECEPCION_BUSCAR`, `RECEPCION_CONSTANCIAS` | ✓ | — | — | — |
| `RECEPCION_NUEVO` | ✓ | — | — | ✓ |
| `EVALUACION_ASIGNAR` | ✓ | — | — | — |
| `EVALUACION_INFORMES` | ✓ | ✓ | — | — |
| `EVALUACION_RIESGO`, `EVALUACION_EXPEDITA`, `EVALUACION_PLENO` | ✓ | ✓ | ✓ | — |
| `EVALUACION_SUBSANACIONES` | ✓ | — | — | ✓ |
| `RESOLUCION_CREAR`, `RESOLUCION_NOTIF`, `RESOLUCION_HISTORIAL`, `RESOLUCION_CONVOCATORIAS` | ✓ | ✓ | — | — |
| `RESOLUCION_FIRMAR` | — | ✓ | — | — |
| `SEGUIMIENTO_AVANCE`, `SEGUIMIENTO_FINAL`, `SEGUIMIENTO_EVENTOS`, `SEGUIMIENTO_RENOVACIONES` | ✓ | ✓ | ✓ | ✓ |
| `SEGUIMIENTO_SUSPENSION` | ✓ | ✓ | — | — |
| `USUARIOS_VER`, `USUARIOS_GESTIONAR`, `USUARIOS_CONFLICTOS`, `EVALUADORES_PERFILES` | ✓ | — | — | — |
| `REPORTES_CARGA`, `REPORTES_EXPORTAR`, `REPORTES_AUDITORIA`, `AUDITORIA_ACCESOS` | ✓ | ✓ | — | — |
| `CONFIG_PARAMETROS`, `CONFIG_PLANTILLAS`, `CONFIG_CATALOGOS`, `CONFIG_NOTIF` | ✓ | — | — | — |

> - En `EVALUADOR` e `INVESTIGADOR`, el alcance se limita a sus propios recursos: los protocolos asignados al evaluador y los protocolos propios del investigador. Eso lo valida el servicio, no la matriz.
> - `RESOLUCION_URGENCIAS`, `REPORTES_KPIS` y `REPORTES_TIEMPOS` quedan **PENDIENTES**, según los reportes que confirme el comité (RF-12.8 en specs/002).
> - El Presidente consulta la consolidación de dictámenes (solo lectura) para preparar el pleno. — decisión 28/10/2026
> - No existe endpoint de firma: la Secretaría emite la resolución con RESOLUCION_CREAR. RESOLUCION_FIRMAR queda solo para PRESIDENTE. — decisión 28/10/2026
> - La validación final de la matriz con la Secretaría queda **PENDIENTE**.

**d) Asignación de roles (decisión 28/10/2026)**

- La asignación de roles la hace la Secretaría con el permiso `USUARIOS_GESTIONAR` (módulo `MOD_USUARIOS`).
- `Permission.ROLES_ASSIGN` pasa a apuntar a `USUARIOS_GESTIONAR`. — Reemplaza a: ROLES_ASSIGN como permiso propio — decisión 28/10/2026
- El permiso `PERMISOS_GESTIONAR` queda retirado (ver punto e).

**e) Permisos retirados (decisión 28/10/2026)**

Los siguientes permisos se retiran con `eliminado_en` (sin borrado físico): `PERMISOS_GESTIONAR`, `SEGUIMIENTO_ENMIENDAS`, `TRADUCCION_ANCESTRAL`, `DASHBOARD_SLA` y `CONFIG_INTEGRACIONES`. — Reemplaza a: permisos activos — decisión 28/10/2026

**f) Asistente IA — `allowed_roles` (decisión 28/10/2026)**

La administración del módulo de IA pasa a `SECRETARIA`. `ADMIN_TI` se elimina de `allowed_roles`. — Reemplaza a: ADMIN_TI en allowed_roles — decisión 28/10/2026

**g) Suplencias de rol**

Sin cambios en esta versión. Siguen pendientes de confirmar (ver Sección 11, pendiente 2).

**h) Datos existentes — reglas para la migración (decisión 28/10/2026)**

Todas las cuentas existentes son de prueba. La migración resuelve la situación sin borrado físico:
- Las cuentas con el rol `ADMIN_TI` se desactivan (`activo = false`) y se les revoca ese rol con `fecha_fin`.
- El rol `SECRETARIA` queda asignado a una sola cuenta de prueba; las demás cuentas que lo tengan lo pierden con `fecha_fin`, conservando su otro rol si lo tienen.
- La cuenta que tenga simultáneamente `INVESTIGADOR` y `SECRETARIA` queda únicamente con `INVESTIGADOR`.
- El rol inactivo creado por error desde la antigua pantalla de roles dinámicos se marca con `eliminado_en`.
> Los identificadores concretos (IDs de cuentas) no van en el spec; van en la tarea de migración (ver tasks.md). — decisión 28/10/2026

**i) Permiso que exige cada endpoint (decisión 28/10/2026)**

- `/evaluations/profiles` (crear, editar y borrar perfiles de evaluador) → `EVALUADORES_PERFILES`.
- Crear, editar y activar/desactivar usuarios (`/auth/users`, `/auth/users/:id`, `/auth/users/:id/status`) → `USUARIOS_GESTIONAR`; la consulta `GET /auth/users` sigue con `USUARIOS_VER`.
- Panel de carga de evaluadores (`/evaluations/evaluators/dashboard`) → `REPORTES_CARGA`; el evaluador ya no lo ve.
- Asignar, suspender y prorrogar roles → `USUARIOS_GESTIONAR` (ya estaba en d).

**j) Vigencia de roles y permisos (decisión 28/10/2026)**

Un rol vencido o revocado (`fecha_fin` pasada), inactivo o eliminado, y un permiso con `eliminado_en`:
- no dan acceso en ningún guard (`RolesGuard` ni `PermissionsGuard`);
- no aparecen en la sesión: respuesta y token de login, `/auth/me` y refresh.

Después de migrar la matriz hay que reiniciar el backend, porque `PermissionsGuard` tiene una caché de 5 minutos.

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

### HU-005: Subsanación Focalizada y Control del Plazo de Subsanación Documental
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Subsanación Focalizada y Control del Plazo de Subsanación Documental |
| **ID** | HU-005 |
| **Descripción** | Gestiona el plazo `plazo_subsanacion_documental_dias` (inicial 30 días; el SRS v3.2 decía 15 días hábiles — Secretaría oct 2026 prevalece, ver Pendientes) para corregir únicamente los archivos observados, manteniendo inmutables los requisitos ya validados. |
| **Estimación** | 16 horas |
| **Prioridad** | ALTA (5) |
| **Dependencias** | HU-004 |
| **Requisitos origen** | RF-004.2, RF-007, RF-013 |

#### 2. Pruebas de Aceptación
1. **Notificación de Observaciones Multilínea**: Envía un correo notificando las observaciones detalladas por cada ítem y la fecha límite exacta.
2. **Inmutabilidad de Aprobados**: Muestra bloqueados (🔒) los documentos validados previamente.
3. **Archivado Híbrido**: Transcurrido el plazo `plazo_subsanacion_documental_dias` sin subsanación, el expediente pasa automáticamente a `Archivado por Vencimiento`.

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

### HU-012: Renovaciones y Eventos Adversos
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Renovación del Aval Ético como Etapa Propia y Reporte de Eventos Adversos |
| **ID** | HU-012 |
| **Descripción** | Permite tramitar la renovación del aval ético (etapa 6 del protocolo, ver RF-EST.1) y reportar Eventos Adversos Graves (EAG). Enmiendas: fuera de alcance en esta versión (ver Sección 7). — Reemplaza a: etapa 7 — decisión 28/10/2026 |
| **Estimación** | 18 horas |
| **Prioridad** | ALTA (Seguridad del Paciente/Participante) |
| **Dependencias** | HU-006 |
| **Requisitos origen** | RF-016 |

#### 2. Pruebas de Aceptación (EARS)
1. **Apertura de la etapa de renovación**: **Cuando** se aproxime el vencimiento del aval ético a `apertura_renovacion_dias` días (inicial 60), **el sistema debe** abrir la etapa 6 (Renovación) y enviar los avisos según `alerta_renovacion_offsets_dias` [90, 60, 15]. — Reemplaza a: etapa 7 — decisión 28/10/2026
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
- **RF-05.2 (Checklist de recepción con barra de progreso)**: La vista de recepción muestra, por cada requisito según el tipo de estudio (IO, EI, EC): el documento, las páginas declaradas frente a las contadas (resaltadas si difieren), una marca ✓/✗ y una observación obligatoria al marcar ✗. Una barra indica el progreso de la validación ("5 de 6"). El botón principal es **"Aprobar recepción"** si todos los ítems están bien (emite código CEISH y carta de recepción) o **"Enviar observaciones"** si hay ítems en ✗ (el investigador tiene 30 días). El botón está deshabilitado mientras haya requisitos sin revisar. Tras la recepción, la aceptación explícita de tiempos sigue siendo obligatoria antes de asignar evaluadores. — CS-10, rediseño 27/10/2026

### RF-06: Asignación del Código Único Oficial
- **RF-06.1**: Formato atómico: `CEISH-ESPOCH-[SIGLA]-[SECUENCIAL_3_DIGITOS]-[AÑO]`.
- **Criterio EARS (RF-06.1)**: **Cuando** la Secretaria apruebe la validación documental completa, **el sistema debe** generar de forma atómica e incremental el código único oficial en la base de datos.

### RF-07: Gestión del Plazo de 30 Días y Archivado Híbrido
- **RF-07.1**: Otorga `plazo_subsanacion_documental_dias` días (inicial 30), contados desde la notificación, para subsanar documentos faltantes u observaciones de forma. Fuente: Secretaría (oct 2026), que prevalece sobre los 15 días hábiles del SRS v3.2. Si son laborables o de calendario: ver Pendientes.
- **Criterio EARS (RF-07.1)**: **Si** se registran observaciones de documentación, **el sistema debe** calcular el plazo según RF-CAL, enviar la notificación por correo y cambiar el estado a `Incompleto / Requiere Subsanación`, con las alertas de RF-ALR.
- **Criterio EARS (RF-07.2)**: **Si** transcurre el plazo sin subsanación o se ejecuta el Cron Job diario, **el sistema debe** marcar el trámite como `Archivado por Vencimiento / Extemporáneo`, notificar al investigador y no reutilizar el código. La subsanación documental no genera nueva versión.

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

### RF-12: Matriz de Asignación de Evaluadores Pares
- **RF-12.1**: Reemplazado por `specs/002-flujo-mvp` RF-12.1 (mínimo configurable de evaluadores, Metodológico y Salud obligatorios; Jurídico y Sociedad Civil opcionales). Se eliminan los topes 1/1/2 de esta versión. — Reemplaza a: composición exacta de 4 evaluadores (1 por perfil) — rediseño 27/10/2026

---

### RF-EST: Catálogo de Estados y Etapas del Protocolo

> CS-01 — Reemplaza a: barra de "Validación" como etapa aparte — rediseño 27/10/2026

- **RF-EST.1 (Seis etapas canónicas)**: El catálogo `catalogos.estados` expone dos campos adicionales en cada estado: `etapa` (una de las 6 etapas) y `orden` (entero para la barra de progreso). La etapa del protocolo se deduce de su `estado_id`; no se almacena como campo independiente en el protocolo. El valor `EXENTO` no forma parte de este alcance. — Reemplaza a: siete etapas canónicas con Riesgo como etapa aparte — decisión 28/10/2026

  | Orden | Etapa | Descripción |
  |---|---|---|
  | 1 | Recepción | Validación documental, código CEISH, carta de recepción y aceptación de tiempos del investigador. |
  | 2 | Asignación | Asignación de evaluadores y envío del oficio firmado por la Presidenta. |
  | 3 | Evaluación | Propuesta y designación del nivel de riesgo (Anexo 10) y entrega de dictámenes éticos y metodológicos (Anexo 9). La etapa termina cuando el nivel de riesgo está fijado Y están todos los dictámenes entregados (ver RF-12.4 en specs/002). |
  | 4 | Resolución | Dictamen del pleno y emisión de la resolución. |
  | 5 | Seguimiento | Informes de inicio, avance y final. |
  | 6 | Renovación | Tramitación del aval renovado (ver RF-16.1). |

  > Nota: "Validación" deja de ser una etapa aparte (queda dentro de Recepción); "Riesgo" deja de ser una etapa independiente y queda DENTRO de Evaluación. — decisión 28/10/2026

- **RF-EST.2 (Exposición en API)**: Todos los endpoints que devuelvan datos de un protocolo deben incluir la etapa actual con uno de los 6 valores anteriores. Todas las pantallas muestran la misma barra de 6 etapas calculada a partir de ese valor. — Reemplaza a: 7 valores / barra de 7 etapas — decisión 28/10/2026

- **RF-EST.3 (Consulta de protocolos por etapa)**: El módulo de Protocolos filtra el listado por etapa. Filtros disponibles: Todos, Recepción, Asignación, Evaluación, Resolución, Seguimiento, Renovación. Cada etapa expone sus columnas propias: — Reemplaza a: listado con etapa Riesgo independiente — decisión 28/10/2026

  | Etapa | Columnas de la etapa |
  |---|---|
  | Recepción | Fecha de recepción, requisitos revisados (X de Y), estado |
  | Asignación | Evaluadores asignados frente al mínimo, tipo de revisión, estado |
  | Evaluación | Riesgo (pendiente X de 2 / fijado / no coinciden → pleno), Dictámenes (X de N, fecha de entrega), estado |
  | Resolución | Resultado del pleno, código de sesión, estado |
  | Seguimiento | Informe que corresponde (inicio, avance o final), fecha de entrega, estado (por entregar / recibido / vencido) |
  | Renovación | Fecha de vencimiento, paso (solicitud / pares / pleno / resolución), estado |

  Cada etapa acepta sus propios filtros además de la búsqueda por código, título o investigador. La etapa Evaluación incluye filtros específicos por Riesgo y Dictámenes. **No existen módulos separados de "Seguimiento" ni de "Renovaciones"**: son etapas dentro de Protocolos. "Mis pendientes" (RF-ALR.f en specs/003) sigue siendo una vista aparte, para las acciones que hay que hacer.

  > **Falta implementar**: el endpoint de listado no expone aún el campo `etapa` en la respuesta (depende de RF-EST.2), ni los filtros por etapa ni las columnas por etapa. Prerequisito: migración que añada `etapa` y `orden` al catálogo `catalogos.estados` (RF-EST.1).

---

### RF-CAL: Cómputo de Días Laborables
- **RF-CAL.a**: El sistema debe calcular los días laborables como lunes a viernes, excluyendo los feriados nacionales de Ecuador obtenidos de una librería interna, sin depender de internet ni de carga manual.
- **RF-CAL.b**: La Secretaría o la Presidencia pueden ajustar manualmente cualquier fecha límite calculada, registrando el motivo; el ajuste queda en auditoría.
- **RF-CAL.c**: El receso académico no se modela en esta versión (ver Pendientes).
- **RF-CAL.d**: Las sesiones de pleno no forman parte de este cómputo: sus fechas las define la Secretaría al crear la convocatoria.

### RF-NORM: Plazo Normativo del Comité
- **RF-NORM.1**: El plazo normativo del comité es 45 días laborables (expedita) o 60 (pleno y ensayos clínicos), contados desde la documentación completa (código definitivo). En emergencia: 15 días. Es una fecha de referencia y control, no bloquea la creación de convocatorias: el sistema debe mostrar una advertencia si la `fecha_reunion` supera el plazo y usarlo para las alertas de protocolos pendientes de convocatoria. No corre mientras el trámite esté en `Incompleto / Requiere Subsanación`. Cada nueva versión recalcula un plazo nuevo. Los días se cuentan según RF-CAL. Valores parametrizables y ajustables manualmente con motivo registrado.

---

### RF-13: Observaciones Multilínea por Requisito Documental
- **RF-13.1**: Permite a la Secretaria detallar correcciones específicas por cada documento del checklist.
- **Criterio EARS (RF-13.1)**: **Si** la Secretaria marca un requisito como observatorio, **el sistema debe** habilitar un campo multilínea (textarea) por ítem y consolidar todas las observaciones en el correo de subsanación.

### RF-14: Subsanación de Versión Mayor (Ciclo Multiversión)
- **RF-14.1**: El sistema debe soportar el ciclo de vida multiversión (v1.0 → v2.0 → v3.0), asignando 30 días hábiles por versión y bloqueando documentos aprobados previamente.
- **Criterio EARS (RF-14.1)**: **Cuando** un protocolo requiera observaciones mayores tras dictamen del Pleno, **el sistema debe** generar una nueva versión correlativa del expediente, asignar un plazo normativo de 30 días hábiles para la respuesta e inhabilitar la modificación de los documentos validados previamente.

### RF-15: Informes de Avance, Cierre y Calendario de Entregables
- **RF-15.1**: El sistema debe controlar el calendario de entregables periódicos e informe final de los protocolos aprobados (`SEGUIMIENTO_AVANCE`, `SEGUIMIENTO_FINAL`).
- **Criterio EARS (RF-15.1)**: **Cuando** una investigación sea aprobada, **el sistema debe** calcular las fechas de vencimiento de sus informes periódicos y final, enviando notificaciones automáticas por correo recordando la obligación de entrega.

### RF-16: Renovaciones, Eventos Adversos y Suspensión

> CS-12 — Reemplaza a: renovación dentro de seguimiento — rediseño 27/10/2026

- **RF-16.1 (Renovación como etapa propia)**: El sistema debe tramitar la renovación del aval ético como la etapa 6 del protocolo (ver RF-EST.1). Aplica únicamente a estudios cuya duración supere 1 año. — Reemplaza a: etapa 7 del protocolo — decisión 28/10/2026

  - **Apertura**: la etapa se abre `apertura_renovacion_dias` días (inicial 60) antes del vencimiento.
  - **Avisos al investigador**: según `alerta_renovacion_offsets_dias` [90, 60, 15] días antes del vencimiento (RF-ALR en specs/003). El aviso a 90 días equivale al anterior "3 meses antes".
  - **Pasos de la etapa de renovación:**

    | Paso | Estado | Acción principal |
    |---|---|---|
    | 1 | Solicitud recibida | La Secretaría envía los documentos (solicitud firmada, informe del año, cronograma actualizado) a **los mismos pares evaluadores del protocolo** para revisión previa al pleno. — Reemplaza a: «por confirmar si son los mismos pares» — decisión 28/10/2026 |
    | 2 | Revisión de pares | Plazo de 8 días laborables. La Secretaría agenda en la próxima sesión. |
    | 3 | Decisión del pleno | El pleno emite la resolución de renovación. |
    | 4 | Renovado | La vigencia se extiende `vigencia_aprobacion_meses` meses (inicial 12); el calendario de informes se recalcula; el protocolo vuelve a Seguimiento. |

  > Por confirmar: (b) qué ocurre si la vigencia vence sin que se haya presentado la solicitud.

- **Criterio EARS (RF-16.1 — EAG)**: **Cuando** el Investigador Principal reporte un Evento Adverso Grave (EAG), **el sistema debe** registrar la notificación de urgencia en un plazo no mayor a 24-48 horas e informar inmediatamente con alerta roja al Presidente y Secretaría.

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

### RF-PAR: Configuración de Parámetros del Sistema

> CS-14 — rediseño 27/10/2026

- **RF-PAR.1**: Ningún plazo se codifica directamente en el código fuente; todos se leen de `sistema.parametros_sistema`. La Secretaría puede editarlos; los cambios aplican a los plazos que se calculen desde ese momento. Los plazos que ya están corriendo no cambian. Cada cambio queda en historial: valor anterior, valor nuevo, usuario, fecha. Si falta la Secretaría, otro directivo puede editar los parámetros.
- **RF-PAR.2 (Parámetros canónicos)**:

  | Grupo | Clave | Tipo | Valor inicial |
  |---|---|---|---|
  | Recepción | `plazo_subsanacion_documental_dias` | INTEGER | 30 |
  | Evaluación | `minimo_evaluadores` | INTEGER | 3 |
  | Evaluación | `plazo_revision_oficio_dias` | INTEGER | 8 |
  | Evaluación | `entrega_dictamen_horas_tras_sesion` | INTEGER | 48 |
  | Evaluación | `plazo_reemplazo_horas` | INTEGER | 24 |
  | Aprobación | `vigencia_aprobacion_meses` | INTEGER | 12 |
  | Seguimiento | `plazo_informe_inicio_dias` | INTEGER | 30 |
  | Seguimiento | `plazo_condicion_dias` | INTEGER | 30 |
  | Renovación | `apertura_renovacion_dias` | INTEGER | 60 |
  | Avisos | `aviso_previo_plazo_dias` | INTEGER | 7 |
  | Avisos | `alerta_renovacion_offsets_dias` | TEXT | 90,60,15 |

  > `alerta_renovacion_offsets_dias` usa `tipo_dato = TEXT` con valores separados por coma. El parámetro `entrega_evaluacion_dias_habiles_tras_reunion` queda **retirado** (reemplazado por `entrega_dictamen_horas_tras_sesion`). — Reemplaza a: `entrega_evaluacion_dias_habiles_tras_reunion` — rediseño 27/10/2026

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
- **Superación de Cuotas de Evaluadores**: Las reglas de cuota aplican según `specs/002-flujo-mvp` RF-12.1 (mínimo configurable, Metodológico y Salud obligatorios). El sistema rechazará asignaciones que incumplan esa composición. — Reemplaza a: exactamente 4, 1 por perfil — rediseño 27/10/2026
- **Indisponibilidad del Asistente de IA**: Si falta la API Key o falla el proveedor de IA (Gemini), el módulo responderá con una excepción 553 / Service Unavailable sin interrumpir el funcionamiento de la plataforma.
- **Concurrencia en Convocatorias y Código Único**: Las secuencias correlativas de código CEISH (`001-2026`) y Convocatorias (`001-2026`) se aislarán mediante transacciones atómicas en PostgreSQL para evitar duplicaciones.

---

## 7. Fuera de Alcance

Quedan diferidos para iteraciones posteriores:
1. Formularios de Evaluación Ética avanzada para Ensayos Clínicos complejos (Fase I/II).
2. Firma Electrónica con certificado digital en la emisión de resoluciones definitivas.
3. Integración mediante API directa hacia sistemas externos del Ministerio de Salud Pública (MSP) o ARCSA.
4. **Enmiendas al protocolo**: no se implementan en esta versión. Deben retirarse de las pantallas de esta versión cualquier botón o fila que las mencione. — CS-16, rediseño 27/10/2026
5. **Gestión dinámica de roles y permisos** (crear roles, editar permisos por rol): los roles son fijos; esta funcionalidad queda fuera de alcance y retirada. — Reemplaza a: cualquier requisito previo que la mencionara — decisión 28/10/2026

---

## 8. Criterios de Finalización (Definition of Done)

Un requerimiento se considerará **Finalizado** cuando:
1. Todos los criterios de aceptación EARS asociados sean verificables funcionalmente.
2. Se permita la autenticación politécnica y externa vía OTP de 6 dígitos.
3. Se generen códigos atómicos y Convocatorias al Pleno con notificaciones PDF sin duplicados.
4. Se aplique la composición de evaluadores según `specs/002-flujo-mvp` RF-12.1 (mínimo configurable, Metodológico y Salud obligatorios). — Reemplaza a: composición exacta de 4 — rediseño 27/10/2026
5. Se registre atómicamente la Aceptación Explícita de plazos con fecha e IP por el Investigador.
6. Todos los mensajes al usuario, errores, correos y PDFs estén 100% en idioma Español y el código interno en Inglés.

---

## 9. Dudas Abiertas

- Ver sección Pendientes por confirmar.

---

## 10. Pendientes por confirmar

- Entrega del informe: miércoles 12:00 posterior a la sesión (presidenta).
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

---

## 11. Pendientes de confirmar con el comité

| # | Pendiente | RF | Estado |
|---|---|---|---|
| 1 | ¿Qué ocurre si la vigencia del aval vence sin que se haya presentado la solicitud de renovación? | RF-16.1 | PENDIENTE |
| 2 | ¿Se mantienen las suplencias temporales de rol (extender o suspender un rol por un periodo)? | HU-001 | PENDIENTE |
| 3 | ¿Cómo encaja la regla de una sola Secretaría vigente (HU-001 b2) con las suplencias temporales? Por ejemplo: ¿cómo reemplazar a la Secretaría durante una ausencia sin violar la unicidad? | HU-001 b2 | PENDIENTE |
| 4 | Los endpoints que solo piden JWT (protocolos, almacenamiento, entre otros — aprox. 55) necesitan una auditoría aparte para confirmar que el servicio valida que el recurso pertenece al usuario antes de devolver datos. | RF-001 | PENDIENTE |
| 5 | Validación final de la matriz de permisos (HU-001 c) con la Secretaría. | HU-001 c | PENDIENTE |
| 6 | ¿Cuáles de los permisos `RESOLUCION_URGENCIAS`, `REPORTES_KPIS` y `REPORTES_TIEMPOS` quedan confirmados? (depende de RF-12.8 en specs/002) | HU-001 c | PENDIENTE |
