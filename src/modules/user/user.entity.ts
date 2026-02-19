import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum UsersType {
  PARENT = 'parent',
  CHILD = 'child',
  ADMIN = 'admin',
}

@Entity()
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
}
