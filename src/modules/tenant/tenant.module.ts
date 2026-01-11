import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacHelper } from 'src/common/helper/rbac-helper';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolePermission } from '../role-permissions/entities/role-permission.entity';
import { RolePermissionsModule } from '../role-permissions/role-permissions.module';
import { Role } from '../role/entities/role.entity';
import { RoleModule } from '../role/role.module';
import { UserTenants } from '../users/entities/user-tenants.entity';
import { UsersModule } from '../users/users.module';
import { Tenant } from './entities/tenant.entity';
import { TenantAccessService } from './services/tenant-access.service';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      Role,
      UserTenants,
      RolePermission,
      Permission,
    ]),
    RoleModule,
    UsersModule,
    RolePermissionsModule,
    PermissionsModule,
  ],
  controllers: [TenantController],
  providers: [TenantService, TenantAccessService, RbacHelper],
  exports: [TenantService, TenantAccessService],
})
export class TenantModule {}
