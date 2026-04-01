import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';

@Entity('child')
export class Child {
  @ApiProperty({
    description:
      'Unique identifier for this child profile (Primary Key, auto-generated UUIDv7)',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @PrimaryColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Identifier of the parent associated with this child profile (Foreign Key, UUIDv7)',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @Column({ type: 'uuid', nullable: false })
  parent_id: string;

  @ApiProperty({
    description: 'First name of the child — required, must not be null',
    example: 'Widad',
  })
  @Column({ type: 'varchar', nullable: false })
  first_name: string;

  @ApiProperty({
    description: 'Last name of the child — required, must not be null',
    example: 'test',
  })
  @Column({ type: 'varchar', nullable: false })
  last_name: string;

  @ApiProperty({
    description: 'Age of the child in years — required, must not be null',
    example: 10,
  })
  @Column({ type: 'int', nullable: false })
  age: number;

  @ApiProperty({
    description: 'Gender of the child — optional, null if not provided',
    example: 'female',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @ApiProperty({
    description:
      'URL of the child avatar image — optional, null if not provided',
    example: 'https://example.com/avatars/widad.png',
    required: false,
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @ApiProperty({
    description:
      'Timestamp when this child profile was created (auto-generated)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @BeforeInsert()
  generateUuidV7() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
