import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class AssignStoryDto {
  @ApiProperty({ description: 'ID of the story to assign' })
  @IsUUID()
  @IsNotEmpty()
  story_id: string;

  @ApiProperty({ description: 'ID of the child receiving the story' })
  @IsUUID()
  @IsNotEmpty()
  child_id: string;

  @ApiPropertyOptional({ description: 'Optional due date for assignment' })
  @IsDateString()
  @IsOptional()
  due_date?: string;
}
