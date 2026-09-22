# Informe de Análisis Técnico y Plan de Acción: Fase 5 - Subsanación V2.0

Este informe detalla el análisis de requerimientos, diseño y estrategia de implementación para ejecutar la **Fase 5** de la refactorización (Subsanación V2.0) en el frontend de **CEISH-ESPOCH**.

---

## 1. Reglas de Negocio y Objetivos de la Fase 5

El objetivo es asegurar que la carga de correcciones en el checklist durante la subsanación sea estricta, previniendo alteraciones accidentales a documentos aprobados, validados, no aplicables o documentos que ya han sido cargados para la versión actual:

1. **Inmutabilidad por Aprobación / Validación:**
   * Cualquier requisito en estado `APROBADO` o `VALIDADO` debe ser inmutable (no debe mostrar botón de "Subir").
2. **Exclusión de No Aplica:**
   * Cualquier requisito en estado `NO_APLICA` no debe permitir carga.
3. **Bloqueo de Documentos Ya Cargados en la Versión Actual:**
   * Un documento que tenga estado `PRESENTADO` y cuente con una URL válida (es decir, ya está en el expediente) debe permanecer bloqueado. Esto previene re-subidas accidentales sobre la misma versión del trámite.
4. **Habilitación de Pendientes/Observados:**
   * Solamente los requisitos en estado `NO_PRESENTADO` (o aquellos que siendo `PRESENTADO` no registren un documento físico en el expediente) deben habilitar la acción de carga.

---

## 2. Estrategia de Refactorización en `subsanacion.page.ts`

### 2.1 Método de Bloqueo de Requisitos
Implementaremos un método utilitario en el componente para unificar la condición de bloqueo:

```typescript
isRequirementLocked(req: ChecklistRequirement): boolean {
  // 1. Estados inmutables por regla general
  if (['APROBADO', 'VALIDADO', 'NO_APLICA'].includes(req.status as any)) {
    return true;
  }
  
  // 2. Si ya está cargado con un documento físico en el expediente, se bloquea
  if (req.status === 'PRESENTADO') {
    const doc = this.getRequirementDocument(req.requirementCode);
    if (doc && doc.id) {
      return true;
    }
  }
  
  return false;
}
```

### 2.2 Re-definición del Contador de Pendientes
El signal reactivo computado `pendingRequirementsCount` pasará a calcularse de la siguiente manera:

```typescript
readonly pendingRequirementsCount = computed(() => {
  return this.checklist().filter(item => {
    // Si no aplica, no es un pendiente de carga
    if (item.status === 'NO_APLICA') return false;
    
    // Si está bloqueado (ya aprobado o cargado), no cuenta como pendiente
    return !this.isRequirementLocked(item);
  }).length;
});
```

---

## 3. Propuesta de Modificación de Plantilla y Código

### 3.1 Plantilla HTML en [`subsanacion.page.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/evaluations/presentation/pages/subsanacion/subsanacion.page.ts)

Reemplazar la celda de acciones de carga por:

```html
                      <td class="text-end" *ngIf="isInvestigador()">
                        <ng-container *ngIf="isRequirementLocked(req); else uploadAction">
                          <mat-icon class="text-success" matTooltip="Documento Inmutable" *ngIf="req.status !== 'NO_APLICA'">check_circle</mat-icon>
                          <mat-icon class="text-muted" matTooltip="Requisito No Aplica para este trámite" *ngIf="req.status === 'NO_APLICA'">remove_circle_outline</mat-icon>
                        </ng-container>
                        
                        <ng-template #uploadAction>
                          <div class="upload-btn-container d-flex align-items-center justify-content-end gap-2">
                            <span class="spinner-border spinner-border-sm text-primary" role="status" *ngIf="uploadingRequirementId() === req.id"></span>
                            <button mat-stroked-button color="primary" class="btn-upload btn-sm" [disabled]="uploadingRequirementId() > 0" (click)="fileInput.click()">
                              <mat-icon>cloud_upload</mat-icon>
                              Subir
                            </button>
                            <input #fileInput type="file" (change)="onUploadFile($event, req.id, req.requirementCode)" accept="application/pdf" style="display: none;" />
                          </div>
                        </ng-template>
                      </td>
```

---

## 4. Estrategia de Pruebas Unitarias (Calidad Obligatoria)

Implementar pruebas unitarias en `subsanacion.page.spec.ts` para verificar la lógica de carga:
1. **Bloqueo:**
   * Probar que `isRequirementLocked()` retorne `true` para `APROBADO`, `VALIDADO` y `NO_APLICA`.
   * Probar que retorne `true` si es `PRESENTADO` y existe un documento en el historial de expediente.
2. **Carga Habilitada:**
   * Probar que retorne `false` si el estado es `NO_PRESENTADO`.
3. **Contador de Pendientes y Envío:**
   * Verificar que `pendingRequirementsCount` sea igual al número de requisitos con estado `NO_PRESENTADO`.
   * Verificar que `isReadyToSubmit` sea `false` si hay requisitos pendientes y pase a `true` únicamente al cargarlos.

---
*Informe elaborado para el plan de refactorización de CEISH-ESPOCH.*
