import type { DataSourceOptions } from 'typeorm';
import { ALL_ENTITIES, ALL_MIGRATIONS } from '../src';

export const ormconfig: DataSourceOptions = {
  type: 'better-sqlite3',
  database: process.env.CONFIG_DIRECTORY
    ? `${process.env.CONFIG_DIRECTORY}/db/db.sqlite3`
    : 'config/db/db.sqlite3',
  synchronize: true,
  migrationsRun: false,
  // logging: "all",
  entities: ALL_ENTITIES,
  migrations: ALL_MIGRATIONS,
  // subscribers: ALL_SUBSCRIBERS,
};
