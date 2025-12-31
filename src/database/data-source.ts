import { config } from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserProfile } from '../modules/users/entities/user_profile.entity';
import { UserTenants } from '../modules/users/entities/user_tenants.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [User, UserProfile, UserTenants, Tenant],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

export default dataSource;
