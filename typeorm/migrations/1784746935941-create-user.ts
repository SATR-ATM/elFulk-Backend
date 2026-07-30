import { type MigrationInterface, type QueryRunner, Table } from 'typeorm';

export class CreateUser1784746935941 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user',
        columns: [
          {
            name: 'id',
            type: 'text',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'email',
            type: 'text',
            isUnique: true,
          },
          {
            name: 'emailVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'image',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'username',
            type: 'text',
          },
          {
            name: 'first_name',
            type: 'text',
          },
          {
            name: 'last_name',
            type: 'text',
          },
          {
            name: 'phone_number',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'lock_alerts',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'limit_warning',
            type: 'boolean',
            isNullable: true,
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: true,
            default: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user');
  }
}
