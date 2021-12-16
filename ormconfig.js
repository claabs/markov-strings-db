module.exports = {
    type: 'better-sqlite3',
    database: process.env.CONFIG_DIRECTORY
      ? `${process.env.CONFIG_DIRECTORY}/db/db.sqlite3`
      : 'config/db/db.sqlite3',
    synchronize: true,
    migrationsRun: false,
    // logging: true,
    // logging: "all",
    enableWAL: true,
    autoLoadEntities: true,
    entities: ['src/entity/**/*.ts'],
    migrations: ['src/migration/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
    cli: {
      entitiesDir: 'src/entity',
      migrationsDir: 'src/migration',
    },
  };
