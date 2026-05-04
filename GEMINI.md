# CEISH-ESPOCH Backend - Project Context

## Project Overview
The **CEISH-ESPOCH** backend is a robust system built with **NestJS** designed to manage the workflow of the Committee of Ethics in Research on Human Beings (CEISH) at ESPOCH. It handles ethical protocols, documents, evaluations, and follow-ups, ensuring data privacy and integrity.

### Main Technologies
- **Framework:** [NestJS](https://nestjs.com/) (v11+)
- **Language:** TypeScript
- **Persistence:** PostgreSQL with [TypeORM](https://typeorm.io/)
- **Authentication:** Passport.js (JWT & Local strategies)
- **Security:** AES-256-CBC encryption for sensitive data
- **Containerization:** Docker & Docker Compose

### Architecture
The project follows **Clean/Hexagonal Architecture** principles, organized by modules:
- `src/modules/<module-name>/domain`: Core entities and business logic.
- `src/modules/<module-name>/application`: Services, Use Cases, DTOs, and Mappers.
- `src/modules/<module-name>/infrastructure`: Controllers, Database entities (ORM), Repositories, and Adapters.
- `src/shared`: Global filters, guards, interceptors, pipes, and utility services like Encryption and Logging.

---

## Building and Running

### Prerequisites
- Node.js (v20+ recommended)
- Docker & Docker Compose

### Key Commands
- **Install Dependencies:** `npm install`
- **Development Mode:** `npm run start:dev` (runs on port 3002 by default, or 3001 via Docker).
- **Docker Stack:** `docker-compose up` (starts API, PostgreSQL, and pgAdmin).
- **Database Access:**
  - **Host:** `localhost:3100` (mapped from 5432)
  - **pgAdmin:** `http://localhost:5051` (Login: `admin@ceish.com` / `admin123`)

### Testing
- **Unit Tests:** `npm run test`
- **E2E Tests:** `npm run test:e2e`
- **Coverage:** `npm run test:cov`

---

## Development Conventions

### Data Security & Privacy
This project handles sensitive research data. 
- **Encryption:** Use the `EncryptionService` (AES-256-CBC) for fields that require PII protection.
- **Transformers:** Check `src/shared/encryption/encryption.transformer.ts` for automatic encryption/decryption at the database level.
- **Decorators:** Use `@Encrypt()` and `@Audit()` decorators in entities and controllers to handle security and tracking automatically.

### Code Quality
- **Formatting:** Prettier is used for consistent code style. Run `npm run format`.
- **Linting:** ESLint is configured for NestJS standards. Run `npm run lint`.
- **Global Pipes/Filters:**
  - `GlobalValidationPipe`: Enforces class-validator constraints.
  - `HttpExceptionFilter`: Standardizes error responses.
  - `ResponseInterceptor`: Standardizes successful response formats.

### Environment Configuration
- Key variables (DB credentials, JWT secrets, Encryption keys) are managed via `.env` and `src/config/`.
- **Encryption Key:** Must be a 32-byte base64 string. Default provided for development in `EncryptionService`.

---

## Key Modules
- **Auth:** Handles registration, login, JWT issuance, and role-based access control (RBAC).
- **Protocols:** The core entity representing research studies submitted for review.
- **Documents:** Management of files associated with protocols.
- **Evaluations/Follow-up:** Modules for the review process and post-approval monitoring (scaffolding ready).
- **Audit:** Tracks system activities for compliance.
