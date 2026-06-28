import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { RegisterStoryMediaDto } from './dto/register-story-media.dto';
import { GetStoriesFilterDto } from './dto/get-stories-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('stories')
@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List stories with optional filters' })
  @ApiResponse({ status: 200, description: 'Filtered list of stories' })
  findAll(
    @Query() filter: GetStoriesFilterDto,
    @Request() req: { user?: { role?: string; ageGroup?: string } },
  ) {
    return this.storyService.findAll(filter, req.user);
  }

  @Get('assigned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assigned stories for a child' })
  @ApiResponse({ status: 200, description: 'List of assigned stories' })
  getAssignedStories(
    @Request() req: { user: { id: string; role?: string } },
    @Query('childId') childId: string,
  ) {
    return this.storyService.getAssignedStories(
      req.user.id,
      childId,
      req.user.role,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create draft story' })
  @ApiResponse({ status: 201, description: 'Draft story created' })
  create(@Body() dto: CreateStoryDto) {
    return this.storyService.create(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full story details with signed image URLs' })
  @ApiResponse({ status: 200, description: 'Story details with media' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { role?: string; ageGroup?: string } },
  ) {
    return this.storyService.findOneWithMedia(id, req.user);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register image asset after direct upload' })
  @ApiResponse({ status: 201, description: 'Media asset registered' })
  registerMedia(
    @Param('id') id: string,
    @Body() dto: RegisterStoryMediaDto,
  ) {
    return this.storyService.registerMediaAsset(id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish story' })
  @ApiResponse({ status: 200, description: 'Story published' })
  publish(@Param('id') id: string) {
    return this.storyService.publishStory(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete story' })
  @ApiResponse({ status: 200, description: 'Story soft deleted' })
  delete(@Param('id') id: string) {
    return this.storyService.softDeleteStory(id);
  }
}
