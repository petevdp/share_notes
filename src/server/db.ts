import * as TypeORM from 'typeorm';
export async function createDatabaseConnection() {
  return await TypeORM.createConnection({
    name: 'default',
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'development',
    password: 'development',
    database: 'development',
    synchronize: true,
    logging: true,
    entities: ['dist/src/server/models/**/*.js'],
    migrations: ['dist/src/server/migration/**/*.js'],
    subscribers: ['dist/src/server/subscriber/**/*.js'],
  });
}
