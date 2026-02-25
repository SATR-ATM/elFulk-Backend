import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { Admin } from './admin.entity';
import { AdminRole } from './admin-role.entity';

@Entity()
export class AdminRoleAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Admin, (admin) => admin.roleAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @ManyToOne(() => AdminRole, (role) => role.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: AdminRole;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @Column({ name: 'assigned_by' })
  assignedBy: string; 
}

