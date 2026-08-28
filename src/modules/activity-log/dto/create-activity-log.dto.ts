import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsInt,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateActivityLogDto {
  @ApiProperty({
    description:
      'UUID of the session this activity log belongs to (Foreign Key)',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
  })
  @IsUUID('all')
  session_id: string;

  @ApiProperty({
    description:
      'Timestamp when this activity started — required, must not be null',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  start_time: string;

  @ApiProperty({
    description:
      'Timestamp when this activity ended — optional, null if still ongoing',
    example: '2024-01-15T10:45:00.000Z',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  end_time?: string;

  @ApiProperty({
    description:
      'Duration of the activity in whole seconds — optional, null if not yet calculated',
    example: 900,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration_seconds?: number;

  @ApiProperty({
    description:
      'The type of action performed in this log entry (e.g. LOGIN, PAGE_VIEW, CLICK)',
    example: 'LOGIN',
  })
  @IsString()
  action_type: string;
}
