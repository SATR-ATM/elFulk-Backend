import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { uuidv7 } from 'uuidv7';

export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

@Entity()
export class Parent {
  @ApiProperty({ format: 'uuid' })
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  ensureId() {
    this.id ??= uuidv7();
  }

  @ApiProperty()
  @Column()
  username: string;

  @ApiProperty({ format: 'email' })
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional()
  @Column({ nullable: true, select: false })
  password_hash: string | null;

  @ApiPropertyOptional()
  @Column({ nullable: true, select: false })
  pin_hash: string | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  pin_activated: boolean;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  phone_number: string | null;

  @ApiProperty({ enum: AuthProvider })
  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.EMAIL,
  })
  auth_provider: AuthProvider;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  external_subject_id: string | null;

  @ApiProperty({ default: false })
  @Column({ default: false })
  lock_alerts: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  limit_warning: boolean;

  @ApiProperty({ default: true })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}