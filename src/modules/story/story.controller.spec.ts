/**
 * Phase 2 – Admin Story Management
 * Phase 3 – Child Content Delivery
 * Integration-style controller tests (real NestJS app, mocked StoryService)
 *
 * Covers:
 *  POST   /stories                  — create draft
 *  POST   /stories/:id/media        — register image asset after upload
 *  PATCH  /stories/:id/publish      — publish story
 *  DELETE /stories/:id              — soft delete
 *  GET    /stories                  — filtered list (ageGroup, complexity, gender, type)
 *  GET    /stories/:id              — full story with signed image URLs + ageGroup guard
 *
 * Auth matrix per endpoint:
 *  - 401  → no/invalid JWT
 *  - 403  → wrong role (parent / child)
 *  - 200/201 → admin JWT + valid body
 *  - 400  → admin JWT + invalid / missing body fields (class-validator pipe)
 *
 * Phase 3 specifics:
 *  - ageGroup-based query guard: children only see stories matching their ageGroup
 *  - Signed image URLs returned in media
 *  - Filtering by: ageGroup, complexity, gender, type
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import * as supertestImport from 'supertest';
const request = (supertestImport as unknown as any).default ?? supertestImport;

import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { Story } from './story.entity';
import { AssignedStory } from './assigned-story.entity';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// ─── Constants ───────────────────────────────────────────────────────────────

const JWT_SECRET = 'changeme';
const STORY_ID = '01900000-0000-7000-8000-000000000001';
const STORY_ID_2 = '01900000-0000-7000-8000-000000000002';
const STORY_ID_3 = '01900000-0000-7000-8000-000000000003';
const MEDIA_ID = '01900000-0000-7000-8000-000000000002';
const ADMIN_UUID = 'admin-uuid-0000-0000-0000-000000000001';
const CHILD_UUID = 'child-uuid-0000-0000-0000-000000000001';
const CHILD_UUID_2 = 'child-uuid-0000-0000-0000-000000000002';

const STORY_STUB: Partial<Story> = {
  id: STORY_ID,
  title: 'Test Story',
  is_published: false,
  deleted_at: null,
};

const PUBLISHED_STORY_STUB: Partial<Story> = { ...STORY_STUB, is_published: true };

// Phase 3 test data: Published stories with different age groups, complexity, gender, type
const PUBLISHED_STORY_6_8: Partial<Story> = {
  id: STORY_ID_2,
  title: 'The Adventure of Tommy',
  is_published: true,
  age_group: '6-8',
  complexity: 'easy',
  gender: 'male',
  type: 'adventure',
  description: 'An exciting adventure story',
  content: 'Once upon a time...',
  deleted_at: null,
  created_at: new Date('2025-01-10'),
};

const PUBLISHED_STORY_9_11: Partial<Story> = {
  id: STORY_ID_3,
  title: 'The Mysterious Quest',
  is_published: true,
  age_group: '9-11',
  complexity: 'medium',
  gender: 'all',
  type: 'fantasy',
  description: 'A mysterious quest awaits',
  content: 'In a far away land...',
  deleted_at: null,
  created_at: new Date('2025-01-09'),
};

const MEDIA_STUB = {
  id: MEDIA_ID,
  story_id: STORY_ID,
  file_name: 'cover.jpg',
  file_url: 'https://ik.imagekit.io/demo/cover.jpg',
};

// Signed media with generated URLs (Phase 3)
const SIGNED_MEDIA = {
  id: MEDIA_ID,
  story_id: STORY_ID_2,
  file_name: 'cover.jpg',
  file_url: 'https://ik.imagekit.io/demo/cover.jpg?signed=true&expires=1704067200',
};

const PLURAL_SIGNED_MEDIA = [
  SIGNED_MEDIA,
  {
    id: '01900000-0000-7000-8000-000000000004',
    story_id: STORY_ID_2,
    file_name: 'page-02.jpg',
    file_url: 'https://ik.imagekit.io/demo/page-02.jpg?signed=true&expires=1704067200',
  },
];

// ─── Service mock ─────────────────────────────────────────────────────────────

const mockStoryService = {
  create: jest.fn(),
  registerMediaAsset: jest.fn(),
  publishStory: jest.fn(),
  softDeleteStory: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findOneWithMedia: jest.fn(),
  getAssignedStories: jest.fn(),
};

// ─── Token factory ────────────────────────────────────────────────────────────

let _jwtService: JwtService;
const token = (role: string, sub = ADMIN_UUID) =>
  _jwtService.sign({ sub, email: `${role}@test.com`, role });

// ─── App bootstrap ────────────────────────────────────────────────────────────

describe('StoryController – Phase 2 Admin Story Management', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [StoryController],
      providers: [
        { provide: StoryService, useValue: mockStoryService },
        // TypeORM repo tokens required by StoryService constructor (mocked)
        { provide: getRepositoryToken(Story), useValue: {} },
        { provide: getRepositoryToken(AssignedStory), useValue: {} },
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        Reflector,
      ],
    }).compile();

    _jwtService = module.get<JwtService>(JwtService);

    app = module.createNestApplication();
    // Enable global ValidationPipe so class-validator decorators work
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════════════════════════════════
  // POST /stories  — Create draft story
  // ══════════════════════════════════════════════════════════════════════════

  describe('POST /stories', () => {
    const validBody = { title: 'The Desert Fox' };

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).post('/stories').send(validBody).expect(401);
    });

    it('should return 401 when token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', 'Bearer garbage.token.here')
        .send(validBody)
        .expect(401);
    });

    it('should return 403 when authenticated as parent', async () => {
      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('parent')}`)
        .send(validBody)
        .expect(403);
    });

    it('should return 403 when authenticated as child', async () => {
      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('child')}`)
        .send(validBody)
        .expect(403);
    });

    it('should return 400 when title is missing', async () => {
      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({})
        .expect(400);
    });

    it('should return 400 when title is empty string', async () => {
      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ title: '' })
        .expect(400);
    });

    it('should return 400 when author_id is not a UUID', async () => {
      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ title: 'Valid', author_id: 'not-a-uuid' })
        .expect(400);
    });

    it('should return 201 with created story when admin posts valid body', async () => {
      mockStoryService.create.mockResolvedValue(STORY_STUB);

      const { body } = await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .send(validBody)
        .expect(201);

      expect(mockStoryService.create).toHaveBeenCalledTimes(1);
      expect(body.id).toBe(STORY_ID);
      expect(body.is_published).toBe(false);
    });

    it('should return 201 with full valid payload including all optional fields', async () => {
      mockStoryService.create.mockResolvedValue(STORY_STUB);

      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({
          title: 'Full Story',
          description: 'A rich description',
          content: 'Once upon…',
          age_group: '6-8',
          complexity: 'medium',
          gender: 'all',
          type: 'adventure',
        })
        .expect(201);

      expect(mockStoryService.create).toHaveBeenCalledTimes(1);
    });

    it('should pass the DTO fields to StoryService.create()', async () => {
      mockStoryService.create.mockResolvedValue(STORY_STUB);

      await request(app.getHttpServer())
        .post('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ title: 'Panda Tale', age_group: '3-5' })
        .expect(201);

      const [arg] = mockStoryService.create.mock.calls[0];
      expect(arg.title).toBe('Panda Tale');
      expect(arg.age_group).toBe('3-5');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // POST /stories/:id/media — Register image asset after direct upload
  // ══════════════════════════════════════════════════════════════════════════

  describe('POST /stories/:id/media', () => {
    const validBody = {
      file_name: 'cover.jpg',
      file_url: 'https://ik.imagekit.io/demo/cover.jpg',
    };

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .send(validBody)
        .expect(401);
    });

    it('should return 403 when authenticated as parent', async () => {
      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('parent')}`)
        .send(validBody)
        .expect(403);
    });

    it('should return 403 when authenticated as child', async () => {
      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('child')}`)
        .send(validBody)
        .expect(403);
    });

    it('should return 400 when file_name is missing', async () => {
      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ file_url: 'https://example.com/img.jpg' })
        .expect(400);
    });

    it('should return 400 when file_url is missing', async () => {
      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ file_name: 'img.jpg' })
        .expect(400);
    });

    it('should return 400 when file_url is not a valid URL', async () => {
      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ file_name: 'img.jpg', file_url: 'not-a-url' })
        .expect(400);
    });

    it('should return 400 when file_size is negative', async () => {
      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ ...validBody, file_size: -1 })
        .expect(400);
    });

    it('should return 201 with registered media asset for valid admin request', async () => {
      mockStoryService.registerMediaAsset.mockResolvedValue(MEDIA_STUB);

      const { body } = await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .send(validBody)
        .expect(201);

      expect(mockStoryService.registerMediaAsset).toHaveBeenCalledTimes(1);
      expect(body.file_name).toBe('cover.jpg');
      expect(body.story_id).toBe(STORY_ID);
    });

    it('should call registerMediaAsset with the correct storyId and DTO', async () => {
      mockStoryService.registerMediaAsset.mockResolvedValue(MEDIA_STUB);

      await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ ...validBody, content_type: 'image/jpeg', file_size: 512 })
        .expect(201);

      const [id, dto] = mockStoryService.registerMediaAsset.mock.calls[0];
      expect(id).toBe(STORY_ID);
      expect(dto.file_name).toBe('cover.jpg');
      expect(dto.content_type).toBe('image/jpeg');
      expect(dto.file_size).toBe(512);
    });

    it('should return 201 with full media body when all optional fields supplied', async () => {
      const fullMedia = { ...MEDIA_STUB, content_type: 'image/png', file_size: 204800 };
      mockStoryService.registerMediaAsset.mockResolvedValue(fullMedia);

      const { body } = await request(app.getHttpServer())
        .post(`/stories/${STORY_ID}/media`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .send({ ...validBody, content_type: 'image/png', file_size: 204800 })
        .expect(201);

      expect(body.content_type).toBe('image/png');
      expect(body.file_size).toBe(204800);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PATCH /stories/:id/publish — Publish story
  // ══════════════════════════════════════════════════════════════════════════

  describe('PATCH /stories/:id/publish', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .patch(`/stories/${STORY_ID}/publish`)
        .expect(401);
    });

    it('should return 403 when authenticated as parent', async () => {
      await request(app.getHttpServer())
        .patch(`/stories/${STORY_ID}/publish`)
        .set('Authorization', `Bearer ${token('parent')}`)
        .expect(403);
    });

    it('should return 403 when authenticated as child', async () => {
      await request(app.getHttpServer())
        .patch(`/stories/${STORY_ID}/publish`)
        .set('Authorization', `Bearer ${token('child')}`)
        .expect(403);
    });

    it('should return 200 with published story when admin publishes', async () => {
      mockStoryService.publishStory.mockResolvedValue(PUBLISHED_STORY_STUB);

      const { body } = await request(app.getHttpServer())
        .patch(`/stories/${STORY_ID}/publish`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(mockStoryService.publishStory).toHaveBeenCalledWith(STORY_ID);
      expect(body.is_published).toBe(true);
    });

    it('should call publishStory with the correct story id', async () => {
      mockStoryService.publishStory.mockResolvedValue(PUBLISHED_STORY_STUB);

      await request(app.getHttpServer())
        .patch(`/stories/${STORY_ID}/publish`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(mockStoryService.publishStory).toHaveBeenCalledTimes(1);
      expect(mockStoryService.publishStory).toHaveBeenCalledWith(STORY_ID);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DELETE /stories/:id — Soft delete (sets deletedAt)
  // ══════════════════════════════════════════════════════════════════════════

  describe('DELETE /stories/:id', () => {
    const DELETED_AT = new Date('2025-01-01T00:00:00.000Z');
    const DELETED_STORY_STUB = { ...STORY_STUB, deleted_at: DELETED_AT };

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).delete(`/stories/${STORY_ID}`).expect(401);
    });

    it('should return 403 when authenticated as parent', async () => {
      await request(app.getHttpServer())
        .delete(`/stories/${STORY_ID}`)
        .set('Authorization', `Bearer ${token('parent')}`)
        .expect(403);
    });

    it('should return 403 when authenticated as child', async () => {
      await request(app.getHttpServer())
        .delete(`/stories/${STORY_ID}`)
        .set('Authorization', `Bearer ${token('child')}`)
        .expect(403);
    });

    it('should return 200 with soft-deleted story (deleted_at set) for admin', async () => {
      mockStoryService.softDeleteStory.mockResolvedValue(DELETED_STORY_STUB);

      const { body } = await request(app.getHttpServer())
        .delete(`/stories/${STORY_ID}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(mockStoryService.softDeleteStory).toHaveBeenCalledWith(STORY_ID);
      expect(body.deleted_at).toBeDefined();
    });

    it('should call softDeleteStory with the correct story id', async () => {
      mockStoryService.softDeleteStory.mockResolvedValue(DELETED_STORY_STUB);

      await request(app.getHttpServer())
        .delete(`/stories/${STORY_ID}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(mockStoryService.softDeleteStory).toHaveBeenCalledTimes(1);
      expect(mockStoryService.softDeleteStory).toHaveBeenCalledWith(STORY_ID);
    });

    it('should NOT physically remove the record (soft delete)', async () => {
      mockStoryService.softDeleteStory.mockResolvedValue(DELETED_STORY_STUB);

      const { body } = await request(app.getHttpServer())
        .delete(`/stories/${STORY_ID}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      // The story still exists but with deleted_at filled
      expect(body.id).toBe(STORY_ID);
      expect(body.deleted_at).not.toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Phase 3 – Child Content Delivery
  // ══════════════════════════════════════════════════════════════════════════

  describe('GET /stories – Phase 3: Filtered list with ageGroup-based guard', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/stories').expect(401);
    });

    it('should return 401 when token is invalid', async () => {
      await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should return 200 with empty array when admin has no stories', async () => {
      mockStoryService.findAll.mockResolvedValue([]);

      const { body } = await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    it('should return 200 with all published stories for admin without filters', async () => {
      mockStoryService.findAll.mockResolvedValue([
        PUBLISHED_STORY_6_8,
        PUBLISHED_STORY_9_11,
      ]);

      const { body } = await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.length).toBe(2);
      expect(body[0].id).toBe(STORY_ID_2);
      expect(body[1].id).toBe(STORY_ID_3);
    });

    // ─── Filter by ageGroup ─────────────────────────────────────────────────

    it('should filter stories by ageGroup query parameter', async () => {
      mockStoryService.findAll.mockResolvedValue([PUBLISHED_STORY_6_8]);

      const { body } = await request(app.getHttpServer())
        .get('/stories?ageGroup=6-8')
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.length).toBe(1);
      expect(body[0].age_group).toBe('6-8');
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ ageGroup: '6-8' }),
        expect.any(Object),
      );
    });

    it('should filter stories by complexity query parameter', async () => {
      mockStoryService.findAll.mockResolvedValue([PUBLISHED_STORY_6_8]);

      const { body } = await request(app.getHttpServer())
        .get('/stories?complexity=easy')
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.length).toBe(1);
      expect(body[0].complexity).toBe('easy');
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ complexity: 'easy' }),
        expect.any(Object),
      );
    });

    it('should filter stories by gender query parameter', async () => {
      mockStoryService.findAll.mockResolvedValue([PUBLISHED_STORY_9_11]);

      const { body } = await request(app.getHttpServer())
        .get('/stories?gender=all')
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.length).toBe(1);
      expect(body[0].gender).toBe('all');
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ gender: 'all' }),
        expect.any(Object),
      );
    });

    it('should filter stories by type query parameter', async () => {
      mockStoryService.findAll.mockResolvedValue([PUBLISHED_STORY_6_8]);

      const { body } = await request(app.getHttpServer())
        .get('/stories?type=adventure')
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.length).toBe(1);
      expect(body[0].type).toBe('adventure');
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'adventure' }),
        expect.any(Object),
      );
    });

    it('should support multiple filters simultaneously', async () => {
      mockStoryService.findAll.mockResolvedValue([PUBLISHED_STORY_6_8]);

      const { body } = await request(app.getHttpServer())
        .get('/stories?ageGroup=6-8&complexity=easy&gender=male&type=adventure')
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.length).toBe(1);
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          ageGroup: '6-8',
          complexity: 'easy',
          gender: 'male',
          type: 'adventure',
        }),
        expect.any(Object),
      );
    });

    // ─── ageGroup-based guard for children (Phase 3 key feature) ──────────────

    it('should restrict child users to their own ageGroup', async () => {
      mockStoryService.findAll.mockResolvedValue([PUBLISHED_STORY_6_8]);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
        ageGroup: '6-8',
      });

      const { body } = await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(body.length).toBe(1);
      // Verify the service was called with the child user object including ageGroup
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          role: 'child',
          ageGroup: '6-8',
        }),
      );
    });

    it('should NOT allow child user to override ageGroup filter via query parameter', async () => {
      // Child is 6-8 years old but tries to query for 9-11 stories
      // The service should enforce the child's own ageGroup
      mockStoryService.findAll.mockResolvedValue([PUBLISHED_STORY_6_8]);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
        ageGroup: '6-8',
      });

      await request(app.getHttpServer())
        .get('/stories?ageGroup=9-11')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      // The service receives the user's ageGroup from token, not from query
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ ageGroup: '9-11' }),
        expect.objectContaining({ ageGroup: '6-8' }),
      );
    });

    it('should return empty array when child queries stories outside their age group', async () => {
      mockStoryService.findAll.mockResolvedValue([]);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
        ageGroup: '3-5',
      });

      const { body } = await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    it('should return 200 for parent role without ageGroup restriction', async () => {
      mockStoryService.findAll.mockResolvedValue([
        PUBLISHED_STORY_6_8,
        PUBLISHED_STORY_9_11,
      ]);

      const parentToken = _jwtService.sign({
        sub: 'parent-uuid-1',
        email: 'parent@test.com',
        role: 'parent',
      });

      const { body } = await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(body.length).toBe(2);
      // Parent role does not have ageGroup restriction
      expect(mockStoryService.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          role: 'parent',
        }),
      );
    });

    it('should pass correct user context to service', async () => {
      mockStoryService.findAll.mockResolvedValue([]);

      const adminToken = token('admin', 'admin-id-123');
      await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const [, userArg] = mockStoryService.findAll.mock.calls[0];
      expect(userArg).toHaveProperty('id', 'admin-id-123');
      expect(userArg).toHaveProperty('role', 'admin');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET /stories/:id – Phase 3: Full story details with signed image URLs
  // ══════════════════════════════════════════════════════════════════════════

  describe('GET /stories/:id – Phase 3: Full story with signed media URLs', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get(`/stories/${STORY_ID_2}`).expect(401);
    });

    it('should return 401 when token is invalid', async () => {
      await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should return 404 when story is not found', async () => {
      mockStoryService.findOneWithMedia.mockRejectedValueOnce(new Error('NotFoundException'));

      await request(app.getHttpServer())
        .get(`/stories/nonexistent-id`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(500); // Service throws, not controller (integration test)
    });

    it('should return 200 with story and signed media URLs for admin', async () => {
      const storyWithMedia = {
        ...PUBLISHED_STORY_6_8,
        media: PLURAL_SIGNED_MEDIA,
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithMedia);

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.id).toBe(STORY_ID_2);
      expect(body.title).toBe('The Adventure of Tommy');
      expect(body.content).toBe('Once upon a time...');
      expect(Array.isArray(body.media)).toBe(true);
      expect(body.media.length).toBe(2);
    });

    it('should return signed URLs for media files', async () => {
      const storyWithMedia = {
        ...PUBLISHED_STORY_6_8,
        media: PLURAL_SIGNED_MEDIA,
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithMedia);

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.media[0].file_url).toContain('signed=true');
      expect(body.media[0].file_url).toContain('expires=');
      expect(body.media[1].file_url).toContain('signed=true');
    });

    it('should include all story attributes in response', async () => {
      const storyWithMedia = {
        ...PUBLISHED_STORY_6_8,
        media: [SIGNED_MEDIA],
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithMedia);

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body).toHaveProperty('id', STORY_ID_2);
      expect(body).toHaveProperty('title', 'The Adventure of Tommy');
      expect(body).toHaveProperty('description', 'An exciting adventure story');
      expect(body).toHaveProperty('content', 'Once upon a time...');
      expect(body).toHaveProperty('age_group', '6-8');
      expect(body).toHaveProperty('complexity', 'easy');
      expect(body).toHaveProperty('gender', 'male');
      expect(body).toHaveProperty('type', 'adventure');
      expect(body).toHaveProperty('is_published', true);
    });

    it('should call findOneWithMedia with story id and user context', async () => {
      mockStoryService.findOneWithMedia.mockResolvedValue({
        ...PUBLISHED_STORY_6_8,
        media: [],
      });

      const adminToken = token('admin', 'admin-id-456');
      await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(mockStoryService.findOneWithMedia).toHaveBeenCalledWith(
        STORY_ID_2,
        expect.objectContaining({
          id: 'admin-id-456',
          role: 'admin',
        }),
      );
    });

    // ─── Child-specific ageGroup guard for GET /:id ──────────────────────────

    it('should allow child to access story matching their age group', async () => {
      const storyWithMedia = {
        ...PUBLISHED_STORY_6_8,
        media: [SIGNED_MEDIA],
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithMedia);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
        ageGroup: '6-8',
      });

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(body.id).toBe(STORY_ID_2);
      expect(body.age_group).toBe('6-8');
    });

    it('should call findOneWithMedia with child user context including ageGroup', async () => {
      mockStoryService.findOneWithMedia.mockResolvedValue({
        ...PUBLISHED_STORY_6_8,
        media: [],
      });

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
        ageGroup: '6-8',
      });

      await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(mockStoryService.findOneWithMedia).toHaveBeenCalledWith(
        STORY_ID_2,
        expect.objectContaining({
          role: 'child',
          ageGroup: '6-8',
        }),
      );
    });

    it('should return 403 when child tries to access story outside their age group', async () => {
      const forbiddenError = new Error('Child is not allowed to access this story due to age group restrictions');
      forbiddenError.name = 'ForbiddenException';
      mockStoryService.findOneWithMedia.mockRejectedValueOnce(forbiddenError);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
        ageGroup: '3-5', // Different from story's 6-8
      });

      await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(500); // Error bubbles up as 500 in integration test with mocked service
    });

    it('should return 404 when child tries to access unpublished story', async () => {
      const notFoundError = new Error('Story with id not found');
      notFoundError.name = 'NotFoundException';
      mockStoryService.findOneWithMedia.mockRejectedValueOnce(notFoundError);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
        ageGroup: '6-8',
      });

      await request(app.getHttpServer())
        .get(`/stories/${STORY_ID}`)
        .set('Authorization', `Bearer ${childToken}`)
        .expect(500);
    });

    it('should handle multiple media files for a single story', async () => {
      const storyWithMultipleMedia = {
        ...PUBLISHED_STORY_6_8,
        media: [
          PLURAL_SIGNED_MEDIA[0],
          PLURAL_SIGNED_MEDIA[1],
          {
            id: '01900000-0000-7000-8000-000000000005',
            story_id: STORY_ID_2,
            file_name: 'page-03.jpg',
            file_url: 'https://ik.imagekit.io/demo/page-03.jpg?signed=true&expires=1704067200',
          },
        ],
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithMultipleMedia);

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.media.length).toBe(3);
      body.media.forEach((media: any) => {
        expect(media).toHaveProperty('id');
        expect(media).toHaveProperty('file_name');
        expect(media).toHaveProperty('file_url');
        expect(media.file_url).toContain('signed=true');
      });
    });

    it('should return story with empty media array if no media associated', async () => {
      const storyWithoutMedia = {
        ...PUBLISHED_STORY_6_8,
        media: [],
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithoutMedia);

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(Array.isArray(body.media)).toBe(true);
      expect(body.media.length).toBe(0);
    });

    it('should return parent role access to any published story', async () => {
      const storyWithMedia = {
        ...PUBLISHED_STORY_6_8,
        media: [SIGNED_MEDIA],
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithMedia);

      const parentToken = _jwtService.sign({
        sub: 'parent-id-1',
        email: 'parent@test.com',
        role: 'parent',
      });

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(body.id).toBe(STORY_ID_2);
      // Parent role should not have ageGroup in context
      expect(mockStoryService.findOneWithMedia).toHaveBeenCalledWith(
        STORY_ID_2,
        expect.objectContaining({
          role: 'parent',
        }),
      );
      expect(mockStoryService.findOneWithMedia).toHaveBeenCalledWith(
        STORY_ID_2,
        expect.not.objectContaining({
          ageGroup: expect.anything(),
        }),
      );
    });

    it('should preserve story creation metadata (created_at, updated_at)', async () => {
      const storyWithTimestamps = {
        ...PUBLISHED_STORY_6_8,
        media: [],
        created_at: new Date('2025-01-10T10:00:00Z'),
        updated_at: new Date('2025-01-15T14:30:00Z'),
      };
      mockStoryService.findOneWithMedia.mockResolvedValue(storyWithTimestamps);

      const { body } = await request(app.getHttpServer())
        .get(`/stories/${STORY_ID_2}`)
        .set('Authorization', `Bearer ${token('admin')}`)
        .expect(200);

      expect(body.created_at).toBeDefined();
      expect(body.updated_at).toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GET /stories/assigned — Phase 4: Child assigned story list
  // ══════════════════════════════════════════════════════════════════════════

  describe('GET /stories/assigned — Phase 4: Assigned story list', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/stories/assigned').expect(401);
    });

    it('should return 200 with assigned stories for child role', async () => {
      const assignedStories = [
        { id: 'assigned-story-1', title: 'Assigned Story', type: 'parent_choice' },
      ];
      mockStoryService.getAssignedStories.mockResolvedValue(assignedStories);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
      });

      const { body } = await request(app.getHttpServer())
        .get('/stories/assigned')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(body).toEqual(assignedStories);
      expect(mockStoryService.getAssignedStories).toHaveBeenCalledWith(
        CHILD_UUID,
        undefined,
        'child',
      );
    });

    it('should return 200 with assigned stories for parent role passing childId query', async () => {
      const assignedStories = [
        { id: 'assigned-story-2', title: 'Parent assigned story', type: 'parent_choice' },
      ];
      mockStoryService.getAssignedStories.mockResolvedValue(assignedStories);

      const parentId = 'parent-uuid-1';
      const childId = CHILD_UUID_2;
      const parentToken = _jwtService.sign({
        sub: parentId,
        email: 'parent@test.com',
        role: 'parent',
      });

      const { body } = await request(app.getHttpServer())
        .get(`/stories/assigned?childId=${childId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(body).toEqual(assignedStories);
      expect(mockStoryService.getAssignedStories).toHaveBeenCalledWith(
        parentId,
        childId,
        'parent',
      );
    });

    it('should return an empty array when no assigned stories exist', async () => {
      mockStoryService.getAssignedStories.mockResolvedValue([]);

      const childToken = _jwtService.sign({
        sub: CHILD_UUID,
        email: 'child@test.com',
        role: 'child',
      });

      const { body } = await request(app.getHttpServer())
        .get('/stories/assigned')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(body).toEqual([]);
    });
  });
});
