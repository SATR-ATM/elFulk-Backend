/**
 * StoryService unit tests – Phase 3: Child Content Delivery
 *
 * Focuses on:
 *  - findAll()         : filter forwarding, ageGroup-based child guard
 *  - findOne()         : not-found exception
 *  - findOneWithMedia() : signed URLs, child publish-gate, child age-group gate
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { IsNull } from 'typeorm';

import { StoryService } from './story.service';
import { Story } from './story.entity';
import { AssignedStory } from './assigned-story.entity';
import { MediaService } from '../media/media.service';
import { MediaAsset } from '../media/media.entity';
import { ChildService } from '../child/child.service';
import { GetStoriesFilterDto } from './dto/get-stories-filter.dto';

// ─── QueryBuilder mock factory ────────────────────────────────────────────────
// Returns a chainable spy object; getMany resolves to the given stories array.

const makeQB = (stories: Partial<Story>[] = []) => {
  const qb: Record<string, jest.Mock> = {};
  ['where', 'andWhere', 'innerJoin', 'orderBy'].forEach((m) => {
    qb[m] = jest.fn().mockReturnValue(qb);
  });
  qb.getMany = jest.fn().mockResolvedValue(stories);
  return qb;
};

// ─── Repository mock factory ──────────────────────────────────────────────────

const makeStoryRepo = (qb = makeQB()) => ({
  createQueryBuilder: jest.fn().mockReturnValue(qb),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  _qb: qb, // expose so tests can assert on spy calls
});

// ─── Stubs ───────────────────────────────────────────────────────────────────

const STORY_ID = '01900000-0000-7000-8000-000000000001';

const publishedStory = (overrides: Partial<Story> = {}): Story =>
  ({
    id: STORY_ID,
    title: 'Test Story',
    is_published: true,
    deleted_at: null,
    age_group: '6-8',
    ...overrides,
  } as Story);

const draftStory = (overrides: Partial<Story> = {}): Story =>
  publishedStory({ is_published: false, ...overrides });

const mediaAsset = (url = 'https://ik.imagekit.io/demo/cover.jpg'): MediaAsset => {
  const asset = new MediaAsset();
  asset.id = 'media-1';
  asset.story_id = STORY_ID;
  asset.file_name = 'cover.jpg';
  asset.file_url = url;
  asset.content_type = 'image/jpeg';
  asset.file_size = 12345;
  asset.created_at = new Date('2025-01-01T00:00:00Z');
  asset.updated_at = new Date('2025-01-01T00:00:00Z');
  return asset;
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('StoryService – Phase 3 / Phase 4', () => {
  let service: StoryService;
  let storyRepo: ReturnType<typeof makeStoryRepo>;
  let assignmentRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let childService: { findOne: jest.Mock };
  let mediaService: jest.Mocked<Pick<MediaService, 'findByStoryId' | 'signFileUrl' | 'getUploadAuth' | 'createAsset'>>;
  let qb: ReturnType<typeof makeQB>;

  beforeEach(async () => {
    qb = makeQB();
    storyRepo = makeStoryRepo(qb);

    assignmentRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    childService = {
      findOne: jest.fn(),
    };

    mediaService = {
      findByStoryId: jest.fn(),
      signFileUrl: jest.fn(),
      getUploadAuth: jest.fn(),
      createAsset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryService,
        { provide: getRepositoryToken(Story), useValue: storyRepo },
        { provide: getRepositoryToken(AssignedStory), useValue: assignmentRepo },
        { provide: MediaService, useValue: mediaService },
        { provide: ChildService, useValue: childService },
      ],
    }).compile();

    service = module.get<StoryService>(StoryService);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // findAll()
  // ══════════════════════════════════════════════════════════════════════════

  describe('findAll()', () => {
    const emptyFilter = (): GetStoriesFilterDto => ({});

    it('should always start with a deleted_at IS NULL where clause', async () => {
      await service.findAll(emptyFilter());
      expect(qb.where).toHaveBeenCalledWith('story.deleted_at IS NULL');
    });

    it('should order results by created_at DESC', async () => {
      await service.findAll(emptyFilter());
      expect(qb.orderBy).toHaveBeenCalledWith('story.created_at', 'DESC');
    });

    it('should return the stories returned by the query builder', async () => {
      const stories = [publishedStory(), publishedStory({ id: 'other-id' })];
      qb.getMany.mockResolvedValue(stories);

      const result = await service.findAll(emptyFilter());

      expect(result).toEqual(stories);
    });

    it('should return an empty array when no stories match', async () => {
      qb.getMany.mockResolvedValue([]);
      expect(await service.findAll(emptyFilter())).toEqual([]);
    });

    // ─── Filter forwarding ────────────────────────────────────────────────

    it('should apply ageGroup filter from query params for non-child user', async () => {
      await service.findAll({ ageGroup: '6-8' }, { role: 'admin' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.age_group = :ageGroup', { ageGroup: '6-8' });
    });

    it('should apply complexity filter', async () => {
      await service.findAll({ complexity: 'easy' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.complexity = :complexity', { complexity: 'easy' });
    });

    it('should apply gender filter', async () => {
      await service.findAll({ gender: 'female' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.gender = :gender', { gender: 'female' });
    });

    it('should apply type filter', async () => {
      await service.findAll({ type: 'adventure' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.type = :type', { type: 'adventure' });
    });

    it('should apply all four filters simultaneously', async () => {
      await service.findAll(
        { ageGroup: '9-11', complexity: 'hard', gender: 'male', type: 'fairy tale' },
        { role: 'parent' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('story.age_group = :ageGroup', { ageGroup: '9-11' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.complexity = :complexity', { complexity: 'hard' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.gender = :gender', { gender: 'male' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.type = :type', { type: 'fairy tale' });
    });

    it('should NOT apply any andWhere when filters are empty and user is not child', async () => {
      await service.findAll({});
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    // ─── Child ageGroup guard ─────────────────────────────────────────────

    it('should use child.ageGroup instead of filter ageGroup for child role', async () => {
      // Even if a filter ageGroup is passed, child role overrides it
      await service.findAll(
        { ageGroup: '9-11' }, // would be ignored
        { role: 'child', ageGroup: '6-8' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('story.age_group = :ageGroup', { ageGroup: '6-8' });
      // Called only once (not twice with both ageGroups)
      const ageGroupCalls = (qb.andWhere as jest.Mock).mock.calls.filter(
        ([clause]: [string]) => clause.includes('age_group'),
      );
      expect(ageGroupCalls).toHaveLength(1);
    });

    it('should apply child ageGroup guard when role is child and ageGroup is set', async () => {
      await service.findAll({}, { role: 'child', ageGroup: '3-5' });
      expect(qb.andWhere).toHaveBeenCalledWith('story.age_group = :ageGroup', { ageGroup: '3-5' });
    });

    it('should NOT apply ageGroup filter when user is child but ageGroup is undefined', async () => {
      await service.findAll({}, { role: 'child', ageGroup: undefined });
      const ageGroupCalls = (qb.andWhere as jest.Mock).mock.calls.filter(
        ([clause]: [string]) => clause.includes('age_group'),
      );
      expect(ageGroupCalls).toHaveLength(0);
    });

    it('should NOT apply child guard for parent role', async () => {
      await service.findAll({}, { role: 'parent' });
      const ageGroupCalls = (qb.andWhere as jest.Mock).mock.calls.filter(
        ([clause]: [string]) => clause.includes('age_group'),
      );
      expect(ageGroupCalls).toHaveLength(0);
    });

    it('should NOT apply child guard for admin role', async () => {
      await service.findAll({}, { role: 'admin' });
      const ageGroupCalls = (qb.andWhere as jest.Mock).mock.calls.filter(
        ([clause]: [string]) => clause.includes('age_group'),
      );
      expect(ageGroupCalls).toHaveLength(0);
    });

    it('should work when no user is passed at all (public/unauthenticated context)', async () => {
      await expect(service.findAll({})).resolves.toBeDefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // findOne()
  // ══════════════════════════════════════════════════════════════════════════

  describe('findOne()', () => {
    it('should return the story when found', async () => {
      const story = publishedStory();
      storyRepo.findOne.mockResolvedValue(story);
      await expect(service.findOne(STORY_ID)).resolves.toEqual(story);
    });

    it('should query with id and deleted_at: IsNull()', async () => {
      storyRepo.findOne.mockResolvedValue(publishedStory());
      await service.findOne(STORY_ID);
      expect(storyRepo.findOne).toHaveBeenCalledWith({
        where: { id: STORY_ID, deleted_at: IsNull() },
      });
    });

    it('should throw NotFoundException when story does not exist', async () => {
      storyRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(STORY_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when story is soft-deleted (null returned by repo)', async () => {
      // TypeORM with IsNull() means soft-deleted records return null
      storyRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('deleted-story-id')).rejects.toThrow(
        `Story with id deleted-story-id not found`,
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // findOneWithMedia()
  // ══════════════════════════════════════════════════════════════════════════

  describe('findOneWithMedia()', () => {
    beforeEach(() => {
      // Default: story is found and has one media asset
      storyRepo.findOne.mockResolvedValue(publishedStory());
      mediaService.findByStoryId.mockResolvedValue([mediaAsset()]);
      mediaService.signFileUrl.mockImplementation((url: string) => `${url}?ik-t=1234&ik-s=abc`);
    });

    // ─── Basic behaviour ──────────────────────────────────────────────────

    it('should return story data merged with media array', async () => {
      const result = await service.findOneWithMedia(STORY_ID);
      expect(result).toHaveProperty('id', STORY_ID);
      expect(result).toHaveProperty('media');
      expect(Array.isArray(result.media)).toBe(true);
    });

    it('should call mediaService.findByStoryId with the correct storyId', async () => {
      await service.findOneWithMedia(STORY_ID);
      expect(mediaService.findByStoryId).toHaveBeenCalledWith(STORY_ID);
    });

    it('should sign every media file_url', async () => {
      const result = await service.findOneWithMedia(STORY_ID);
      result.media.forEach((asset: any) => {
        expect(asset.file_url).toContain('ik-t=');
        expect(asset.file_url).toContain('ik-s=');
      });
    });

    it('should call signFileUrl for each media asset', async () => {
      mediaService.findByStoryId.mockResolvedValue([mediaAsset('url1'), mediaAsset('url2')]);
      await service.findOneWithMedia(STORY_ID);
      expect(mediaService.signFileUrl).toHaveBeenCalledTimes(2);
    });

    it('should return an empty media array when story has no assets', async () => {
      mediaService.findByStoryId.mockResolvedValue([]);
      const result = await service.findOneWithMedia(STORY_ID);
      expect(result.media).toEqual([]);
    });

    it('should throw NotFoundException when story does not exist', async () => {
      storyRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneWithMedia(STORY_ID)).rejects.toThrow(NotFoundException);
    });

    // ─── Child role restrictions: publish gate ────────────────────────────

    it('should throw NotFoundException for child accessing an unpublished story', async () => {
      storyRepo.findOne.mockResolvedValue(draftStory());
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'child', ageGroup: '6-8' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should NOT expose an unpublished story to child role (publish gate)', async () => {
      storyRepo.findOne.mockResolvedValue(draftStory({ is_published: false }));
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'child' }),
      ).rejects.toThrow(`Story with id ${STORY_ID} not found`);
    });

    it('should allow admin to access an unpublished story', async () => {
      storyRepo.findOne.mockResolvedValue(draftStory());
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'admin' }),
      ).resolves.toHaveProperty('id', STORY_ID);
    });

    it('should allow parent to access an unpublished story', async () => {
      storyRepo.findOne.mockResolvedValue(draftStory());
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'parent' }),
      ).resolves.toHaveProperty('id', STORY_ID);
    });

    // ─── Child role restrictions: ageGroup gate ───────────────────────────

    it('should throw ForbiddenException when child age group does not match story age group', async () => {
      storyRepo.findOne.mockResolvedValue(publishedStory({ age_group: '9-11' }));
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'child', ageGroup: '6-8' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with correct message for age group mismatch', async () => {
      storyRepo.findOne.mockResolvedValue(publishedStory({ age_group: '12+' }));
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'child', ageGroup: '3-5' }),
      ).rejects.toThrow('Child is not allowed to access this story due to age group restrictions');
    });

    it('should allow child when age group matches exactly', async () => {
      storyRepo.findOne.mockResolvedValue(publishedStory({ age_group: '6-8' }));
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'child', ageGroup: '6-8' }),
      ).resolves.toHaveProperty('id', STORY_ID);
    });

    it('should allow child when story has no age_group restriction (null)', async () => {
      storyRepo.findOne.mockResolvedValue(publishedStory({ age_group: null }));
      await expect(
        service.findOneWithMedia(STORY_ID, { role: 'child', ageGroup: '6-8' }),
      ).resolves.toHaveProperty('id', STORY_ID);
    });

    it('should not apply child gates when no user is provided', async () => {
      storyRepo.findOne.mockResolvedValue(draftStory()); // unpublished, but no child context
      await expect(service.findOneWithMedia(STORY_ID)).resolves.toHaveProperty('id', STORY_ID);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // assignStoryToChild()
  // ══════════════════════════════════════════════════════════════════════════

  describe('assignStoryToChild()', () => {
    const parentId = 'parent-uuid-1';
    const childId = 'child-uuid-1';
    const assignDto = {
      story_id: STORY_ID,
      child_id: childId,
      due_date: '2025-10-10',
    };

    it('should assign story when child belongs to authenticated parent', async () => {
      childService.findOne.mockResolvedValue({ id: childId, parent_id: parentId });
      storyRepo.findOne.mockResolvedValue(publishedStory({ id: STORY_ID }));
      assignmentRepo.create.mockReturnValue({
        ...assignDto,
        story_id: STORY_ID,
        assignee_id: childId,
        assigned_by: parentId,
        due_date: new Date(assignDto.due_date),
      });
      assignmentRepo.save.mockResolvedValue({
        id: 'assignment-1',
        ...assignDto,
        story_id: STORY_ID,
        assignee_id: childId,
        assigned_by: parentId,
        due_date: new Date(assignDto.due_date),
      });

      const result = await service.assignStoryToChild(parentId, assignDto);

      expect(childService.findOne).toHaveBeenCalledWith(childId);
      expect(storyRepo.findOne).toHaveBeenCalledWith({ where: { id: STORY_ID, deleted_at: IsNull() } });
      expect(assignmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          story_id: STORY_ID,
          assignee_id: childId,
          assigned_by: parentId,
        }),
      );
      expect(assignmentRepo.save).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toHaveProperty('id', 'assignment-1');
      expect(result).toHaveProperty('assigned_by', parentId);
      expect(result).toHaveProperty('assignee_id', childId);
    });

    it('should throw ForbiddenException when child does not belong to authenticated parent', async () => {
      childService.findOne.mockResolvedValue({ id: childId, parent_id: 'other-parent' });

      await expect(service.assignStoryToChild(parentId, assignDto)).rejects.toThrow(ForbiddenException);
      expect(assignmentRepo.create).not.toHaveBeenCalled();
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getAssignedStories()
  // ══════════════════════════════════════════════════════════════════════════

  describe('getAssignedStories()', () => {
    it('should return parent assignment records when parent requests child assigned stories', async () => {
      const assignmentRecord = [{ id: 'assignment-1', assignee_id: 'child-1' }];
      assignmentRepo.find.mockResolvedValue(assignmentRecord);
      childService.findOne.mockResolvedValue({ id: 'child-1', parent_id: 'parent-uuid-1' });

      const result = await service.getAssignedStories('parent-uuid-1', 'child-1', 'parent');

      expect(childService.findOne).toHaveBeenCalledWith('child-1');
      expect(assignmentRepo.find).toHaveBeenCalledWith({
        where: { assignee_id: 'child-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(assignmentRecord);
    });

    it('should throw ForbiddenException when parent requests assignments for a child they do not own', async () => {
      childService.findOne.mockResolvedValue({ id: 'child-1', parent_id: 'other-parent' });

      await expect(service.getAssignedStories('parent-uuid-1', 'child-1', 'parent')).rejects.toThrow(ForbiddenException);
    });

    it('should return child assigned stories filtered to parent_choice type and ordered by assignment.created_at', async () => {
      const childStories = [{ id: 'story-1', type: 'parent_choice' }];
      const qb2 = makeQB(childStories);
      storyRepo.createQueryBuilder.mockReturnValue(qb2);
      childService.findOne.mockResolvedValue({ id: 'child-1', parent_id: 'parent-uuid-1' });

      const result = await service.getAssignedStories('child-1', undefined, 'child');

      expect(childService.findOne).toHaveBeenCalledWith('child-1');
      expect(qb2.where).toHaveBeenCalledWith('assignment.assignee_id = :childId', { childId: 'child-1' });
      expect(qb2.andWhere).toHaveBeenCalledWith('story.deleted_at IS NULL');
      expect(qb2.andWhere).toHaveBeenCalledWith('story.type = :storyType', { storyType: 'parent_choice' });
      expect(qb2.orderBy).toHaveBeenCalledWith('assignment.created_at', 'DESC');
      expect(result).toEqual(childStories);
    });
  });
});
