# Informe de Análisis Técnico y Plan de Acción: Fase 6 - Bandejas de Secretaría y Control Documental

Este informe detalla el análisis de requerimientos, diseño y estrategia de implementación para ejecutar la **Fase 6** de la refactorización (Bandejas de Secretaría y Control Documental) en **CEISH-ESPOCH**.

---

## 1. Objetivos de la Fase 6

El objetivo principal es unificar el diseño visual, los filtros y la consistencia de los datos de protocolos entre la bandeja de entrada (lista) y la ficha de inspección (detalle) de la Secretaría, introduciendo el control de versiones de forma explícita:

1. **Visibilidad de Estados de Control Documental:**
   * La bandeja de entrada y la ficha de detalle deben soportar visualmente el estado `EN_CONTROL_DOCUMENTAL` (Control Documental) de manera nativa, evitando mostrar strings crudos de base de datos.
2. **Visualización de Versión en el Detalle:**
   * La ficha de inspección de secretaría debe mostrar en su encabezado la versión activa del trámite (V1.0, V2.0, etc.) obtenida de la base de datos para diferenciar si se trata de una revisión inicial o una subsanación.
3. **Unificación Estética de Estados (Consistencia):**
   * Migrar los badges de estados específicos a clases de estados genéricas (`pending`, `review`, `approved`, `rejected`) mapeadas mediante las tuberías de Angular (`ProtocolStatusLabelPipe` y `ProtocolStatusClassPipe`), evitando estilos ad-hoc rotos.

---

## 2. Estrategia de Refactorización

### 2.1 Actualización del Detalle de Validación

#### 1. Importación de Pipes en [`protocol-validation-detail.page.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/protocols/presentation/pages/protocol-validation-detail/protocol-validation-detail.page.ts)
Añadiremos `ProtocolStatusLabelPipe` y `ProtocolStatusClassPipe` al bloque de importación y los registraremos en el array de `imports` del componente.

#### 2. Actualización de la Grid del Encabezado
Insertar un nuevo bloque de información para mostrar el número de versión activa:

```html
            <div class="info-item">
              <span class="label">CÓDIGO DE TRÁMITE:</span>
              <div class="d-flex align-items-center justify-content-between gap-2">
                <span class="value code">{{ header()?.ceishCode || 'TRÁMITE EN PROCESO' }}</span>
                <span class="badge-status" [ngClass]="globalStatus()?.status | protocolStatusClass">
                  {{ globalStatus()?.status | protocolStatusLabel }}
                </span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">VERSIÓN ACTIVA:</span>
              <span class="value code" style="color: #003366; font-weight: 800;">V{{ globalStatus()?.version || '1.0' }}</span>
            </div>
```

#### 3. Actualización de Clases CSS en Estilos
Simplificar las clases CSS ad-hoc de `.badge-status` para alinearlas con la salida de `protocolStatusClass`:

```css
    .badge-status { padding: 4px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      &.pending { background: #f1f5f9; color: #475569; }
      &.review { background: #eff6ff; color: #1d4ed8; }
      &.approved { background: #dcfce7; color: #166534; }
      &.rejected { background: #fee2e2; color: #991b1b; }
    }
```

---

### 2.2 Actualización de la Bandeja de Entrada de Validación

En [`protocol-validation-list.page.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/protocols/presentation/pages/protocol-validation-list/protocol-validation-list.page.ts):
- Registrar las tuberías de formateo.
- Cambiar la visualización directa por pipes:
  ```html
  <span class="status-tag" [ngClass]="p.status | protocolStatusClass">
    {{ p.status | protocolStatusLabel }}
  </span>
  ```

---

## 3. Estrategia de Pruebas Unitarias (Calidad Obligatoria)

* **Pruebas de Filtro:**
  * Verificar que `pendingProtocols` filtre correctamente trámites con estado `EN_CONTROL_DOCUMENTAL`.
* **Pruebas de Consistencia:**
  * Probar que el label del badge se resuelva correctamente utilizando `ProtocolUI.label`.
  * Probar que el número de versión activa se renderice adecuadamente en la ficha de detalle.

---
*Informe elaborado para el plan de refactorización de CEISH-ESPOCH.*
