import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export class CreateChildDto {
  @ApiProperty({
    description: 'UUID of the parent who owns this child profile (Foreign Key)',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @IsUUID('all')
  @IsNotEmpty()
  parent_id: string;

  @ApiProperty({
    description: 'First name of the child',
    example: 'Widad',
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    description: 'Last name of the child',
    example: 'test',
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    description: 'Age of the child in years — must be between 1 and 17',
    example: 10,
  })
  @IsInt()
  @Min(1)
  @Max(17)
  age: number;

  @ApiProperty({
    description: 'Gender of the child — optional',
    example: 'female',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({
    description: 'URL of the child avatar image — optional',
    example: 'https://example.com/avatars/widad.png',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}
