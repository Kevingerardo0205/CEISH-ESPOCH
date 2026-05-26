# CEISH-ESPOCH Backend — AGENTS.md

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
- `synchronize: true` in non-prod (`database.config.ts`). **Disable in production.**
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
- Fallback default key in code if `ENCRYPTION_KEY` unset (dev only)

## Sensitive

- `.env` contains live `RESEND_API_KEY`, `ENCRYPTION_KEY`, `JWT_SECRET` — already in `.gitignore`.
- `passwordHash`, `refreshTokenHash` use `select: false` in ORM — explicit `.addSelect()` needed.
- `EncryptionTransformer` uses a singleton `EncryptionService` — must call `setEncryptionService()` during module init.

## Tests

- Unit: `jest` (default config in `package.json`)
- E2E: `jest --config ./test/jest-e2e.json` (single test: `test/app.e2e-spec.ts`)
- Coverage not configured.

## Frontend Integration

- `/protocols/requirements` — protocol submission requirements
- `/reception/protocol/:id` — reception detail
- See `frontend-3fn-validation-guide.md` for full API contracts.

## Notes

- Both `package-lock.json` and `pnpm-lock.yaml` exist. Dockerfile uses `npm install`. Prefer `npm` for scripts.
- `class-validator` + `class-transformer` registered globally as `ValidationPipe` in `main.ts`.
- ORM entities map to snake_case DB columns via `@Column({ name: '...' })`.
- All entities extend `BaseOrmEntity` (provides `id`, `createdAt`, `updatedAt`).
