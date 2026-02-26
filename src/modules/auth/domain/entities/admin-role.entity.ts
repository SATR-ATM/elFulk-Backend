import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AdminRoleAssignment } from './admin-role-assignment.entity';

@Entity()
export class AdminRole{
@PrimaryGeneratedColumn()
id:number;

@Column({unique:true})
name:string;

@Column('text',{array:true})
permissions: string[];

  @OneToMany(() => AdminRoleAssignment, (assignment) => assignment.role)
  assignments: AdminRoleAssignment[];

}