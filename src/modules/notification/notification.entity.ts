import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('notification')
export class Notification {
  @ApiProperty({
    description: 'Unique identifier (UUIDv7, auto-generated)',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @PrimaryColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'UUID of the parent who receives the notification',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @Column({ type: 'uuid', nullable: false })
  parent_id: string;

  @ApiProperty({
    description: 'Short title of the notification',
    example: 'Limit warning',
  })
  @Column({ type: 'varchar', nullable: false })
  title: string;

  @ApiProperty({
    description: 'Full message body of the notification',
    example: 'Your child has reached the daily screen-time limit.',
  })
  @Column({ type: 'text', nullable: false })
  message: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @ApiPropertyOptional({
    description:
      'Timestamp when the notification was read. Null if not yet read',
    example: '2026-03-04T12:32:49.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @ApiProperty({
    description: 'Type/category of the notification',
    example: 'limit_warning',
  })
  @Column({ type: 'varchar', nullable: false })
  type: string;

  @ApiProperty({
    description: 'Timestamp when the notification was created',
    example: '2026-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
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
