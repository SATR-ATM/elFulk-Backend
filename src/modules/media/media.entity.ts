import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity('media_assets')
export class MediaAsset {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  ensureId() {
    this.id ??= uuidv7();
  }

  @Column({ nullable: true, type: 'uuid' })
  story_id: string | null;

  @Column()
  file_name: string;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ nullable: true, type: 'text' })
  content_type: string | null;

  @Column({ type: 'bigint', nullable: true })
  file_size: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
