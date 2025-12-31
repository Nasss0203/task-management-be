import { config } from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AuditLog } from '../modules/audit-log/entities/audit-log.entity';
import { Permission } from '../modules/permissions/entities/permission.entity';
import { RefreshToken } from '../modules/refresh-token/entities/refresh-token.entity';
import { RolePermission } from '../modules/role-permissions/entities/role-permission.entity';
import { Role } from '../modules/role/entities/role.entity';
import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserProfile } from '../modules/users/entities/user_profile.entity';
import { UserRole } from '../modules/users/entities/user_role.entity';
import { UserTenants } from '../modules/users/entities/user_tenants.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [
    User,
    UserProfile,
    UserTenants,
    Tenant,
    Role,
    Permission,
    RolePermission,
    UserRole,
    RefreshToken,
    AuditLog,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

export default dataSource;
