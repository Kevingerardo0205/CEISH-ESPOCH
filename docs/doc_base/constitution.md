# Constitución del Proyecto CEISH-ESPOCH

Principios innegociables. Toda spec, plan y tarea debe cumplirlos.


1. **Simplicidad del Stack**: NestJS, TypeORM y PostgreSQL nativos. Prohibido agregar dependencias externas sin autorización previa.
2. **Especificación sobre Código**: Todo cambio en el código debe estar respaldado por la especificación activa y `AGENTS.md`.
3. **Arquitectura Hexagonal**: Separación estricta entre `domain` (lógica pura), `application` (casos de uso) e `infrastructure` (controladores/DB).
4. **Política de Pruebas**: Verificación obligatoria ejecutando `npm test`, `npm run test:e2e` y `npm run lint` antes de dar por terminada cualquier tarea.
5. **Persistencia e Integridad**: Cambios en esquemas DB se hacen solo vía migraciones TypeORM. Datos sensibles (PII) deben usar encriptación AES-256-CBC.
6. **Idioma Estándar**: Código, variables, DTOs y comentarios en **Inglés**. Mensajes de error al usuario y documentación de API en **Español**.
