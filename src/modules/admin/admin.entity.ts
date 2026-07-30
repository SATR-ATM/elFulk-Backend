import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
import { User } from '../../../typeorm/entities/User';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  MODERATOR = 'moderator',
}

export enum AccountStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('admins')
export class Admin {
  @ApiProperty({
    description: 'UUIDv7 primary key',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @PrimaryColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Better Auth user ID' })
  @Column({ unique: true, name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'Role assigned to the admin',
    enum: AdminRole,
    example: AdminRole.MODERATOR,
  })
  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.MODERATOR })
  role: AdminRole;

  @ApiProperty({
    description: 'Current account status',
    enum: AccountStatus,
    example: AccountStatus.PENDING,
  })
  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.PENDING })
  status: AccountStatus;

  @ApiPropertyOptional({
    description: 'Admin who approved this account',
    type: () => Admin,
  })
  @ManyToOne(() => Admin, (admin) => admin.approvedAdmins, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: Admin;

  @ApiPropertyOptional({
    description: 'Admins approved by this account',
    type: () => [Admin],
  })
  @OneToMany(() => Admin, (admin) => admin.approvedBy)
  approvedAdmins: Admin[];

  @ApiPropertyOptional({
    description: 'Timestamp when the account was approved',
    example: '2026-01-15T10:30:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiPropertyOptional({
    description: 'Timestamp of the last login',
    example: '2026-03-04T22:00:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @BeforeInsert()
  generateUuidV7() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
