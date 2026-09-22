# Informe de Análisis Técnico y Plan de Acción: Fase 3 - Emisión de Resoluciones

Este informe detalla el análisis de requerimientos, diseño de componentes y la estrategia de implementación para ejecutar la **Fase 3** de la refactorización en el sistema **CEISH-ESPOCH**.

---

## 1. Objetivos de la Fase 3

El objetivo principal es corregir el formulario de emisión de resoluciones, mejorar el manejo de errores/concurrencia y desacoplar la lógica del componente visual siguiendo los principios de responsabilidad única (SRP) y Clean Architecture:

- **Refactorización del Formulario:** Mantener únicamente los dictámenes válidos (1: Aprobación Definitiva, 2: Aprobado con Observaciones, 3: Rechazado), removiendo cualquier residuo de resoluciones obsoletas (como tipo 4).
- **Validación Estricta y Condicional:**
  - **Tipo 1:** Solo requiere `observations`.
  - **Tipo 2:** Requiere obligatoriamente `majorObservations` y `correctionProcedure`. `minorObservations` es opcional.
  - **Tipo 3:** Requiere `majorObservations` (justificación) con un mínimo de 20 caracteres.
- **Desacoplamiento Arquitectónico:**
  - Extraer el formulario a un componente dedicado: `ResolutionFormComponent`.
  - Implementar el caso de uso `CreateResolutionUseCase` para validar las reglas de negocio antes de la persistencia.
  - Implementar `ConflictDialogComponent` para alertar al usuario de forma bloqueante ante respuestas HTTP 409 (concurrencia).
- **Visualización de Errores Claros:** Mostrar mensajes informativos con `<mat-error>` en cada campo inválido.

---

## 2. Diagrama de Flujo del Desacoplamiento (Clean Architecture)

```text
+-------------------------+      (1) Clic Notificar       +---------------------------+
| ResolutionGeneratorPage | <---------------------------- |  ResolutionFormComponent  |
+-------------------------+                               +---------------------------+
             |                                                          ^
             | (2) Llama a                                              | (4) Muestra error
             v                                                          |
+-------------------------+      (3) Valida e invoca      +---------------------------+
| CreateResolutionUseCase | ----------------------------> |  ConflictDialogComponent  |
+-------------------------+                               +---------------------------+
             |
             v
+----------------------------+
| FrontendResolutionsService |
+----------------------------+
             |
             v
+-----------------------+
|  ResolutionApiAdapter |
+-----------------------+
```

---

## 3. Propuesta de Código Completo para la Fase 3

### 3.1 Diálogo Bloqueante de Conflicto de Concurrencia

#### [`conflict-dialog.component.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/shared/components/conflict-dialog/conflict-dialog.component.ts)
```typescript
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConflictDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
}

@Component({
  selector: 'app-conflict-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modern-dialog warn">
      <div class="dialog-header-accent" style="background-color: #f59e0b; height: 4px;"></div>
      
      <div class="dialog-body" style="padding: 24px; text-align: center;">
        <div class="icon-container" style="background-color: #fef3c7; color: #d97706; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <mat-icon class="status-icon" style="font-size: 36px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">sync_problem</mat-icon>
        </div>
        
        <h2 class="dialog-title" style="font-size: 1.4rem; font-weight: 800; color: #1f2937; margin: 0 0 12px;">{{ data?.title || 'Conflicto de Concurrencia' }}</h2>
        <p class="dialog-message" style="font-size: 0.95rem; color: #4b5563; line-height: 1.5; margin: 0;">
          {{ data?.message || 'El expediente de este protocolo ha sido modificado o versionado por otra transacción concurrente. Por favor, recargue la página para ver la información actualizada.' }}
        </p>
      </div>

      <div class="dialog-actions" style="padding: 16px 24px; display: flex; justify-content: center; border-top: 1px solid #f3f4f6;">
        <button mat-flat-button color="warn" class="btn-confirm" (click)="onConfirm()" style="border-radius: 8px; font-weight: 600; padding: 8px 24px;">
          {{ data?.confirmText || 'Recargar Página' }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['../confirm-dialog/confirm-dialog.component.scss']
})
export class ConflictDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConflictDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConflictDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
```

---

### 3.2 Caso de Uso: Emisión de Resolución

#### [`create-resolution.use-case.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/resolutions/application/create-resolution.use-case.ts)
```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { FrontendResolutionsService } from '@infrastructure/services/frontend-resolutions.service';
import { ResolutionEntity } from '@domain/entities/resolution.entity';

@Injectable({
  providedIn: 'root'
})
export class CreateResolutionUseCase {
  private readonly resolutionsService = inject(FrontendResolutionsService);

  /**
   * Ejecuta el caso de uso validando las reglas de negocio en el frontend 
   * antes de enviar la resolución al backend.
   */
  execute(resolution: Partial<ResolutionEntity>): Observable<ResolutionEntity> {
    if (!resolution.protocolId) {
      return throwError(() => new Error('El ID de protocolo es obligatorio.'));
    }

    if (!resolution.resolutionTypeId) {
      return throwError(() => new Error('El tipo de resolución es obligatorio.'));
    }

    const typeId = Number(resolution.resolutionTypeId);

    // Reglas funcionales por tipo
    if (typeId === 1) {
      if (!resolution.observations || resolution.observations.trim() === '') {
        return throwError(() => new Error('Las observaciones del comité son obligatorias para la aprobación definitiva.'));
      }
    } else if (typeId === 2) {
      if (!resolution.majorObservations || resolution.majorObservations.trim() === '') {
        return throwError(() => new Error('Las observaciones mayores son obligatorias para la aprobación condicional.'));
      }
      if (!resolution.correctionProcedure || resolution.correctionProcedure.trim() === '') {
        return throwError(() => new Error('El procedimiento de subsanación es obligatorio para la aprobación condicional.'));
      }
    } else if (typeId === 3) {
      if (!resolution.majorObservations || resolution.majorObservations.trim() === '') {
        return throwError(() => new Error('La justificación del rechazo es obligatoria.'));
      }
      if (resolution.majorObservations.trim().length < 20) {
        return throwError(() => new Error('La justificación del rechazo debe tener al menos 20 caracteres.'));
      }
    } else {
      return throwError(() => new Error('El tipo de resolución no es válido.'));
    }

    return this.resolutionsService.createResolution(resolution);
  }
}
```

---

### 3.3 Componente del Formulario de Resolución Extraído

#### [`resolution-form.component.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/resolutions/presentation/components/resolution-form/resolution-form.component.ts)
```typescript
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProtocolEntity } from '@domain/entities/protocol.entity';

export interface EmitResolutionEvent {
  formValue: any;
  file: File | null;
}

@Component({
  selector: 'app-resolution-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="generator-layout">
      <!-- Columna Izquierda: Vista Previa y Carga de Archivo -->
      <div class="preview-section">
        <div class="content-card shadow-soft p-4">
          <h4 class="preview-title d-flex align-items-center gap-2 mb-3" style="font-weight: 700; color: #1e293b;">
            <mat-icon style="color: #64748b;">visibility</mat-icon>
            Vista Previa y Emisión
          </h4>
          
          <div class="document-preview-placeholder" style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
            <div class="preview-art" style="margin-bottom: 16px;">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #94a3b8;">picture_as_pdf</mat-icon>
            </div>
            <div class="active-preview-info">
              <span class="doc-type" style="display: block; font-weight: 700; font-size: 0.9rem; color: #334155;">Resolución Consolidada Automática</span>
              <span class="doc-target" style="font-size: 0.8rem; color: #64748b;">{{ protocol?.code || ('PRT-' + protocol?.id) }}</span>
            </div>
          </div>

          <!-- Carga del PDF Firmado -->
          <div class="file-upload-zone p-3 text-center" style="border: 1px solid #cbd5e1; border-radius: 12px; background: #fafafa; margin-bottom: 24px;">
            <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: #64748b; margin-bottom: 8px;">upload_file</mat-icon>
            <p class="small text-muted mb-3" *ngIf="!selectedFile()" style="font-size: 0.8rem; font-weight: 500;">Cargue la Carta de Resolución PDF Firmada</p>
            
            <div *ngIf="selectedFile()" class="p-2 mb-3 rounded d-flex align-items-center justify-content-center gap-2" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
              <mat-icon style="color: #10b981; font-size: 18px; width: 18px; height: 18px;">check_circle</mat-icon>
              <span class="small fw-bold" style="font-size: 0.8rem; color: #475569;">{{ selectedFile()?.name }}</span>
            </div>
            
            <button type="button" mat-stroked-button class="btn-sm w-100" (click)="fileInput.click()">
              {{ selectedFile() ? 'Cambiar Archivo PDF' : 'Seleccionar PDF' }}
            </button>
            <input #fileInput type="file" (change)="onFileSelected($event)" accept="application/pdf" style="display: none;" />
          </div>

          <button type="button" mat-flat-button color="primary" class="w-100 py-2" 
                  [disabled]="form.invalid || isSubmitting"
                  (click)="onSubmit()">
            <mat-icon *ngIf="!isSubmitting">draw</mat-icon>
            <span>{{ isSubmitting ? 'Procesando...' : 'Emitir y Notificar' }}</span>
          </button>
        </div>
      </div>

      <!-- Columna Derecha: Configuración del Formulario -->
      <div class="content-card shadow-soft p-4">
        <header class="section-header d-flex align-items-center gap-2 mb-4" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <mat-icon style="color: #64748b;">settings_suggest</mat-icon>
          <h3 style="font-size: 1.1rem; font-weight: 800; margin: 0; color: #1e293b;">Configuración de la Resolución</h3>
        </header>
        
        <form [formGroup]="form">
          <!-- Tipo de Resolución -->
          <div class="mb-4">
            <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Tipo de Dictamen / Resolución</label>
            <mat-form-field appearance="outline" class="w-100">
              <mat-select formControlName="resolutionTypeId">
                <mat-option [value]="1">Aprobación Definitiva</mat-option>
                <mat-option [value]="2">Aprobado con Observaciones</mat-option>
                <mat-option [value]="3">Rechazado / No Aprobado</mat-option>
              </mat-select>
              <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">gavel</mat-icon>
            </mat-form-field>
          </div>

          <!-- Campos de Vigencia y Seguimiento (Ocultar si es Rechazado) -->
          <ng-container *ngIf="form.get('resolutionTypeId')?.value !== 3">
            <div class="mb-3">
              <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Vigencia de la Aprobación (Años)</label>
              <mat-form-field appearance="outline" class="w-100">
                <input matInput type="number" formControlName="validityYears" min="1" (keydown)="preventMinus($event)">
                <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">calendar_today</mat-icon>
                <span matSuffix class="pe-3 text-muted fw-bold">Años</span>
                <mat-error *ngIf="form.get('validityYears')?.hasError('required')">La vigencia es obligatoria.</mat-error>
                <mat-error *ngIf="form.get('validityYears')?.hasError('min')">Debe ser mínimo 1 año.</mat-error>
              </mat-form-field>
            </div>

            <div class="mb-3">
              <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Periodo de Seguimiento (Días)</label>
              <mat-form-field appearance="outline" class="w-100">
                <input matInput type="number" formControlName="followUpPeriodDays" min="1" (keydown)="preventMinus($event)">
                <mat-icon matPrefix style="color: #64748b; margin-right: 8px;">rotate_right</mat-icon>
                <span matSuffix class="pe-3 text-muted fw-bold">Días</span>
                <mat-error *ngIf="form.get('followUpPeriodDays')?.hasError('required')">El periodo de seguimiento es obligatorio.</mat-error>
                <mat-error *ngIf="form.get('followUpPeriodDays')?.hasError('min')">Debe ser mínimo 1 día.</mat-error>
              </mat-form-field>
            </div>
          </ng-container>

          <mat-divider class="my-4"></mat-divider>

          <!-- Dictamen: Aprobado (1) -->
          <div class="field-group mb-2" *ngIf="form.get('resolutionTypeId')?.value === 1">
            <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Observaciones Consolidadas del Comité *</label>
            <mat-form-field appearance="outline" class="w-100">
              <textarea matInput formControlName="observations" rows="5" placeholder="Detalle la fundamentación y observaciones para la aprobación..."></textarea>
              <mat-error *ngIf="form.get('observations')?.hasError('required')">Las observaciones consolidadas son obligatorias.</mat-error>
            </mat-form-field>
          </div>

          <!-- Dictamen: Aprobado con Observaciones (2) -->
          <ng-container *ngIf="form.get('resolutionTypeId')?.value === 2">
            <div class="field-group mb-3">
              <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Observaciones Mayores *</label>
              <mat-form-field appearance="outline" class="w-100">
                <textarea matInput formControlName="majorObservations" rows="4" placeholder="Describa las observaciones metodológicas o éticas mayores..."></textarea>
                <mat-error *ngIf="form.get('majorObservations')?.hasError('required')">Las observaciones mayores son obligatorias.</mat-error>
              </mat-form-field>
            </div>

            <div class="field-group mb-3">
              <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Observaciones Menores (Opcional)</label>
              <mat-form-field appearance="outline" class="w-100">
                <textarea matInput formControlName="minorObservations" rows="3" placeholder="Describa las observaciones menores o sugerencias..."></textarea>
              </mat-form-field>
            </div>

            <div class="field-group mb-2">
              <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Procedimiento de Subsanación *</label>
              <mat-form-field appearance="outline" class="w-100">
                <textarea matInput formControlName="correctionProcedure" rows="3" placeholder="Ej: Subir los anexos correspondientes en la sección de Subsanación..."></textarea>
                <mat-error *ngIf="form.get('correctionProcedure')?.hasError('required')">El procedimiento de subsanación es obligatorio.</mat-error>
              </mat-form-field>
            </div>
          </ng-container>

          <!-- Dictamen: Rechazado (3) -->
          <div class="field-group mb-2" *ngIf="form.get('resolutionTypeId')?.value === 3">
            <label class="field-label" style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Justificación del Rechazo *</label>
            <mat-form-field appearance="outline" class="w-100">
              <textarea matInput formControlName="majorObservations" rows="5" placeholder="Fundamente detalladamente las razones éticas o científicas del rechazo..."></textarea>
              <mat-error *ngIf="form.get('majorObservations')?.hasError('required')">La justificación del rechazo es obligatoria.</mat-error>
              <mat-error *ngIf="form.get('majorObservations')?.hasError('minlength')">La justificación debe tener al menos 20 caracteres.</mat-error>
            </mat-form-field>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ResolutionFormComponent implements OnInit {
  @Input() protocol!: ProtocolEntity | null;
  @Input() isSubmitting = false;
  @Output() onEmit = new EventEmitter<EmitResolutionEvent>();

  selectedFile = signal<File | null>(null);

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      resolutionTypeId: [1, Validators.required],
      validityYears: [1, [Validators.required, Validators.min(1)]],
      followUpPeriodDays: [180, [Validators.required, Validators.min(1)]],
      observations: ['', Validators.required],
      majorObservations: [''],
      minorObservations: [''],
      correctionProcedure: ['']
    });
  }

  ngOnInit() {
    this.form.get('resolutionTypeId')?.valueChanges.subscribe(typeId => {
      this.updateValidators(Number(typeId));
    });
  }

  private updateValidators(typeId: number) {
    const obsCtrl = this.form.get('observations');
    const majorObsCtrl = this.form.get('majorObservations');
    const correctionProcedureCtrl = this.form.get('correctionProcedure');

    obsCtrl?.clearValidators();
    majorObsCtrl?.clearValidators();
    correctionProcedureCtrl?.clearValidators();

    if (typeId === 1) {
      obsCtrl?.setValidators([Validators.required]);
    } else if (typeId === 2) {
      majorObsCtrl?.setValidators([Validators.required]);
      correctionProcedureCtrl?.setValidators([Validators.required]);
    } else if (typeId === 3) {
      majorObsCtrl?.setValidators([Validators.required, Validators.minLength(20)]);
    }

    obsCtrl?.updateValueAndValidity();
    majorObsCtrl?.updateValueAndValidity();
    correctionProcedureCtrl?.updateValueAndValidity();
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  preventMinus(event: KeyboardEvent) {
    if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  resetForm() {
    this.form.reset({
      resolutionTypeId: 1,
      validityYears: 1,
      followUpPeriodDays: 180,
      observations: '',
      majorObservations: '',
      minorObservations: '',
      correctionProcedure: ''
    });
    this.selectedFile.set(null);
    this.updateValidators(1);
  }

  onSubmit() {
    if (this.form.valid) {
      this.onEmit.emit({
        formValue: this.form.value,
        file: this.selectedFile()
      });
    }
  }
}
```

---

### 3.4 Página de Orquestación Actualizada

#### [`resolution-generator.page.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/features/resolutions/presentation/pages/resolution-generator/resolution-generator.page.ts)
```typescript
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, filter, map } from 'rxjs/operators';
import { of } from 'rxjs';

import { IEvaluationRepositoryPort } from '@domain/ports/IEvaluationRepositoryPort';
import { IProtocolRepositoryPort } from '@domain/ports/IProtocolRepositoryPort';
import { ProtocolEntity } from '@domain/entities/protocol.entity';
import { S3StorageService } from '@infrastructure/services/s3-storage.service';
import { CreateResolutionUseCase } from '../../../application/create-resolution.use-case';
import { ResolutionFormComponent, EmitResolutionEvent } from '../../components/resolution-form/resolution-form.component';
import { ConflictDialogComponent } from '@shared/components/conflict-dialog/conflict-dialog.component';

@Component({
  selector: 'app-resolution-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    ResolutionFormComponent
  ],
  template: `
    <div class="dashboard-page animate-fade-in" style="padding: 2.5rem; max-width: 1400px; margin: 0 auto; background-color: #f8fafc; min-height: 100vh;">
      
      <!-- VISTA A: BANDEJA DE PROTOCOLOS EVALUADOS -->
      <ng-container *ngIf="!selectedProtocol()">
        <header class="page-header mb-4" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 2rem;">
          <div class="title-section">
            <div class="breadcrumb-chip" style="background: #f1f5f9; color: #475569; padding: 6px 14px; border-radius: 100px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; display: inline-block; margin-bottom: 0.5rem;">CEISH / Secretaría / Resoluciones</div>
            <h1 class="page-title" style="font-size: 2.25rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.8px;">Bandeja de Resoluciones</h1>
            <p class="page-subtitle" style="font-size: 1.05rem; color: #64748b; margin: 0.25rem 0 0 0; font-weight: 500;">Protocolos con evaluaciones de pares completadas listos para dictamen final</p>
          </div>
        </header>

        <main class="content-card shadow-soft p-4" style="background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
          <div class="table-responsive">
            <table class="w-100 tray-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Título del Protocolo</th>
                  <th>Investigador Principal</th>
                  <th>Fecha de Recepción</th>
                  <th class="text-center">Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of pendingProtocols()">
                  <td class="fw-bold text-primary">{{ p.code || ('PRT-' + p.id) }}</td>
                  <td class="protocol-title-cell" [matTooltip]="p.title">{{ p.title }}</td>
                  <td>{{ p.principalInvestigator || 'No asignado' }}</td>
                  <td>{{ p.submissionDate | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="text-center">
                    <span class="badge-status-evaluado">EVALUADO</span>
                  </td>
                  <td class="text-center">
                    <button mat-flat-button color="primary" class="emit-action-btn" (click)="onSelectProtocol(p)">
                      <mat-icon>gavel</mat-icon>
                      <span>Emitir Dictamen</span>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="pendingProtocols().length === 0">
                  <td colspan="6" class="text-center text-muted py-5">
                    <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; margin-bottom: 8px;">inbox</mat-icon>
                    <p class="m-0 fw-bold">No hay protocolos pendientes de resolución consolidada</p>
                    <p class="small text-muted">Los protocolos aparecerán aquí cuando todos sus evaluadores asignados finalicen sus informes.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </ng-container>
 
      <!-- VISTA B: GENERADOR COMPLETO DE RESOLUCIÓN -->
      <ng-container *ngIf="selectedProtocol()">
        <div class="page-header d-flex align-items-center gap-3 mb-4" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 2rem;">
          <button mat-icon-button class="back-btn" (click)="onClearSelection()" matTooltip="Volver a la bandeja">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-section flex-grow-1">
            <div class="breadcrumb-chip" style="background: #f1f5f9; color: #475569; padding: 6px 14px; border-radius: 100px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; display: inline-block; margin-bottom: 0.5rem;">CEISH / Secretaría / Resoluciones / Emisión</div>
            <h1 class="page-title" style="font-size: 2.25rem; font-weight: 900; color: #0f172a; margin: 0;">Emitir Resolución Consolidada</h1>
            <div class="protocol-title-banner mt-2" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 12px; font-size: 0.92rem; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: #64748b;">menu_book</mat-icon>
              <span>{{ selectedProtocol()?.title }}</span>
            </div>
          </div>
          <span class="protocol-badge ms-3 align-self-start" style="background: #0f172a; color: white; padding: 6px 14px; border-radius: 8px; font-weight: 700;">{{ selectedProtocol()?.code || ('PRT-' + selectedProtocol()?.id) }}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start;">
          <!-- Componente del Formulario Centralizado -->
          <app-resolution-form #resForm 
                               [protocol]="selectedProtocol()" 
                               [isSubmitting]="isSubmitting()" 
                               (onEmit)="onGenerate($event)">
          </app-resolution-form>

          <!-- Barra Lateral Derecha: Insumos de Evaluadores -->
          <aside class="form-section">
            <div class="content-card shadow-soft p-3 insumo-card" style="background: white; border-radius: 16px; border: 1px solid #e2e8f0;" *ngIf="evaluationsList().length > 0">
              <header class="insumo-header mb-2" style="display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <mat-icon class="insumo-icon" style="color: #64748b;">rate_review</mat-icon>
                <h4 class="m-0 insumo-title" style="font-weight: 800; font-size: 0.95rem; color: #1e293b;">Informes de Evaluadores (Insumo)</h4>
              </header>
              <p class="insumo-desc mb-3" style="font-size: 0.78rem; color: #64748b; line-height: 1.4;">Descargue los informes oficiales individuales subidos por cada uno de los evaluadores de la versión activa.</p>
              
              <div class="evaluators-list" style="display: flex; flex-column: column; gap: 12px;">
                <div class="evaluator-item" *ngFor="let ev of evaluationsList()" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                  <div class="evaluator-main" style="display: flex; align-items: center; gap: 8px;">
                    <mat-icon style="color: #475569;">account_circle</mat-icon>
                    <span style="font-size: 0.8rem; font-weight: 700; color: #334155;">Par Evaluador ({{ getProfileLabel(ev.evaluatorProfile?.name || ev.evaluatorProfile) }})</span>
                  </div>
                  <div class="evaluator-actions" style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px;">
                    <span class="action-label" style="font-size: 0.72rem; font-weight: 600; color: #64748b;">Descargar:</span>
                    <div style="display: flex; gap: 4px;">
                      <button type="button" mat-icon-button (click)="downloadEvaluatorPdf(ev.id)" matTooltip="Descargar Reporte PDF" style="width: 32px; height: 32px; line-height: 32px;">
                        <mat-icon style="font-size: 18px; color: #dc2626;">picture_as_pdf</mat-icon>
                      </button>
                      <button type="button" mat-icon-button (click)="downloadEvaluatorDocx(ev.id)" matTooltip="Descargar Word DOCX" style="width: 32px; height: 32px; line-height: 32px;">
                        <mat-icon style="font-size: 18px; color: #2563eb;">description</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </ng-container>
    </div>
  `
})
export class ResolutionGeneratorPage implements OnInit {
  @ViewChild('resForm') resForm!: ResolutionFormComponent;

  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private protocolRepo = inject(IProtocolRepositoryPort);
  private evaluationRepo = inject(IEvaluationRepositoryPort);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private s3StorageService = inject(S3StorageService);
  private createResolutionUseCase = inject(CreateResolutionUseCase);

  isSubmitting = signal(false);

  pendingProtocols = signal<ProtocolEntity[]>([]);
  selectedProtocol = signal<ProtocolEntity | null>(null);
  evaluationsList = signal<any[]>([]);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['protocolId']) {
        const pIdNum = Number(params['protocolId']);
        this.loadSelectedProtocol(String(pIdNum));
      } else {
        this.selectedProtocol.set(null);
        this.loadPendingProtocols();
      }
    });
  }

  loadPendingProtocols() {
    this.protocolRepo.getProtocolsByStatusId(14).subscribe({
      next: (list) => {
        this.pendingProtocols.set(list || []);
      },
      error: () => this.snackBar.open('❌ Error al cargar la bandeja de protocolos evaluados.', 'Cerrar')
    });
  }

  loadSelectedProtocol(id: string) {
    this.protocolRepo.getById(id).subscribe({
      next: (protocol) => {
        this.onSelectProtocol(protocol);
      },
      error: () => this.snackBar.open('❌ Error al cargar el protocolo seleccionado.', 'Cerrar')
    });
  }

  onSelectProtocol(protocol: ProtocolEntity) {
    this.selectedProtocol.set(protocol);
    
    // Cargar informes de evaluación asociados
    this.evaluationRepo.getByProtocolId(protocol.id).subscribe({
      next: (list) => {
        this.evaluationsList.set(list || []);
      },
      error: (err) => {
        console.error('Error al obtener evaluaciones del protocolo:', err);
        this.evaluationsList.set([]);
      }
    });
  }

  onClearSelection() {
    this.selectedProtocol.set(null);
    this.evaluationsList.set([]);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { protocolId: null },
      queryParamsHandling: 'merge'
    });
    this.loadPendingProtocols();
  }

  getProfileLabel(profile: string): string {
    if (!profile) return 'General';
    const profileStr = String(profile).toUpperCase();
    const map: any = {
      'METODOLOGIA': 'Metodológico',
      'BIOETICA': 'de Bioética',
      'LEGAL': 'de Aspectos Jurídicos'
    };
    return map[profileStr] || profile;
  }

  downloadEvaluatorPdf(evaluationId: any) {
    if (!evaluationId) return;
    this.evaluationRepo.getDocumentDownloadUrl(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el PDF.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('❌ No se pudo descargar el PDF de este evaluador.', 'Cerrar', { duration: 3000 })
    });
  }

  downloadEvaluatorDocx(evaluationId: any) {
    if (!evaluationId) return;
    this.evaluationRepo.getDocxDownloadUrl(String(evaluationId)).subscribe({
      next: (res) => {
        if (res && res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        } else {
          this.snackBar.open('❌ No se encontró la URL de descarga para el Word DOCX.', 'Cerrar', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('❌ No se pudo descargar el Word DOCX de este evaluador.', 'Cerrar', { duration: 3000 })
    });
  }

  onGenerate(event: EmitResolutionEvent) {
    const protocol = this.selectedProtocol();
    if (protocol) {
      this.isSubmitting.set(true);
      const formValue = event.formValue;
      const protocolIdNum = Number(protocol.id);

      // 1. Generar la ruta/key para el Acta Consolidada
      const s3Key = `protocols/${protocolIdNum}/resolutions/Carta_Resolucion_Consolidada.pdf`;
      const fileToUpload = event.file || new File([new Blob(['Acta de Resolución'], { type: 'application/pdf' })], 'Carta_Resolucion_Consolidada.pdf', { type: 'application/pdf' });

      // 2. Solicitar URL firmada y realizar la subida a Cloudflare R2
      this.s3StorageService.getUploadUrl(s3Key, 'application/pdf').pipe(
        switchMap(urlRes => this.s3StorageService.uploadFileToS3(urlRes.uploadUrl, fileToUpload).pipe(
          filter(upRes => upRes.success),
          map(() => urlRes.key)
        )),
        switchMap(uploadedKey => {
          const typeId = Number(formValue.resolutionTypeId);
          const resolutionPayload = {
            protocolId: protocolIdNum,
            resolutionTypeId: typeId,
            validityYears: typeId === 3 ? 1 : Number(formValue.validityYears),
            followUpPeriodDays: typeId === 3 ? undefined : Number(formValue.followUpPeriodDays),
            observations: formValue.observations,
            majorObservations: formValue.majorObservations,
            minorObservations: formValue.minorObservations,
            correctionProcedure: formValue.correctionProcedure,
            letterFilePath: uploadedKey
          };

          return this.createResolutionUseCase.execute(resolutionPayload);
        })
      ).subscribe({
        next: (res) => {
          this.snackBar.open('✅ Dictamen emitido y notificado con éxito', 'Cerrar', { duration: 5000 });
          this.resForm.resetForm();
          this.isSubmitting.set(false);
          this.onClearSelection();
        },
        error: (err) => {
          console.error('Error submitting resolution:', err);
          this.isSubmitting.set(false);
          if (err.status === 409) {
            this.showConflictDialog();
          } else {
            this.snackBar.open(`❌ Error al procesar la resolución: ${err.message || 'Error del servidor'}`, 'Cerrar', { duration: 5000 });
          }
        }
      });
    }
  }

  showConflictDialog() {
    const dialogRef = this.dialog.open(ConflictDialogComponent, {
      width: '450px',
      disableClose: true,
      data: {
        title: 'Conflicto de Concurrencia',
        message: 'El expediente de este protocolo ya ha sido modificado, aprobado o subsanado por otra sesión concurrente. Por favor, recargue el listado.',
        confirmText: 'Recargar Bandeja'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.onClearSelection();
    });
  }
}
```

---

## 4. Estrategia de Pruebas Unitarias (Calidad Obligatoria >80%)

Para cumplir con la cobertura mínima del 80%, se proponen las siguientes pruebas utilizando Karma/Jasmine:

### 4.1 Unit Tests para `CreateResolutionUseCase`
- Verificar que arroje error si no se pasa `protocolId` o `resolutionTypeId`.
- Probar que valide correctamente el campo `observations` para dictámenes de tipo 1.
- Probar que requiera `majorObservations` y `correctionProcedure` para dictámenes condicionales de tipo 2.
- Probar que requiera `majorObservations` con al menos 20 caracteres para rechazos de tipo 3.
- Verificar que llame con éxito al servicio si pasa las validaciones de negocio.

### 4.2 Unit Tests para `ResolutionFormComponent`
- Verificar el estado inicial del formulario.
- Probar que los validadores se actualicen dinámicamente según el tipo de resolución seleccionado.
- Confirmar que se muestren mensajes de error visuales coherentes al usuario.
- Verificar que el evento `onEmit` se dispare únicamente si el formulario es válido.

---
*Informe elaborado para el plan de calidad de CEISH-ESPOCH.*
