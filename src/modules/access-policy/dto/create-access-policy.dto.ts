import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccessPolicyDto {
  @ApiProperty({ description: 'UUID of the child this policy belongs to' })
  @IsUUID()
  @IsNotEmpty()
  child_id: string;

  @ApiProperty({ description: 'Bitmask representing allowed days of the week (0-127)' })
  @IsInt()
  @IsNotEmpty()
  day_of_week_bitmask: number;

  @ApiPropertyOptional({ description: 'Weekly usage limit in minutes' })
  @IsInt()
  @IsOptional()
  weekly_limit_minutes?: number;

  @ApiPropertyOptional({ description: 'Start of allowed usage time (HH:MM:SS)' })
  @IsString()
  @IsOptional()
  time_allowed_start_time?: string;

  @ApiPropertyOptional({ description: 'End of allowed usage time (HH:MM:SS)' })
  @IsString()
  @IsOptional()
  time_allowed_end_time?: string;

  @ApiPropertyOptional({ description: 'Maximum app age rating allowed' })
  @IsInt()
  @IsOptional()
  max_app_rating?: number;

  @ApiPropertyOptional({ description: 'Whether the lock is enabled', default: false })
  @IsBoolean()
  @IsOptional()
  lock_enabled?: boolean;
}