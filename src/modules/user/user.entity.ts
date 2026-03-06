import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Session } from '../session/session.entity';

export enum UsersType {
  PARENT = 'parent',
  CHILD = 'child',
  ADMIN = 'admin',
}

@Entity()
export class Users {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  ensureId() {
    this.id ??= uuidv7();
  }

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({
    type: 'enum',
    enum: UsersType,
  })
  type: UsersType;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  last_login: Date;

  @OneToMany(() => Session, (session) => session.child)
  sessions: Session[];
}
