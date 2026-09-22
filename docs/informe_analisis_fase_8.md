# Informe de Análisis Técnico y Plan de Acción: Fase 8 - Manejo de errores y resiliencia

Este informe detalla el análisis de requerimientos, diseño y estrategia de implementación ejecutada para la **Fase 8** de la refactorización (Manejo de Errores y Resiliencia) en **CEISH-ESPOCH**.

---

## 1. Objetivos de la Fase 8

El objetivo principal es dotar a la aplicación de tolerancia a fallos transitorios de red y caídas del servidor, protegiendo las transacciones críticas del lado del cliente y mejorando la UX:

1. **Reintentos en Llamadas GET fallidas (Retry):**
   * Configurar reintentos automáticos en el cliente HTTP únicamente para llamadas idempotentes (tipo `GET`) cuando fallen por causas transitorias (red ausente, error 503 Service Unavailable, o 504 Gateway Timeout).
2. **Notificación Global Toast (Toasts):**
   * Interceptar errores graves de infraestructura (status 500, 503, 504) o desconexiones (status 0) de forma centralizada y mostrar alertas tipo SnackBar para informar al usuario sin interrumpir su flujo.
3. **Preservación de Estado en Formularios:**
   * Garantizar que ante fallos en peticiones `POST` o `PUT` (ej. al emitir un dictamen), el estado local de los formularios permanezca intacto para permitir un reintento manual sin pérdida de datos.

---

## 2. Estrategia de Refactorización en `ErrorInterceptor`

### 2.1 Mecanismo de Reintento Reactivo (RxJS)
Integramos el operador `retry` en el flujo de intercepción para peticiones `GET`, configurado para hacer hasta 2 reintentos con un retardo de 1 segundo entre ellos:

```typescript
    let next$ = next.handle(request);

    if (request.method === 'GET') {
      next$ = next$.pipe(
        retry({
          count: 2,
          delay: (error, retryCount) => {
            if (error instanceof HttpErrorResponse && [0, 503, 504].includes(error.status)) {
              console.warn(`[ErrorInterceptor] Petición GET fallida. Reintento ${retryCount}/2...`);
              return of(null).pipe(delay(1000));
            }
            throw error;
          }
        })
      );
    }
```

### 2.2 Toasts Globales para Errores de Infraestructura
Utilizamos `MatSnackBar` inyectado dinámicamente mediante `Injector` para evitar referencias circulares durante la inicialización de la app:

```typescript
        if (error instanceof HttpErrorResponse) {
          if (error.status === 500 || error.status === 503 || error.status === 504) {
            this.snackBar.open(
              'El servidor del CEISH está experimentando problemas. Por favor, inténtelo de nuevo más tarde.',
              'Cerrar',
              { duration: 5000 }
            );
          } else if (error.status === 0) {
            this.snackBar.open(
              'Error de conexión. Verifique su red de internet.',
              'Cerrar',
              { duration: 5000 }
            );
          }
        }
```

---

## 3. Pruebas Unitarias Implementadas

En [`error.interceptor.spec.ts`](file:///D:/Frontend-CEISH/ceish-espoch-frontend/src/infrastructure/interceptors/error.interceptor.spec.ts) se validan los siguientes escenarios usando `HttpTestingController`:
1. **Reintentos GET:** Lanza un error 503 y verifica que se realicen exactamente los 2 reintentos configurados con retardo temporal.
2. **No Reintento en POST:** Valida que peticiones mutativas (`POST`) no sean reintentadas ante errores 503 para evitar efectos colaterales.
3. **Despliegue de Toasts:** Verifica que `MatSnackBar.open` sea invocado con los mensajes adecuados ante fallos 500.
4. **Mapeo Concurrente:** Verifica que el error 409 se siga traduciendo a `CONCURRENCY_ERROR` con su respectivo mensaje.

---
*Informe elaborado para el plan de refactorización de CEISH-ESPOCH.*
