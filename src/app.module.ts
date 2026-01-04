import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guard/jwt-auth.guard';
import { PermissionGuard } from './common/guard/permission.guard';
import { DatabaseModule } from './database/database.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RefreshTokenModule } from './modules/refresh-token/refresh-token.module';
import { RolePermissionsModule } from './modules/role-permissions/role-permissions.module';
import { RoleModule } from './modules/role/role.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UsersModule } from './modules/users/users.module';
@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret',
      signOptions: { expiresIn: '15m' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    TenantModule,
    RoleModule,
    PermissionsModule,
    RolePermissionsModule,
    RefreshTokenModule,
    AuditLogModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
