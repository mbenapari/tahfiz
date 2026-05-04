import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'tahfiz_db';
const dbUser = process.env.DB_USER || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('DB_USER environment variable is required in production'); })()
  : 'postgres');
const dbPassword = process.env.DB_PASSWORD || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('DB_PASSWORD environment variable is required in production'); })()
  : 'postgres');
const dbHost = process.env.DB_HOST || 'localhost';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: 'postgres',
  logging: false,
});

export default sequelize;
