import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ActivatePinDto {
  @ApiProperty({
    description: 'A 4-digit numeric PIN to activate parent mode',
    example: '1234',
  })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}