import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class AdminRole{
@PrimaryGeneratedColumn()
id:number;

@Column({unique:true})
name:string;

@Column('text',{array:true})
permissions: string[];



}