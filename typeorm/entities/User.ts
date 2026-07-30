import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryColumn('text')
  id!: string;

  @Column('text', { name: 'name' })
  name!: string;

  @Column('text', { name: 'email', unique: true })
  email!: string;

  @Column('boolean', { name: 'emailVerified', default: false })
  emailVerified!: boolean;

  @Column('text', { name: 'image', nullable: true })
  image: string | null;

  @Column('timestamptz', {
    name: 'createdAt',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @Column('timestamptz', {
    name: 'updatedAt',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  @Column('text', { name: 'first_name' })
  first_name!: string;

  @Column('text', { name: 'last_name' })
  last_name!: string;

  @Column('text', { name: 'phone_number', nullable: true })
  phone_number: string | null;

  @Column('boolean', { name: 'lock_alerts', nullable: true, default: false })
  lock_alerts: boolean | null;

  @Column('boolean', { name: 'limit_warning', nullable: true, default: false })
  limit_warning: boolean | null;

  @Column('boolean', { name: 'is_active', nullable: true, default: true })
  is_active: boolean | null;
}
