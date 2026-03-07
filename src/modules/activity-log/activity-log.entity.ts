import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
  //   ManyToOne,
  //   JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';
// import { Session } from '../session/session.entity';

@Entity('activity_log')
export class ActivityLog {
  @ApiProperty({
    description:
      'Unique identifier for this activity log entry (Primary Key, auto-generated UUIDv7)',
    example: '01952a1b-d4e6-7c3f-a2b1-e9f0123456ab',
    format: 'uuid',
  })
  @PrimaryColumn('uuid')
  id: string;

  @ApiProperty({
    description:
      'Identifier of the session associated with this activity log entry (Foreign Key, UUIDv7)',
    example: '01952a1c-f3a1-7b2e-c4d5-f6e7a8b9c0d1',
    format: 'uuid',
  })
  @Column({ type: 'uuid', nullable: false })
  session_id: string;

  // @ManyToOne(() => Session, {
  //   nullable: false,
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'session_id' })
  // session: Session;

  @ApiProperty({
    description:
      'Timestamp when this activity started — required, must not be null',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: false })
  start_time: Date;

  @ApiProperty({
    description:
      'Timestamp when this activity ended — optional, null if still ongoing',
    example: '2024-01-15T10:45:00.000Z',
    required: false,
    nullable: true,
  })
  @Column({ type: 'timestamp', nullable: true })
  end_time: Date | null;

  @ApiProperty({
    description:
      'Duration of the activity in whole seconds — optional, null if not yet calculated',
    example: 900,
    required: false,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  duration_seconds: number | null;

  @ApiProperty({
    description:
      'The type of action performed in this log entry (e.g. LOGIN, PAGE_VIEW)',
    example: 'LOGIN',
  })
  @Column({ type: 'varchar', nullable: false })
  action_type: string;

  @BeforeInsert()
  generateUuidV7() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
