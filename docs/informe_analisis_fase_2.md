# Informe de Análisis Técnico y Plan de Acción: Fase 2 - Modelos de Dominio y Servicios de Infraestructura

Este informe detalla el análisis de discrepancias, el diseño arquitectónico y la propuesta de implementación para ejecutar con éxito la **Fase 2** de la refactorización en el sistema **CEISH-ESPOCH**.

---

## 1. Diagnóstico del Desajuste Frontend-Backend (Problema Crítico)

Al contrastar el código del frontend actual (`ResolutionGeneratorPage` y `ProtocolApiAdapter`) con la base de datos y los servicios del backend (`ResolutionsService` y `SimplifyResolutionObservations` migration), se ha identificado la siguiente discrepancia estructural:

### A. Estructura de Observaciones en BD y Backend
La base de datos original (`script.sql`) definía tres columnas distintas en la tabla `resolucion.resoluciones`:
- `observaciones_mayores`
- `observaciones_menores`
- `procedimiento_subsanacion`

Sin embargo, mediante la migración **`SimplifyResolutionObservations1793000000000`**, el backend simplificó esta estructura, eliminando las tres columnas redundantes y consolidando toda la información en un solo campo de texto llamado **`observaciones`** (mapeado en la entidad TypeORM como `observations`).
La concatenación se realiza con el siguiente formato:
```text
Observaciones Mayores: <texto_mayores>\n
Observaciones Menores: <texto_menores>\n
Procedimiento: <texto_procedimiento>
```

### B. Comportamiento en el Frontend
El formulario del frontend (`ResolutionGeneratorPage`) sigue dividiendo las observaciones y el procedimiento en tres campos independientes y envía un payload al backend con las llaves `majorObservations`, `minorObservations`, y `correctionProcedure`.
- **Efecto Colateral:** Dado que el controlador y servicio de NestJS esperan el campo consolidado `observations` (`dto.observations`), la petición del frontend no envía este campo. Por lo tanto, el backend crea la resolución con **observaciones nulas o vacías**, perdiendo el detalle científico de la resolución en base de datos.
- **Visualización Histórica:** En la pantalla de detalle del protocolo, el frontend intenta mapear campos individuales del historial de versiones (`v.majorObservations`, `v.correctionProcedure`), los cuales retornan vacíos porque el backend solo provee `v.observaciones`.

---

## 2. Propuesta de Solución: Mapeo y Desacoplamiento (Clean Architecture)

Para resolver este problema sin alterar el esquema simplificado de la base de datos (garantizando así el rendimiento y consistencia del backend), aplicamos un **Mapeador Bidireccional Inteligente** en el frontend:

1. **De Frontend a Backend (Escritura):**
   Antes de llamar al API de creación de resolución, el mapper consolidará los tres campos del formulario (`majorObservations`, `minorObservations`, `correctionProcedure`) en la cadena con formato estructurado que espera la BD, asignándola al campo `observations`.
2. **De Backend a Frontend (Lectura):**
   Al consultar el historial de versiones o la resolución de un protocolo, el mapper parseará la cadena consolidada `observaciones` detectando los prefijos (`Observaciones Mayores:`, `Observaciones Menores:`, `Procedimiento:`) para volver a dividir el texto en los tres campos visuales originales. Si el texto no está formateado, se asignará completo a observaciones mayores por retrocompatibilidad.

---

## 3. Plan de Acción Detallado: Tareas de la Fase 2

### Tarea 2.1: Enriquecimiento de Entidades de Dominio
- **`ResolutionEntity` (`src/domain/entities/resolution.entity.ts`):** Rediseñar para incorporar tipos rigurosos acordes al backend (uso de `resolutionTypeId` numérico, `validityYears`, `followUpPeriodDays`, `letterFilePath`) y conservar las propiedades virtuales (`majorObservations`, `minorObservations`, `correctionProcedure`) para el consumo de la interfaz de usuario.
- **`ProtocolVersionEntity` (`src/domain/entities/protocol.entity.ts`):** Verificar consistencia de los campos de observación para el renderizado en la línea de tiempo.

### Tarea 2.2: Implementación de Mappers (`src/infrastructure/mappers/resolution.mapper.ts`)
- Crear `ResolutionMapper` con métodos `toDomain` y `toPayload`.
- Desarrollar la lógica de parsing regex/índices para descomprimir `observaciones` consolidado.

### Tarea 2.3: Actualización del Adaptador de Protocolos (`src/infrastructure/adapters/protocol-api.adapter.ts`)
- Utilizar el parser del `ResolutionMapper` dentro de la transformación del arreglo `versions` en `mapToEntity` del `ProtocolApiAdapter` para que la visualización del timeline histórico recupere las observaciones segmentadas.

### Tarea 2.4: Creación de `FrontendResolutionsService` (`src/infrastructure/services/frontend-resolutions.service.ts`)
- Proveer un servicio Angular con interfaces claras de entrada y salida que centralice las llamadas al puerto del repositorio de resoluciones (`IResolutionRepositoryPort`), aislando la lógica de negocio y mapeo.

### Tarea 2.5: Integración y Refactorización del Generador de Resoluciones (`resolution-generator.page.ts`)
- Modificar el controlador de la página para inyectar `FrontendResolutionsService` y delegar las tareas de guardado y mapeo en él.

---

## 4. Estructura de Código Propuesta

A continuación, se detalla el código completo para implementar la Fase 2:

### 4.1 Entidades del Dominio Actualizadas

#### [`resolution.entity.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/domain/entities/resolution.entity.ts)
```typescript
export interface ResolutionEntity {
  id?: string | number;
  protocolId: string | number;
  versionId: string | number;
  resolutionTypeId: number; // 1: APROBADA, 2: CONDICIONAL, 3: RECHAZADA
  resolutionType?: 'APPROVAL' | 'CONDITIONAL' | 'REJECTION' | 'EXEMPTION'; // Mapeo para lógica UI
  issuedAt?: Date | string; // fecha_emision
  validityYears: number; // vigencia_aprobacion_anios
  followUpPeriodDays?: number; // periodo_seguimiento_dias
  observations?: string; // Campo consolidado del backend (observaciones)
  letterFilePath?: string; // archivo_carta_pdf
  createdByUserId?: number; // creado_por

  // Propiedades Virtuales de Presentación (descomprimidas)
  majorObservations?: string;
  minorObservations?: string;
  correctionProcedure?: string;
}
```

---

### 4.2 Mapeador de Resoluciones

#### [`resolution.mapper.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/infrastructure/mappers/resolution.mapper.ts)
```typescript
import { ResolutionEntity } from '@domain/entities/resolution.entity';

export interface CreateResolutionPayloadDTO {
  protocolId: number;
  resolutionTypeId: number;
  validityYears?: number;
  followUpPeriodDays?: number;
  observations?: string;
  pdfLetterPath?: string;
}

export class ResolutionMapper {
  
  /**
   * Transforma la respuesta DTO del backend en una entidad del dominio de la aplicación,
   * deserializando las observaciones consolidadas en campos individuales para la UI.
   */
  static toDomain(dto: any): ResolutionEntity {
    if (!dto) return {} as ResolutionEntity;
    const raw = dto.data || dto;

    const observations = raw.observations || raw.observaciones || '';
    const parsedObs = this.parseConsolidatedObservations(observations);

    let typeStr: 'APPROVAL' | 'CONDITIONAL' | 'REJECTION' | 'EXEMPTION' = 'APPROVAL';
    if (raw.resolutionTypeId === 2) typeStr = 'CONDITIONAL';
    else if (raw.resolutionTypeId === 3) typeStr = 'REJECTION';

    return {
      id: raw.id,
      protocolId: raw.protocolId,
      versionId: raw.versionId,
      resolutionTypeId: raw.resolutionTypeId,
      resolutionType: typeStr,
      issuedAt: raw.issuedAt || raw.fechaEmision || raw.fecha_emision,
      validityYears: raw.validityYears || raw.vigenciaAprobacionAnios || raw.vigencia_aprobacion_anios || 1,
      followUpPeriodDays: raw.followUpPeriodDays || raw.periodoSeguimientoDias || raw.periodo_seguimiento_dias,
      observations: observations,
      letterFilePath: raw.letterFilePath || raw.archivoCartaPdf || raw.pdfLetterPath,
      createdByUserId: raw.createdByUserId || raw.creadoPor,
      ...parsedObs
    };
  }

  /**
   * Consolida las observaciones estructuradas del frontend en el campo único de observaciones
   * que espera el backend de acuerdo al tipo de dictamen.
   */
  static toPayload(entity: Partial<ResolutionEntity>): CreateResolutionPayloadDTO {
    let consolidatedObs = '';
    
    if (entity.resolutionTypeId === 1) {
      consolidatedObs = entity.observations || '';
    } else if (entity.resolutionTypeId === 2) {
      if (entity.majorObservations) {
        consolidatedObs += `Observaciones Mayores: ${entity.majorObservations}\n`;
      }
      if (entity.minorObservations) {
        consolidatedObs += `Observaciones Menores: ${entity.minorObservations}\n`;
      }
      if (entity.correctionProcedure) {
        consolidatedObs += `Procedimiento: ${entity.correctionProcedure}`;
      }
    } else if (entity.resolutionTypeId === 3) {
      consolidatedObs = entity.majorObservations || '';
    }

    return {
      protocolId: Number(entity.protocolId),
      resolutionTypeId: Number(entity.resolutionTypeId),
      validityYears: entity.resolutionTypeId === 3 ? undefined : Number(entity.validityYears || 1),
      followUpPeriodDays: entity.resolutionTypeId === 3 ? undefined : Number(entity.followUpPeriodDays || 180),
      observations: consolidatedObs.trim(),
      pdfLetterPath: entity.letterFilePath
    };
  }

  /**
   * Procesa la cadena consolidada de la BD para extraer las secciones individuales
   */
  static parseConsolidatedObservations(obs: string): {
    majorObservations: string;
    minorObservations: string;
    correctionProcedure: string;
  } {
    if (!obs) {
      return { majorObservations: '', minorObservations: '', correctionProcedure: '' };
    }

    let major = '';
    let minor = '';
    let procedure = '';

    const majorLabel = 'Observaciones Mayores:';
    const minorLabel = 'Observaciones Menores:';
    const procedureLabel = 'Procedimiento:';

    const majorIdx = obs.indexOf(majorLabel);
    const minorIdx = obs.indexOf(minorLabel);
    const procedureIdx = obs.indexOf(procedureLabel);

    // Si no contiene marcas del consolidado, se asume todo como observaciones mayores
    if (majorIdx === -1 && minorIdx === -1 && procedureIdx === -1) {
      return { majorObservations: obs.trim(), minorObservations: '', correctionProcedure: '' };
    }

    const segments = [
      { label: majorLabel, index: majorIdx, key: 'major' },
      { label: minorLabel, index: minorIdx, key: 'minor' },
      { label: procedureLabel, index: procedureIdx, key: 'procedure' }
    ].filter(s => s.index !== -1).sort((a, b) => a.index - b.index);

    for (let i = 0; i < segments.length; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      const start = current.index + current.label.length;
      const end = next ? next.index : obs.length;
      const val = obs.slice(start, end).trim();
      
      if (current.key === 'major') major = val;
      if (current.key === 'minor') minor = val;
      if (current.key === 'procedure') procedure = val;
    }

    return { majorObservations: major, minorObservations: minor, correctionProcedure: procedure };
  }
}
```

---

### 4.3 Servicio de Aplicación para Infraestructura

#### [`frontend-resolutions.service.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/infrastructure/services/frontend-resolutions.service.ts)
```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IResolutionRepositoryPort } from '@domain/ports/IResolutionRepositoryPort';
import { ResolutionEntity } from '@domain/entities/resolution.entity';
import { ResolutionMapper } from '../mappers/resolution.mapper';

@Injectable({
  providedIn: 'root'
})
export class FrontendResolutionsService {
  private readonly resolutionRepo = inject(IResolutionRepositoryPort);

  /**
   * Envía una resolución de protocolo consolidada estructurada al backend,
   * mapeando y formateando las observaciones en un único campo.
   */
  createResolution(resolution: Partial<ResolutionEntity>): Observable<ResolutionEntity> {
    const payload = ResolutionMapper.toPayload(resolution);
    return this.resolutionRepo.submitResolution(payload).pipe(
      map(res => ResolutionMapper.toDomain(res))
    );
  }

  /**
   * Recupera las resoluciones de un protocolo y parsea el campo único de observaciones
   * a la estructura legible por los componentes visuales de frontend.
   */
  getResolutionByProtocolId(protocolId: string | number): Observable<ResolutionEntity[]> {
    return this.resolutionRepo.getResolutionByProtocolId(String(protocolId)).pipe(
      map(res => {
        const rawList = Array.isArray(res) ? res : [res];
        return rawList.map(item => ResolutionMapper.toDomain(item));
      })
    );
  }
}
```

---

### 4.4 Integración del Timeline Histórico en el Adaptador de Protocolos

#### Modificación Propuesta en [`protocol-api.adapter.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/infrastructure/adapters/protocol-api.adapter.ts) (Líneas 229-239)
```typescript
      versions: (raw.versions || nestedProtocol?.versions || []).map((v: any) => {
        const parsedObs = ResolutionMapper.parseConsolidatedObservations(
          v.observaciones || v.observations || v.majorObservations || ''
        );
        return {
          id: v.id,
          versionNumber: v.versionNumber || v.numeroVersion || v.version || 1,
          status: v.status || v.estado || '',
          statusId: v.statusId || v.estadoId || null,
          resolutionType: v.resolutionType || v.tipoResolucion || null,
          majorObservations: parsedObs.majorObservations,
          minorObservations: parsedObs.minorObservations,
          correctionProcedure: parsedObs.correctionProcedure,
          createdAt: v.createdAt ? new Date(v.createdAt) : null
        };
      })
```

---

## 5. Estrategia de Pruebas Unitarias (Calidad Obligatoria >80%)

Para cumplir con la puerta de calidad del 80% de cobertura, se definen las siguientes especificaciones técnicas con Karma y Jasmine:

### 5.1 Unit Tests para `ResolutionMapper`
- **Caso 1 (Lectura):** Debe deserializar una cadena con formato estructurado del backend en propiedades individuales.
- **Caso 2 (Lectura - Fallback):** Debe asignar una cadena sin formato estructurado completa al campo `majorObservations` y dejar el resto vacío.
- **Caso 3 (Escritura):** Debe concatenar apropiadamente los campos de observaciones y procedimiento cuando el tipo de dictamen es `APROBADO_CON_OBSERVACIONES` (ID: 2).
- **Caso 4 (Escritura):** Debe mapear directamente `observations` o `majorObservations` si el tipo es Aprobado (ID: 1) o Rechazado (ID: 3) respectivamente.

### 5.2 Unit Tests para `FrontendResolutionsService`
- **Caso 1:** Debe inyectar correctamente `IResolutionRepositoryPort` a través de TestBed.
- **Caso 2:** Debe enviar el payload mapeado a `submitResolution` del repositorio y devolver la entidad de dominio parseada.
- **Caso 3:** Debe gestionar errores de red y HTTP propagando el observable de forma segura (400, 401, 403, 404 y el conflicto de concurrencia 409).

---

## 6. Siguientes Pasos Recomendados

1. **Revisión:** Validar que el formato de texto y prefijos de consolidación coincida exactamente con las políticas del backend (el método `parseConsolidatedObservations` propuesto asume los prefijos `"Observaciones Mayores:"`, `"Observaciones Menores:"` y `"Procedimiento:"`).
2. **Ejecución de Cambios:** Escribir los archivos de entidades, mapeadores, servicios y adaptadores propuestos en el repositorio del frontend.
3. **Refactorización de la Página:** Ajustar `ResolutionGeneratorPage` para consumir `FrontendResolutionsService.createResolution()` en lugar de llamar directamente al repositorio de infraestructura.
4. **Ejecutar Pruebas:** Implementar los archivos `.spec.ts` y correr el comando de testeo de Angular (`npm run test` o similar) para validar la cobertura.

---
*Informe elaborado para el plan de calidad de CEISH-ESPOCH.*
