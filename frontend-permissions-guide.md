# Guía Técnica de Integración Frontend: Gestión de Módulos, Permisos y Roles (Angular V20+)

Esta guía técnica detalla la arquitectura, endpoints, contratos de datos y sugerencias de diseño UI/UX para el equipo de frontend. El objetivo es implementar la administración de **Módulos**, **Permisos** y su **Asignación a Roles** dentro de la plataforma **CEISH-ESPOCH**.

---

## 1. Arquitectura de Seguridad y Requisitos Previos

El backend expone endpoints protegidos que siguen estrictas políticas de control de acceso:

1. **Autenticación (JWT):** Todos los endpoints listados aquí requieren la cabecera estándar de autorización:
   ```http
   Authorization: Bearer <ACCESS_TOKEN>
   ```
2. **Autorización Granular (RBAC):** El usuario autenticado debe tener asignado el permiso de sistema **`PERMISOS_GESTIONAR`**. Si el token no cuenta con este permiso, el servidor responderá con:
   - `401 Unauthorized` (si el token expiró o es inválido).
   - `403 Forbidden` (si el usuario está autenticado pero no tiene los privilegios suficientes).
3. **Trazabilidad (Auditoría):** Todas las solicitudes de escritura (`POST`, `PATCH`, `PUT`, `DELETE`) se registran automáticamente en el sistema de auditoría del CEISH con códigos específicos de acción.

---

## 2. Mapa de Endpoints del Backend

Todos los endpoints tienen como prefijo global `/api`.

```mermaid
graph TD
    A[Cliente Angular] -->|JWT + PERMISOS_GESTIONAR| B(Gateway /api)
    B --> C[/auth/modules]
    B --> D[/auth/permissions]
    B --> E[/auth/roles]
    C -->|GET/POST/PATCH/DELETE| F[Gestión de Módulos]
    D -->|GET/POST/PATCH/DELETE| G[Gestión de Permisos]
    E -->|GET/PUT/POST/DELETE| H[Matriz Rol-Permisos]
```

### Resumen Rápido de Rutas

| Categoría | Método | Endpoint | Acción |
| :--- | :--- | :--- | :--- |
| **Módulos** | `GET` | `/api/auth/modules` | Listar todos los módulos |
| **Módulos** | `GET` | `/api/auth/modules/:id` | Obtener detalle de un módulo |
| **Módulos** | `GET` | `/api/auth/modules/:id/permissions` | Obtener permisos vinculados al módulo |
| **Módulos** | `POST` | `/api/auth/modules` | Crear un nuevo módulo |
| **Módulos** | `PATCH` | `/api/auth/modules/:id` | Editar módulo (campos parciales) |
| **Módulos** | `DELETE` | `/api/auth/modules/:id` | Borrado lógico del módulo (Soft-Delete) |
| **Permisos** | `GET` | `/api/auth/permissions` | Listar todos los permisos del sistema |
| **Permisos** | `GET` | `/api/auth/permissions/:id` | Obtener detalle de un permiso |
| **Permisos** | `POST` | `/api/auth/permissions` | Crear un permiso (valida mayúsculas) |
| **Permisos** | `PATCH` | `/api/auth/permissions/:id` | Editar nombre o módulo asociado |
| **Permisos** | `DELETE` | `/api/auth/permissions/:id` | Borrado lógico del permiso (Soft-Delete) |
| **Roles** | `GET` | `/api/auth/roles` | Listar roles con sus permisos y módulos |
| **Roles** | `GET` | `/api/auth/roles/:id` | Obtener un rol por ID con sus permisos |
| **Roles** | `GET` | `/api/auth/roles/:id/permissions` | Listar permisos del rol (simplificado) |
| **Roles** | `POST` | `/api/api/auth/roles/:id/permissions` | **Agregar** nuevos permisos a un rol |
| **Roles** | `PUT` | `/api/auth/roles/:id/permissions` | **Reemplazar** la lista completa de permisos de un rol |
| **Roles** | `DELETE` | `/api/auth/roles/:id/permissions` | **Remover** permisos específicos de un rol |

---

## 3. Contratos de Datos y Esquemas JSON

### A. Gestión de Módulos (`/api/auth/modules`)

Los módulos sirven para estructurar lógicamente los permisos y el menú del sistema.

#### POST `/api/auth/modules` — Crear Módulo
* **Payload (Request):**
  ```json
  {
    "code": "EVALUACIONES",
    "name": "Evaluación Ética",
    "icon": "pi pi-book", 
    "order": 3,
    "isActive": true
  }
  ```
* **Reglas del Backend (ValidationPipe):**
  - `code`: **Obligatorio.** Debe estar en letras mayúsculas y guiones bajos (`/^[A-Z_]+$/`). Ej: `DASHBOARD_ANALYTICS`.
  - `name`: **Obligatorio.** Texto del módulo. Ej: "Dashboard Estadístico".
  - `icon`: **Opcional.** Nombre del icono (ej. PrimeIcons, FontAwesome o Heroicons).
  - `order`: **Opcional.** Número entero que determina el orden de renderizado en el menú lateral.
  - `isActive`: **Opcional.** Booleano. Por defecto `true`.

* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "id": 3,
    "code": "EVALUACIONES",
    "name": "Evaluación Ética",
    "icon": "pi pi-book",
    "order": 3,
    "isActive": true,
    "createdAt": "2026-05-22T08:15:30.000Z",
    "updatedAt": "2026-05-22T08:15:30.000Z",
    "deletedAt": null
  }
  ```

---

### B. Gestión de Permisos (`/api/auth/permissions`)

Los permisos confieren el acceso granular a las acciones del sistema.

#### POST `/api/auth/permissions` — Crear Permiso
* **Payload (Request):**
  ```json
  {
    "code": "EVALUACION_RIESGO",
    "name": "Asignar Nivel de Riesgo del Protocolo",
    "moduleId": 3
  }
  ```
* **Reglas del Backend (ValidationPipe):**
  - `code`: **Obligatorio.** Debe estar en mayúsculas y guiones bajos. Debe ser único.
  - `name`: **Obligatorio.** Nombre amigable para mostrar en pantalla.
  - `moduleId`: **Opcional.** ID numérico del módulo contenedor para agruparlo.

---

### C. Roles y Asignaciones (`/api/auth/roles`)

El endpoint más potente para la integración frontend es el listado y la reasignación en lote de permisos de un rol.

#### GET `/api/auth/roles` — Obtener Roles con Permisos Agrupados
Este endpoint carga todas las relaciones necesarias para renderizar la matriz de control de accesos.

* **Respuesta de Servidor (200 OK):**
  ```json
  [
    {
      "id": 2,
      "code": "SECRETARIA",
      "name": "Secretaría CEISH",
      "createdAt": "2026-05-01T12:00:00.000Z",
      "updatedAt": "2026-05-22T08:20:00.000Z",
      "permissions": [
        {
          "id": 14,
          "code": "RECEPCION_NUEVO",
          "name": "Registrar Recepción de Protocolos",
          "module": {
            "id": 1,
            "code": "RECEPCION",
            "name": "Recepción de Documentación"
          }
        },
        {
          "id": 15,
          "code": "RECEPCION_VALIDAR",
          "name": "Validar Documentos del Protocolo",
          "module": {
            "id": 1,
            "code": "RECEPCION",
            "name": "Recepción de Documentación"
          }
        }
      ]
    }
  ]
  ```

#### PUT `/api/auth/roles/:id/permissions` — Reemplazar todos los permisos del Rol
Este método es ideal para el botón **"Guardar Cambios"** de la pantalla de asignación. Envía exactamente la colección final de IDs de permisos que el rol debe tener.

* **Payload (Request):**
  ```json
  {
    "permissionIds": [14, 15, 22, 29]
  }
  ```
* **Respuesta Exitosa (200 OK):** Retorna el objeto del Rol actualizado con la nueva lista de relaciones.

---

## 4. Guía de Implementación UI/UX en Angular (Recomendado)

Para lograr una interfaz premium, moderna, intuitiva y sumamente interactiva, se proponen los siguientes diseños y componentes basados en las mejores prácticas de Angular v20+ (utilizando **Signals** y **ChangeDetectionOnPush**).

### A. Estructura de la Pantalla de Matriz de Permisos
Recomendamos una pantalla dividida en dos columnas para una navegación ergonómica y rápida:

```
+-----------------------------------------------------------------------------------+
|  Administración de Seguridad / Roles y Permisos                                  |
+------------------------------------+----------------------------------------------+
| Columna Izquierda: Roles           | Columna Derecha: Matriz de Permisos          |
| (Lista interactiva de Roles)        | (Agrupado dinámicamente por Módulos)         |
|                                    |                                              |
| [🔎 Buscar rol...               ]  | [ ] Módulo: Recepción de Documentación       |
|                                    |     [x] Registrar Recepción de Protocolos    |
| * Administrador                    |     [x] Validar Documentos del Protocolo     |
| > Secretaría CEISH                 |     [ ] Generar Constancias                  |
| * Investigador                     |                                              |
| * Miembro del Comité CEISH         | [ ] Módulo: Evaluación Ética                 |
|                                    |     [ ] Asignar Nivel de Riesgo              |
|                                    |     [ ] Registrar Dictamen Pleno             |
|                                    |                                              |
|                                    |               [ Guardar Cambios (PUT) ]      |
+------------------------------------+----------------------------------------------+
```

### B. Código del Componente Angular (Asignación Reactiva)
A continuación, se detalla un ejemplo de servicio y componente optimizado con **Signals** para manejar el estado de selección de forma reactiva y limpia:

#### 1. Servicio Angular (`security.service.ts`)
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Module {
  id: number;
  code: string;
  name: string;
  icon?: string;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  module?: Module;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  permissions: Permission[];
}

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private http = inject(HttpClient);
  private baseUrl = '/api/auth';

  // Signals para almacenamiento global de estado reactivo
  roles = signal<Role[]>([]);
  modules = signal<Module[]>([]);
  permissions = signal<Permission[]>([]);

  async loadAllData() {
    const [rolesData, modulesData, permissionsData] = await Promise.all([
      firstValueFrom(this.http.get<Role[]>(`${this.baseUrl}/roles`)),
      firstValueFrom(this.http.get<Module[]>(`${this.baseUrl}/modules`)),
      firstValueFrom(this.http.get<Permission[]>(`${this.baseUrl}/permissions`))
    ]);

    this.roles.set(rolesData);
    this.modules.set(modulesData);
    this.permissions.set(permissionsData);
  }

  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<Role> {
    const updated = await firstValueFrom(
      this.http.put<Role>(`${this.baseUrl}/roles/${roleId}/permissions`, { permissionIds })
    );
    
    // Actualizar signal localmente
    this.roles.update(current => current.map(r => r.id === roleId ? updated : r));
    return updated;
  }
}
```

#### 2. Componente de Asignación Angular (`role-matrix.component.ts`)
```typescript
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityService, Role, Permission } from './security.service';

@Component({
  selector: 'app-role-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-matrix.component.html',
  styleUrls: ['./role-matrix.component.css']
})
export class RoleMatrixComponent implements OnInit {
  public securityService = inject(SecurityService);

  // Rol seleccionado actualmente
  selectedRoleId = signal<number | null>(null);

  // Signal del mapa de permisos seleccionados temporalmente en la UI (ID -> boolean)
  selectedPermissionsMap = signal<Record<number, boolean>>({});

  // Cómputo del rol actualmente seleccionado
  selectedRole = computed(() => {
    const id = this.selectedRoleId();
    return this.securityService.roles().find(r => r.id === id) || null;
  });

  // Agrupación reactiva de todos los permisos por su módulo asignado
  permissionsByModule = computed(() => {
    const allPermissions = this.securityService.permissions();
    const groups: Record<string, { moduleName: string; permissions: Permission[] }> = {};

    allPermissions.forEach(perm => {
      const moduleName = perm.module?.name || 'Permisos Globales';
      if (!groups[moduleName]) {
        groups[moduleName] = { moduleName, permissions: [] };
      }
      groups[moduleName].permissions.push(perm);
    });

    return Object.values(groups);
  });

  ngOnInit() {
    this.securityService.loadAllData().then(() => {
      // Autoseleccionar primer rol si existe
      const firstRole = this.securityService.roles()[0];
      if (firstRole) {
        this.selectRole(firstRole.id);
      }
    });
  }

  selectRole(roleId: number) {
    this.selectedRoleId.set(roleId);
    const role = this.securityService.roles().find(r => r.id === roleId);
    
    // Mapear los permisos actuales del rol para los checkboxes en la UI
    const permissionMap: Record<number, boolean> = {};
    if (role) {
      role.permissions.forEach(p => {
        permissionMap[p.id] = true;
      });
    }
    this.selectedPermissionsMap.set(permissionMap);
  }

  togglePermission(permissionId: number) {
    this.selectedPermissionsMap.update(current => ({
      ...current,
      [permissionId]: !current[permissionId]
    }));
  }

  // Verifica si todos los permisos de un grupo/módulo están seleccionados
  isModuleFullyChecked(permissions: Permission[]): boolean {
    const map = this.selectedPermissionsMap();
    return permissions.every(p => map[p.id]);
  }

  // Toggle para seleccionar/deseleccionar todos los permisos de un módulo de un click
  toggleModulePermissions(permissions: Permission[], event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedPermissionsMap.update(current => {
      const updated = { ...current };
      permissions.forEach(p => {
        updated[p.id] = isChecked;
      });
      return updated;
    });
  }

  async saveChanges() {
    const roleId = this.selectedRoleId();
    if (!roleId) return;

    const map = this.selectedPermissionsMap();
    const activeIds = Object.keys(map)
      .map(Number)
      .filter(id => map[id]);

    try {
      await this.securityService.updateRolePermissions(roleId, activeIds);
      alert('Permisos actualizados con éxito para el rol.');
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al guardar los permisos.');
    }
  }
}
```

#### 3. Estructura HTML sugerida (`role-matrix.component.html`)
Para un diseño sofisticado, implementa este marcado dinámico:

```html
<div class="grid grid-cols-12 gap-6 p-6 min-h-screen bg-slate-900 text-slate-100 font-sans">
  
  <!-- Columna de Roles (4 de 12 columnas) -->
  <div class="col-span-4 bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
    <h2 class="text-xl font-bold mb-4 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
      Roles del Sistema
    </h2>
    <div class="space-y-2">
      @for (role of securityService.roles(); track role.id) {
        <button 
          (click)="selectRole(role.id)"
          [class.bg-blue-600]="selectedRoleId() === role.id"
          [class.border-blue-400]="selectedRoleId() === role.id"
          [class.bg-slate-750]="selectedRoleId() !== role.id"
          class="w-full text-left p-4 rounded-xl border border-slate-750 hover:border-slate-600 hover:bg-slate-700 transition duration-200 ease-in-out font-semibold shadow-sm flex justify-between items-center">
          <span>{{ role.name }}</span>
          <span class="text-xs px-2.5 py-1 rounded-full bg-slate-900/50 text-slate-300 font-mono">
            {{ role.permissions.length }} perm.
          </span>
        </button>
      }
    </div>
  </div>

  <!-- Columna de Matriz de Permisos (8 de 12 columnas) -->
  <div class="col-span-8 bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col">
    @if (selectedRole(); as role) {
      <div class="flex justify-between items-center border-b border-slate-700 pb-4 mb-6">
        <div>
          <span class="text-xs uppercase tracking-widest text-blue-400 font-bold">Configurando Permisos para</span>
          <h2 class="text-2xl font-extrabold text-white">{{ role.name }}</h2>
        </div>
        <button 
          (click)="saveChanges()"
          class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold tracking-wide shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-150">
          Guardar Cambios
        </button>
      </div>

      <!-- Scrollable Container de Permisos -->
      <div class="flex-grow space-y-6 overflow-y-auto max-h-[70vh] pr-2">
        @for (group of permissionsByModule(); track group.moduleName) {
          <div class="bg-slate-850/50 border border-slate-750 rounded-xl p-4 shadow-sm">
            
            <!-- Encabezado de Módulo con Select All Checkbox -->
            <div class="flex justify-between items-center border-b border-slate-750 pb-3 mb-4">
              <span class="font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <i class="pi pi-folder text-indigo-400"></i> {{ group.moduleName }}
              </span>
              <label class="inline-flex items-center cursor-pointer text-xs text-indigo-300 hover:text-indigo-200 font-semibold gap-2">
                <input 
                  type="checkbox"
                  [checked]="isModuleFullyChecked(group.permissions)"
                  (change)="toggleModulePermissions(group.permissions, $event)"
                  class="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 w-4 h-4 cursor-pointer" />
                Marcar Todos
              </label>
            </div>

            <!-- Grid de Permisos Individuales -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (perm of group.permissions; track perm.id) {
                <label 
                  [class.border-slate-600]="selectedPermissionsMap()[perm.id]"
                  [class.bg-slate-750/30]="selectedPermissionsMap()[perm.id]"
                  class="flex items-start gap-3 p-3 rounded-lg border border-slate-750/50 hover:bg-slate-750/40 hover:border-slate-650 cursor-pointer transition duration-150">
                  <input 
                    type="checkbox"
                    [checked]="selectedPermissionsMap()[perm.id]"
                    (change)="togglePermission(perm.id)"
                    class="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 w-4.5 h-4.5 cursor-pointer" />
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-slate-100 leading-tight">{{ perm.name }}</span>
                    <span class="text-xxs text-slate-400 font-mono mt-1 tracking-wider uppercase">{{ perm.code }}</span>
                  </div>
                </label>
              }
            </div>

          </div>
        }
      </div>
    } @else {
      <div class="flex-grow flex flex-col justify-center items-center text-slate-400 py-12">
        <i class="pi pi-lock text-5xl mb-4 text-slate-500 animate-pulse"></i>
        <p class="font-medium">Seleccione un rol en el panel de la izquierda para comenzar.</p>
      </div>
    }
  </div>

</div>
```

---

## 5. Directiva Estructural `*hasPermission` (Habilitación Dinámica de UI)

Para simplificar la visualización u ocultación dinámica de botones y menús basados en los permisos reales del usuario autenticado, implemente la siguiente directiva estructural en Angular:

```typescript
import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from './auth.service'; // Asumiendo que expone un signal 'userPermissions'

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  private requiredPermission = signal<string | null>(null);
  private hasView = false;

  @Input('appHasPermission') set hasPermission(permission: string) {
    this.requiredPermission.set(permission);
  }

  constructor() {
    // Reacciona automáticamente cada vez que cambien los permisos del usuario o el requerido
    effect(() => {
      const required = this.requiredPermission();
      const userPerms = this.authService.userPermissions() || [];

      const matches = required ? userPerms.includes(required) : true;

      if (matches && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!matches && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }
}
```

### Ejemplo de Uso en Plantillas HTML:
```html
<!-- Solo visible si el usuario tiene el permiso de gestión general -->
<button *appHasPermission="'PERMISOS_GESTIONAR'" (click)="goToSettings()">
  Panel de Configuración de Permisos
</button>

<!-- Solo visible si el usuario puede validar documentos -->
<button *appHasPermission="'RECEPCION_VALIDAR'" class="btn-check">
  Validar Anexo 1
</button>
```

---

## 6. Manejo de Errores y Validaciones Frontend

El frontend debe estar preparado para gestionar los códigos de error estándar emitidos por los interceptores globales del backend:

1. **Error `400 Bad Request`:**
   - Ocurre al violar el validador de `code` (por ejemplo, enviar letras minúsculas o espacios en `code`).
   - **Acción:** Sanitizar la entrada forzando mayúsculas con un filtro o `toUpperCase()` y reemplazando espacios por guiones bajos.
2. **Error `409 Conflict`:**
   - Ocurre al intentar crear un módulo o permiso cuyo `code` ya se encuentra registrado.
   - **Acción:** Mostrar un toast de alerta amigable: *"El código especificado ya existe en el sistema. Elija otro código único"*.
3. **Error `403 Forbidden`:**
   - Ocurre si el token JWT no posee el permiso `PERMISOS_GESTIONAR`.
   - **Acción:** Redireccionar al usuario a una página de `/403-sin-acceso` o al Dashboard principal informándole de la restricción.
