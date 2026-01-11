import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
      relations: { role: true },
    });

    if (!ut) throw new ForbiddenException();
    if (ut.role.name !== 'OWNER') throw new ForbiddenException();

    return ut;
  }
}
