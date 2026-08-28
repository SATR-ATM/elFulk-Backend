import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { StoryService } from './story.service';
import { AssignStoryDto } from './dto/assign-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('assignments')
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a story to a child' })
  @ApiResponse({ status: 201, description: 'Story assigned to child' })
  assignStory(@Request() req: { user: { id: string } }, @Body() dto: AssignStoryDto) {
    return this.storyService.assignStoryToChild(req.user.id, dto);
  }

  @Get('stories')
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
}
