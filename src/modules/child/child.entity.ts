import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';

@Entity('child')
export class Child {
  @ApiProperty({
    description: 'Unique identifier (UUIDv7, auto-generated)',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @PrimaryColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'UUID of the parent who owns this child profile',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @Column({ type: 'uuid', nullable: false })
  parent_id: string;

  @ApiProperty({ example: 'Widad' })
  @Column({ type: 'varchar', nullable: false })
  first_name: string;

  @ApiProperty({ example: 'Benali' })
  @Column({ type: 'varchar', nullable: false })
  last_name: string;

  @ApiProperty({
    description: 'Date of birth of the child',
    example: '2015-06-20',
    type: 'string',
    format: 'date',
  })
  @Column({ type: 'date', nullable: false })
  date_of_birth: string;

  @ApiPropertyOptional({ example: 'female', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatars/widad.png',
    nullable: true,
  })
  @Column({ type: 'varchar', nullable: true })
  avatar_url: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @BeforeInsert()
  generateUuidV7() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
