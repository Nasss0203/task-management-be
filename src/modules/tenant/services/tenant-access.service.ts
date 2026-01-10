import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from 'src/modules/role/entities/role.entity';
import { UserTenants } from 'src/modules/users/entities/user-tenants.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TenantAccessService {
  constructor(
    @InjectRepository(UserTenants)
    private userTenantRepo: Repository<UserTenants>,
  ) {}

  async assertOwner(userId: string, tenantId: string) {
    const ut = await this.userTenantRepo.findOne({
      where: { userId, tenantId },
      relations: ['role'],
    });

    if (!ut || ut.role.name !== RoleName.OWNER) {
      throw new ForbiddenException('Only OWNER allowed');
    }

    return ut;
  }
}
