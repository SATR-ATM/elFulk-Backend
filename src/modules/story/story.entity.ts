import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity('stories')
export class Story {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  ensureId() {
    this.id ??= uuidv7();
  }

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'text' })
  content: string | null;

  @Column({ nullable: true, type: 'varchar' })
  age_group: string | null;

  @Column({ nullable: true, type: 'varchar' })
  complexity: string | null;

  @Column({ nullable: true, type: 'varchar' })
  gender: string | null;

  @Column({ nullable: true, type: 'varchar' })
  type: string | null;

  @Column({ nullable: true, type: 'uuid' })
  author_id: string | null;

  @Column({ default: false })
  is_published: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  deleted_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
