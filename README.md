# elFulk Backend

A NestJS backend for the elFulk story platform, built for story upload, child content delivery, parent assignments, and cleanup.

## Project Overview

This repository contains the backend implementation for a story platform supporting:

- admin story creation and media upload
- signed media delivery via ImageKit
- age-group filtered child story delivery
- parent assignment workflows
- JWT authentication and role-based access control
- tests for API flows and guards

## Phase Roadmap

### Phase 1 — Foundation (Week 1–2)

- Set up NestJS modules: `StoriesModule`, `MediaModule`, `ImageKitModule`
- Define TypeORM entities: `Story`, `MediaAsset`, `AssignedStory`
- Write and run initial migrations
- Implement `JwtAuthGuard` and `RolesGuard`
- Create `ImageKitService` with `getAuthParameters()` and `getSignedUrl()`
- Add `GET /media/upload-auth`

### Phase 2 — Admin Story Management (Week 2–3)

- `POST /stories` — create draft stories
- `POST /stories/:id/media` — register image asset after direct upload
- `PATCH /stories/:id/publish` — publish stories
- `DELETE /stories/:id` — soft delete with `deleted_at`
- Validate DTOs using `class-validator`
- Add integration tests for upload and story creation flow

### Phase 3 — Child Content Delivery (Week 3–4)

- `GET /stories` — filtered list by `ageGroup`, `complexity`, `gender`, `type`
- `GET /stories/:id` — full story details with signed media URLs
- Apply age-group access rules so children only see matching content

### Phase 4 — Parent Assignment Flow (Week 4–5)

- `POST /assignments` — parent assigns story to child
- `GET /stories/assigned` — child assigned story list
- Filter assigned stories by `storyType = 'parent_choice'`
- Verify parent-child relationship before assignment

### Phase 5 — Optimization & Security Hardening (Week 5–6)

- Add response caching for public story lists
- Add `DELETE /stories/:id/media/:mediaId` to remove media from ImageKit and DB
- Add global rate limiting with `@nestjs/throttler`
- Enable `helmet`, `cors`, and global `ValidationPipe`
- Audit endpoint guards and security policies
- Load test media delivery and story access

### Phase 6 — QA & Launch (Week 6–7)

- Add end-to-end tests for admin upload → child read flows
- Test cross-age-group access and restrictions
- Review signed URL expiry policies
- Document API with Swagger
- Prepare staging and UAT deployment

## Current Features

- JWT authentication and role-based authorization
- Story creation, publishing, soft deletion
- Media registration and signed URL delivery
- Child story filtering by age group and content metadata
- Parent assignment workflows
- Guarded API endpoints for admin/parent/child roles

## Requirements

- Node.js 20+
- npm
- PostgreSQL 16+ or Docker Compose

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Configure `.env` values, including:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `TYPEORM_SYNC`
- `JWT_SECRET`

4. Create the database manually if needed:

```sql
CREATE DATABASE elfulk_backend;
```

5. Run the application:

```bash
npm run start:dev
```

Open `http://localhost:3000`.

## Docker

Run with Docker Compose:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Services:

- `api` — NestJS backend on port `3000`
- `db` — PostgreSQL

## Testing

Run all tests:

```bash
npm test --silent
```

Run e2e flow:

```bash
npm run test:e2e -- test/admin-child-flow.e2e-spec.ts --runInBand
```

Run lint:

```bash
npm run lint
```

## Useful Commands

```bash
npm run start
npm run start:dev
npm run start:prod
npm run lint
npm run format
npm run test
npm run test:e2e
npm run test:cov
```

## Project Structure

```text
src/
├── app.module.ts
├── main.ts
└── modules/
    ├── access-policy/
    ├── admin/
    ├── auth/
    ├── child/
    ├── parent/
    ├── media/
    ├── story/
    ├── imagekit/
    └── user/
```

## Notes

This README reflects the full phase roadmap from foundation through QA and launch, with a focus on story upload, child delivery, parent assignments, and cleanup.
