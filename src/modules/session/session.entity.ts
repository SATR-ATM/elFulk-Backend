import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../user/user.entity';

export enum SessionStatus {
  Active = 'active',
  Locked = 'locked',
  Ended = 'ended',
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Users, (user) => user.sessions)
  @JoinColumn({ name: 'child_id' })
  child: Users;

  @CreateDateColumn({
    name: 'start_time',
    nullable: false,
  })
  startTime: Date;

  @Column({
    name: 'end_time',
    type: 'timestamptz',
    nullable: true,
  })
  endTime: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.Active,
  })
  status: SessionStatus;
}
