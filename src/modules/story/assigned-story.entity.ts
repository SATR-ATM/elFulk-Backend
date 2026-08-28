import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity('assigned_stories')
export class AssignedStory {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  ensureId() {
    this.id ??= uuidv7();
  }

  @Column({ type: 'uuid' })
  story_id: string;

  @Column({ type: 'uuid' })
  assignee_id: string;

  @Column({ nullable: true, type: 'uuid' })
  assigned_by: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  due_date: Date | null;

  @Column({ default: false })
  is_completed: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
