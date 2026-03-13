import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateSessionDto {
  @ApiProperty({
    description: 'New duration to add in ms',
    example: 3600000,
  })
  @IsNumber()
  endTime: number;
}
