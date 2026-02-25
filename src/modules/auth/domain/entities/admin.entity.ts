import {
  Entity,
  Column,
  PrimaryColumn,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { AdminRoleAssignment } from './admin-role-assignment.entity';


@Entity()
export class Admin {

  @PrimaryColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password_hash: string | null;

  @Column({ nullable: true })
  author: string | null;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

@OneToMany(() => AdminRoleAssignment, (assignment) => assignment.admin)
  roleAssignments: AdminRoleAssignment[];
}