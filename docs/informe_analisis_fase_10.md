# Informe de Análisis Técnico y Plan de Acción: Fase 10 - Pruebas de integración E2E

Este informe detalla el análisis de requerimientos, diseño y estrategia de implementación para ejecutar la **Fase 10** de la refactorización (Pruebas de integración E2E) en **CEISH-ESPOCH**.

---

## 1. Selección del Framework de E2E

Para las pruebas de integración de extremo a extremo, se ha seleccionado **Cypress** por las siguientes razones técnicas:
1. **Facilidad de Integración:** Se integra directamente con Angular mediante comandos simples de CLI y archivos TypeScript nativos.
2. **Time-Travel Debugging:** Permite inspeccionar el estado de la aplicación en cada paso de la prueba, acelerando el desarrollo de tests en comparación con Playwright.
3. **Manejo Nativo de Esperas:** Espera de forma automática que los elementos del DOM y las peticiones HTTP interceptadas estén listos, eliminando esperas manuales frágiles (`sleep`).

---

## 2. Estrategia de Configuración en el Proyecto

### 2.1 Actualización de `package.json`
Agregaremos los scripts de automatización E2E en [`package.json`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/package.json):
```json
    "e2e": "cypress run",
    "e2e:open": "cypress open"
```
Y añadiremos `"cypress": "^13.12.0"` en el bloque de `devDependencies`.

### 2.2 Archivo de Configuración [`cypress.config.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/cypress.config.ts)
Crearemos el archivo de configuración en la raíz del frontend para apuntar al puerto local:
```typescript
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4200",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts"
  },
});
```

---

## 3. Especificaciones E2E Diseñadas

Para resguardar los flujos principales sin impactar la base de datos real del servidor en etapas de integración pura, implementaremos pruebas de caja negra interceptando la API mediante `cy.intercept`:

### 3.1 Pruebas de Autenticación (`cypress/e2e/login.cy.ts`)
* **Errores:** Verifica que credenciales inválidas muestren alertas.
* **Happy Path:** Valida el login exitoso, almacenamiento de tokens JWT y redirección al `/dashboard`.

### 3.2 Sometimiento de Protocolos (`cypress/e2e/protocol-submission.cy.ts`)
* Simula a un Investigador Principal completando el formulario de creación de estudio y guardándolo como borrador, redirigiendo correctamente al workspace del trámite.

### 3.3 Validación por Secretaría (`cypress/e2e/document-validation.cy.ts`)
* Simula a la Secretaría ingresando a la bandeja de pendientes, abriendo la ficha de inspección de un protocolo específico y cambiando el estado de los requerimientos (`APROBADO` / `RECHAZADO`).

---
*Informe elaborado para el plan de refactorización de CEISH-ESPOCH.*
