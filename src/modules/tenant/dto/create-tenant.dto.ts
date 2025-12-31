export class CreateTenantDto {
  id: string;

  name: string;

  slug: string;

  planType: string;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
