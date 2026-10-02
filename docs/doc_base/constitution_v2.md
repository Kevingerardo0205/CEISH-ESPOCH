# Constitución del Proyecto CEISH-ESPOCH (v2 — Brownfield SDD)

Documento normativo supremo y vinculante para todos los agentes de desarrollo, arquitectos y colaboradores que interactúen con el repositorio del sistema **CEISH-ESPOCH**.

> **Contexto Operativo**: El proyecto CEISH-ESPOCH **NO es un proyecto greenfield**. Cuenta con una base de código preexistente y avanzada, base de datos en PostgreSQL con esquemas definidos, módulos de negocio consolidados, entidades, servicios, controladores, repositorios, pruebas unitarias/e2e, migraciones y funcionalidades en producción. Toda intervención técnica debe someterse a las siguientes reglas innegociables.

---

## 1. Principios Fundamentales de Desarrollo Brownfield y SDD

### Regla 1: Brownfield First
Antes de crear cualquier archivo, clase, entidad, servicio, repositorio, componente, ruta, migración o módulo:
1. **Búsqueda e Inspección**: Localizar primero si ya existe una implementación equivalente o análoga en la base de código.
2. **Reutilización**: Evaluar si el componente existente puede reutilizarse directamente.
3. **Adaptación**: Si el componente existe pero requiere ajustes o extensiones, modificarlo o adaptarlo respetando los contratos existentes.
4. **Creación como Último Recurso**: Se autoriza la creación de nuevos archivos únicamente cuando se demuestre fehacientemente que no existe una implementación previa adecuada.

### Regla 2: No Duplicación
No se crearán versiones paralelas ni redundantes de funcionalidades existentes por el simple hecho de que un plan o especificación mencione "crear archivo".
* Las rutas de archivos y componentes indicados en los planes son **objetivos de arquitectura**, NO una autorización automática para duplicar código existente.
* Si el objetivo ya está satisfecho por un archivo preexistente, se debe conciliar y reutilizar dicho archivo.

### Regla 3: Fuentes de Verdad y Jerarquía de Autoridad
En un entorno brownfield, la realidad operativa del sistema prevalece sobre la documentación tentativa. Las fuentes de verdad se estructuran jerárquicamente:

**Fuentes Primarias (Realidad del Sistema):**
1. Código fuente implementado y probado.
2. Esquema real de base de datos y datos existentes.
3. Historial de migraciones aplicadas.
4. Pruebas unitarias y de integración existentes.
5. Contratos API reales y Swagger/OpenAPI en funcionamiento.
6. Arquitectura hexagonal implementada.
7. Documentación oficial del proyecto (`AGENTS.md`, `constitution.md`).

**Fuentes Secundarias (Documentos de Planificación):**
* `spec.md`
* `plan.md`
* `tasks.md`

> **Principio de Conciliación**: Si surge una contradicción entre las fuentes primarias y secundarias, el agente debe **identificarla y documentarla explícitamente** antes de modificar cualquier línea de código.

### Regla 4: Preservación del Sistema y Compatibilidad Hacia Atrás
Está terminantemente prohibido eliminar, refactorizar masivamente o reemplazar funcionalidades existentes sin justificar:
1. Por qué la implementación actual es defectuosa o insuficiente.
2. Qué módulos, servicios o componentes dependen de ella.
3. Qué elemento exacto la sustituirá.
4. Cuál es el plan de pruebas que valida que ninguna funcionalidad adyacente o regresión sea introducida.

### Regla 5: Integridad de Base de Datos
Nunca se deben modificar tipos de datos, relaciones, claves primarias (PK), claves foráneas (FK), índices o datos preexistentes únicamente para ajustarse a ejemplos abstractos de un plan.
* Primero se verifica el esquema real de PostgreSQL (esquemas `catalogos`, `protocolos`, etc.).
* La lógica de aplicación y los DTOs deben adaptarse al dominio y persistencia existentes, no al revés.

### Regla 6: Preservación del Dominio
No se deben alterar identificadores de negocio, enums, máquinas de estados ni relaciones de dominio únicamente para coincidir con ejemplos sintéticos presentes en la documentación o especificación.
* Los ejemplos documentales no constituyen datos de producción ni definen la estructura canónica frente a los enums y modelos reales en el código.

### Regla 7: Test First (Desarrollo Guiado por Pruebas)
Cuando una tarea implique la incorporación o modificación de comportamiento:
1. **Analizar** primero las suites de pruebas existentes (`*.spec.ts`, `*.e2e-spec.ts`).
2. **Crear o actualizar** los casos de prueba necesarios que capturen el nuevo requisito o la corrección de fallo.
3. **Implementar** la solución mínima requerida.
4. **Ejecutar** las pruebas asociadas al módulo afectado para validar la solución.
5. **Ejecutar la validación completa** (`npm test`, `npm run test:e2e`, `npm run lint`).

### Regla 8: Flujo del Ciclo de Vida SDD (Spec-Driven Development)
Todo cambio o requisito debe transitar estrictamente por las siguientes etapas secuenciales:
```text
SPEC → CLARIFICATION → RECONCILIATION → PLAN → TASKS → IMPLEMENTATION → VALIDATION
```
* **SPEC**: Especificación clara de requisitos y criterios EARS.
* **CLARIFICATION**: Resolución de ambigüedades e interrogantes sobre el alcance.
* **RECONCILIATION**: Contraste explícito entre la spec y la base de código/esquema existente.
* **PLAN**: Definición técnica de la arquitectura y estrategia de cambio mínimo.
* **TASKS**: Desglose en tareas atómicas, trazables y secuenciales.
* **IMPLEMENTATION**: Ejecución focalizada de código guiada por pruebas.
* **VALIDATION**: Verificación rigurosa de calidad, linting, cobertura y no-regresión.

### Regla 9: Aislamiento y Ejecución de Tareas
* Implementar **únicamente** la tarea específica en curso.
* No avanzar de forma automática ni anticipada a la siguiente tarea sin haber completado y validado formalmente la actual.

### Regla 10: Semántica del Estado `[x]`
* La marca `[x]` en cualquier documento SDD certifica que el elemento está **completamente implementado, probado y verificado**.
* **Prohibición**: Queda prohibido desmarcar un elemento a `[ ]` de forma automática o por asunciones documentales. Antes de intentar reimplementar algo marcado con `[x]`, se debe inspeccionar el código real para confirmar su estado funcional.

### Regla 11: Trazabilidad Bidireccional
Cada artefacto de código y modificación debe mantener una trazabilidad transparente hacia:
1. Requisito de negocio de origen.
2. Criterio EARS correspondiente.
3. Archivo objetivo (nuevo o preexistente).
4. Caso de prueba asociado.
5. Criterio de validación y aceptación.

### Regla 12: Autoridad del Backend y Reglas Críticas
* El frontend **no es la fuente de verdad** de reglas de negocio críticas, cálculos de estado, autorizaciones ni validaciones de integridad.
* Toda regla de negocio crítica debe ser validada, impuesta y resguardada en el backend (capas de `domain` y `application`), y respaldada por la base de datos.

### Regla 13: Política sobre Mocks y Fuentes Simuladas
* Está prohibido introducir `MockRepository`, `localStorage`, arreglos en memoria u orígenes de datos simulados como reemplazo de servicios y bases de datos reales en código de producción.
* Los mocks quedan restringidos **exclusivamente al entorno de pruebas automatizadas (Jest)** o a casos donde un requisito técnico justifique explícitamente un fallback documentado.

### Regla 14: Gestión Responsable de Migraciones
No se deben eliminar, sobreescribir ni recrear migraciones existentes sin antes:
1. Comprobar si fueron ejecutadas en la base de datos activa.
2. Analizar las mutaciones de esquema exactas que introdujeron.
3. Evaluar el estado actual del esquema físico en PostgreSQL.
4. Generar migraciones incrementales y reversibles (`npm run migration:generate`).

### Regla 15: Principio de Cambio Mínimo (Minimal Delta)
* Se debe priorizar siempre el cambio más conciso, limpio y quirúrgico que satisfaga el requisito con precisión.
* Evitar refactorizaciones oportunistas no solicitadas, modificaciones cosméticas innecesarias o adición de dependencias que amplíen la superficie de riesgo del sistema.

### Regla 16: Criterio Estricto de "Hecho" (Definition of Done)
Una tarea solo puede marcarse como `[x]` cuando se cumplan simultáneamente todas las siguientes condiciones:
1. El código existe, compila y sigue los patrones arquitectónicos del proyecto.
2. Satisface el requisito funcional y el criterio EARS asignado.
3. Las pruebas unitarias y de integración pertinentes se ejecutan y pasan exitosamente.
4. No genera duplicación de lógica ni de archivos.
5. No introduce regresiones ni rompe funcionalidades existentes.
6. El código pasa el formateo (`npm run format`) y linter (`npm run lint`).
7. Se cumple a cabalidad el criterio de aceptación ("Hecho cuando").

---

## 2. Convenciones Arquitectónicas y Técnicas

1. **Arquitectura Hexagonal (Clean Architecture)**:
   * `domain`: Entidades puras en TypeScript, tipos de dominio, interfaces de puertos (repositorios/adaptadores). Cero dependencias externas.
   * `application`: Casos de uso, servicios de aplicación, DTOs de entrada/salida y mapeadores.
   * `infrastructure`: Controladores HTTP, entidades TypeORM (ORM), implementaciones de repositorios, estrategias de autenticación y adaptadores externos.
2. **Inversión de Dependencias**:
   * Enlace en módulos NestJS mediante `{ provide: IPortInterface, useClass: PortImplementation }`.
3. **Seguridad y Criptografía**:
   * Los datos personales sensibles (PII) deben ser protegidos mediante `EncryptionTransformer` con cifrado **AES-256-CBC**.
   * Respetar los decoradores `@Encrypt()` y `@Audit()` para la trazabilidad y confidencialidad.
4. **Manejo de Idioma**:
   * **Inglés**: Nombres de variables, funciones, clases, archivos, interfaces, DTOs, entidades y comentarios de código.
   * **Español**: Mensajes de error dirigidos al usuario, respuestas de API y documentación funcional/técnica.
5. **Stack Tecnológico**:
   * NestJS (v11+), TypeORM, PostgreSQL, Passport.js (JWT), Jest para testing.
   * Prohibido añadir dependencias npm externas sin autorización previa expresa.
