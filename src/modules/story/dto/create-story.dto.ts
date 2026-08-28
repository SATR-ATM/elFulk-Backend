import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: '4-6' })
  @IsString()
  @IsOptional()
  age_group?: string;

  @ApiPropertyOptional({ example: 'easy' })
  @IsString()
  @IsOptional()
  complexity?: string;

  @ApiPropertyOptional({ example: 'female' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'fairy tale' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  author_id?: string;
}
