import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsInt, Min } from 'class-validator';

export class RegisterStoryMediaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  file_url: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content_type?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  file_size?: number;
}
