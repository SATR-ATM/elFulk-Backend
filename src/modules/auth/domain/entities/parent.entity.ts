import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

@Entity()
export class Parent {
  @PrimaryColumn()
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password_hash: string | null;

  @Column()
  pin_hash: string;

  @Column({ nullable: true })
  phone_number: string | null;

  @Column({
    type: 'enum',
    enum: AuthProvider,
  })
  auth_provider: AuthProvider;

  @Column({ nullable: true })
  external_subject_id: string | null;

  @Column({ default: false })
  lock_alerts: boolean;

  @Column({ default: false })
  limit_warning: boolean;

  @Column({ default: true })
  is_active: boolean;

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