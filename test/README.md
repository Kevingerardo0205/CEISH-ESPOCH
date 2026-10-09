# Instrucciones de Pruebas con Base de Datos Real (CEISH-ESPOCH)

## 1. Seguridad de Base de Datos
- Las pruebas de integración en `test/real-db-evaluations.e2e-spec.ts` se ejecutan **exclusivamente** contra una base de datos aislada para pruebas.
- **Guard de Seguridad:** La suite verifica en tiempo de ejecución que el nombre de la base de datos termine estrictamente en `test` o `test_db` (por defecto `ceish_test_db`). Si se intenta ejecutar contra `ceish_db` o cualquier base compartida, el test aborta inmediatamente sin realizar modificaciones.

## 2. Creación y Configuración de `ceish_test_db`

Para crear la base de datos de pruebas dentro de PostgreSQL (Docker):

```bash
# 1. Conectarse a PostgreSQL en el puerto 3100
docker exec -it ceish_postgres psql -U ceish_user -d postgres -c "CREATE DATABASE ceish_test_db OWNER ceish_user;"

# 2. Clonar el esquema y catálogo ejecutando las migraciones o clonando el template
npm run migration:run
```

## 3. Variables de Entorno para Pruebas

Se pueden configurar las siguientes variables de entorno para personalizar la conexión:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `TEST_DB_HOST` | `localhost` | Host de PostgreSQL |
| `TEST_DB_PORT` | `3100` | Puerto expuesto en Docker |
| `TEST_DB_USER` | `ceish_user` | Usuario de PostgreSQL |
| `TEST_DB_PASSWORD` | `<tu-clave>` | Contraseña |
| `TEST_DB_NAME` | `ceish_test_db` | Nombre de la base de datos de pruebas |

## 4. Ejecución de las Pruebas

```bash
# Ejecutar todas las pruebas E2E e integración
npm run test:e2e

# Ejecutar únicamente las pruebas con base de datos real
npx jest --config ./test/jest-e2e.json test/real-db-evaluations.e2e-spec.ts --verbose

# Ejecutar con zona horaria específica (UTC o America/Guayaquil)
cmd /c "set TZ=America/Guayaquil && npx jest --config ./test/jest-e2e.json test/real-db-evaluations.e2e-spec.ts --verbose"
cmd /c "set TZ=UTC && npx jest --config ./test/jest-e2e.json test/real-db-evaluations.e2e-spec.ts --verbose"
```
