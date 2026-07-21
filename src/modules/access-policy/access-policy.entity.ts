import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity()
export class AccessPolicy {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  ensureId() {
    this.id ??= uuidv7();
  }

  @Column('uuid')
  child_id: string;

  @Column({ type: 'int' })
  day_of_week_bitmask: number;

  @Column({ type: 'int', nullable: true })
  weekly_limit_minutes: number | null;

  @Column({ type: 'time', nullable: true })
  time_allowed_start_time: string | null;

  @Column({ type: 'time', nullable: true })
  time_allowed_end_time: string | null;

  @Column({ type: 'int', nullable: true })
  max_app_rating: number | null;

  @Column({ default: false })
  lock_enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}