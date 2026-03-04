import { IsString, IsEmail, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole, AccountStatus } from './admin.entity';

export class CreateAdminDto {
  @ApiProperty({
    description: 'First name of the admin',
    example: 'Khalil',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({
    description: 'Last name of the admin',
    example: 'Test',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({
    description: 'Unique email address used for authentication',
    example: 'khalil@test.com',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Plain-text password. Will be hashed before storage.',
    example: 'StrongP@ssw0rd!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  password_hash: string;

  @ApiPropertyOptional({
    description: 'Role assigned to the admin. Defaults to MODERATOR if not provided.',
    enum: AdminRole,
    example: AdminRole.MODERATOR,
    default: AdminRole.MODERATOR,
  })
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;

  @ApiPropertyOptional({
    description: 'Account activation status. Defaults to PENDING if not provided.',
    enum: AccountStatus,
    example: AccountStatus.PENDING,
    default: AccountStatus.PENDING,
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiPropertyOptional({
    description: 'UUID of the admin who approved this account.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsString()
  @IsOptional()
  approvedById?: string;
}