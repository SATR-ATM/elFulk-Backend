# Future Tasks — Auth

## OAuth Providers (Google / Apple)

`AuthProvider` enum in `Parent` already has `GOOGLE` and `APPLE` values.
To enable OAuth:

1. Add provider config in `src/auth.ts` following [Better Auth docs](https://www.better-auth.com/docs/authentication/oauth)
2. Run `pnpm db:auth:generate` to refresh schema if needed
3. Create a `POST /parents/link` endpoint for OAuth users to create their Parent profile
4. Update request protection if needed

## Production Migration Strategy

Currently auth tables are managed by `TYPEORM_SYNC=true`. In production,
`synchronize` is risky — it can drop columns or data if an entity definition
changes. Options:

- Stay with `synchronize` (convenient but risky)
- Add a proper `db:migrate` script using `typeorm migration:run`
- Use `typeorm migration:generate` to produce migrations from entity changes

## Consider Prisma or Drizzle

If the Better Auth TypeORM adapter's field workflow proves too tedious
(editing `additionalFields` + running generate), consider migrating the
auth layer to Prisma or Drizzle, which handle custom fields more cleanly.
This would only affect the `typeorm/entities/` directory — application
entities would stay on TypeORM unless also migrated.

## Docker: Switch to pnpm & Upgrade Base Image

The Dockerfile currently uses `npm install --legacy-peer-deps` to work
around peer-dep conflicts from Better Auth's browser transitive deps
(e.g. `@babel/core@8.x` from `@tanstack/react-start`). Once the base
image is upgraded to `node:22-alpine`:

1. Switch to `pnpm install --frozen-lockfile` (matches local dev)
2. Drop `--legacy-peer-deps` — pnpm does not auto-install peer deps
3. Pin a specific pnpm version in the Dockerfile for reproducibility

## CI/CD Pipeline

No CI configuration exists yet. When adding one (GitHub Actions, GitLab
CI, etc.):

1. **Lint** — `pnpm lint` (ESLint + Prettier)
2. **Type check** — `pnpm tsc --noEmit`
3. **Unit tests** — `pnpm test`
4. **E2E tests** — requires a PostgreSQL service container;
   run with `pnpm test:e2e`

## CodeRabbit Integration

[CodeRabbit](https://coderabbit.ai) provides automated code review on
pull requests. To enable:
