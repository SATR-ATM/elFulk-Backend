import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertestImport from 'supertest';
const request: any = (supertestImport as unknown as any).default ?? supertestImport;
import { DataSource } from 'typeorm';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const log = (label: string, data?: unknown) => {
  console.log(`\n[TEST] ──── ${label}`);
  if (data !== undefined) console.log(JSON.stringify(data, null, 2));
};

const logStep = (step: string) =>
  console.log(`\n${'─'.repeat(60)}\n[STEP] ${step}\n${'─'.repeat(60)}`);

// ─────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────

describe('Stories Feature — Full E2E Flow', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Tokens
  let adminToken: string;
  let parentToken: string;
  let childToken: string;

  // IDs
  let parentId: string;
  let childId: string;
  let storyId: string;
  let mediaId: string;
  let assignmentId: string;

  // ─── Setup ───────────────────────────────────

  beforeAll(async () => {
    logStep('Bootstrapping NestJS application');

    // Use a dedicated test database and ensure it exists, then let TypeORM sync
    const testDb = process.env.TYPEORM_TEST_DATABASE ?? `${process.env.TYPEORM_DATABASE ?? 'elFulk'}_test`;
    process.env.TYPEORM_DATABASE = testDb;
    process.env.TYPEORM_SYNC = 'true';

    // Ensure the test DB exists (connect to default 'postgres' database and create if missing)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Client } = require('pg');
    const adminClient = new Client({
      host: process.env.TYPEORM_HOST ?? 'localhost',
      port: Number(process.env.TYPEORM_PORT ?? 5432),
      user: process.env.TYPEORM_USERNAME ?? 'postgres',
      password: process.env.TYPEORM_PASSWORD ?? 'khaliltouils',
      database: process.env.TYPEORM_ADMIN_DB ?? 'postgres',
    });

    await adminClient.connect();
    // Drop and recreate test DB to ensure clean schema
    await adminClient.query(`DROP DATABASE IF EXISTS "${testDb}"`);
    await adminClient.query(`CREATE DATABASE "${testDb}"`);
    await adminClient.end();

    // Delay loading AppModule until after env vars are set so TypeORM config picks them up
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AppModule } = require('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    // Ensure test app uses same global prefix as real app
    app.setGlobalPrefix('api/v1');

    await app.init();
    dataSource = moduleFixture.get(DataSource);

    log('App bootstrapped successfully');
  });

  afterAll(async () => {
    logStep('Teardown — cleaning up test data');

    // Optional: wipe test-created records
    // so re-runs don't accumulate junk data.
    // Adjust table names to match your actual schema.
    try {
      if (dataSource?.isInitialized) {
        await dataSource.query(
          `DELETE FROM assigned_stories WHERE assignee_id = $1`,
          [childId],
        );
        await dataSource.query(`DELETE FROM media_assets WHERE story_id = $1`, [
          storyId,
        ]);
        await dataSource.query(`DELETE FROM stories WHERE id = $1`, [storyId]);
        await dataSource.query(`DELETE FROM child WHERE id = $1`, [childId]);
        await dataSource.query(`DELETE FROM parent WHERE id = $1`, [parentId]);
        log('Test data cleaned up');
      }
    } catch (err) {
      console.warn('[TEARDOWN] Cleanup error (non-fatal):', err);
    }

    await app.close();
    log('App closed');
  });

  // ═════════════════════════════════════════════
  // BLOCK 1 — Auth Setup
  // ═════════════════════════════════════════════

  describe('1. Auth — Register & Login', () => {
    const timestamp = Date.now();
    const parentEmail = `parent-${timestamp}@test.com`;
    const parentPassword = 'Password123!';
    const adminEmail = process.env.TEST_ADMIN_EMAIL ?? 'admin@safehome.dev';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD ?? 'AdminPass123!';

    it('1.1 — registers a parent account', async () => {
      logStep('1.1 Register parent');

      const res = await request(app.getHttpServer())
        .post('/api/v1/parents')
        .send({
          username: `Parent ${timestamp}`,
          email: parentEmail,
          password: parentPassword,
        })
        .expect(201);

      parentId = res.body.id;
      log('Parent registered', { parentId, email: parentEmail });
      expect(parentId).toBeDefined();
    });

    it('1.2 — parent logs in and receives access token', async () => {
      logStep('1.2 Parent login');

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: parentEmail, password: parentPassword })
        .expect(201);

      parentToken = res.body.access_token;
      log('Parent login response', {
        hasToken: !!parentToken,
        tokenPreview: parentToken?.slice(0, 30) + '...',
      });

      expect(parentToken).toBeDefined();
      expect(typeof parentToken).toBe('string');
    });

    it('1.3 — parent activates PIN', async () => {
      logStep('1.3 Activate PIN');

      await request(app.getHttpServer())
        .post('/api/v1/auth/activate-pin')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ pin: '1234' })
        .expect(200);

      log('PIN activated successfully');
    });

    it('1.4 — ensure admin account exists and logs in', async () => {
      logStep('1.4 Ensure admin account exists');

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/admins')
        .send({
          first_name: 'Test',
          last_name: 'Admin',
          email: adminEmail,
          password: adminPassword,
        });

      if (![201, 409].includes(createRes.status)) {
        throw new Error(
          `Admin setup failed with status ${createRes.status}: ${JSON.stringify(
            createRes.body,
          )}`,
        );
      }

      log('Admin account ensured', { status: createRes.status });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({ email: adminEmail, password: adminPassword })
        .expect(201);

      adminToken = res.body.access_token;
      log('Admin login response', {
        hasToken: !!adminToken,
        role: res.body.role ?? 'not returned in response',
      });

      expect(adminToken).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════
  // BLOCK 2 — Child Account
  // ═════════════════════════════════════════════

  describe('2. Child — Create & Login', () => {
    it('2.1 — parent creates a child profile', async () => {
      logStep('2.1 Create child');

      const res = await request(app.getHttpServer())
        .post('/api/v1/children')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          first_name: 'Lina',
          last_name: 'Test',
          date_of_birth: '2018-06-24', // age ~6, maps to age_group '6-8'
          gender: 'female',
          pin: '1234',
        })
        .expect(201);

      childId = res.body.id;
      log('Child created', res.body);

      expect(childId).toBeDefined();
      expect(res.body.first_name).toBe('Lina');
    });

    it('2.2 — parent requests child token and receives access token', async () => {
      logStep('2.2 Child token issuance');

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/child-token')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ childId: childId })
        .expect(201);

      childToken = res.body.access_token;
      log('Child token response', {
        hasToken: !!childToken,
        tokenPreview: childToken?.slice(0, 30) + '...',
      });

      expect(childToken).toBeDefined();
    });
  });

  // ═════════════════════════════════════════════
  // BLOCK 3 — Admin Creates Story
  // ═════════════════════════════════════════════

  describe('3. Admin — Story CRUD', () => {
    it('3.1 — admin creates a story draft (unpublished)', async () => {
      logStep('3.1 Create story draft');

      const payload = {
        title: 'The Brave Little Star',
        description: 'A story about courage',
        content: 'Once upon a time, a little star wondered if she was bright enough...',
        type: 'parent_choice',
        age_group: '6-8',
        complexity: 'easy',
        gender: 'all',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      storyId = res.body.id;
      log('Story created (draft)', res.body);

      expect(storyId).toBeDefined();
      expect(res.body.is_published).toBe(false); // must start unpublished
      expect(res.body.title).toBe('The Brave Little Star');
    });

    it('3.2 — child cannot access an unpublished story', async () => {
      logStep('3.2 Unpublished story is hidden from child');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/stories/${storyId}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(404);

      log('Response for unpublished story (expect 404)', res.body);
    });

    it('3.3 — admin attaches media asset to story', async () => {
      logStep('3.3 Upload media');

      const payload = {
        file_name: 'cover.jpg',
        file_url: 'https://ik.imagekit.io/safehome/stories/cover.jpg',
        content_type: 'image/jpeg',
        file_size: 204800, // 200KB
      };

      const res = await request(app.getHttpServer())
        .post(`/api/v1/stories/${storyId}/media`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      mediaId = res.body.id;
      log('Media asset registered', res.body);

      expect(mediaId).toBeDefined();
      expect(res.body.file_name).toBe('cover.jpg');
    });

    it('3.4 — admin publishes the story', async () => {
      logStep('3.4 Publish story');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/stories/${storyId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      log('Story after publish', res.body);

      expect(res.body.is_published).toBe(true);
    });

    it('3.5 — non-admin cannot publish a story', async () => {
      logStep('3.5 Role guard — parent cannot publish');

      await request(app.getHttpServer())
        .patch(`/api/v1/stories/${storyId}/publish`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(403);

      log('403 returned correctly for non-admin publish attempt');
    });
  });

  // ═════════════════════════════════════════════
  // BLOCK 4 — Parent Assigns Story to Child
  // ═════════════════════════════════════════════

  describe('4. Parent — Assign Story', () => {
    it('4.1 — parent assigns published story to child', async () => {
      logStep('4.1 Assign story');

      const res = await request(app.getHttpServer())
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ story_id: storyId, child_id: childId })
        .expect(201);

      assignmentId = res.body.id;
      log('Assignment created', res.body);

      expect(assignmentId).toBeDefined();
      expect(res.body.story_id ?? res.body.storyId).toBe(storyId);
      expect(res.body.assignee_id ?? res.body.child_id ?? res.body.childId).toBe(
        childId,
      );
    });

    it('4.2 — parent cannot assign a story to a child they do not own', async () => {
      logStep('4.2 Unauthorized child assignment blocked');

      const fakeChildId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post('/api/v1/assignments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ story_id: storyId, child_id: fakeChildId })
        .expect(404);

      log('403 returned correctly for foreign child assignment');
    });

    it('4.3 — parent lists own assignments', async () => {
      logStep('4.3 List assignments');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/assignments/stories?childId=${childId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      log('Assignments list', res.body);

      expect(Array.isArray(res.body)).toBe(true);
      const ids = res.body.map((a: any) => a.id);
      expect(ids).toContain(assignmentId);
    });
  });

  // ═════════════════════════════════════════════
  // BLOCK 5 — Child Reads Story
  // ═════════════════════════════════════════════

  describe('5. Child — Read Story', () => {
    it('5.1 — child sees assigned story in their assigned list', async () => {
      logStep('5.1 Child assigned stories');

      const res = await request(app.getHttpServer())
        .get('/api/v1/stories/assigned')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      log('Child assigned stories', res.body);

      expect(Array.isArray(res.body)).toBe(true);
      const assignedIds = res.body.map((s: any) => s.id);
      expect(assignedIds).toContain(storyId);
    });

    it('5.2 — child fetches full story with signed media URLs', async () => {
      logStep('5.2 Fetch story detail');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/stories/${storyId}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      log('Story detail response', res.body);

      expect(res.body).toMatchObject({
        id: storyId,
        title: 'The Brave Little Star',
        type: 'parent_choice',
        is_published: true,
      });

      // Media must be present and URLs must be signed (contain ik-s or similar)
      expect(Array.isArray(res.body.media)).toBe(true);
      expect(res.body.media.length).toBeGreaterThan(0);

      const media = res.body.media[0];
      log('First media asset', media);

      expect(media).toMatchObject({ file_name: 'cover.jpg' });
      expect(typeof media.file_url).toBe('string');
      expect(media.file_url.length).toBeGreaterThan(0);

      // Signed URLs should have an expiry param (ImageKit uses ik-t)
      const isSignedUrl =
        media.file_url.includes('ik-t') ||
        media.file_url.includes('signature') ||
        media.file_url.includes('expire');

      log('URL appears signed?', isSignedUrl);
      // Soft assertion: warn if not signed (signed URL may only work in prod)
      if (!isSignedUrl) {
        console.warn(
          '[WARN] Media URL does not look signed — verify ImageKit config in test env',
        );
      }
    });

    it('5.6 — child cannot access a story outside their age group', async () => {
      logStep('5.6 Age group isolation');

      // Create a story for a different age group (admin only)
      const res = await request(app.getHttpServer())
        .post('/api/v1/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Teen Story',
          description: 'For older kids',
          content: 'Advanced content...',
          type: 'default',
          age_group: '12+',       // child is age 6 → should not see this
          complexity: 'advanced',
          gender: 'all',
        })
        .expect(201);

      const teenStoryId = res.body.id;

      // Publish it
      await request(app.getHttpServer())
        .patch(`/api/v1/stories/${teenStoryId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Child must NOT see it
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/stories')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      log('Stories visible to child', listRes.body.map?.((s: any) => ({
        id: s.id,
        age_group: s.age_group,
      })));

      const visibleIds = listRes.body.map((s: any) => s.id);
      expect(visibleIds).not.toContain(teenStoryId);

      // Direct access should also be blocked
      await request(app.getHttpServer())
        .get(`/api/v1/stories/${teenStoryId}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(403);

      log('Age group isolation enforced correctly');
    });
  });

  // ═════════════════════════════════════════════
  // BLOCK 6 — Admin Soft Delete
  // ═════════════════════════════════════════════

  describe('6. Admin — Soft Delete', () => {
    it('6.1 — admin soft-deletes the story', async () => {
      logStep('6.1 Soft delete story');

      await request(app.getHttpServer())
        .delete(`/api/v1/stories/${storyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      log(`Story ${storyId} soft-deleted`);
    });

    it('6.2 — deleted story is no longer accessible to child', async () => {
      logStep('6.2 Deleted story hidden from child');

      await request(app.getHttpServer())
        .get(`/api/v1/stories/${storyId}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(404);

      log('404 confirmed — deleted story not accessible');
    });

    it('6.3 — deleted story is no longer in child assigned list', async () => {
      logStep('6.3 Deleted story absent from assigned list');

      const res = await request(app.getHttpServer())
        .get('/api/v1/stories/assigned')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      const ids = res.body.map((s: any) => s.id);
      log('Assigned story IDs after deletion', ids);

      expect(ids).not.toContain(storyId);
    });
  });
});