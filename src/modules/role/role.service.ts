import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, RoleName } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}
  async create(createRoleDto: CreateRoleDto) {
    const ownerRole = await this.roleRepo.save({
      name: RoleName.OWNER,
      tenant_id: createRoleDto.tenant_id,
    });

    return ownerRole;
  }

  findAll() {
    return `This action returns all role`;
  }

  async findOne(id: string) {
    let finalRoleId = id?.trim();

    if (!finalRoleId) {
      const memberRole = await this.roleRepo.findOne({
        where: { name: RoleName.MEMBER },
      });
      // bạn implement findByCodeOrName() theo schema role của bạn
      if (!memberRole) {
        throw new HttpException(
          'Default MEMBER role not found',
          HttpStatus.NOT_FOUND,
        );
      }
      finalRoleId = memberRole.id;
    } else {
      await this.roleRepo.findOne({ where: { id: finalRoleId } });
    }
    return finalRoleId;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
