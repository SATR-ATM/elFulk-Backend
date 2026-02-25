import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Admin } from './admin.entity';
import { AdminRole } from './admin-role.entity';

@Entity()
export class AdminRoleAssignment{
@PrimaryGeneratedColumn()
id:number
    
}


