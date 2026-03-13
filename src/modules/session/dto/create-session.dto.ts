import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    description: 'UUID of the child user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  childId: string;

  @ApiPropertyOptional({
    description: 'Session duration in ms (defaults to 1 hour)',
    example: 3600000,
  })
  @IsNumber()
  @IsOptional()
  endTime?: number;
}
