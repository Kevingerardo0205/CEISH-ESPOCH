# CEISH-ESPOCH Backend — AGENTS.md

## Reglas
- Fuente de verdad: `specs/`. `spec.md` manda sobre plan, tasks y código. Flujo: spec.md → plan.md → tasks → código. Lee `docs/doc_base/constitution.md`, la spec activa y la tarea TSK completa (Descripción, Archivos afectados, Tests, "Hecho cuando") antes de tocar código.
- Si el código contradice la spec o la tarea, no improvises: repórtalo y detente.
- Una tarea TSK por cambio. Cita los IDs TSK en el mensaje de commit. Marca la tarea [x] solo cuando sus pruebas pasen.
- Límites: No modificar esquemas de base de datos ni firmas/payloads de endpoints sin consulta previa (cambios solo aditivos y descritos en la tarea). Respetar la arquitectura hexagonal (`domain`, `application`, `infrastructure`). No añadir dependencias o bibliotecas externas sin autorización.

## Anti-duplicación
- Antes de crear cualquier archivo, clase, función, enum, constante o DTO, búscalo con Grep por nombre e intención. Si existe algo equivalente, reutilízalo o extiéndelo.
- Solo se crean archivos nuevos listados en "Archivos afectados" de la tarea con Acción CREAR. Si necesitas otro, detente y repórtalo.
- Plazos solo en `src/shared/deadlines/deadline-rules.ts`; días hábiles solo con `BusinessDayCalculator`; fechas de calendario solo con helpers timezone-safe (America/Guayaquil). Prohibido `toISOString().split('T')[0]` y `.slice(0,10)`.
- Implementa solo en el flujo canónico (MeetingsController/CreateMeetingUseCase; EvaluationsController y sus use cases). No agregues lógica a CallsController, calls.service.ts ni a la ruta legacy `assign-peer-evaluators`.
- Al entregar un PR, lista los archivos NUEVOS (con la tarea que los justifica) y los símbolos exportados NUEVOS con el resultado de buscar similares.

## Git y entrega
- No hagas push, merge ni PR; los hace el usuario. Los PR van contra `dev` con "Create a merge commit".
- Commits sin líneas `Co-Authored-By` ni `Claude-Session`, salvo que el usuario lo pida.
- No leas ni modifiques `.env`; no imprimas secretos. No toques `package*.json`. No publiques artefactos ni generes HTML.
- Todo lo que no ejecutes, márcalo "NO EJECUTADO". No inventes salidas.

## Al terminar cualquier tarea
- Ejecuta y reporta salida real: `npx tsc --noEmit`, `npm test`, `npx jest --config ./test/jest-e2e.json --forceExit --runInBand`.
- Formato y lint SOLO sobre los archivos tocados: `npx prettier --write <archivos>` y `npx eslint <archivos>`. No uses `npm run format` global (fines de línea).

## Estilo
- TypeScript (Node.js 20+), strict type hints en todas las funciones y clases públicas.
- Minimizar dependencias de terceros; preferir bibliotecas nativas y del ecosistema NestJS autorizado (Jest únicamente para tests).
- Identificadores en inglés; mensajes de usuario, errores y respuestas en español.

## Project Context

## Project Overview
The **CEISH-ESPOCH** backend is a robust system built with **NestJS** designed to manage the workflow of the Committee of Ethics in Research on Human Beings (CEISH) at ESPOCH. It handles ethical protocols, documents, evaluations, and follow-ups, ensuring data privacy and integrity.

## Commands

```bash
npm run start:dev     # dev with hot-reload (port ${PORT:-3002})
npm run build         # tsc build
npm test              # Jest unit tests
npm run test:e2e      # jest --config ./test/jest-e2e.json
npm run lint          # eslint + prettier check
npm run format        # prettier --write
npm run migration:generate -- src/modules/<module>/infrastructure/database/<name>
npm run migration:run
npm run migration:revert
```

## Database

- Host port `3100`, container port `5432`. Connect via `localhost:3100` outside Docker.
- `synchronize: false` always (`database.config.ts:13`). Migrations are the only schema management path.
- Schema: `catalogos` (users/auth), 7 more schemas following PET process (see `script.sql`).
- Migrations CLI: `typeorm-ts-node-commonjs -d src/config/typeorm-cli.config.ts` (uses `synchronize: false`).

## Architecture

- **Hexagonal / clean** per module: `domain/` (plain TS entities + abstract port interfaces), `application/` (services + DTOs), `infrastructure/` (ORM entities, controllers, repo implementations, Passport strategies).
- Dependency inversion via `{ provide: IPort, useClass: Impl }` in module providers.
- `src/shared/` — `guards/` (JwtAuthGuard, RolesGuard, PermissionsGuard), `decorators/` (`@Roles`, `@Permissions`, `@Audit`, `@Encrypt`), `encryption/` (AES-256-CBC), `db/` (BaseOrmEntity), `enums/` (Permission).

## Modules

| Module | Scope |
|---|---|
| auth | Users, roles, permissions, JWT auth, email confirm, password recovery |
| protocols | Protocol CRUD and workflow |
| reception | Reception workflow |
| documents | Document management |
| evaluations | Protocol evaluation |
| resolutions | Resolution issuance |
| notifications | Email/push notifications |
| audit | Audit logging |
| adverse-events | Adverse event tracking |
| follow-up | Protocol follow-up |
| reports | Report generation |

## API

- Global prefix: `/api` (set in `main.ts`)
- Swagger docs: `/docs`
- Auth endpoint prefix: `/auth`
- JWT expiry: 15m access token, refresh token rotation
- Rate limit: 3 req/15min on password endpoints (ThrottlerGuard)
- Guard chain: `JwtAuthGuard → RolesGuard → PermissionsGuard`

## Encryption

- Algorithm: `aes-256-cbc`, key from `ENCRYPTION_KEY` env var (32-byte base64)
- `EncryptionTransformer` for transparent TypeORM column encryption (sensitive PII columns)
- No fallback key — `ENCRYPTION_KEY` is required at startup; throws if absent or if decoded key ≠ 32 bytes (`encryption.service.ts:11,14-19`).

## Sensitive

- `.env` contains live `RESEND_API_KEY`, `ENCRYPTION_KEY`, `JWT_SECRET` — already in `.gitignore`.
- `passwordHash`, `refreshTokenHash` use `select: false` in ORM — explicit `.addSelect()` needed.
- `EncryptionTransformer` uses a singleton `EncryptionService` — must call `setEncryptionService()` during module init.

## Tests

- Unit: `jest` (default config in `package.json`)
- E2E: `jest --config ./test/jest-e2e.json` — 7 suites in `test/` (app, evaluations-assignment, evaluations-contract, meetings, meetings-concurrency, peer-risk-concurrency, real-db-evaluations).
- `coverageDirectory: ../coverage` configured in jest; `collectCoverage` not enabled — run with `--coverage` flag to generate.

## Frontend Integration

- `/protocols/requirements` — protocol submission requirements
- `/reception/protocol/:id` — reception detail
- See `frontend-3fn-validation-guide.md` for full API contracts.

## Notes

- Both `package-lock.json` and `pnpm-lock.yaml` exist. Dockerfile uses `npm install`. Prefer `npm` for scripts.
- `class-validator` + `class-transformer` registered globally as `ValidationPipe` in `main.ts`.
- ORM entities map to snake_case DB columns via `@Column({ name: '...' })`.
- All entities extend `BaseOrmEntity` (provides `id`, `createdAt`, `updatedAt`).
