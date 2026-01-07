import { NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  async findByIdOrFail(id: string): Promise<T> {
    const entity = await this.findOneBy({ id } as any);
    if (!entity) throw new NotFoundException();
    return entity;
  }

  async existsById(id: string): Promise<boolean> {
    return this.exist({ where: { id } as any });
  }

  async softDeleteById(id: string): Promise<void> {
    const result = await this.softDelete(id);
    if (!result.affected) throw new NotFoundException();
  }

  async findByTenantId(tenantId: string): Promise<T[]> {
    return this.find({
      where: { tenant_id: tenantId } as any,
    });
  }

  async findOneInTenantOrFail(id: string, tenantId: string): Promise<T> {
    const entity = await this.findOne({
      where: { id, tenant_id: tenantId } as any,
    });
    if (!entity) throw new NotFoundException();
    return entity;
  }
}
