import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { IAuth } from 'src/types/auth';
import { hashPassword } from 'src/utils';
import { Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { RefreshToken } from '../refresh-token/entities/refresh-token.entity';
import { RolePermission } from '../role-permissions/entities/role-permission.entity';
import { Role } from '../role/entities/role.entity';
import { PlanTypeTenant, Tenant } from '../tenant/entities/tenant.entity';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { UserTenants } from '../users/entities/user-tenants.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,
    @InjectRepository(UserTenants)
    private userTenantRepo: Repository<UserTenants>,
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepo: Repository<RolePermission>,

    private permissionsService: PermissionsService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { email, username, password } = registerUserDto;

    const exists = await this.userRepo.findOne({
      where: [{ email }, { username }],
    });

    if (exists) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepo.save({
      email,
      username,
      passwordHash: hashPassword(password),
      isActive: true,
    });

    const tenant = await this.tenantRepo.save({
      name: `${username}'s workspace`,
      slug: username,
      planType: PlanTypeTenant.FREE,
    });

    let ownerRole = await this.roleRepo.findOne({
      where: {
        name: 'OWNER',
        tenant_id: tenant.id,
      },
    });

    if (!ownerRole) {
      ownerRole = await this.roleRepo.save({
        name: 'OWNER',
        tenant_id: tenant.id,
      });
    }

    const permissions = await this.permissionRepo.find();

    if (permissions.length === 0) {
      throw new Error('Permissions not seeded');
    }

    await this.rolePermissionRepo.save(
      permissions.map((p) => ({
        role_id: ownerRole.id,
        permission_id: p.id,
      })),
    );

    await this.userTenantRepo.save({
      userId: user.id,
      tenantId: tenant.id,
      roleId: ownerRole.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        role: ownerRole.name,
      },
    };
  }

  async login(auth: IAuth) {
    const { email } = auth;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const userTenant = await this.userTenantRepo.findOne({
      where: { userId: user.id },
    });

    if (!userTenant) {
      throw new HttpException(
        'User does not belong to any tenant',
        HttpStatus.FORBIDDEN,
      );
    }

    const tenantId = userTenant.tenantId;

    const permissionCodes = await this.permissionsService.getUserPermissions(
      user.id,
      tenantId,
    );

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      tenantId,
      permissions: permissionCodes,
    };

    const accessToken = this.jwt.sign(payload);

    const refreshToken = randomBytes(64).toString('hex');
    await this.refreshRepo.save({
      user_id: user.id,
      token: this.hash(refreshToken),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      accessToken,
      refreshToken,
      context: {
        tenantId,
        permissions: permissionCodes,
      },
    };
  }

  private async buildAuthContext(userId: string) {
    const rows = await this.userRepo.query(
      `
    SELECT tenant_id, role_id
    FROM user_tenants
    WHERE user_id = $1
    ORDER BY joined_at ASC
    LIMIT 1
    `,
      [userId],
    );

    if (!rows.length) {
      throw new ForbiddenException('User does not belong to any tenant');
    }

    const { tenant_id, role_id } = rows[0];

    const permissions = await this.userRepo.query(
      `
    SELECT DISTINCT p.code
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = $1
    `,
      [role_id],
    );

    return {
      tenantId: tenant_id,
      permissions: permissions.map((p) => p.code),
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);

    const stored = await this.refreshRepo.findOne({
      where: { token: tokenHash },
    });

    if (!stored || stored.expires_at < new Date() || stored.revoked_at) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    stored.revoked_at = new Date();
    await this.refreshRepo.save(stored);

    const user = await this.userRepo.findOne({
      where: { id: stored.user_id },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    const { tenantId, permissions } = await this.buildAuthContext(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      tenantId,
      permissions,
    };

    const accessToken = this.jwt.sign(payload);

    const newRefresh = randomBytes(64).toString('hex');
    await this.refreshRepo.save({
      user_id: user.id,
      token: this.hash(newRefresh),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      access_token: accessToken,
      refresh_token: newRefresh,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);

    const stored = await this.refreshRepo.findOne({
      where: { token: tokenHash },
    });

    if (stored && !stored.revoked_at) {
      stored.revoked_at = new Date();
      await this.refreshRepo.save(stored);
    }

    return { success: true };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email },
    });
    if (user) {
      const isValid = this.comparePassword(password, user.passwordHash);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  }

  comparePassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  private hash(v: string) {
    return createHash('sha256').update(v).digest('hex');
  }
}
