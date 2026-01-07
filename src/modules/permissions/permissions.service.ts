import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTenants } from '../users/entities/user-tenants.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(UserTenants)
    private userTenantRepo: Repository<UserTenants>,
  ) {}

  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const rows = await this.userTenantRepo.query(
      `
      SELECT DISTINCT p.code
      FROM user_tenants ut
      JOIN role_permissions rp ON rp.role_id = ut.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ut.user_id = $1
        AND ut.tenant_id = $2
      `,
      [userId, tenantId],
    );

    return rows.map((r) => r.code);
  }
  create(createPermissionDto: CreatePermissionDto) {
    return 'This action adds a new permission';
  }

  findAll() {
    return `This action returns all permissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} permission`;
  }

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    return `This action updates a #${id} permission`;
  }

  remove(id: number) {
    return `This action removes a #${id} permission`;
  }
}
