import { DataSource } from 'typeorm';
import * as path from 'path';

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [path.join(__dirname, '../../typeorm/entities/**/*.{ts,js}')],
  migrations: [path.join(__dirname, '../../typeorm/migrations/**/*.{ts,js}')],
  synchronize: process.env.TYPEORM_SYNC === 'true',
});
