import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/entities/role.entity';
import { RoleModule } from '../role/role.module';
import { UserTenants } from '../users/entities/user-tenants.entity';
import { UsersModule } from '../users/users.module';
import { Tenant } from './entities/tenant.entity';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Role, UserTenants]),
    RoleModule,
    UsersModule,
  ],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}
