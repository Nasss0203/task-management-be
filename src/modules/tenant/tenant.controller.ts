import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantService } from './tenant.service';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ResponseMessage('Tenant created successfully')
  async create(@Body() createTenantDto: CreateTenantDto, @Auth() auth: IAuth) {
    console.log('🚀 ~ auth~', auth);
    return await this.tenantService.create({
      createTenantDto,
      userId: auth.id,
    });
  }

  @Get()
  @ResponseMessage('Tenants fetched successfully')
  findAll(@Auth() auth: IAuth) {
    return this.tenantService.findAll(auth.id);
  }

  @Get(':id')
  @ResponseMessage('Tenant fetched successfully')
  findOne(@Param('id') id: string, @Auth() auth: IAuth) {
    return this.tenantService.findOne({ tenantId: id, userId: auth.id });
  }

  @Patch(':id')
  @ResponseMessage('Tenant updated successfully')
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Auth() auth: IAuth,
  ) {
    return this.tenantService.update({
      tenantId: id,
      userId: auth.id,
      updateTenantDto,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.tenantService.remove(id);
  }

  @Delete('soft-remove/:id')
  @ResponseMessage('Tenant deleted successfully')
  softRemove(@Param('id') tenantId: string, @Auth() auth: IAuth) {
    return this.tenantService.softRemove({
      tenantId,
      userId: auth.id,
    });
  }

  @Patch('restore/:id')
  @ResponseMessage('Tenant restored successfully')
  restore(@Param('id') tenantId: string, @Auth() auth: IAuth) {
    return this.tenantService.restore({
      tenantId,
      userId: auth.id,
    });
  }

  @Post('add-member/:id')
  @ResponseMessage('Member added to tenant successfully')
  addMember(
    @Auth() auth: IAuth,
    @Param('id') tenantId: string,
    @Body() body: { userId: string; roleId: string },
  ) {
    return this.tenantService.addMember({
      tenantId,
      userId: body.userId,
      ownerId: auth.id,
    });
  }

  @Get(':id/members')
  @ResponseMessage('Tenant members fetched successfully')
  getMembers(@Auth() auth: IAuth, @Param('id') tenantId: string) {
    return this.tenantService.getMemberTenants({
      ownerId: auth.id,
      tenantId,
    });
  }

  @Delete(':id/members/:memberUserId')
  @ResponseMessage('Member removed from tenant successfully')
  removeMember(
    @Auth() auth: IAuth,
    @Param('id') tenantId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.tenantService.removeMember({
      ownerId: auth.id,
      tenantId,
      memberUserId,
    });
  }
}
