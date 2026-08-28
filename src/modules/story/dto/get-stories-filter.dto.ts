import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetStoriesFilterDto {
  @ApiPropertyOptional({ description: 'Story age group filter, e.g. 4-6' })
  @IsString()
  @IsOptional()
  ageGroup?: string;

  @ApiPropertyOptional({ description: 'Complexity filter, e.g. easy, medium, hard' })
  @IsString()
  @IsOptional()
  complexity?: string;

  @ApiPropertyOptional({ description: 'Story gender target filter, e.g. male, female, all' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ description: 'Story type filter, e.g. fairy tale, adventure' })
  @IsString()
  @IsOptional()
  type?: string;
}
