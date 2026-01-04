// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: false,
        synchronize: true,
        migrationsRun: true,
        schema: 'public',
        logging: true,
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
      }),
    }),
  ],
})
export class DatabaseModule {}
