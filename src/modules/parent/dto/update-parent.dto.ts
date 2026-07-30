import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateParentDto {
  @ApiPropertyOptional({ description: 'PIN hash (if re-setting)' })
  @IsOptional()
  @IsString()
  pin_hash?: string;

  @ApiPropertyOptional({ example: '+212600000001' })
  @IsOptional()
  @IsString()
  phone_number?: string;
}
