import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/repository/base.repository';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantRepository extends BaseRepository<Tenant> {}
