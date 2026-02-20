# SafeHome Backend - Engineering Status

This document is the internal status for the backend implementation in `src/`.

## Current Status

- Base app wired with NestJS, TypeORM, ConfigModule.
- `users` module implemented (entity/service/controller/dto).
- Basic validation enabled via `ValidationPipe`.
- Unit tests and e2e tests are passing.

## Implemented Models

- User (base): `src/modules/user/user.entity.ts`
  - Fields: `id`, `first_name`, `last_name`, `type`, `created_at`, `last_login`.

## Planned Models (Next)

- Parent
- Child
- Admin
- AccessPolicy
- Session
- ActivityLog
- Notification

## Database

- PostgreSQL
- TypeORM
- Current connection is configured via environment variables:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - `TYPEORM_SYNC` for dev-only schema sync

## How To Test

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

## How To Run (Local)

```bash
npm install
cp .env.example .env
npm run start:dev
```

## How To Run (Docker)

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Team Tasks (Next Steps)

1. Decide inheritance strategy for `User` -> `Parent/Child/Admin`.
2. Implement Parent module + migration + tests.
3. Implement Child module + relations + tests.
4. Implement AccessPolicy module + tests.
5. Implement Session module + ActivityLog module + tests.
6. Implement Notification module + tests.
7. Add migrations workflow and disable `synchronize` outside dev.
8. Add Auth (login/JWT) after Parent/Child are stable.

## Notes

- Avoid `npm install --force` and `npm install --legacy-peer-deps`.
