Sí. Revisando **el PET CEISH-ESPOCH** y, además, la reunión donde se explicó el flujo que actualmente falta en el sistema, el problema de **Convocatorias → Reuniones** es importante porque no es solamente agregar una pantalla: **la convocatoria se convierte en un punto de control que conecta protocolos, evaluadores, plazos, versiones, resultados y actas**.

## 1. ¿Qué tiene el PET sobre Convocatorias y Reuniones?

Hay que separar dos cosas:

### A. Lo que el PET establece explícitamente

El PET indica que para la evaluación en pleno:

* Se asignan evaluadores según los perfiles requeridos.
* Los documentos de la reunión deben estar disponibles para los miembros **al menos 15 días antes de la reunión programada**.
* Los revisores deben analizar los materiales asignados.
* Los evaluadores deben entregar su informe con anticipación a la reunión.
* En la sesión en pleno se debate cada protocolo.
* Puede invitarse al investigador para preguntas, pero debe retirarse durante las deliberaciones y votación.
* Pueden participar consultores externos cuando sea necesario. 

Además, el PET exige que exista un **acta de cada sesión**, y esa acta debe registrar, entre otras cosas:

* Agenda.
* Protocolos/documentos evaluados.
* Deliberaciones.
* Decisión.
* Participantes.
* Conflictos de interés.
* Consultores externos.
* Votaciones.
* Abstenciones y justificaciones.
* Firmas de los participantes. 

Y para seguimiento, el propio PET dice que el CEISH debe **planificar y convocar reuniones** para determinados estudios de riesgo mayor al mínimo. 

### B. Lo que se definió específicamente para el sistema

Aquí está **el verdadero cambio que les solicitaron**.

En la reunión se explicó que la Secretaría debe poder crear una convocatoria indicando:

* Tipo de convocatoria.
* Fecha.
* Hora.
* Lugar.
* Protocolos que serán tratados.
* Orden del día.
* Información de la reunión.

Los lugares deben ser parametrizables, porque pueden cambiar. 

Además, existen elementos obligatorios del orden del día:

1. Constatación del quórum.
2. Aprobación del orden del día.
3. Aprobación del acta anterior.
4. Protocolos que serán evaluados.
5. Asuntos varios.

Los protocolos intermedios son seleccionados por Secretaría conjuntamente con Presidencia. 

Y cuando se crea la convocatoria, el sistema debe enviar la notificación a los miembros del Comité. 

---

# 2. ¿Cuál es la magnitud del impacto en la base de datos?

Yo lo clasificaría como **IMPACTO ALTO**, pero **no es necesario rehacer toda la base**.

El motivo es que actualmente el flujo de protocolos/evaluaciones puede funcionar sin representar formalmente la **sesión del Comité**.

El problema fundamental es este:

```text
PROTOCOLO
    ↓
ASIGNACIÓN DE EVALUADORES
    ↓
EVALUACIÓN
    ↓
¿?
    ↓
REUNIÓN / CONVOCATORIA
    ↓
DECISIÓN DEL COMITÉ
    ↓
ACTA
    ↓
RESOLUCIÓN / DICTAMEN
```

Ese `¿?` es justamente lo que falta.

La reunión indicó expresamente que el proceso de convocatoria está fuera del control actual y que se necesita una nueva estructura para controlar **qué protocolos fueron tratados en una convocatoria y cuáles todavía no**. 

## Las tablas que conceptualmente hacen falta

No recomiendo simplemente agregar `convocatoria_id` directamente a `protocolos`.

La relación correcta debería ser más parecida a:

```text
CONVOCATORIA
      │
      ├── REUNIÓN
      │
      └── CONVOCATORIA_PROTOCOLO
                    │
                    ▼
                PROTOCOLO
```

Y posteriormente:

```text
CONVOCATORIA
      │
      ├── MIEMBROS / PARTICIPANTES
      │
      ├── ORDEN DEL DÍA
      │
      ├── PROTOCOLOS
      │
      ├── ACTA
      │
      └── DOCUMENTO GENERADO
```

### Tablas nuevas que considero necesarias

| Tabla                      | Necesidad                            |       Impacto |
| -------------------------- | ------------------------------------ | ------------: |
| `convocatorias`            | Registrar la convocatoria            |       🔴 Alta |
| `convocatorias_protocolos` | Saber qué protocolos se tratarán     |       🔴 Alta |
| `reuniones/sesiones`       | Registrar la ejecución de la reunión | 🟠 Media/Alta |
| `orden_dia`                | Controlar puntos de la reunión       |      🟠 Media |
| `participantes_reunion`    | Registrar quién asistió              | 🟠 Media/Alta |
| `votaciones`               | Registrar decisión por protocolo     |       🔴 Alta |
| `actas`                    | Registrar acta de la sesión          |       🔴 Alta |
| `lugares`                  | Parametrizar lugares                 |      🟡 Media |

**Pero ojo:** algunas de estas podrían combinarse dependiendo de cómo esté actualmente su esquema.

---

# 3. El cambio más importante: NO relacionar directamente protocolo → reunión

Esto es muy importante para su diseño.

Un protocolo puede pasar por **varias reuniones** porque puede tener:

```text
Versión 1
   ↓
Convocatoria 25
   ↓
Reunión
   ↓
APROBADO CON CONDICIONES
   ↓
Versión 2
   ↓
Nueva convocatoria
   ↓
Nueva reunión
   ↓
APROBADO
```

La reunión dejó esto bastante claro: cuando se genera una nueva versión, esa versión puede volver a entrar en una nueva convocatoria y tendrá nuevos plazos. 

Por eso la relación debería ser:

```text
PROTOCOLO 1 ───< VERSIONES
                     │
                     └──< CONVOCATORIA_PROTOCOLO >── CONVOCATORIA
                                                        │
                                                        └── REUNIÓN
```

No:

```text
PROTOCOLO
   │
   └── convocatoria_id   ❌
```

Porque eso solamente permitiría representar una convocatoria y rompería el historial.

---

# 4. Hay otro cambio MUY importante: los plazos

Actualmente el protocolo tiene su **plazo normativo**.

Pero cuando Secretaría lo agrega a una convocatoria aparecen **dos nuevos plazos**:

### Plazo normativo

Ejemplo:

```text
Protocolo A
Plazo normativo: 25/09/2026
```

Ese plazo pertenece al proceso del protocolo/evaluación.

### Plazo de reunión

```text
Reunión: 03/08/2026
```

Es la fecha en que el protocolo será tratado por el Comité.

### Plazo de entrega

```text
Entrega de evaluación: 06/08/2026
```

Es la fecha interna que deben cumplir los evaluadores para que Secretaría pueda consolidar la información.

La reunión lo explica explícitamente: al crear la convocatoria aparecen esos dos nuevos valores y, mientras el protocolo todavía no pertenece a una convocatoria, pueden estar vacíos. 

Y cuando se agrega el protocolo a una convocatoria, esos valores se actualizan automáticamente. 

Por eso **NO recomiendo sobrescribir el plazo normativo**.

Debe quedar:

```text
protocolo/version
 ├── plazo_normativo
 ├── fecha_reunion
 └── fecha_entrega_evaluacion
```

Pero mejor aún, conceptualmente:

```text
PROTOCOLO_VERSION
      │
      ├── plazo_normativo
      │
      └── CONVOCATORIA_PROTOCOLO
               ├── fecha_reunion
               └── fecha_entrega
```

Así cada participación del protocolo en una convocatoria conserva su propio historial.

---

# 5. ¿Qué acciones deben tomar?

Yo las haría en este orden.

## Acción 1 — No modificar todavía las tablas actuales

Primero hagan un **análisis de impacto**.

Identifiquen:

```text
Protocolos
Versiones
Evaluaciones
Evaluadores
Asignaciones
Dictámenes
Resoluciones
Documentos
Notificaciones
Seguimiento
Actas
```

y determinen dónde actualmente se guarda:

* fecha de evaluación;
* resultado;
* versión;
* evaluador;
* fecha de entrega;
* reunión, si existe;
* acta.

Esto es importante porque el propio equipo reconoció que las convocatorias están actualmente fuera del control del sistema. 

---

# 6. Acción 2 — Crear el módulo de Convocatorias

La pantalla debería permitir:

```text
┌──────────────────────────────────────────────┐
│ NUEVA CONVOCATORIA                           │
├──────────────────────────────────────────────┤
│ Tipo:        [ Ordinaria ▼ ]                 │
│ Número:      [ 25-2026 ]                     │
│ Fecha:       [ 03/08/2026 ]                  │
│ Hora:        [ 09:00 ]                       │
│ Lugar:       [ Salón Dorado ▼ ]              │
│                                              │
│ Protocolos pendientes                        │
│ ┌──────────────────────────────────────────┐ │
│ │ Código │ Protocolo │ Plazo │ Seleccionar│ │
│ │ A      │ Estudio X │ 25/09 │     ☑      │ │
│ │ B      │ Estudio Y │ 10/09 │     ☑      │ │
│ │ C      │ Estudio Z │ 06/10 │     ☐      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [Generar convocatoria]                       │
└──────────────────────────────────────────────┘
```

Los protocolos deben aparecer **ordenados por proximidad del plazo normativo**, tal como se explicó en la reunión. 

---

# 7. Acción 3 — Crear la relación Convocatoria ↔ Protocolo

Esta es probablemente la tabla más importante.

Algo conceptualmente así:

```text
convocatorias_protocolos

id
convocatoria_id
protocolo_version_id
fecha_reunion
fecha_entrega_evaluacion
estado
orden
resultado
```

Por ejemplo:

```text
25-2026
   │
   ├── PROT-001 v1
   │      reunión: 03/08/2026
   │      entrega: 06/08/2026
   │
   └── PROT-005 v1
          reunión: 03/08/2026
          entrega: 06/08/2026
```

Esto permite saber exactamente:

> **¿En qué convocatoria fue tratado este protocolo?**

Y también:

> **¿Qué protocolos fueron tratados en la convocatoria 25-2026?**

---

# 8. Acción 4 — Crear el control de Reunión

La convocatoria no debería ser exactamente lo mismo que la reunión.

Conceptualmente:

```text
CONVOCATORIA
     │
     │ genera
     ▼
REUNIÓN
     │
     ├── asistentes
     ├── quórum
     ├── orden del día
     ├── protocolos
     ├── votaciones
     └── acta
```

Porque la convocatoria es la **invitación/programación**, mientras que la reunión representa lo que **realmente ocurrió**.

---

# 9. Acción 5 — Controlar las votaciones

Esto también es importante porque el PET exige registrar la votación de cada protocolo, incluyendo abstenciones y su argumentación. 

Entonces no basta con:

```text
protocolo.resultado = APROBADO
```

Deberían poder tener algo como:

```text
VOTACION
──────────────
Protocolo: CEISH-IO-001-2026

Miembro       Voto
────────────────────
Jurídico      APROBADO
Salud         APROBADO
Metodología   CONDICIONADO
Bioética      APROBADO
Soc. Civil   ABSTENCIÓN
```

Y después:

```text
Resultado final:
APROBADO CON CONDICIONES
```

---

# 10. Acción 6 — Acta

Aquí deben respetar bastante el PET.

El sistema debería generar/almacenar:

```text
ACTA
 │
 ├── convocatoria
 ├── reunión
 ├── agenda
 ├── protocolos tratados
 ├── deliberaciones
 ├── participantes
 ├── conflictos de interés
 ├── consultores
 ├── votaciones
 └── firmas
```

El PET establece específicamente que el acta debe permitir reconstruir las discusiones y decisiones tomadas. 

---

# 11. Acción 7 — No automatizar Quipux/Teams todavía

De la reunión sale una recomendación muy clara:

**No intenten automatizar todo el proceso externo de Teams/Quipux.**

Lo que sí debe hacer el sistema:

```text
Secretaría
    ↓
Crear convocatoria
    ↓
Sistema genera PDF/Word
    ↓
Sistema envía notificación/correo
    ↓
Secretaría descarga
    ↓
Gestiona el envío externo
```

Esto fue planteado expresamente como una forma de evitar complicar innecesariamente el sistema. 

---

# 12. Magnitud final del cambio

Yo lo pondría así para su análisis de impacto:

| Área                          | Impacto           |
| ----------------------------- | ----------------- |
| Base de datos                 | 🔴 **ALTO**       |
| Backend                       | 🔴 **ALTO**       |
| Frontend                      | 🔴 **ALTO**       |
| Flujo de trabajo              | 🔴 **MUY ALTO**   |
| Evaluaciones                  | 🟠 **MEDIO/ALTO** |
| Versionamiento                | 🔴 **ALTO**       |
| Notificaciones                | 🟠 **MEDIO**      |
| Actas                         | 🔴 **ALTO**       |
| Reportes                      | 🔴 **ALTO**       |
| Migración de datos existentes | 🟠 **MEDIO**      |

**No es un cambio cosmético.** Es una ampliación del modelo de negocio.

---

## 13. Mi recomendación concreta para su proyecto

No hagan simplemente:

> "Agregar una tabla convocatoria".

Yo plantearía el cambio arquitectónico así:

```text
                    ┌─────────────────┐
                    │  CONVOCATORIA   │
                    ├─────────────────┤
                    │ id              │
                    │ número          │
                    │ tipo            │
                    │ fecha           │
                    │ hora            │
                    │ lugar_id        │
                    │ estado          │
                    └────────┬────────┘
                             │
                             │ 1:N
                             ▼
                ┌────────────────────────┐
                │ CONVOCATORIA_PROTOCOLO │
                ├────────────────────────┤
                │ convocatoria_id        │
                │ protocolo_version_id   │
                │ orden                  │
                │ fecha_reunion          │
                │ fecha_entrega          │
                │ estado                  │
                └───────────┬────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  PROTOCOLO  │
                     └──────┬──────┘
                            │
                         versiones
                            │
                            ▼
                     ┌─────────────┐
                     │  EVALUACIÓN │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  VOTACIÓN   │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │    ACTA     │
                     └─────────────┘
```

### En resumen

**El PET exige que exista una reunión formal con documentación, evaluación previa, deliberación, votación y acta.** 

**La reunión de levantamiento agrega al sistema la necesidad de controlar convocatorias, selección de protocolos, número de convocatoria, fecha/hora/lugar, plazo de reunión y plazo de entrega.** 

Y lo más importante: **la convocatoria debe convertirse en una entidad histórica**, porque un mismo protocolo/versión puede ser tratado en diferentes reuniones. Por eso el impacto en BD es **alto**, pero se puede resolver de forma limpia mediante nuevas entidades y relaciones, sin romper todo el modelo actual.

Si su SQL adjunto corresponde a la **BD actual de CEISH**, el siguiente paso recomendable es hacer el análisis **tabla por tabla** y decir exactamente: **qué tablas actuales se reutilizan, cuáles se modifican, cuáles nuevas se crean, qué FK se agregan y qué migraciones SQL necesitan**.

---

## 14. Brechas de Requerimientos y Ajustes Adicionales (Auditoría del Transcript de la Reunión)

Al cruzar su análisis actual con la transcripción de la reunión en [`docs/reunion.md`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/docs/reunion.md), se identificaron varias brechas de requisitos funcionales y de negocio que deben agregarse al plan de desarrollo:

### 14.1. Autenticación y Registro de Investigadores Externos
* **Requerimiento:** No todos los investigadores provienen de la ESPOCH (no todos tienen CAS). Se debe permitir el registro libre para investigadores externos.
* **Impacto en BD/Auth:** 
  * Se requiere que la tabla de usuarios permita registrar correos externos.
  * Debe implementarse la validación del correo externo mediante el envío de un código **OTP (One-Time Password)** antes de habilitar la cuenta.
  * Configurar la redirección del login CAS institucional y el login local clásico.

### 14.2. Reglas de Negocio en la Asignación de Evaluadores (Límite por Tipo)
* **Requerimiento:** No se pueden asignar libremente los evaluadores. Se deben cumplir topes por perfil técnico:
  * **Representantes de la Sociedad Civil:** Máximo 1 por protocolo.
  * **Asesoría Jurídica:** Máximo 1 por protocolo.
  * **Metodológicos / Éticos:** Máximo 2 por protocolo (configurable).
  * Estas restricciones deben ser parametrizables para permitir cambios si el comité crece.
* **Impacto en BD:** Crear o modificar la tabla de configuración (`parametros_asignacion` o similar) con columnas: `tipo_evaluador` (código del rol) y `max_permitido`.
* **Impacto en Backend:** Agregar validación en [`assignPeerEvaluators`](file:///C:/Users/Usuario/Desktop/8vo/API%20II/CEISH-ESPOCH/src/modules/evaluations/application/services/evaluations.service.ts#L752) para verificar que el arreglo de `evaluatorIds` cumpla con estas cuotas de roles.

### 14.3. Descarga de Formatos y Plantillas (Botón de Formato)
* **Requerimiento:** Al lado de cada campo de subida de archivos (Anexo 1, Anexo 2, etc.), debe colocarse un botón de descarga para que el investigador obtenga la plantilla oficial en Word/PDF directamente desde el sistema si no la tiene a mano.
* **Impacto en Backend:** Habilitar un endpoint estático o un servicio de storage para servir las plantillas de documentos (`GET /api/documents/templates/:filename`).

### 14.4. Código de Envío Temporal vs. Código CEISH Oficial
* **Requerimiento:** Al momento en que el investigador finaliza la carga y envía el protocolo, el sistema debe mostrar un modal de confirmación con un **código de envío/seguimiento temporal** (clave primaria del envío). El **Código CEISH definitivo** se asigna únicamente cuando la secretaria valida técnicamente los archivos y los acepta.
* **Impacto en BD:** Añadir un campo `codigo_seguimiento_temporal` en la tabla `protocolos` que se genere automáticamente al crear el registro.

### 14.5. Flujo de Enlaces de Acción Directa (Deep Linking)
* **Requerimiento:** Los correos de notificación (ej. "Aceptar términos") deben incluir enlaces directos que lleven al investigador a la acción específica dentro de la plataforma (y no solo al login general). Si el usuario no está logueado, debe redirigirlo al login y luego mandarlo automáticamente al destino original.
* **Impacto en Frontend/Backend:** Implementar en el flujo de autenticación el soporte de parámetros de redirección (ej. `?redirectTo=/protocols/12/accept`).

### 14.6. Reseteo Anual del Correlativo de Convocatorias
* **Requerimiento:** El código de las convocatorias se incrementa secuencialmente y se reinicia en cada año calendario (ej. convocatoria `25-2026`).
* **Impacto en Backend:** El servicio generador de convocatorias debe consultar la última convocatoria creada en el año actual para determinar el consecutivo correspondiente en lugar de un autoincremento global simple.

### 14.7. Protocolos Exentos (Tipos y Características Parametrizables)
* **Requerimiento:** Los protocolos exentos (estudios sin datos sensibles) no requieren evaluación completa de pares ni seguimiento posterior, sino la generación directa de un *Certificado de Exención*. Los tipos de estudio y sus características deben ser completamente CRUD-ables en el panel de administración.
* **Impacto en BD:** Incorporar el tipo `EXENTO` en el ciclo de vida del protocolo y asegurar que las tablas de catálogos de tipos de estudio y características (`tipos_estudio`, `caracteristicas_estudio`) cuenten con endpoints CRUD en el backend.
