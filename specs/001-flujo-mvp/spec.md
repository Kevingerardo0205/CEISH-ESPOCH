# Especificación de Requisitos de Software: Sistema Backend CEISH-ESPOCH

**Código de Especificación:** `specs/001-flujo-mvp/spec.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Versión:** 3.7.2
**Estado:** Aprobado  
**Historial:** 2026-10-10 — v3.3.0: alineado con decisiones de Secretaría/Tutor (ver Pendientes por confirmar)  
**Historial:** 2026-10-10 — v3.3.1: RF-16.1 avisos de renovación actualizados a 90, 60 y 15 días; parámetro `alerta_renovacion_offsets_dias`  
**Historial:** 2026-10-27 — v3.4.0: CS-01 etapas (7) del protocolo en catálogo estados; CS-10 precisión de recepción; CS-12 renovación como etapa propia; CS-14 parámetros del sistema; CS-16 enmiendas fuera de alcance — rediseño 27/10/2026
**Historial:** 2026-10-28 — v3.4.1: HU-001 roles fijos y gestión de usuarios del comité; RF-16.1 mismos pares resuelto; RF-EST.1/RF-EST.2/RF-EST.3 transición a 6 etapas canónicas (Riesgo integrado dentro de Evaluación, columnas de riesgo y dictámenes, filtros por riesgo y dictámenes, Evaluación concluye con nivel de riesgo fijado y todos los dictámenes entregados, Renovación etapa 6); sección Pendientes de confirmar con el comité
**Historial:** 2026-10-28 — v3.5.0: HU-001 roles fijos completo: ADMIN_TI absorbido, segregación INVESTIGADOR excluyente, una sola SECRETARIA, matriz de permisos fija, permisos retirados, asistente IA, reglas de migración de datos
**Historial:** 2026-10-28 — v3.5.1: HU-001 c) Presidente ve la consolidación de dictámenes; i) permiso por endpoint; j) vigencia en sesión y guards
**Historial:** 2026-10-29 — v3.5.2: HU-001 b) cambio de investigador a comité sin protocolos en curso; registro con cédula o correo repetidos
**Historial:** 2026-10-30 — v3.5.3: HU-001 GET /auth/roles de solo lectura; administración del asistente IA solo SECRETARIA; asignación rechaza roles inexistentes, inactivos o eliminados
**Historial:** 2026-11-04 — v3.5.4: HU-001 k) rechazos del login con código estable (`code`) y mensajes en español; credenciales inválidas con un mismo mensaje para correo inexistente y contraseña incorrecta
**Historial:** 2026-11-04 — v3.5.5: RF-EST.1 regla de origen de la etapa (protocolo → recepción → RECEPCION), APROBADO según resolución emitida, Renovación sin estados todavía; RF-EST.2 parcial
**Historial:** 2026-11-04 — v3.5.6: RF-EST.3 contrato de GET /protocols (acceso SECRETARIA y PRESIDENTE con `PROTOCOLOS_LISTAR`, filtros `search`, `year` y `etapa`, `limit` máximo 100, `principalInvestigator` en la respuesta); HU-001 c) `PROTOCOLOS_LISTAR` en la matriz; pendientes de búsqueda sin tildes, datos personales del listado, regla del año y escritura de `fecha_recepcion`
**Historial:** 2026-11-09 — v3.6.0: creación del protocolo (origen: pruebas del 09/11/2026 con los protocolos 171 y 173, reunión del 06/11/2026 con la Secretaría y la Presidenta, decisiones de la usuaria del 09/11/2026). HU-002 estado inicial BORRADOR; RF-02.1 modificado; RF-02.2 título (trim, 20 a 200); RF-02.3 borrador y envío (`POST /protocols/:id/submit`); RF-02.4 `fecha_recepcion` al enviar con `NOW()` (cierra el pendiente 10 de la sección 11); RF-02.5 `receptionStatus = BORRADOR`; RF-02.6 auditoría `PROTOCOL_CREATED`; RF-02.7 ciclo del borrador (decidido, se implementa con el rediseño del frontend); RF-03.3 requisitos por tipo (CONFIDENCIALIDAD, CONFLICTO_INTERES y ANEXO_5 obligatorios en EI e IO); RF-EST.3 sin borradores en los listados de la Secretaría; notas en RF-NORM.1, RF-18.1 y RF-19.1; pendientes 11 a 18
**Historial:** 2026-11-09 — v3.6.1: RF-02.2 se aplica también a cualquier edición del título por la API; cierra el pendiente 16 (hoy el backend no tiene endpoint ni DTO de edición del protocolo)
**Historial:** 2026-11-09 — v3.7.0: decisiones de la usuaria del 09/11/2026. Pendiente 13 cerrado: la fecha de documentación completa es `fecha_constancia`, fijada al aprobar la recepción (RF-02.4 e, RF-NORM.1). Pendiente 14 cerrado: 8 días de calendario desde la creación, sin aviso por correo; la pantalla muestra la fecha de eliminación (RF-02.7). Pendiente 17 cerrado: el catálogo se reconstruye por `codigo_anexo` en una tarea aparte (TSK-001.13). Nuevo RF-02.8: edición del borrador con `PATCH /protocols/:id` (el frontend llama a `PUT /protocols/:id`, que el backend no expone). Pendientes 15 y 18 siguen abiertos hasta la reunión con la Secretaría del jueves 12/11/2026
**Historial:** 2026-11-09 — v3.7.1: decisiones de la usuaria del 09/11/2026. Pendiente 12 cerrado: `POST /protocols/:id/submit` también reenvía después de una subsanación, desde 9, 11 y 20 a 15; en otros estados 409; `fecha_recepcion` solo se escribe si es NULL (guarda el primer envío) (RF-02.3 e, RF-02.4 b). Pendiente 19 cerrado: se aceptan RF-02.8 f y g. Relleno de `fecha_constancia` aprobado como migración reversible (RF-02.4)
**Historial:** 2026-11-09 — v3.7.2: decisión de la usuaria del 09/11/2026 (TSK-001.7). RF-02.5: `BORRADOR` solo con la recepción de la versión activa en 9 y versión activa 1; con 9 y versión > 1 sigue `EVALUACION_SUBSANACIONES` (lo usa el frontend para «Subir correcciones» y el modo subsanación). RF-02.7: la eliminación a los 8 días, «un solo borrador por investigador» y «Descartar borrador» aplican solo a la versión 1 en 9

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

La matriz se siembra por migración y **no se edita desde la aplicación**. Los endpoints que escriben en tablas de roles, módulos, permisos y `rol_permisos` se cierran. Se retiran todos los endpoints de RolesController y PermissionsController, salvo GET /auth/roles: se mantiene solo de lectura, con USUARIOS_VER, y devuelve únicamente los roles activos y sin eliminado_en (los 4 fijos). Lo usa el formulario de usuarios del frontend. — Reemplaza a: gestión dinámica de permisos — decisión 28/10/2026; GET /auth/roles de solo lectura — decisión 30/10/2026

| Permiso | SECRETARIA | PRESIDENTE | EVALUADOR | INVESTIGADOR |
|---|---|---|---|---|
| `DASHBOARD_RESUMEN`, `DASHBOARD_NOTIF` | ✓ | ✓ | ✓ | ✓ |
| `DASHBOARD_VENCIMIENTOS` | ✓ | ✓ | — | — |
| `RECEPCION_LISTA`, `RECEPCION_VALIDAR`, `RECEPCION_BUSCAR`, `RECEPCION_CONSTANCIAS` | ✓ | — | — | — |
| `RECEPCION_NUEVO` | ✓ | — | — | ✓ |
| `PROTOCOLOS_LISTAR` | ✓ | ✓ | — | — |
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
- La asignación rechaza (400) cualquier código de rol inexistente, inactivo (`activo = false`) o eliminado (`eliminado_en IS NOT NULL`). — decisión 30/10/2026

**e) Permisos retirados (decisión 28/10/2026)**

Los siguientes permisos se retiran con `eliminado_en` (sin borrado físico): `PERMISOS_GESTIONAR`, `SEGUIMIENTO_ENMIENDAS`, `TRADUCCION_ANCESTRAL`, `DASHBOARD_SLA` y `CONFIG_INTEGRACIONES`. — Reemplaza a: permisos activos — decisión 28/10/2026

**f) Asistente IA — `allowed_roles` (decisión 28/10/2026)**

La administración del asistente IA es solo de `SECRETARIA`. — Reemplaza a: ADMIN_TI en allowed_roles — decisión 28/10/2026

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

La vigencia se evalúa con el reloj de la base de datos; cuando la asignación no trae fecha de inicio, se usa `NOW()` de la base. — decisión 30/10/2026

**k) Rechazos del login (decisión 04/11/2026)**

Cada rechazo de `POST /auth/login` lleva un código estable (`code`) además del mensaje. El frontend reconoce el caso por `code`; el mensaje es en español. Con el filtro global, ambos llegan en `body.error.code` y `body.error.message`.

| Caso | Status | `code` | Mensaje |
|---|---|---|---|
| Correo inexistente o contraseña incorrecta | 401 | `INVALID_CREDENTIALS` | Correo o contraseña incorrectos. |
| Cuenta desactivada | 401 | `ACCOUNT_DISABLED` | Su cuenta está desactivada. Contacte al administrador. |
| Correo sin verificar | 403 | `EMAIL_NOT_VERIFIED` | Por favor, confirma tu correo electrónico antes de iniciar sesión. |
| Cuenta bloqueada temporalmente por intentos fallidos | 403 | `ACCOUNT_LOCKED` | Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde. |

- El mensaje de correo inexistente y el de contraseña incorrecta son idénticos, para no revelar si el correo está registrado.
- Los status, el orden de las validaciones (correo registrado → desactivada → correo sin verificar → bloqueo → contraseña) y la regla de bloqueo no cambian: el intento fallido que alcanza el máximo responde `INVALID_CREDENTIALS` y fija el bloqueo; los intentos siguientes, mientras dure, responden `ACCOUNT_LOCKED`.

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
| **Requisitos origen** | RF-002 (RF-02.1 a RF-02.7), RF-03.3 |

#### 2. Pruebas de Aceptación
1. **Campos Obligatorios**: El sistema exige título, tipo de estudio e ID del Investigador Principal. El título se recorta y debe tener entre 20 y 200 caracteres (RF-02.2). — decisión 09/11/2026
2. **Declaración Jurada Obligatoria**: Impide guardar el borrador si no se acepta la declaración de que el estudio no ha iniciado previamente.
3. **Estado Inicial**: Al registrar (paso 1 del formulario), el protocolo queda como **borrador**: la recepción de la versión 1 en `INICIADO` (9), `fecha_recepcion` NULL, `receptionStatus = BORRADOR`, y la Secretaría no lo ve (RF-02.3, RF-02.5). — Reemplaza a: «estado inicial `TRÁMITE EN PROCESO` / `PENDIENTE_ASIGNACION`» — decisión 09/11/2026
4. **Envío**: El borrador pasa a la Secretaría solo cuando el investigador lo envía (`POST /protocols/:id/submit`): la recepción pasa a `EN_REVISION_SECRETARIA` (15), se fija `fecha_recepcion` y aparece en los pendientes de la Secretaría (RF-02.3, RF-02.4). — decisión 09/11/2026
5. **Edición del borrador**: Mientras es borrador, el investigador principal puede corregir los datos del paso 1 (`PATCH /protocols/:id`); después del envío, no (RF-02.8). — decisión 09/11/2026

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
- **Criterio EARS (RF-02.1, modificado 09/11/2026)**: **Cuando** el Investigador Principal registre los datos mínimos (paso 1), **el sistema debe** crear el protocolo como borrador según RF-02.3, no como trámite enviado. — Reemplaza a: registro que equivalía al envío — decisión 09/11/2026

- **RF-02.2 (Título del protocolo, decisión 09/11/2026)**: El título se recorta (trim) antes de validar y de guardar, y debe tener entre 20 y 200 caracteres después del recorte. La misma regla aplica en el frontend y en `CreateProtocolDto`.
  - **Criterio EARS (RF-02.2)**: **Si** el título recortado tiene menos de 20 o más de 200 caracteres, **el sistema debe** rechazar el registro con 400 y un mensaje en español que indique el rango.
  - **Criterio EARS (RF-02.2)**: **Cuando** el título sea válido, **el sistema debe** guardarlo ya recortado.
  - > La columna `protocolos.titulo` admite 1000 caracteres; la regla no cambia el esquema. Los protocolos existentes con títulos fuera del rango no se modifican.
  - **Criterio EARS (RF-02.2, edición — decisión 09/11/2026)**: **Si** un endpoint de edición del protocolo acepta `title`, **el sistema debe** aplicarle la misma regla (trim, 20 a 200), con la misma validación que `CreateProtocolDto`, para que nadie lo cambie por la API sin validar.
  - > Estado actual (09/11/2026): el backend no tiene endpoint ni DTO de edición del protocolo (`protocol.controller.ts` no tiene `@Put` ni `@Patch`; no existe `UpdateProtocolDto`), así que hoy ningún camino cambia el título después de crearlo. En el frontend, `editar-protocolo.page.ts` no tiene campo de título y reenvía el original (`editar-protocolo.page.ts:345`, PR #22 del frontend) con `PUT /protocols/:id` (`protocolo.service.ts:472-476` del frontend), una ruta que el backend no expone. Cierra el pendiente 16.

- **RF-02.3 (Borrador y envío, decisión 09/11/2026)**:
  - **Criterio EARS (RF-02.3 a)**: **Cuando** el investigador cree el protocolo (`POST /protocols`), **el sistema debe** crear la versión 1 y su recepción en `INICIADO` (9), que en este flujo significa **borrador**.
  - **Criterio EARS (RF-02.3 b)**: **Mientras** la recepción de la versión activa esté en `INICIADO` (9), **el sistema debe** excluir el protocolo de las vistas de la Secretaría: `GET /reception/protocols` (con y sin filtro, incluido `pendientes`), `GET /protocols` (RF-EST.3) y `GET /secretaria/pendientes` (RF-ALR.f en specs/003). El investigador lo sigue viendo en `GET /protocols/mis-protocolos`.
  - **Criterio EARS (RF-02.3 c)**: **Cuando** el investigador principal envíe el borrador (`POST /protocols/:id/submit`), **el sistema debe** pasar la recepción a `EN_REVISION_SECRETARIA` (15); desde ese momento el protocolo aparece en la fila «Validar» de los pendientes de la Secretaría (RF-ALR.f.1 a en specs/003) y en `GET /reception/protocols`.
  - **Criterio EARS (RF-02.3 d)**: **Si** quien envía no es el investigador principal, **el sistema debe** rechazar el envío con un mensaje en español (hoy 400; el código de estado no cambia en esta versión).
  - **Criterio EARS (RF-02.3 e, decisión 09/11/2026 — pendiente 12)**: **Cuando** el investigador principal reenvíe el protocolo después de una subsanación documental, **el sistema debe** usar el mismo `POST /protocols/:id/submit`: se acepta con la recepción en `INICIADO` (9), `INCOMPLETO` (11) o `REQUIERE_SUBSANACION_DOC` (20) y pasa a `EN_REVISION_SECRETARIA` (15).
    - **Nota (TSK-001.5):** Verificado el 09/11/2026: ningún código escribe 20 ni 21 en `recepcion.recepciones`; tras una subsanación, la versión nueva nace con su recepción en 9. 20 se acepta por el spec, pero en la práctica el reenvío llega desde 9 u 11.
  - **Criterio EARS (RF-02.3 e.1)**: **Si** la recepción está en cualquier otro estado, **el sistema debe** responder 409 con un mensaje en español, sin cambiar el estado ni las fechas. Hoy `submit` cambia a 15 desde cualquier estado (incluso desde `COMPLETO`).
  - **Criterio EARS (RF-02.3 f)**: **Cuando** se envíe el borrador, **el sistema debe** registrar `PROTOCOL_SUBMITTED` en `sistema.audit_log` (ya ocurre hoy, con `registro_id` = id del protocolo).

- **RF-02.4 (`fecha_recepcion`, decisión 09/11/2026)**: `recepcion.recepciones.fecha_recepcion` es la fecha y hora en que el investigador envía el protocolo a la Secretaría.
  - **Criterio EARS (RF-02.4 a)**: **Cuando** se cree el protocolo, **el sistema debe** dejar `fecha_recepcion` en NULL. Requiere quitar el `NOT NULL` y el `DEFAULT now()` de la columna (hoy `NOT NULL DEFAULT now()`); es un cambio de esquema que va en su propia migración (TSK-001.6).
  - **Criterio EARS (RF-02.4 b, actualizado 09/11/2026 — pendiente 12)**: **Cuando** se envíe o se reenvíe el protocolo (RF-02.3 c y e), **el sistema debe** escribir `fecha_recepcion` solo si es NULL, con la hora de la base (`COALESCE(fecha_recepcion, NOW())`), no con `new Date()` de Node. Así guarda el primer envío; los reenvíos después de una subsanación no la cambian.
  - **Criterio EARS (RF-02.4 c)**: **Cuando** la Secretaría complete la recepción (`finalizarRevision`, `verificarRequisitos` con `isComplete`), **el sistema debe** conservar la `fecha_recepcion` del envío: no se vuelve a escribir.
  - **Criterio EARS (RF-02.4 d)**: **Mientras** `fecha_recepcion` sea NULL, el filtro `year` de RF-EST.3 sigue usando `protocolos.creado_en` (el `COALESCE` actual) y las consultas que la leen deben tolerar NULL.
  - **Criterio EARS (RF-02.4 e, decisión 09/11/2026 — pendiente 13)**: **Cuando** la Secretaría apruebe la recepción (paso a `COMPLETO` (10) en `finalizarRevision` o en `verificarRequisitos` con `isComplete`), **el sistema debe** fijar `recepcion.recepciones.fecha_constancia` con `NOW()` de la base. Esa es la **fecha de documentación completa**; no se crea columna nueva.
  - **Criterio EARS (RF-02.4 f)**: **Cuando** después se emita la constancia PDF (`POST /reception/protocol/:protocolId/certificate`, `emitirConstancia`), **el sistema debe** conservar la `fecha_constancia` ya fijada (`COALESCE(fecha_constancia, NOW())`); hoy `emitirConstancia` la escribe siempre con `new Date()` (`reception.service.ts:835`).
  - **Criterio EARS (RF-02.4 g)**: **Cuando** un cálculo necesite la fecha de documentación completa (plazo normativo de RF-NORM.1, `responseDeadline`, fechas de la convocatoria, alerta de protocolos sin convocatoria, `GET /evaluations/meetings/pending-protocols`), **el sistema debe** usar `fecha_constancia`, no `fecha_recepcion`.
  - > Datos existentes (09/11/2026): en `ceish_db`, 22 de 25 recepciones en `COMPLETO` tienen `fecha_constancia` NULL; para ellas `fecha_recepcion` guarda hoy la fecha del último completado (se pisaba al completar). Decisión del 09/11/2026 (aprobada): en TSK-001.6, una migración reversible rellena `fecha_constancia = fecha_recepcion` solo donde `fecha_constancia` IS NULL y la recepción ya pasó por `COMPLETO`, sin tocar otras columnas. El agente la corre solo en `ceish_test_db`; en `ceish_db` la aplica la usuaria.
  - > Cierra el pendiente 10 de la sección 11 (la escritura con `new Date()` desde Node).

- **RF-02.5 (Estado mostrado del borrador, decisión 09/11/2026; precisado el 09/11/2026 en v3.7.2)**: `receptionStatus` (getter de `ProtocolOrmEntity`) devuelve `BORRADOR` cuando la recepción de la versión activa está en `INICIADO` (9) **y la versión activa es la 1**. Hoy, con la versión 1, ese caso cae en `PENDIENTE_SUBSANACION`; con versión > 1 devuelve `EVALUACION_SUBSANACIONES`, y eso no cambia (la versión nueva de una subsanación nace con su recepción en 9, y el frontend usa `EVALUACION_SUBSANACIONES` para «Subir correcciones» y el modo subsanación). Es un valor nuevo en la respuesta (cambio aditivo del enum `ReceptionStatus`); los demás valores no cambian.
  - **Criterio EARS (RF-02.5)**: **Mientras** la recepción de la versión activa esté en `INICIADO` (9) y la versión activa sea la 1, **el sistema debe** devolver `receptionStatus = "BORRADOR"` en todas las respuestas que usan `ProtocolMapper`. Con la recepción en 9 y versión activa > 1, sigue devolviendo `EVALUACION_SUBSANACIONES`. — Reemplaza a: «`BORRADOR` con la recepción en 9, sin condición de versión» — decisión 09/11/2026

- **RF-02.6 (Auditoría de la creación, decisión 09/11/2026)**:
  - **Criterio EARS (RF-02.6 a)**: **Cuando** se cree un protocolo, **el sistema debe** dejar una fila `PROTOCOL_CREATED` en `sistema.audit_log` con `registro_id` = id del protocolo creado.
  - **Criterio EARS (RF-02.6 b)**: **Cuando** se registre esa fila, **el sistema debe** omitir de `datos_nuevos` las cédulas (`identification`) y los teléfonos (`phone`, `sponsorPhone`) de investigadores, coinvestigadores y patrocinador.
  - > Estado actual (09/11/2026): la fila sí se crea (130 filas `PROTOCOL_CREATED` en `ceish_db`), pero con `registro_id` NULL, así que no aparece al buscar por protocolo (para el 173 solo aparecen `DOCUMENT_UPLOADED` y `PROTOCOL_SUBMITTED`). `datos_nuevos` guarda el cuerpo completo de la petición, con el arreglo `investigators`. Causa probable, a confirmar en TSK-001.9: el `AuditInterceptor` (APP_INTERCEPTOR) recibe la respuesta ya envuelta por `ResponseInterceptor` (`{ data, statusCode, message }`), así que `data.id` es undefined; `submit` funciona porque toma `params.id`.

- **RF-02.7 (Ciclo del borrador — decidido el 09/11/2026; se implementa después, con el rediseño del frontend)**:
  - **Criterio EARS (RF-02.7 a, decisión 09/11/2026 — pendiente 14)**: **Si** un borrador no se envía en 8 días de calendario contados desde su creación (`protocolos.creado_en`), **el sistema debe** eliminarlo: `eliminado_en` (soft delete) en el protocolo y borrado de sus archivos en R2. Editar el borrador (RF-02.8) no reinicia el plazo.
  - **Criterio EARS (RF-02.7 b, decisión 09/11/2026)**: **Mientras** el protocolo sea borrador, **el sistema debe** devolver la fecha en que se eliminará (creación + 8 días de calendario, en America/Guayaquil) para que el investigador la vea en pantalla. No se envían avisos por correo.
  - **Criterio EARS (RF-02.7 c)**: **Si** el investigador ya tiene un borrador abierto (recepción en `INICIADO` y sin `eliminado_en`), **el sistema debe** rechazar la creación de otro con un mensaje en español.
  - **Criterio EARS (RF-02.7 d)**: **Cuando** el investigador elija «Descartar borrador», **el sistema debe** eliminarlo igual que en (a).
  - > El plazo de 8 días es un parámetro de `sistema.parametros_sistema` según RF-PAR.1; el nombre del parámetro y el del campo de la respuesta se fijan en TSK-001.11.
  - > **Alcance (precisado el 09/11/2026, v3.7.2):** «borrador» en RF-02.7 a–d es solo la **versión 1** con su recepción en `INICIADO` (9). Una versión > 1 en 9 es una subsanación en curso: no se elimina a los 8 días, no cuenta para «un solo borrador por investigador» y no se puede descartar.

- **RF-02.8 (Edición del borrador, decisión 09/11/2026)**: El frontend (`editar-protocolo.page.ts`) guarda con `PUT /protocols/:id`, que el backend no expone (no hay `@Put` ni `@Patch` en `protocol.controller.ts`). Se crea `PATCH /protocols/:id` solo para borradores.
  - **Criterio EARS (RF-02.8 a)**: **Mientras** la recepción de la versión activa esté en `INICIADO` (9), **el sistema debe** permitir al investigador principal editar los datos del paso 1 con `PATCH /protocols/:id`: título, tipo de estudio, indicadores (`isVulnerablePopulation`, `usesBiologicalSamples`, `isMulticentric`, `hasExternalInstitutions`, `isIndigenousPopulation`), datos de financiamiento y patrocinador, fechas estimadas, cobertura y duración, coinvestigadores e instituciones. La lista exacta sale de `CreateProtocolDto` y se fija en TSK-001.14.
  - **Criterio EARS (RF-02.8 b)**: **Cuando** se edite, **el sistema debe** aplicar la misma validación que en la creación (RF-02.2 para el título, los mismos tipos para los indicadores), reutilizando las reglas de `CreateProtocolDto`. `riskLevelId` no forma parte del DTO: con el `ValidationPipe` global (`forbidNonWhitelisted: true`), enviarlo responde 400. `principalInvestigatorId` e `isAffidavitAccepted` no se editan.
  - **Criterio EARS (RF-02.8 c)**: **Si** quien edita no es el investigador principal del protocolo, **el sistema debe** rechazar la petición con un mensaje en español, sin cambios.
  - **Criterio EARS (RF-02.8 d)**: **Si** la recepción no está en `INICIADO` (9), **el sistema debe** responder 409 con un mensaje en español, sin cambios.
  - **Criterio EARS (RF-02.8 e)**: **Cuando** cambien el tipo de estudio o algún indicador, **el sistema debe** recalcular el checklist con `calcularRequeridos`: agrega los requisitos nuevos en `NO_PRESENTADO` y conserva, con su estado y sus documentos ya subidos, los que siguen aplicando.
  - **Criterio EARS (RF-02.8 f, decisión 09/11/2026 — pendiente 19)**: **Si** un requisito con documento subido deja de aplicar, **el sistema debe** marcar ese requisito como `NO_APLICA` y conservar el documento (fila en `recepcion.documentos` con su `requisito_id` y el archivo en R2), sin mostrarlo como obligatorio. Si el requisito vuelve a aplicar en otra edición, vuelve a su estado anterior con el mismo documento. Los archivos se borran de R2 solo cuando se elimina o se descarta el borrador (RF-02.7). Un requisito sin documento que deja de aplicar se quita del checklist.
  - **Criterio EARS (RF-02.8 g, decisión 09/11/2026 — pendiente 19)**: **Cuando** se edite, **el sistema debe** registrar `PROTOCOL_UPDATED` en `sistema.audit_log` con `registro_id` = id del protocolo y `datos_nuevos` saneado como en RF-02.6 b.
  - > La edición no cambia `fecha_recepcion` (sigue NULL) ni reinicia el plazo del borrador (RF-02.7 a). Dependencia: el frontend cambia `PUT` por `PATCH` y solo permite editar en borrador, en una tarea del repo del frontend.

### RF-03: Generación Automática y Ajuste del Checklist Documental
- **RF-03.1**: El sistema debe generar dinámicamente la matriz de requisitos según el tipo de estudio.
- **RF-03.2**: La Secretaria podrá corregir el tipo de estudio durante la revisión técnica si detecta discrepancias metodológicas.
- **Criterio EARS (RF-03.1)**: **Cuando** se registre un protocolo o la Secretaria corrija su tipología, **el sistema debe** actualizar automáticamente el checklist de requisitos obligatorios.
- **RF-03.3 (Requisitos por tipo de estudio — catálogo, decisión de la Secretaría del 06/11/2026)**: En `catalogos.tipos_documento`, `CONFIDENCIALIDAD`, `CONFLICTO_INTERES` y `ANEXO_5` son obligatorios sin condición en EI e IO (hoy dependen de `muestras`/`vulnerable` y de `institucionesPublicas`). EC no cambia.

  | Tipo | Requisitos sin marcas (hoy) | Requisitos sin marcas (v3.6.0) |
  |---|---|---|
  | EI | 7: ANEXO_1, ANEXO_2, CONSENTIMIENTO, INSTRUMENTOS, CV_INVESTIGADORES, ANEXO_4, FICHA_INTERVENCION | 10: los 7 + CONFIDENCIALIDAD, CONFLICTO_INTERES, ANEXO_5 |
  | IO | 6: ANEXO_1, ANEXO_2, CONSENTIMIENTO, INSTRUMENTOS, CV_INVESTIGADORES, ANEXO_4 | 9: los 6 + CONFIDENCIALIDAD, CONFLICTO_INTERES, ANEXO_5 |

  - **Criterio EARS (RF-03.3 a)**: **Cuando** se cree un protocolo EI sin marcas, **el sistema debe** generar 10 requisitos; IO sin marcas, 9.
  - **Criterio EARS (RF-03.3 b)**: **Si** el protocolo marca población indígena, **el sistema debe** sumar `TRADUCCION_ANCESTRAL` y `CONSENTIMIENTO_COM` (EI 12, IO 11). Esta regla ya está en el catálogo y no cambia.
  - **Criterio EARS (RF-03.3 c)**: **Cuando** se aplique el cambio, **la migración debe** actualizar las filas por `codigo_anexo` (nunca por `id`) y no tocar el checklist (`requisitos_protocolo`) de los protocolos existentes.
  - > `POLIZA_RC` e `IDONEIDAD_INST` dependen de `riesgoMayor` en EI; ningún llamador de `calcularRequeridos` pasa esa marca y el riesgo lo fijan los pares después de la creación. Qué hacer con ellos: por confirmar (sección 11, pendiente 15).
  - > Si el checklist de un protocolo existente se recalcula al corregir su tipología (RF-03.2), usará el catálogo vigente, ya con esta regla (no verificado en el código el 09/11/2026).
  - > Las migraciones del catálogo `1778850000000-ForceDocumentCodesById` y `1778870000000-FixAllDocumentCodes` escriben `codigo_anexo` por `id`, y `1778800000000-SeedTiposDocumento` inserta por `nombre` con el id de la secuencia. En una base nueva los ids no coinciden con los de `ceish_db` (19 ANEXO_1 … 45 APROB_ORIGEN), así que los códigos quedarían distintos (análisis estático; no ejecutado en una base nueva). Pendiente 17 cerrado (09/11/2026): el catálogo se reconstruye por `codigo_anexo` en una tarea aparte (TSK-001.13).

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

- **RF-EST.1 (Seis etapas canónicas)**: El catálogo `catalogos.estados` expone dos campos adicionales en cada estado: `etapa` (una de las 6 etapas) y `orden` (posición de la etapa, de 1 a 6, para la barra de progreso). La etapa no se almacena como campo independiente en el protocolo. El valor `EXENTO` no forma parte de este alcance. — Reemplaza a: siete etapas canónicas con Riesgo como etapa aparte — decisión 28/10/2026

  **Regla de origen de la etapa**: la etapa sale del estado del protocolo (`protocolos.estado_id`); si es NULL, del estado de la recepción de la versión activa (`recepcion.recepciones.estado_id`); si tampoco hay recepción, es `RECEPCION`. La tabla estado → etapa vive en `catalogos.estados`; la precedencia se aplica en una sola función de dominio (`resolveProtocolStage`). — Reemplaza a: «la etapa del protocolo se deduce de su `estado_id`» — decisión 04/11/2026

  | Etapa (orden) | Estados (id del catálogo) |
  |---|---|
  | RECEPCION (1) | INICIADO (9), INCOMPLETO (11), ARCHIVADO_VENCIMIENTO (12), EN_REVISION_SECRETARIA (15), REQUIERE_SUBSANACION_DOC (20), EN_CONTROL_DOCUMENTAL (21; versión nueva después del pleno) |
  | ASIGNACION (2) | COMPLETO (10) |
  | EVALUACION (3) | EN_EVALUACION (13), DISCREPANCIA_RIESGO (16) |
  | RESOLUCION (4) | EVALUADO (14), APROBADO (17, ver excepción), RECHAZADO (18), REQUIERE_SUBSANACION_VERSION (19), APROBADO_CON_CONDICION (25) |
  | — (NULL) | Estados de DOCUMENTO (1-4), de asignaciones (5-8, 26, 27) y de CONVOCATORIA (22-24): no son estados de protocolo |

  La tabla se aplica por `id`: los códigos `APROBADO` y `RECHAZADO` están duplicados por categoría.

  **Excepción APROBADO (17)**: en el catálogo lleva etapa `RESOLUCION` (orden 4). `resolveProtocolStage` la sube a `SEGUIMIENTO` (orden 5) cuando la versión activa del protocolo tiene una resolución emitida (fila en `resolucion.resoluciones` con `version_id` igual a la versión activa; `fecha_emision` es NOT NULL). — decisión 04/11/2026

  > Nota: la etapa `RENOVACION` (6) todavía no tiene estados que la representen en `catalogos.estados`; ningún protocolo la alcanza hasta que se implementen los estados de RF-16.1. No se calcula por fechas. — decisión 04/11/2026

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

  Cada respuesta incluye `etapa` (código de la etapa) y `etapaOrden` (1 a 6, o null).

  > **Alcance parcial (04/11/2026, TSK-001.2)**: implementado en `GET /protocols` y en los demás endpoints que usan `ProtocolMapper` (`GET /protocols/mis-protocolos`, `GET /protocols/mis-subsanaciones`), y en `GET /reception/protocols`. **Falta (TSK-001.3)**: `GET /protocols/:id`, `POST /protocols`, `GET /reception/protocol/:id`, `GET /evaluations/protocols/pending-peer-assignment`, `GET /evaluations/my-assignments`, `GET /evaluations/evaluators/dashboard`, `GET /evaluations/peer-assignments/my-pending`, `GET /evaluations/meetings/pending-protocols`, `GET /evaluations/meetings` y `GET /resolutions/protocol/:protocolId`.

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

  **Contrato de `GET /api/protocols` (TSK-001.4, decisión 04/11/2026)**:

  1. **Acceso**: solo SECRETARIA y PRESIDENTE, con el permiso `PROTOCOLOS_LISTAR` («Listar protocolos», módulo `MOD_RECEPCION`, creado por migración). El handler aplica `RolesGuard` y `PermissionsGuard` con `@Roles(SECRETARIA, PRESIDENTE)` y `@Permissions(PROTOCOLOS_LISTAR)`, además del `JwtAuthGuard` de la clase. Sin token → 401; otro rol o sin el permiso → 403. Los demás handlers del controlador (`mis-protocolos`, `mis-subsanaciones`, catálogos y checklist) no cambian.
  2. **Filtros** (se combinan con AND entre sí y con los existentes: `studyType`, `receptionStatus`, `reviewType`, `investigatorId`, `statusId`, `subsanar`):
     - `search`: se recorta; si queda vacío, se ignora; máximo 100 caracteres (si no, 400). Busca sin distinguir mayúsculas (ILIKE, con `%`, `_` y `\` escapados) en `codigo_ceish`, `titulo`, el nombre de un coinvestigador (`protocolo_investigadores.nombre_completo`, con EXISTS) y el nombre del investigador principal (`catalogos.usuarios.nombres_completos` por `investigador_principal_id`, con EXISTS). Sin joins que dupliquen filas.
     - `year`: entero de 2000 a 2100 (si no, 400). Es el año, en America/Guayaquil, de `COALESCE(fecha_recepcion de la recepción de la versión activa, protocolos.creado_en)`. Las dos columnas son `timestamp without time zone` y se interpretan como UTC.
     - `etapa`: uno de los 6 códigos de RF-EST.1 (si no, 400). Se calcula en SQL con la misma regla de `resolveProtocolStage` y se filtra antes de paginar, así que `total` y `totalPages` cuentan solo esa etapa.
     - `limit`: de 1 a 100 (si no, 400). `page` sin cambios.
  3. **Orden**: `updatedAt` DESC, sin cambios.
  4. **Respuesta**: la misma de antes (`data`, `total`, `page`, `limit`, `totalPages`; cada item con `etapa` y `etapaOrden`) más `principalInvestigator: { id, fullName } | null`. No se quita ni se renombra ningún campo.

  5. **Borradores (decisión 09/11/2026, RF-02.3 b)**: el listado excluye los protocolos cuya recepción de la versión activa está en `INICIADO` (9). Los totales por etapa cuentan solo protocolos enviados.

  > **Falta implementar**: las columnas por etapa y los filtros propios de cada etapa (Riesgo y Dictámenes en Evaluación). El listado ya filtra por etapa (TSK-001.4), expone `etapa` y `etapaOrden` (RF-EST.2 parcial, TSK-001.2) y el catálogo `catalogos.estados` ya tiene `etapa` y `orden` (RF-EST.1). — actualizado 04/11/2026

---

### RF-CAL: Cómputo de Días Laborables
- **RF-CAL.a**: El sistema debe calcular los días laborables como lunes a viernes, excluyendo los feriados nacionales de Ecuador obtenidos de una librería interna, sin depender de internet ni de carga manual.
- **RF-CAL.b**: La Secretaría o la Presidencia pueden ajustar manualmente cualquier fecha límite calculada, registrando el motivo; el ajuste queda en auditoría.
- **RF-CAL.c**: El receso académico no se modela en esta versión (ver Pendientes).
- **RF-CAL.d**: Las sesiones de pleno no forman parte de este cómputo: sus fechas las define la Secretaría al crear la convocatoria.

### RF-NORM: Plazo Normativo del Comité
- **RF-NORM.1**: El plazo normativo del comité es 45 días laborables (expedita) o 60 (pleno y ensayos clínicos), contados desde la documentación completa (código definitivo). En emergencia: 15 días. Es una fecha de referencia y control, no bloquea la creación de convocatorias: el sistema debe mostrar una advertencia si la `fecha_reunion` supera el plazo y usarlo para las alertas de protocolos pendientes de convocatoria. No corre mientras el trámite esté en `Incompleto / Requiere Subsanación`. Cada nueva versión recalcula un plazo nuevo. Los días se cuentan según RF-CAL. Valores parametrizables y ajustables manualmente con motivo registrado.
  > Nota (09/11/2026, pendiente 13 cerrado): con RF-02.4, `fecha_recepcion` pasa a ser la fecha de envío. La fecha de documentación completa, desde la que corre este plazo, es `recepcion.recepciones.fecha_constancia`, fijada con `NOW()` de la base al aprobar la recepción (RF-02.4 e–g). La regla de 45/60/15 días no cambia; solo cambia la columna de origen.

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
  > Nota (09/11/2026): en la reunión del 06/11/2026 se propuso que la Secretaría suba los formatos oficiales en Configuración y que el investigador los descargue uno por uno o todos en un ZIP. Por confirmar con la Secretaría el 12/11/2026 (sección 11, pendiente 18).
- **Criterio EARS (RF-18.2)**: **Cuando** un Investigador abra el enlace de la notificación por correo, **el sistema debe** redirigirlo directamente a la pantalla de Aceptación Explícita de Plazos de ese protocolo específico.
- **Criterio EARS (RF-18.3)**: **Cuando** la Secretaría redacte observaciones por ítem del checklist, **el sistema debe** disponer de áreas de texto multilínea (`textarea`) sin compresión ni scrolls perezosos.

### RF-19: Reglas Específicas de Tesis, Informe Narrativo de Evaluador e Integración Quipux
- **RF-19.1**: El sistema debe adaptar el checklist documental para proyectos de Tesis de Grado/Posgrado exigiendo obligatoriamente: (a) Acta de Aprobación de Tema de Tesis, y (b) Certificado de Revisión y Respaldo del Director de Tesis.
- **RF-19.2**: El sistema debe permitir a los Evaluadores adjuntar su Informe Narrativo detallado en formato digital (Word/PDF) como complemento de la captura estructurada de los Anexos 9 y 10.
- **RF-19.3**: El sistema debe permitir registrar el Número de Oficio / Trámite Quipux para trazabilidad institucional en las notificaciones y convocatorias expedidas.
- **Criterio EARS (RF-19.1)**: **Si** la modalidad del estudio es Tesis (Pregrado o Posgrado), **el sistema debe** inyectar automáticamente en el checklist los requisitos obligatorios del Acta de Aprobación de Tema y Certificado del Director.
- **Criterio EARS (RF-19.2)**: **Cuando** un Evaluador Par registre su dictamen técnico, **el sistema debe** permitir subir el informe narrativo en Word/PDF y registrar simultáneamente el dictamen estructurado de los Anexos 9 y 10.
- **Criterio EARS (RF-19.3)**: **Cuando** la Secretaría emita un comunicado formal o convocatoria, **el sistema debe** permitir incluir el código de referencia Quipux correspondiente.
  > Nota (09/11/2026): en la reunión del 06/11/2026 se mencionaron, para tesis, la captura del informe antiplagio y el oficio del tutor, y una bandera «es tesis» al crear. No coinciden con los dos documentos de RF-19.1 (acta de aprobación del tema y certificado del director). Por confirmar con la Secretaría el 12/11/2026 (sección 11, pendiente 11); RF-19.1 no cambia hasta entonces.

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
| 7 | Búsqueda del listado sin distinguir tildes (`unaccent` o `pg_trgm`). No se hace en TSK-001.4. | RF-EST.3 | PENDIENTE |
| 8 | Recortar los datos personales que devuelve el listado de protocolos (investigadores, instituciones, checklist). | RF-EST.3 | PENDIENTE |
| 9 | Validar el año del filtro `year`: fecha de recepción de la versión activa o, si no hay recepción, fecha de creación del protocolo. | RF-EST.3 | PENDIENTE DE VALIDAR |
| 10 | `recepcion.recepciones.fecha_recepcion` se escribe desde Node con `new Date()` y queda en la hora local del proceso (UTC en el contenedor `ceish_api`, UTC−5 en una máquina local). El filtro `year` la toma como UTC. Corregir quién la escribe (por ejemplo, con `NOW()` de la base) en otra tarea. | RF-EST.3 | CERRADO (09/11/2026): RF-02.4, se fija al enviar con `NOW()` de la base; se implementa en TSK-001.6 |
| 11 | Tesis: ¿se piden la captura del informe antiplagio y el oficio del tutor (en lugar de, o además de, los dos documentos de RF-19.1)? ¿Se agrega la bandera «es tesis» al crear el protocolo? (reunión del 06/11/2026) | RF-19.1, RF-03.3 | PENDIENTE de confirmar con la Secretaría (12/11/2026) |
| 12 | ¿El reenvío de una subsanación documental (`INCOMPLETO` 11, `REQUIERE_SUBSANACION_DOC` 20) usa `POST /protocols/:id/submit`, o solo se envía desde `INICIADO` (9)? | RF-02.3 e | CERRADO (09/11/2026): sí; `submit` se acepta desde 9, 11 y 20 y pasa a 15; en otros estados 409; `fecha_recepcion` con `COALESCE` guarda el primer envío |
| 13 | Fecha de documentación completa para el plazo normativo y los reportes, ahora que `fecha_recepcion` es la de envío: ¿columna propia (`fecha_completado`, requiere consulta), fila de auditoría o `fecha_constancia`? | RF-02.4, RF-NORM.1 | CERRADO (09/11/2026): `fecha_constancia`, fijada con `NOW()` al aprobar la recepción; sin columna nueva (RF-02.4 e–g). Desbloquea TSK-001.6 |
| 14 | Ciclo del borrador: ¿desde cuándo se cuentan los 8 días, y son de calendario o laborables? | RF-02.7 | CERRADO (09/11/2026): 8 días de calendario desde la creación; sin aviso por correo; la pantalla muestra la fecha de eliminación |
| 15 | `POLIZA_RC` e `IDONEIDAD_INST` (EI, condición `riesgoMayor`) no pueden pedirse al crear porque el riesgo lo fijan los pares después. ¿Se piden después de fijar el riesgo, en qué etapa y con qué plazo? | RF-03.3 | PENDIENTE de confirmar con la Secretaría (jueves 12/11/2026) |
| 16 | ¿La edición del título (si existe un endpoint que lo cambie) aplica la regla de RF-02.2? | RF-02.2 | CERRADO (09/11/2026): sí, cualquier endpoint de edición que acepte `title` aplica RF-02.2; hoy el backend no tiene endpoint ni DTO de edición, y el `PUT /protocols/:id` que llama el frontend no existe en el backend |
| 17 | Catálogo de requisitos en una base nueva: las migraciones 1778850000000 y 1778870000000 escriben por `id`; ¿se reconstruye el catálogo por `codigo_anexo` en una tarea aparte? | RF-03.3 | CERRADO (09/11/2026): sí, en TSK-001.13 |
| 18 | Formatos oficiales descargables (uno por uno y en ZIP) que la Secretaría sube en Configuración (reunión del 06/11/2026). | RF-18.1 | PENDIENTE de confirmar con la Secretaría (jueves 12/11/2026) |
| 19 | RF-02.8 f: ¿se acepta conservar como `NO_APLICA` el documento de un requisito que deja de aplicar al editar el borrador, y borrarlo de R2 solo al eliminar o descartar el borrador? ¿Se registra `PROTOCOL_UPDATED` (RF-02.8 g)? | RF-02.8 | CERRADO (09/11/2026): se aceptan RF-02.8 f y g |
