import { PlanTypeTenant } from '../entities/tenant.entity';

export class CreateTenantDto {
  id?: string;

  name: string;

  slug: string;

  planType: PlanTypeTenant;

  createdAt?: Date;

  updatedAt?: Date;

  deletedAt?: Date | null;
}
