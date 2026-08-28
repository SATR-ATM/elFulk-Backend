/**
 * Phase 4 – Parent Assignment Flow
 * Integration-style controller tests for AssignmentController
 *
 * Covers:
 *  POST /assignments               — parent assigns story to child
 *  GET  /assignments/stories       — get assigned stories for a child
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');

import { AssignmentController } from './assignment.controller';
import { StoryService } from './story.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const JWT_SECRET = 'changeme';
const PARENT_UUID = '00000000-0000-4000-8000-000000000001';
const CHILD_UUID = '00000000-0000-4000-8000-000000000002';
const STORY_ID = '00000000-0000-4000-8000-000000000003';

const mockStoryService = {
  assignStoryToChild: jest.fn(),
  getAssignedStories: jest.fn(),
};

let _jwtService: JwtService;
const token = (role: string, sub = PARENT_UUID) =>
  _jwtService.sign({ sub, email: `${role}@test.com`, role });

describe('AssignmentController – Phase 4 Parent Assignment Flow', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [AssignmentController],
      providers: [
        { provide: StoryService, useValue: mockStoryService },
        JwtStrategy,
        JwtAuthGuard,
        Reflector,
      ],
    }).compile();

    _jwtService = module.get<JwtService>(JwtService);

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /assignments', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).post('/assignments').send({}).expect(401);
    });

    it('should return 400 when body is invalid', async () => {
      const parentToken = token('parent', PARENT_UUID);
      await request(app.getHttpServer())
        .post('/assignments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ story_id: 'not-a-uuid' })
        .expect(400);
    });

    it('should return 201 when parent assigns story to child', async () => {
      const expectedAssignment = {
        id: 'assignment-1',
        story_id: STORY_ID,
        assignee_id: CHILD_UUID,
        assigned_by: PARENT_UUID,
      };
      mockStoryService.assignStoryToChild.mockResolvedValue(expectedAssignment);

      const parentToken = token('parent', PARENT_UUID);
      const { body } = await request(app.getHttpServer())
        .post('/assignments')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ story_id: STORY_ID, child_id: CHILD_UUID })
        .expect(201);

      expect(mockStoryService.assignStoryToChild).toHaveBeenCalledWith(
        PARENT_UUID,
        expect.objectContaining({ story_id: STORY_ID, child_id: CHILD_UUID }),
      );
      expect(body).toEqual(expectedAssignment);
    });
  });

  describe('GET /assignments/stories', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).get('/assignments/stories').expect(401);
    });

    it('should return 200 and child assigned stories for child role', async () => {
      const assignedStories = [{ id: 'assignment-story-1', title: 'Assigned Story' }];
      mockStoryService.getAssignedStories.mockResolvedValue(assignedStories);
      const childToken = token('child', CHILD_UUID);

      const { body } = await request(app.getHttpServer())
        .get('/assignments/stories')
        .set('Authorization', `Bearer ${childToken}`)
        .expect(200);

      expect(mockStoryService.getAssignedStories).toHaveBeenCalledWith(
        CHILD_UUID,
        undefined,
        'child',
      );
      expect(body).toEqual(assignedStories);
    });

    it('should return 200 and assigned stories for parent role with childId', async () => {
      const assignedStories = [{ id: 'assignment-story-2', title: 'Parent-assigned Story' }];
      mockStoryService.getAssignedStories.mockResolvedValue(assignedStories);
      const parentToken = token('parent', PARENT_UUID);
      const childId = CHILD_UUID;

      const { body } = await request(app.getHttpServer())
        .get(`/assignments/stories?childId=${childId}`)
        .set('Authorization', `Bearer ${parentToken}`)
        .expect(200);

      expect(mockStoryService.getAssignedStories).toHaveBeenCalledWith(
        PARENT_UUID,
        childId,
        'parent',
      );
      expect(body).toEqual(assignedStories);
    });
  });
});