import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { UserRole } from './entities/user-role.entity';
import { UserTenants } from './entities/user-tenants.entity';
import { User } from './entities/user.entity';
import { UserTenantService } from './services/user-tenant.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserTenants, UserRole]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserTenantService],
  exports: [UsersService, UserTenantService],
})
export class UsersModule {}
