import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Parent } from './parent.entity';

@Entity()
export class Session {
  @PrimaryColumn()
  token: string;

  @ManyToOne(() => Parent, (parent) => parent.sessions)
  parent: string;

  @Column({
    type: 'timestamptz',
  })
  expiresAt: Date;

  @Column({
    type: 'string',
    nullable: true,
  })
  deviceInfo: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: string;

  isValid(): boolean {
    const nowUtc = new Date(new Date().toISOString());
    return this.expiresAt > nowUtc;
  }
}
