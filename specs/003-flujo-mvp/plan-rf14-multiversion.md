# Plan de Arquitectura y Diseño Técnico: RF-14 Ciclo Multiversión e Inmutabilidad de Aprobados

**Especificación de Referencia:** `specs/003-flujo-mvp/spec.md` (Versión 1.4.1, HU-014, RF-14)  
**Proyecto:** CEISH-ESPOCH Backend  
**Documento Target:** `specs/003-flujo-mvp/plan-rf14-multiversion.md`  
**Cumplimiento Constitucional:** `docs/doc_base/constitution.md` y `AGENTS.md` (Arquitectura Hexagonal, NestJS, TypeORM, PostgreSQL, cero dependencias no autorizadas).

---

## 1. Mapeo de Criterios EARS y Requisitos Funcionales

| Criterio EARS / Requisito | Ubicación en este Plan | Descripción de Cobertura |
|---|---|---|
| **RF-14.1 (EARS 1)**: Auto-Generación de Versión Mayor (v1.0 ➔ v2.0) y `plazo_condicion_dias` Días Hábiles | Sección 3 (Algoritmo A), Sección 4 (Contrato API) y Sección 5 (Decisiones Técnicas) | Incremento secuencial del entero `numero_version` en BD y asignación del plazo normativo de `plazo_condicion_dias` días hábiles (inicial 30). |
| **RF-14.1 (EARS 2)**: Inmutabilidad y Congelamiento Documental (🔒) | Sección 3 (Algoritmo B), Sección 2 (Modelos) y Sección 4 (Endpoints) | Congelamiento estricto de requisitos `APROBADO` / `NO_APLICA` y reseteo a `NO_PRESENTADO` únicamente para los observados/rechazados. |
| **RF-14.1 (EARS 3)**: Incremento Dinámico sin Límite Duro y Formateo `v${numero_version}.0` | Sección 3 (Algoritmo C), Sección 2 (Mapeo JSON) y Sección 5 (Decisiones Técnicas) | Permite versiones v3.0, v4.0 indefinidas hasta dictamen explícito de `RECHAZADO` y proyecta la versión como `vX.0` en la presentación. |

---

## 2. Estructura de Módulos (Arquitectura Hexagonal)

El módulo se integra en los bounded contexts de `protocols` y `resolutions` en `src/modules/protocols/`.

```
src/modules/protocols/
├── domain/
│   ├── entities/
│   │   ├── protocol-version.entity.ts       # Entidad de Dominio Versión de Protocolo
│   │   └── version-requirement.entity.ts    # Entidad de Dominio Requisito por Versión
│   └── ports/
│       └── protocol-version-repository.port.ts # Puerto de persistencia de versiones
├── application/
│   ├── dtos/
│   │   ├── create-next-version.dto.ts       # DTO para disparar la creación de v2.0/v3.0
│   │   └── protocol-version-response.dto.ts # DTO de salida con formateo vX.0 y banderas de congelamiento
│   ├── services/
│   │   ├── create-next-version.use-case.ts  # Caso de Uso: Transicionar dictamen a nueva versión
│   │   └── get-version-checklist.use-case.ts # Caso de Uso: Consultar checklist inmutable/editable
│   └── mappers/
│       └── protocol-version.mapper.ts
└── infrastructure/
    ├── database/
    │   ├── entities/
    │   │   ├── version-protocolo.orm-entity.ts # Mapea a schema 'protocolos', tabla 'versiones_protocolo'
    │   │   └── requisito-version.orm-entity.ts # Mapea a schema 'protocolos', tabla 'requisitos_version'
    │   └── repositories/
    │       └── protocol-version-typeorm.repository.ts
    └── controllers/
        └── protocol-versions.controller.ts  # Endpoints REST (/api/protocols/:id/versions)
```

---

## 3. Modelo de Datos JSON: Transición v1.0 ➔ v2.0 (Resultado de Congelamiento)

### Objeto de Entrada (v1.0 con dictamen "Requiere Subsanación")
```json
{
  "protocolId": "c2ffcd77-7b0a-2ef6-994b-4aa7ac160a33",
  "currentVersionId": "ver-001",
  "versionNumber": 1,
  "formattedVersion": "v1.0",
  "plenoResolution": "APROBADO_CON_CONDICIONES",
  "requirements": [
    {
      "requirementId": "req-001",
      "name": "Carta de Presentación del Proyecto",
      "status": "APROBADO",
      "documentPath": "/storage/v1/carta.pdf"
    },
    {
      "requirementId": "req-002",
      "name": "Consentimiento Informado (Anexo 3)",
      "status": "OBSERVADO",
      "documentPath": "/storage/v1/consentimiento.pdf",
      "observation": "Falta aclaración de seguros."
    },
    {
      "requirementId": "req-003",
      "name": "Aprobación de Comité Institucional previo",
      "status": "NO_APLICA",
      "documentPath": null
    }
  ]
}
```

### Objeto Resultante Creado (v2.0 con Congelamiento 🔒)
```json
{
  "protocolId": "c2ffcd77-7b0a-2ef6-994b-4aa7ac160a33",
  "newVersionId": "ver-002",
  "versionNumber": 2,
  "formattedVersion": "v2.0",
  "submissionDeadline": "2026-11-04T23:59:59.000Z",
  "businessDaysAllowed": 30,
  "requirements": [
    {
      "requirementId": "req-001",
      "name": "Carta de Presentación del Proyecto",
      "status": "APROBADO",
      "isFrozen": true,
      "canEdit": false,
      "inheritedFromVersion": "v1.0",
      "documentPath": "/storage/v1/carta.pdf"
    },
    {
      "requirementId": "req-002",
      "name": "Consentimiento Informado (Anexo 3)",
      "status": "NO_PRESENTADO",
      "isFrozen": false,
      "canEdit": true,
      "inheritedFromVersion": null,
      "documentPath": null
    },
    {
      "requirementId": "req-003",
      "name": "Aprobación de Comité Institucional previo",
      "status": "NO_APLICA",
      "isFrozen": true,
      "canEdit": false,
      "inheritedFromVersion": "v1.0",
      "documentPath": null
    }
  ]
}
```

---

## 4. Algoritmos en Pseudocódigo

### Algoritmo A: Incremento de `numero_version` y Asignación de Plazo (30 Días Hábiles)
```text
ALGORITMO CreateNextProtocolVersion(protocolId: UUID, plenoResolution: String)
ENTRADA: protocolId, plenoResolution ("REQUIERE_SUBSANACION" / "APROBADO_CON_CONDICIONES")
SALIDA: Objeto VersionProtocoloOrmEntity v2.0 creada con requisitos congelados

PASO 1: Consultar la versión activa actual en BD:
        currentVersion = Query("SELECT * FROM versiones_protocolo WHERE protocolo_id = :protocolId AND es_activa = true")

PASO 2: Incrementar secuencialmente el número de versión (entero en BD):
        nextVersionNumber = (currentVersion.numero_version || 1) + 1

PASO 3: Calcular fecha límite a 30 DÍAS HÁBILES:
        deadlineDate = BusinessDaysCalculator.addBusinessDays(FechaActual(), 30) // 23:59:59.999

PASO 4: Inactivar la versión anterior en la transacción:
        UPDATE versiones_protocolo SET es_activa = false WHERE id = currentVersion.id;

PASO 5: Crear el nuevo registro de versión v2.0:
        newVersion = INSERT INTO versiones_protocolo (
            protocolo_id, numero_version, es_activa, fecha_limite_subsanacion, estado
        ) VALUES (
            protocolId, nextVersionNumber, true, deadlineDate, 'EN_SUBSANACION'
        );

PASO 6: Ejecutar Algoritmo B (Congelamiento de Requisitos).
PASO 7: RETORNAR newVersion.
FIN ALGORITMO
```

---

### Algoritmo B: Congelamiento e Inmutabilidad de Requisitos (🔒)
```text
ALGORITMO FreezeAndCopyRequirements(previousVersionId: UUID, newVersionId: UUID)
ENTRADA: previousVersionId, newVersionId
SALIDA: Registros creados en la tabla 'requisitos_version'

PASO 1: Consultar todos los requisitos de la versión anterior:
        previousReqs = Query("SELECT * FROM requisitos_version WHERE version_id = :previousVersionId")

PASO 2: PARA CADA req EN previousReqs HACER
            IF req.estado == 'APROBADO' O req.estado == 'NO_APLICA' ENTONCES
                // CONGELAMIENTO (🔒): Copiar la referencia original, mantener estado e inhabilitar edición
                INSERT INTO requisitos_version (
                    version_id, requisito_id, estado, es_congelado, archivo_id
                ) VALUES (
                    newVersionId, req.requisito_id, req.estado, true, req.archivo_id
                );
            SINO // req.estado == 'OBSERVADO' O req.estado == 'RECHAZADO' O req.estado == 'NO_PRESENTADO'
                // RESETEO: Liberar requisito para nuevo resometimiento por el Investigador
                INSERT INTO requisitos_version (
                    version_id, requisito_id, estado, es_congelado, archivo_id
                ) VALUES (
                    newVersionId, req.requisito_id, 'NO_PRESENTADO', false, NULL
                );
            FIN IF
        FIN PARA
FIN ALGORITMO
```

---

### Algoritmo C: Formateo de Presentación `v${numero_version}.0`
```text
ALGORITMO FormatVersionForPresentation(numeroVersionInteger: Integer)
ENTRADA: numeroVersionInteger (ej. 1, 2, 3)
SALIDA: String formateado (ej. "v1.0", "v2.0", "v3.0")

PASO 1: IF numeroVersionInteger ES NULL O <= 0 ENTONCES
            RETORNAR "v1.0"
        FIN IF
PASO 2: RETORNAR "v" + String(numeroVersionInteger) + ".0"
FIN ALGORITMO
```

---

## 5. Contrato de API REST

### Endpoint 1: Crear Siguiente Versión tras Dictamen (v1.0 ➔ v2.0)
- **Método / Ruta**: `POST /api/protocols/:id/versions/next`
- **Guards**: `JwtAuthGuard`, `RolesGuard('PRESIDENTE', 'ADMIN')`, `PermissionsGuard('RESOLUTIONS_EMIT')`
- **Request DTO (`CreateNextVersionDto`)**:
  ```json
  {
    "resolutionType": "APROBADO_CON_CONDICIONES"
  }
  ```
- **Response HTTP 201 Created**:
  ```json
  {
    "statusCode": 201,
    "message": "Nueva versión v2.0 creada exitosamente con requisitos congelados",
    "data": {
      "protocolId": "c2ffcd77-7b0a-2ef6-994b-4aa7ac160a33",
      "versionNumber": 2,
      "formattedVersion": "v2.0",
      "submissionDeadline": "2026-11-04T23:59:59.000Z",
      "businessDaysAllowed": 30,
      "frozenRequirementsCount": 2,
      "editableRequirementsCount": 1
    }
  }
  ```

---

### Endpoint 2: Consultar Checklist por Versión con Banderas de Congelamiento (🔒)
- **Método / Ruta**: `GET /api/protocols/:id/versions/active/checklist`
- **Response HTTP 200 OK**: Retorna el JSON de la versión activa v2.0 mostrado en la Sección 3 de este plan.

---

## 6. Decisiones Técnicas Justificadas

### Decisión: Mantener `numero_version` como `integer` en PostgreSQL y proyectar `vX.0` en UI
- **Decisión**: La columna de BD se mantiene como `integer` en `versiones_protocolo.numero_version`. El formateo a `v1.0`, `v2.0`, `v3.0` se realiza exclusivamente en la capa de aplicación (Mappers, DTOs y plantillas de PDF).
- **Justificación**: Evita alterar la base de datos existente o introducir tipos `numeric`/`varchar` innecesarios. Dado que el CEISH solo maneja revisiones mayores completas por dictamen del Pleno (sin subversiones tipo v1.1 o v1.2), la representación entera es óptima para incrementos atómicos simples (`+1`).
- **Alternativa descartada**: Cambiar el tipo de datos de la columna a `numeric` o `varchar`. Descartada por complejidad innecesaria y riesgo de inconsistencias de tipos.

---

## 7. Estrategia de Pruebas (TDD)

1. **Pruebas Unitarias (`npm test`)**:
   - `create-next-version.use-case.spec.ts`: Probar que v1.0 pase a v2.0 y v2.0 a v3.0 dinámicamente sin límite superior.
   - `freeze-requirements.service.spec.ts`: Verificar que un requisito `APROBADO` conserve su `archivo_id` y `es_congelado = true`, mientras que uno `OBSERVADO` pase a `NO_PRESENTADO` con `archivo_id = null`.
2. **Pruebas E2E (`npm run test:e2e`)**:
   - `protocol-versions.e2e-spec.ts`: Invocar la creación de v2.0 y consultar el endpoint de checklist activo. Verificar que el usuario no pueda modificar requisitos congelados.
