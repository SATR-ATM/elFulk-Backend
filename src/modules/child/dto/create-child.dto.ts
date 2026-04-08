import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  IsDateString,
} from 'class-validator';

export class CreateChildDto {
  @ApiProperty({ description: 'First name of the child', example: 'Widad' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ description: 'Last name of the child', example: 'Benali' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601 date string)',
    example: '2015-06-20',
  })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiPropertyOptional({ description: 'Gender of the child', example: 'female' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    description: 'URL of the child avatar image',
    example: 'https://example.com/avatars/widad.png',
  })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}