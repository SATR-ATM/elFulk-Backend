import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../user/user.entity';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export enum SessionStatus {
  Active = 'active',
  Locked = 'locked',
  Ended = 'ended',
}

@Entity('sessions')
export class Session {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Users })
  @ManyToOne(() => Users, (user) => user.sessions)
  @JoinColumn({ name: 'child_id' })
  child: Users;

  @ApiProperty()
  @CreateDateColumn({
    name: 'start_time',
    nullable: false,
  })
  startTime: Date;

  @ApiProperty()
  @Column({
    name: 'end_time',
    type: 'timestamptz',
    nullable: true,
  })
  endTime: Date;

  @ApiHideProperty()
  @Column({
    name: 'status',
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.Active,
  })
  private _status: SessionStatus;

  @ApiProperty()
  // use this to get the status
  get status(): SessionStatus {
    return this.endTime > new Date() ? this._status : SessionStatus.Ended;
  }
}
