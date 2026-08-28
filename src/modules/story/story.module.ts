import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './story.entity';
import { AssignedStory } from './assigned-story.entity';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { AssignmentController } from './assignment.controller';
import { MediaModule } from '../media/media.module';
import { ChildModule } from '../child/child.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, AssignedStory]),
    MediaModule,
    ChildModule,
  ],
  providers: [StoryService],
  controllers: [StoryController, AssignmentController],
  exports: [StoryService],
})
export class StoriesModule {}
