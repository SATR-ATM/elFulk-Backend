import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UsersType {
  PARENT = 'parent',
  CHILD = 'child',
  ADMIN = 'admin',
}

@Entity()
export class Users {
  @ApiProperty({
    description: 'Unique identifier for the user (UUIDv7)',
    example: '01932b3a-7c4f-7e8d-9f0a-1b2c3d4e5f60',
    format: 'uuid',
  })
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  ensureId() {
    this.id ??= uuidv7();
  }

  @ApiProperty({
    description: "User's first name",
    example: 'John',
    maxLength: 255,
  })
  @Column()
  first_name: string;

  @ApiProperty({
    description: "User's last name",
    example: 'Doe',
    maxLength: 255,
  })
  @Column()
  last_name: string;

  @ApiProperty({
    description: 'Role/type of the user within the system',
    enum: UsersType,
    enumName: 'UsersType',
    example: UsersType.PARENT,
  })
  @Column({
    type: 'enum',
    enum: UsersType,
  })
  type: UsersType;

  @ApiProperty({
    description: 'Timestamp when the user account was created',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiPropertyOptional({
    description:
      'Timestamp of the last login. Null if the user has never logged in',
    example: '2024-03-10T08:45:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Column({ nullable: true })
  last_login: Date;
}
