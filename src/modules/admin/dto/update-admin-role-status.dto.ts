import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AccountStatus, AdminRole } from '../admin.entity';

export class UpdateAdminRoleStatusDto {
  @ApiProperty({
    description: 'UUID of the super admin performing this action',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID()
  approverId: string;

  @ApiPropertyOptional({
    description: 'New role assigned to the target admin',
    enum: AdminRole,
    example: AdminRole.MODERATOR,
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({
    description: 'New account status for the target admin',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
