import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserTenantDto } from '../dto/create-user-tenant.dto';
import { UserTenants } from '../entities/user-tenants.entity';

@Injectable()
export class UserTenantService {
  constructor(
    @InjectRepository(UserTenants)
    private userTenantRepo: Repository<UserTenants>,
  ) {}

  async create(userTenant: CreateUserTenantDto) {
    const newUserTenant = await this.userTenantRepo.create(userTenant);
    return this.userTenantRepo.save(newUserTenant);
  }
}
