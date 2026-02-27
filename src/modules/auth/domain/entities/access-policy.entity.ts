import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity()
export class AccessPolicy {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  child_id: string;

  @Column({ type: 'int', nullable: true })
  daily_limit_minutes: number | null;

  @Column({ type: 'int', nullable: true })
  weekly_limit_minutes: number | null;

  @Column({ type: 'time', nullable: true })
  allowed_start_time: string | null;

  @Column({ type: 'time', nullable: true })
  allowed_end_time: string | null;

  @Column({ type: 'int', nullable: true })
  max_age_rating: number | null;

  @Column({ default: false })
  lock_enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}