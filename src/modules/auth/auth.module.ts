import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacHelper } from 'src/common/helper/rbac-helper';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { LocalStrategy } from 'src/common/strategy/local.strategy';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { RefreshToken } from '../refresh-token/entities/refresh-token.entity';
import { RolePermission } from '../role-permissions/entities/role-permission.entity';
import { Role } from '../role/entities/role.entity';
import { Tenant } from '../tenant/entities/tenant.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { UserTenants } from '../users/entities/user-tenants.entity';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RefreshToken,
      UserTenants,
      Tenant,
      Role,
      UserRole,
      Permission,
      RolePermission,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<number>('JWT_ACCESS_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    PermissionsModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, RbacHelper],
  controllers: [AuthController],
  exports: [RbacHelper],
})
export class AuthModule {}
