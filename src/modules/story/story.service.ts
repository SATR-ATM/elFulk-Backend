import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Story } from './story.entity';
import { AssignedStory } from './assigned-story.entity';
import { MediaService } from '../media/media.service';
import { ChildService } from '../child/child.service';
import { AssignStoryDto } from './dto/assign-story.dto';
import { RegisterStoryMediaDto } from './dto/register-story-media.dto';
import { GetStoriesFilterDto } from './dto/get-stories-filter.dto';

interface UserContext {
  role?: string;
  ageGroup?: string;
}

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(AssignedStory)
    private readonly assignmentRepository: Repository<AssignedStory>,
    private readonly mediaService: MediaService,
    private readonly childService: ChildService,
  ) {}

  findAll(filters: GetStoriesFilterDto, user?: UserContext) {
    const query = this.storyRepository.createQueryBuilder('story');
    query.where('story.deleted_at IS NULL');

    // Phase 3: Apply ageGroup-based query guard (children only see matching content)
    if (user?.role === 'child' && user?.ageGroup) {
      query.andWhere('story.age_group = :ageGroup', {
        ageGroup: user.ageGroup,
      });
    } else if (filters.ageGroup) {
      query.andWhere('story.age_group = :ageGroup', {
        ageGroup: filters.ageGroup,
      });
    }

    if (filters.complexity) {
      query.andWhere('story.complexity = :complexity', {
        complexity: filters.complexity,
      });
    }

    if (filters.gender) {
      query.andWhere('story.gender = :gender', {
        gender: filters.gender,
      });
    }

    if (filters.type) {
      query.andWhere('story.type = :type', {
        type: filters.type,
      });
    }

    return query.orderBy('story.created_at', 'DESC').getMany();
  }

  async findOne(id: string) {
    const story = await this.storyRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }
    return story;
  }

  create(story: Partial<Story>) {
    return this.storyRepository.save(
      this.storyRepository.create({ is_published: false, ...story }),
    );
  }

  async findOneWithMedia(id: string, user?: UserContext) {
    const story = await this.findOne(id);

    if (user?.role === 'child') {
      if (!story.is_published) {
        throw new NotFoundException(`Story with id ${id} not found`);
      }
      if (story.age_group && story.age_group !== user.ageGroup) {
        throw new ForbiddenException(
          'Child is not allowed to access this story due to age group restrictions',
        );
      }
    }

    const media = await this.mediaService.findByStoryId(id);
    const signedMedia = media.map((asset) => ({
      ...asset,
      file_url: this.mediaService.signFileUrl(asset.file_url),
    }));

    return {
      ...story,
      media: signedMedia,
    };
  }

  async assignStoryToChild(parentId: string, dto: AssignStoryDto) {
    const child = await this.childService.findOne(dto.child_id);
    if (child.parent_id !== parentId) {
      throw new ForbiddenException(
        'Child does not belong to authenticated parent',
      );
    }

    const story = await this.findOne(dto.story_id);
    const assignment = this.assignmentRepository.create({
      story_id: story.id,
      assignee_id: child.id,
      assigned_by: parentId,
      due_date: dto.due_date ? new Date(dto.due_date) : null,
    });

    return this.assignmentRepository.save(assignment);
  }

  async getAssignedStories(
    userId: string,
    childId?: string,
    userRole?: string,
  ) {
    if (userRole === 'child') {
      childId = userId;
    }

    if (!childId) {
      throw new BadRequestException('childId is required');
    }

    const child = await this.childService.findOne(childId);
    if (userRole !== 'child' && child.parent_id !== userId) {
      throw new ForbiddenException(
        'Child does not belong to authenticated parent',
      );
    }

    if (userRole === 'child') {
      return this.storyRepository
        .createQueryBuilder('story')
        .innerJoin(
          'assigned_stories',
          'assignment',
          'assignment.story_id = story.id',
        )
        .where('assignment.assignee_id = :childId', { childId })
        .andWhere('story.deleted_at IS NULL')
        .andWhere('story.type = :storyType', {
          storyType: 'parent_choice',
        })
        .orderBy('assignment.created_at', 'DESC')
        .getMany();
    }

    return this.assignmentRepository.find({
      where: { assignee_id: childId },
      order: { created_at: 'DESC' },
    });
  }

  async publishStory(id: string) {
    const story = await this.findOne(id);
    story.is_published = true;
    return this.storyRepository.save(story);
  }

  async softDeleteStory(id: string) {
    const story = await this.findOne(id);
    story.deleted_at = new Date();
    return this.storyRepository.save(story);
  }

  async registerMediaAsset(
    storyId: string,
    attributes: RegisterStoryMediaDto,
  ) {
    await this.findOne(storyId);
    return this.mediaService.createAsset({
      ...attributes,
      story_id: storyId,
    });
  }
}
