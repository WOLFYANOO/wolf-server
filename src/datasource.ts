import { DataSource } from 'typeorm';
import 'dotenv/config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    __dirname + '/entities/*.entity.{js,ts}',
    __dirname + '/clients/entities/*.entity.{js,ts}',
    __dirname + '/workers/entities/*.entity.{js,ts}',
    __dirname + '/dashboard/entities/*.entity.{js,ts}',
  ],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  synchronize: false,
});
