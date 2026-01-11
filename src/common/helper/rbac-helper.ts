import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/modules/permissions/entities/permission.entity';
import { RolePermission } from 'src/modules/role-permissions/entities/role-permission.entity';
import { Role, RoleName } from 'src/modules/role/entities/role.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class RbacHelper {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async getOrCreateTenantRole(tenantId: string, name: RoleName) {
    let role = await this.roleRepo.findOne({
      where: { tenant_id: tenantId, name },
    });
    if (role) return role;

    try {
      role = await this.roleRepo.save({ tenant_id: tenantId, name });
      return role;
    } catch {
      // có thể bị conflict do request khác tạo trước
      role = await this.roleRepo.findOne({
        where: { tenant_id: tenantId, name },
      });
      if (!role) {
        throw new HttpException(
          'Cannot create role',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return role;
    }
  }

  async ensureRolePermissions(roleId: string, codes: string[]) {
    const uniqueCodes = [...new Set(codes)];

    const perms = await this.permissionRepo.find({
      where: { code: In(uniqueCodes) },
    });

    if (perms.length !== uniqueCodes.length) {
      throw new HttpException(
        'Some permissions not seeded',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // lấy danh sách permission_id đã có mapping
    const existing = await this.rolePermissionRepo.find({
      where: { role_id: roleId, permission_id: In(perms.map((p) => p.id)) },
    });
    const existingSet = new Set(existing.map((x) => x.permission_id));

    const toInsert = perms
      .filter((p) => !existingSet.has(p.id))
      .map((p) => ({ role_id: roleId, permission_id: p.id }));

    if (toInsert.length > 0) {
      await this.rolePermissionRepo.save(toInsert);
    }
  }

  async ensureTenantRoles(tenantId: string) {
    const owner = await this.getOrCreateTenantRole(tenantId, RoleName.OWNER);
    const member = await this.getOrCreateTenantRole(tenantId, RoleName.MEMBER);

    const ownerPerms = [
      'tenant.manage',
      'tenant.member.manage',
      'project.create',
      'project.read',
      'project.update',
      'project.delete',
      'task.create',
      'task.read',
      'task.update',
      'task.delete',
      'task.assign',
      'task.change_status',
    ];

    const memberPerms = [
      'project.read',
      'task.create',
      'task.read',
      'task.update',
    ];

    await this.ensureRolePermissions(owner.id, ownerPerms);
    await this.ensureRolePermissions(member.id, memberPerms);

    return { ownerRole: owner, memberRole: member };
  }
}
