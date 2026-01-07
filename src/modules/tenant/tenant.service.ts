import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { generateSlug } from 'src/utils';
import { Repository } from 'typeorm';
import { RoleName } from '../role/entities/role.entity';
import { RoleService } from '../role/role.service';
import { UserTenants } from '../users/entities/user-tenants.entity';
import { UserTenantService } from '../users/services/user-tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PlanTypeTenant, Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    @InjectRepository(UserTenants)
    private userTenantRepo: Repository<UserTenants>,
    private readonly roleSerivce: RoleService,
    private readonly userTenantService: UserTenantService,
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

    const ownerRole = await this.roleSerivce.create({
      tenant_id: newTenant.id,
      name: RoleName.OWNER,
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
      return null;
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

  update(id: number, updateTenantDto: UpdateTenantDto) {
    return `This action updates a #${id} tenant`;
  }

  remove(id: number) {
    return `This action removes a #${id} tenant`;
  }

  async softRemove({ tenantId, userId }: { tenantId: string; userId: string }) {
    const userTenant = await this.userTenantRepo.findOne({
      where: {
        userId,
        tenantId,
      },
      relations: ['role'],
    });

    if (!userTenant || userTenant.role.name !== 'OWNER') {
      throw new ForbiddenException('Only OWNER can delete tenant');
    }

    return this.tenantRepo.softRemove({ id: tenantId });
  }
}
