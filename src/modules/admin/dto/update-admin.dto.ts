import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminDto {
  @ApiPropertyOptional()
  first_name?: string;

  @ApiPropertyOptional()
  last_name?: string;

  @ApiPropertyOptional()
  email?: string;
}
