import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user_profile.entity';
import { UserRole } from './entities/user_role.entity';
import { UserTenants } from './entities/user_tenants.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserTenants, UserRole]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
