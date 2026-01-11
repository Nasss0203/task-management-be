import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RbacHelper } from 'src/common/helper/rbac-helper';
import { generateSlug } from 'src/utils';
import { Repository } from 'typeorm';
import { RoleName } from '../role/entities/role.entity';
import { RoleService } from '../role/role.service';
import { UserTenants } from '../users/entities/user-tenants.entity';
import { UserTenantService } from '../users/services/user-tenant.service';
import { UsersService } from '../users/users.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PlanTypeTenant, Tenant } from './entities/tenant.entity';
import { TenantAccessService } from './services/tenant-access.service';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(UserTenants)
    private userTenantRepo: Repository<UserTenants>,

    private readonly roleSerivce: RoleService,
    private readonly userTenantService: UserTenantService,
    private readonly tenantAccessService: TenantAccessService,
    private readonly userService: UsersService,
    private readonly rbacHelper: RbacHelper,
  ) {}

  async create({
    createTenantDto,
    userId,
  }: {
    createTenantDto: CreateTenantDto;
    userId: string;
  }) {
    const slug = generateSlug(createTenantDto.name).toLowerCase();

    const newTenant = await this.tenantRepo.save({
      ...createTenantDto,
      slug,
      planType: PlanTypeTenant.FREE,
    });

    const { ownerRole } = await this.rbacHelper.ensureTenantRoles(newTenant.id);

    await this.userTenantService.create({
      userId,
      tenantId: newTenant.id,
      roleId: ownerRole.id,
    });

    await this.userTenantService.create({
      userId: userId,
      tenantId: newTenant.id,
      roleId: ownerRole.id,
    });

    return newTenant;
  }

  async findAll(userId: string) {
    const rows = await this.userTenantRepo.find({
      where: { userId },
      relations: ['tenant', 'role'],
    });

    const data = rows.map((ut) => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
      slug: ut.tenant.slug,
      planType: ut.tenant.planType,
      role: ut.role.name,
      joinedAt: ut.joinedAt,
    }));

    return data;
  }

  async findOne({ tenantId, userId }: { tenantId: string; userId: string }) {
    const userTenant = await this.userTenantRepo.findOne({
      where: { tenantId, userId },
      relations: ['tenant', 'role'],
    });

    if (!userTenant) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: userTenant.tenant.id,
      name: userTenant.tenant.name,
      slug: userTenant.tenant.slug,
      planType: userTenant.tenant.planType,
      role: userTenant.role.name,
      joinedAt: userTenant.joinedAt,
    };
  }

  async update({
    tenantId,
    userId,
    updateTenantDto,
  }: {
    tenantId: string;
    userId: string;
    updateTenantDto: UpdateTenantDto;
  }) {
    await this.tenantAccessService.assertOwner(userId, tenantId);

    await this.tenantRepo.update(tenantId, updateTenantDto);

    return this.tenantRepo.findOneBy({ id: tenantId });
  }

  async removeTenant({
    tenantId,
    userId,
  }: {
    tenantId: string;
    userId: string;
  }) {
    await this.tenantAccessService.assertOwner(userId, tenantId);

    return this.tenantRepo.delete({ id: tenantId });
  }

  async softRemove({ tenantId, userId }: { tenantId: string; userId: string }) {
    await this.tenantAccessService.assertOwner(userId, tenantId);

    return this.tenantRepo.softRemove({ id: tenantId });
  }

  async restore({ tenantId, userId }: { tenantId: string; userId: string }) {
    await this.tenantAccessService.assertOwner(userId, tenantId);

    return this.tenantRepo.restore({ id: tenantId });
  }

  async addMember({
    tenantId,
    userId,
    ownerId,
  }: {
    tenantId: string;
    userId: string;
    ownerId: string;
  }) {
    await this.tenantAccessService.assertOwner(ownerId, tenantId);

    await this.userService.findOne(userId);

    const existed = await this.userTenantRepo.findOneBy({ userId, tenantId });
    if (existed) {
      throw new HttpException(
        'User is already a member of this tenant',
        HttpStatus.CONFLICT,
      );
    }

    // ✅ luôn lấy MEMBER role đúng tenant + đảm bảo permissions
    const { memberRole } = await this.rbacHelper.ensureTenantRoles(tenantId);

    return this.userTenantRepo.save({
      tenantId,
      userId,
      roleId: memberRole.id,
    });
  }

  async getMemberTenants({
    ownerId,
    tenantId,
  }: {
    ownerId: string;
    tenantId: string;
  }) {
    await this.tenantAccessService.assertOwner(ownerId, tenantId);

    const rows = await this.userTenantRepo.find({
      where: { tenantId },
      relations: { user: true, role: true }, // để lấy thông tin user + role
      order: { joinedAt: 'ASC' },
    });

    const membersOnly = rows.filter((r) => r.role?.name !== RoleName.OWNER);

    return membersOnly.map((m) => ({
      userId: m.userId,
      user: {
        id: m.user?.id,
        email: m.user?.email,
        username: m.user?.username,
      },
      role: {
        id: m.role?.id,
        name: m.role?.name,
      },
      joinedAt: m.joinedAt,
    }));
  }

  async removeMember({
    ownerId,
    tenantId,
    memberUserId,
  }: {
    ownerId: string;
    tenantId: string;
    memberUserId: string;
  }) {
    // 1) chỉ owner được xóa
    await this.tenantAccessService.assertOwner(ownerId, tenantId);

    // 2) tìm membership
    const membership = await this.userTenantRepo.findOne({
      where: {
        tenantId,
        userId: memberUserId,
      },
      relations: { role: true },
    });

    if (!membership) {
      throw new HttpException(
        'Member not found in this tenant',
        HttpStatus.NOT_FOUND,
      );
    }

    // 3) không cho xóa OWNER
    if (membership.role?.name === RoleName.OWNER) {
      throw new HttpException(
        'Cannot remove tenant owner',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4) xóa
    await this.userTenantRepo.remove(membership);

    return { success: true };
  }
}
