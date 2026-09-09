import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Short title of the notification',
    example: 'Limit warning',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Full message body of the notification',
    example: 'Your child has reached the daily screen-time limit.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Whether the notification has been read',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @ApiPropertyOptional({
    description:
      'Timestamp when the notification was read. Null if not yet read',
    example: '2026-03-04T12:32:49.000Z',
  })
  @IsOptional()
  @IsDateString()
  read_at?: string;

  @ApiProperty({
    description: 'Type/category of the notification',
    example: 'limit_warning',
  })
  @IsString()
  @IsNotEmpty()
  type: string;
}
