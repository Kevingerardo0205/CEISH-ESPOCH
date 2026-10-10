# Especificación de Requisitos de Software: Flujo de Asignación y Evaluación CEISH-ESPOCH

**Código de Especificación:** `specs/002-flujo-mvp/spec.md`  
**Proyecto:** CEISH-ESPOCH Backend  
**Versión:** 1.1.0  
**Estado:** Aprobado  
**Historial:** 2026-10-10 — alineado con decisiones de Secretaría/Tutor (ver Pendientes por confirmar)

---

## 1. Contexto y Objetivo

### 1.1 Contexto
En el flujo del Comité de Ética en Investigación en Seres Humanos de la ESPOCH (CEISH-ESPOCH), la etapa de evaluación par de protocolos requiere un estricto control de cuotas por perfil profesional, selección aleatoria de evaluadores de riesgo, mecanismos inmutables de reasignación por conflictos de interés o vencimiento, y notificaciones automatizadas con deep-linking.

### 1.2 Objetivo
Definir la especificación completa del módulo de Asignación, Restricción de Cuotas, Reasignación Trazable y Notificación de Evaluadores Pares para garantizar que cada protocolo cuente con 4 evaluadores calificados (uno por perfil) sin alterar la integridad histórica ni los tiempos operativos del proceso.

---

## 2. Usuarios y Roles

| Rol | Descripción | Acciones Principales |
|---|---|---|
| **Secretaria / Presidente CEISH** | Autoridad administrativa y de supervisión operativa. La Secretaría asigna a los 4 evaluadores pares; la Presidencia puede asignar y supervisar. | Asignar la cuota exacta de 4 evaluadores, ejecutar reasignaciones por vencimiento/COI indicando el catálogo de motivo, agendar convocatorias. |
| **Evaluador Par** | Miembro del CEISH pertenecientes a uno de los 4 perfiles (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO`, `SALUD/ETICA`). | Recibir notificaciones con deep-linking, acceder a su panel, descargar expediente, diligenciar el Anexo 9 e Informe Narrativo (y el Anexo 10 si fue seleccionado aleatoriamente). |

---

## 3. Historias de Usuario

### HU-012: Asignación Estricta, Reasignación Inmutable y Evaluación Par
#### 1. Información General de la Historia de Usuario
| Campo | Valor |
|---|---|
| **Título** | Matriz de Asignación Estricta de 4 Evaluadores, Seleccionador Aleatorio de Anexo 10 y Reasignación Trazable |
| **ID** | HU-012 |
| **Descripción** | Permite a la Secretaría/Presidente asignar exactamente 4 evaluadores (uno por perfil), selecciona aleatoriamente a 2 (excluyendo a Sociedad Civil) para la Estratificación del Riesgo, gestiona la sustitución de evaluadores sin borrar el historial y garantiza notificaciones por correo con enlaces de acceso directo. |
| **Prioridad** | CRÍTICA |
| **Requisitos origen** | RF-12.1, RF-12.2, RF-12.3, RF-12.4, RF-12.5, RF-12.6 |

#### 2. Pruebas de Aceptación (EARS)
1. **Validación de Cuota Exacta**: **Cuando** la Secretaría asigna evaluadores, **el sistema debe** verificar que la lista contenga exactamente 4 evaluadores con un representante por perfil (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO`, `SALUD`), impidiendo guardar combinaciones duplicadas o incompletas.
2. **Exclusión Aleatoria en Anexo 10**: **Cuando** se confirma la cuota de 4 evaluadores, **el sistema debe** escoger aleatoriamente a 2 evaluadores pertenecientes a `JURIDICO`, `METODOLOGICO` o `SALUD` para llenar el Anexo 10, excluyendo explícitamente a `SOCIEDAD_CIVIL`.
3. **Reasignación Trazable por Motivo**: **Si** un evaluador es sustituido por `VENCIMIENTO` o `CONFLICTO_INTERES`, **el sistema debe** actualizar su estado histórico (`REASIGNADO_VENCIMIENTO` / `REASIGNADO_COI`), filtrar a los candidatos de reemplazo estrictamente por el mismo perfil saliente y aplicar RF-12.7(e) para la fecha de entrega.
4. **Notificación con Deep-Linking**: **Cuando** se formaliza una asignación o reasignación, **el sistema debe** enviar un correo electrónico al evaluador con el código del protocolo, el tiempo mínimo de revisión (`plazo_revision_oficio_dias`) y la indicación de que la fecha de entrega se informará cuando el protocolo se agende en una convocatoria, la indicación explícita de si debe llenar el Anexo 10 y un enlace directo a su panel de evaluación.

---

## 4. Requisitos Funcionales

### RF-12: Matriz de Asignación, Restricción de Cuotas y Reasignación de Evaluadores Pares

- **RF-12.1 (Composición Estricta de Cuota)**: El sistema debe exigir la asignación de exactamente 4 evaluadores pares por protocolo, asignando obligatoriamente 1 miembro por cada uno de los 4 perfiles requeridos: `JURIDICO` (1), `SOCIEDAD_CIVIL` (1), `METODOLOGICO` (1) y `SALUD` / `ETICA` (1).
- **RF-12.2 (Selección Aleatoria para Estratificación de Riesgo - Anexo 10)**: El sistema debe seleccionar automáticamente de forma aleatoria a 2 evaluadores de la lista asignada para diligenciar el Anexo 10 (Estratificación del Riesgo), excluyendo de forma estricta e innegociable al evaluador con perfil `SOCIEDAD_CIVIL` (la selección se realiza única y exclusivamente entre los perfiles técnicos: `JURIDICO`, `METODOLOGICO` y `SALUD` / `ETICA`).
- **RF-12.3 (Reasignación Inmutable por Vencimiento o COI)**: Si un evaluador es desasignado por vencimiento del plazo o Conflicto de Interés (`CONFLICTO_INTERES`), el sistema debe conservar inmutable el registro saliente (marcando estado `REASIGNADO_VENCIMIENTO` o `REASIGNADO_COI` con timestamp y motivo) y filtrar obligatoriamente al evaluador reemplazante dentro del mismo perfil estricto (`JURIDICO`, `SOCIEDAD_CIVIL`, `METODOLOGICO` o `SALUD`), aplicando RF-12.7(e) para la fecha de entrega.
- **RF-12.4 (Requisito de Completitud del 100%)**: El sistema debe impedir el avance a la fase de dictamen final o resolución si falta el reporte del Anexo 9 e Informe Narrativo de cualquiera de los 4 evaluadores (o el Anexo 10 de los 2 seleccionados aleatoriamente).
- **RF-12.5 (Continuidad Evaluadora en Versiones Mayores v2.0/v3.0)**: Al resometer una versión mayor tras dictamen de subsanación (`v2.0`), el sistema debe heredar automáticamente la asignación de los 4 evaluadores originales de la versión previa.
- **RF-12.6 (Notificaciones Automatizadas con Deep-Linking)**: El sistema debe notificar inmediatamente por correo al evaluador asignado/reasignado incluyendo el resumen del protocolo, el tiempo mínimo de revisión (`plazo_revision_oficio_dias`) y la indicación de que la fecha de entrega se informará cuando el protocolo se agende en una convocatoria, la indicación explícita sobre el Anexo 10 y enlace directo (deep-linking) a su formulario de evaluación.
- **RF-12.7 (Plazos del Evaluador):**
  - a) Al asignar a un par, el sistema debe registrar la `fecha_asignacion` y NO fijar plazo de entrega al evaluador. La tarea se muestra como "Pendiente de convocatoria" y, como referencia, el `fecha_plazo_normativo` de la versión.
  - b) El plazo del evaluador comienza cuando la Secretaría agrega el protocolo a una convocatoria. En ese momento el sistema debe registrar la `fecha_reunion` y la `fecha_entrega_evaluacion` de esa convocatoria (specs/003 RF-09.1) y usarla como el plazo del evaluador.
  - c) El oficio de asignación informa un tiempo de revisión de `plazo_revision_oficio_dias` días laborables (inicial 8), igual para revisión expedita y en pleno. Es un tiempo mínimo, no una fecha límite. Si la `fecha_reunion` queda a menos de ese número de días laborables de la `fecha_asignacion`, mostrar una advertencia no bloqueante. Fuente: Secretaría (oct 2026).
  - d) Control de protocolos pendientes de convocatoria: el sistema debe listar los protocolos-versión con pares asignados y sin convocatoria, y alertar a la Secretaría (con copia a la Presidencia) cuando: transcurran `dias_max_sin_convocatoria` días laborables (inicial 8) desde la `fecha_asignacion` activa más antigua de esa versión, o el `fecha_plazo_normativo` esté a `dias_alerta_normativo_sin_convocatoria` días o menos. Aplica specs/003 RF-ALR; deja de emitirse al agendar. La reasignación (RF-12.3) no reinicia la antigüedad.
  - e) En una reasignación (RF-12.3), el evaluador reemplazante hereda la `fecha_entrega_evaluacion` vigente de la convocatoria; si el protocolo no está agendado, queda "Pendiente de convocatoria".

#### Criterios de Aceptación EARS (RF-12)
1. **Criterio EARS (RF-12.1)**: **Cuando** la Secretaría o Presidente asignen evaluadores a un protocolo, **el sistema debe** validar que la lista contenga exactamente 4 evaluadores con la combinación única de perfiles (`1 Jurídico`, `1 Sociedad Civil`, `1 Metodológico`, `1 Salud`), rechazando cualquier duplicidad o asignación incompleta.
2. **Criterio EARS (RF-12.2)**: **Cuando** se confirme la asignación de los 4 evaluadores, **el sistema debe** elegir aleatoriamente a 2 evaluadores pertenecientes a los perfiles `JURIDICO`, `METODOLOGICO` o `SALUD` para responder el Anexo 10, excluyendo de forma estricta e innegociable al evaluador con perfil `SOCIEDAD_CIVIL` de dicha estratificación.
3. **Criterio EARS (RF-12.3)**: **Si** se ejecuta la reasignación de un evaluador por `VENCIMIENTO` o `CONFLICTO_INTERES`, **el sistema debe** registrar el evento en la bitácora de auditoría sin borrar el registro histórico, limitar la lista de selección al mismo perfil del evaluador saliente y aplicar RF-12.7(e) para la fecha de entrega del reemplazante.
4. **Criterio EARS (RF-12.4)**: **Mientras** no se haya registrado el 100% de las evaluaciones de la cuota de 4 miembros (Anexos 9, Anexo 10 e Informes Narrativos), **el sistema debe** impedir la emisión de la resolución final de la Convocatoria.
5. **Criterio EARS (RF-12.5)**: **Cuando** un protocolo resometido en versión v2.0 ingrese a control, **el sistema debe** vincular automáticamente a los mismos 4 evaluadores asignados en v1.0.
6. **Criterio EARS (RF-12.6)**: **Cuando** un evaluador sea asignado o reasignado, **el sistema debe** despachar un correo con el resumen, la indicación explícita del Anexo 10 y la URL con deep-linking al panel del evaluador.

---

## 5. Requisitos No Funcionales

1. **Usabilidad**: Formulario de asignación intuitivo con indicadores visuales por cada uno de los 4 perfiles obligatorios y mensajes de validación 100% en **Español**.
2. **Auditabilidad e Inmutabilidad**: Registro histórico inalterable de sustituciones con fecha, hora, usuario administrativo y motivo normativo (`VENCIMIENTO` o `CONFLICTO_INTERES`).
3. **Seguridad**: Autenticación RBAC estricta (solo evaluadores asignados pueden ver expedientes confidenciales y subir dictámenes).

---

## 6. Casos Límite y Manejo de Excepciones

- **Evaluadores Insuficientes en un Perfil**: Si la base de datos no cuenta con miembros disponibles en un perfil específico (ej. `JURIDICO`), el sistema rechazará la asignación mostrando una alerta descriptiva a la Secretaría.
- **Resolicitud de Reasignación Concurrente**: Si dos usuarios administrativos intentan reasignar al mismo evaluador simultáneamente, se bloqueará mediante transacción atómica.

---

## 7. Fuera de Alcance

1. Firma digital con certificado electrónico en los Informes Narrativos de Evaluadores.
2. Votación automatizada en tiempo real mediante interfaz de videoconferencia.

---

## 8. Criterios de Finalización (Definition of Done)

1. Validación funcional de la cuota exacta de 4 evaluadores (1 Jurídico, 1 Sociedad Civil, 1 Metodológico, 1 Salud).
2. Selección aleatoria de Anexo 10 excluyendo de forma estricta e innegociable al evaluador con perfil SOCIEDAD_CIVIL.
3. Trazabilidad inmutable de reasignaciones por `VENCIMIENTO` o `CONFLICTO_INTERES` aplicando RF-12.7(e) para la fecha de entrega.
4. Notificaciones por correo comprobables con deep-linking directo al panel.

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
